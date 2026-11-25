use std::fmt;
use std::time::Duration;

use cascivo_server::{Record, SessionId, SessionStore, StoreError};
use worker::send::SendFuture;

/// KV refuses an `expirationTtl` below 60 seconds; shorter session TTLs are rounded up.
pub const MIN_TTL: u64 = 60;

/// The three KV calls [`KvStore`] makes. `worker::KvStore` is the real one; tests use a map.
pub trait KvBackend: Send + Sync + 'static {
    fn get(&self, key: &str) -> impl Future<Output = Result<Option<String>, String>> + Send;
    fn put(
        &self,
        key: &str,
        value: String,
        ttl_secs: u64,
    ) -> impl Future<Output = Result<(), String>> + Send;
    fn delete(&self, key: &str) -> impl Future<Output = Result<(), String>> + Send;
}

// Workers is single-threaded, so wrapping the `!Send` JS futures in `SendFuture` is sound.
impl KvBackend for worker::KvStore {
    fn get(&self, key: &str) -> impl Future<Output = Result<Option<String>, String>> + Send {
        SendFuture::new(async move {
            worker::KvStore::get(self, key)
                .text()
                .await
                .map_err(|e| e.to_string())
        })
    }

    fn put(
        &self,
        key: &str,
        value: String,
        ttl_secs: u64,
    ) -> impl Future<Output = Result<(), String>> + Send {
        SendFuture::new(async move {
            worker::KvStore::put(self, key, value)
                .map_err(|e| e.to_string())?
                .expiration_ttl(ttl_secs)
                .execute()
                .await
                .map_err(|e| e.to_string())
        })
    }

    fn delete(&self, key: &str) -> impl Future<Output = Result<(), String>> + Send {
        SendFuture::new(async move {
            worker::KvStore::delete(self, key)
                .await
                .map_err(|e| e.to_string())
        })
    }
}

/// Sessions in Workers KV: key [`SessionId::storage_key`] (sha256 hex, so the KV namespace
/// never holds a usable cookie value), value the JSON [`Record`], `expirationTtl` = the
/// session TTL (at least [`MIN_TTL`]). KV is eventually consistent across locations (up to
/// about 60 s), so a logout or id rotation can take that long to be seen everywhere; the
/// session layer's own idle/absolute checks still apply.
pub struct KvStore<B: KvBackend = worker::KvStore> {
    kv: B,
}

impl<B: KvBackend> fmt::Debug for KvStore<B> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("KvStore(..)")
    }
}

impl KvStore {
    /// The KV namespace bound as `binding`.
    ///
    /// # Errors
    /// When the binding is missing or not a KV namespace.
    pub fn new(env: &worker::Env, binding: &str) -> worker::Result<Self> {
        Ok(Self::with_backend(env.kv(binding)?))
    }
}

impl<B: KvBackend> KvStore<B> {
    pub fn with_backend(kv: B) -> Self {
        Self { kv }
    }
}

fn ttl_secs(ttl: Duration) -> u64 {
    let s = ttl.as_secs() + u64::from(ttl.subsec_nanos() > 0);
    s.max(MIN_TTL)
}

impl<B: KvBackend> SessionStore for KvStore<B> {
    async fn load(&self, id: &SessionId) -> Result<Option<Record>, StoreError> {
        let Some(json) = self.kv.get(&id.storage_key()).await.map_err(StoreError)? else {
            return Ok(None);
        };
        // A record that no longer parses (older format, manual edit) is a fresh session, not a
        // 500 on every request until it expires.
        Ok(serde_json::from_str(&json).ok())
    }

    async fn save(&self, id: &SessionId, r: &Record, ttl: Duration) -> Result<(), StoreError> {
        let json = serde_json::to_string(r).map_err(|e| StoreError(e.to_string()))?;
        self.kv
            .put(&id.storage_key(), json, ttl_secs(ttl))
            .await
            .map_err(StoreError)
    }

    async fn delete(&self, id: &SessionId) -> Result<(), StoreError> {
        self.kv.delete(&id.storage_key()).await.map_err(StoreError)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;
    use std::sync::{Arc, Mutex};

    #[derive(Clone, Default)]
    struct Mem(Arc<Mutex<HashMap<String, (String, u64)>>>);

    impl KvBackend for Mem {
        async fn get(&self, key: &str) -> Result<Option<String>, String> {
            Ok(self.0.lock().unwrap().get(key).map(|(v, _)| v.clone()))
        }
        async fn put(&self, key: &str, value: String, ttl: u64) -> Result<(), String> {
            self.0.lock().unwrap().insert(key.to_owned(), (value, ttl));
            Ok(())
        }
        async fn delete(&self, key: &str) -> Result<(), String> {
            self.0.lock().unwrap().remove(key);
            Ok(())
        }
    }

    struct Down;
    impl KvBackend for Down {
        async fn get(&self, _: &str) -> Result<Option<String>, String> {
            Err("kv down".into())
        }
        async fn put(&self, _: &str, _: String, _: u64) -> Result<(), String> {
            Err("kv down".into())
        }
        async fn delete(&self, _: &str) -> Result<(), String> {
            Err("kv down".into())
        }
    }

    fn record() -> Record {
        Record {
            csrf: "tok".into(),
            created: 1,
            touched: 2,
            ..Record::default()
        }
    }

    #[tokio::test]
    async fn round_trip_under_hashed_key() {
        let mem = Mem::default();
        let s = KvStore::with_backend(mem.clone());
        let id = SessionId::generate().unwrap();
        assert_eq!(s.load(&id).await.unwrap(), None);
        s.save(&id, &record(), Duration::from_secs(3600))
            .await
            .unwrap();
        {
            let m = mem.0.lock().unwrap();
            let (json, ttl) = m.get(&id.storage_key()).expect("stored under storage_key");
            assert_eq!(*ttl, 3600);
            assert_eq!(serde_json::from_str::<Record>(json).unwrap(), record());
            assert_eq!(m.len(), 1);
        }
        assert_eq!(s.load(&id).await.unwrap(), Some(record()));
        s.delete(&id).await.unwrap();
        assert_eq!(s.load(&id).await.unwrap(), None);
    }

    #[test]
    fn ttl_floor_and_rounding() {
        assert_eq!(ttl_secs(Duration::ZERO), MIN_TTL);
        assert_eq!(ttl_secs(Duration::from_secs(5)), MIN_TTL);
        assert_eq!(ttl_secs(Duration::from_millis(90_500)), 91);
        assert_eq!(ttl_secs(Duration::from_secs(86_400)), 86_400);
    }

    #[tokio::test]
    async fn corrupt_record_is_a_new_session() {
        let mem = Mem::default();
        let id = SessionId::generate().unwrap();
        mem.put(&id.storage_key(), "{not json".into(), 60)
            .await
            .unwrap();
        assert_eq!(KvStore::with_backend(mem).load(&id).await.unwrap(), None);
    }

    #[tokio::test]
    async fn backend_errors_surface() {
        let s = KvStore::with_backend(Down);
        let id = SessionId::generate().unwrap();
        assert!(
            s.load(&id)
                .await
                .unwrap_err()
                .to_string()
                .contains("kv down")
        );
        assert!(
            s.save(&id, &record(), Duration::from_secs(60))
                .await
                .is_err()
        );
        assert!(s.delete(&id).await.is_err());
    }
}
