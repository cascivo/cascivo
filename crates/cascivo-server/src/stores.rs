//! Built-in [`SessionStore`]s.

use std::collections::HashMap;
use std::fmt;
use std::sync::{Arc, Mutex, PoisonError};
use std::time::Duration;

use chacha20poly1305::aead::{Aead, Payload};
use chacha20poly1305::{KeyInit, XChaCha20Poly1305, XNonce};
use hmac::{Hmac, Mac};
use sha2::Sha256;

use crate::session::{Record, SessionId, SessionStore, StoreError};
use crate::util::{b64, now, random, unb64};

/// In-process records (tests, single-process development). Clones share the map.
#[derive(Clone, Default)]
pub struct MemoryStore(Arc<Mutex<HashMap<String, (Record, u64)>>>);

impl fmt::Debug for MemoryStore {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("MemoryStore(..)")
    }
}

impl MemoryStore {
    pub fn new() -> Self {
        Self::default()
    }
}

impl SessionStore for MemoryStore {
    async fn load(&self, id: &SessionId) -> Result<Option<Record>, StoreError> {
        let mut m = self.0.lock().unwrap_or_else(PoisonError::into_inner);
        let key = id.storage_key();
        match m.get(&key) {
            Some((r, exp)) if *exp > now() => Ok(Some(r.clone())),
            Some(_) => {
                m.remove(&key);
                Ok(None)
            }
            None => Ok(None),
        }
    }

    async fn save(&self, id: &SessionId, r: &Record, ttl: Duration) -> Result<(), StoreError> {
        let exp = now().saturating_add(ttl.as_secs());
        self.0
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .insert(id.storage_key(), (r.clone(), exp));
        Ok(())
    }

    async fn delete(&self, id: &SessionId) -> Result<(), StoreError> {
        self.0
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .remove(&id.storage_key());
        Ok(())
    }
}

/// Stateless: the record itself, encrypted and authenticated (XChaCha20-Poly1305, the cookie
/// name as associated data), is the cookie. Works on every target and needs no storage.
/// Trade-offs: the cookie must stay under 4 KB, and a logged-out or rotated-away cookie stays
/// valid until it expires (only server stores can revoke).
#[derive(Clone)]
pub struct CookieStore {
    keys: Arc<[[u8; 32]]>,
}

impl fmt::Debug for CookieStore {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("CookieStore(..)")
    }
}

const MAX_COOKIE: usize = 3800;

impl CookieStore {
    /// `secrets`: the current one first, then older ones that still open existing cookies
    /// (key rotation). Each at least 32 bytes, e.g. `APP_SECRET`; a key is derived from it.
    pub fn new(secrets: &[&[u8]]) -> Result<Self, StoreError> {
        if secrets.is_empty() || secrets.iter().any(|s| s.len() < 32) {
            return Err(StoreError(
                "CookieStore needs secrets of 32 bytes or more".into(),
            ));
        }
        let keys = secrets
            .iter()
            .map(|s| {
                let mut m = <Hmac<Sha256> as KeyInit>::new_from_slice(s)
                    .map_err(|e| StoreError(e.to_string()))?;
                m.update(b"cascivo-server/session-cookie/v1");
                let mut k = [0u8; 32];
                k.copy_from_slice(&m.finalize().into_bytes());
                Ok(k)
            })
            .collect::<Result<Vec<_>, StoreError>>()?;
        Ok(Self { keys: keys.into() })
    }

    pub(crate) fn seal(&self, r: &Record, name: &str) -> Result<String, StoreError> {
        let json = serde_json::to_vec(r).map_err(|e| StoreError(e.to_string()))?;
        let nonce = random::<24>().map_err(|e| StoreError(e.to_string()))?;
        let key = self
            .keys
            .first()
            .ok_or_else(|| StoreError("no key".into()))?;
        let ct = XChaCha20Poly1305::new_from_slice(key)
            .map_err(|e| StoreError(e.to_string()))?
            .encrypt(
                &XNonce::from(nonce),
                Payload {
                    msg: &json,
                    aad: name.as_bytes(),
                },
            )
            .map_err(|e| StoreError(e.to_string()))?;
        let mut out = nonce.to_vec();
        out.extend(ct);
        let s = b64(&out);
        if s.len() > MAX_COOKIE {
            return Err(StoreError(format!(
                "sealed session is {} bytes; keep CookieStore records small or use a server store",
                s.len()
            )));
        }
        Ok(s)
    }

    pub(crate) fn open(&self, v: &str, name: &str) -> Option<Record> {
        let b = unb64(v)?;
        if b.len() < 24 + 16 {
            return None;
        }
        let (nonce, ct) = b.split_at(24);
        let nonce = XNonce::try_from(nonce).ok()?;
        self.keys.iter().find_map(|k| {
            let pt = XChaCha20Poly1305::new_from_slice(k)
                .ok()?
                .decrypt(
                    &nonce,
                    Payload {
                        msg: ct,
                        aad: name.as_bytes(),
                    },
                )
                .ok()?;
            serde_json::from_slice(&pt).ok()
        })
    }
}

impl SessionStore for CookieStore {
    async fn load(&self, _: &SessionId) -> Result<Option<Record>, StoreError> {
        Ok(None)
    }
    async fn save(&self, _: &SessionId, _: &Record, _: Duration) -> Result<(), StoreError> {
        Ok(())
    }
    async fn delete(&self, _: &SessionId) -> Result<(), StoreError> {
        Ok(())
    }
    fn cookie_store(&self) -> Option<&CookieStore> {
        Some(self)
    }
}

/// Records in SQLite (sqlx), keyed by [`SessionId::storage_key`]. Call
/// [`migrate`](Self::migrate) once at startup and [`delete_expired`](Self::delete_expired)
/// now and then.
#[cfg(feature = "sqlite")]
#[derive(Clone, Debug)]
pub struct SqliteStore {
    pool: sqlx::SqlitePool,
}

#[cfg(feature = "sqlite")]
fn db(e: sqlx::Error) -> StoreError {
    StoreError(e.to_string())
}

#[cfg(feature = "sqlite")]
#[allow(clippy::cast_possible_wrap)]
fn now_i64() -> i64 {
    now() as i64
}

#[cfg(feature = "sqlite")]
impl SqliteStore {
    pub fn new(pool: sqlx::SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn migrate(&self) -> Result<(), StoreError> {
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS cascivo_sessions \
             (key TEXT PRIMARY KEY NOT NULL, record TEXT NOT NULL, expires INTEGER NOT NULL)",
        )
        .execute(&self.pool)
        .await
        .map_err(db)?;
        Ok(())
    }

    pub async fn delete_expired(&self) -> Result<u64, StoreError> {
        let r = sqlx::query("DELETE FROM cascivo_sessions WHERE expires <= ?")
            .bind(now_i64())
            .execute(&self.pool)
            .await
            .map_err(db)?;
        Ok(r.rows_affected())
    }
}

#[cfg(feature = "sqlite")]
impl SessionStore for SqliteStore {
    async fn load(&self, id: &SessionId) -> Result<Option<Record>, StoreError> {
        let row: Option<String> =
            sqlx::query_scalar("SELECT record FROM cascivo_sessions WHERE key = ? AND expires > ?")
                .bind(id.storage_key())
                .bind(now_i64())
                .fetch_optional(&self.pool)
                .await
                .map_err(db)?;
        row.map(|s| serde_json::from_str(&s).map_err(|e| StoreError(e.to_string())))
            .transpose()
    }

    async fn save(&self, id: &SessionId, r: &Record, ttl: Duration) -> Result<(), StoreError> {
        let json = serde_json::to_string(r).map_err(|e| StoreError(e.to_string()))?;
        let ttl = i64::try_from(ttl.as_secs()).unwrap_or(i64::MAX);
        sqlx::query(
            "INSERT INTO cascivo_sessions (key, record, expires) VALUES (?, ?, ?) \
             ON CONFLICT(key) DO UPDATE SET record = excluded.record, expires = excluded.expires",
        )
        .bind(id.storage_key())
        .bind(json)
        .bind(now_i64().saturating_add(ttl))
        .execute(&self.pool)
        .await
        .map_err(db)?;
        Ok(())
    }

    async fn delete(&self, id: &SessionId) -> Result<(), StoreError> {
        sqlx::query("DELETE FROM cascivo_sessions WHERE key = ?")
            .bind(id.storage_key())
            .execute(&self.pool)
            .await
            .map_err(db)?;
        Ok(())
    }
}
