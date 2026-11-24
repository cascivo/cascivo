use std::fmt;

use axum::http::StatusCode;
use cascivo_server::AppError;
use worker::HttpMetadata;

use crate::R2;

/// What [`R2::upload`] accepts. The client's file name never reaches the key; the
/// content type is matched against `types` (parameters and case ignored) and stored as the
/// allowlisted spelling. Every object is served `Content-Disposition: attachment`, so a user
/// file cannot render as a page on your origin.
#[derive(Debug, Clone, Copy)]
pub struct Upload {
    pub max_bytes: usize,
    pub types: &'static [&'static str],
    /// Key prefix (server-chosen, e.g. `"avatars/"`).
    pub prefix: &'static str,
}

impl Upload {
    pub const fn new(max_bytes: usize, types: &'static [&'static str]) -> Self {
        Self {
            max_bytes,
            types,
            prefix: "uploads/",
        }
    }

    #[must_use]
    pub const fn prefix(mut self, prefix: &'static str) -> Self {
        self.prefix = prefix;
        self
    }

    /// The allowlisted content type for an upload of `len` bytes.
    ///
    /// # Errors
    /// Empty, over `max_bytes`, or a type not in `types`.
    pub fn check(&self, content_type: &str, len: usize) -> Result<&'static str, UploadError> {
        if len == 0 {
            return Err(UploadError::Empty);
        }
        if len > self.max_bytes {
            return Err(UploadError::TooLarge {
                max: self.max_bytes,
            });
        }
        let essence = content_type.split(';').next().unwrap_or("").trim();
        self.types
            .iter()
            .copied()
            .find(|t| t.eq_ignore_ascii_case(essence))
            .ok_or(UploadError::Type)
    }

    /// `prefix` + 32 random hex characters (128 bits).
    ///
    /// # Errors
    /// When the platform has no randomness.
    pub fn key(&self) -> Result<String, UploadError> {
        let mut b = [0u8; 16];
        getrandom::fill(&mut b).map_err(|e| UploadError::Store(e.to_string()))?;
        let mut k = String::with_capacity(self.prefix.len() + 32);
        k.push_str(self.prefix);
        for x in b {
            k.push_str(&format!("{x:02x}"));
        }
        Ok(k)
    }
}

/// A stored upload.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Stored {
    pub key: String,
    pub content_type: &'static str,
    pub size: usize,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum UploadError {
    Empty,
    TooLarge { max: usize },
    Type,
    Store(String),
}

impl fmt::Display for UploadError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Empty => f.write_str("empty upload"),
            Self::TooLarge { max } => write!(f, "upload over {max} bytes"),
            Self::Type => f.write_str("upload type not allowed"),
            Self::Store(e) => write!(f, "R2: {e}"),
        }
    }
}

impl std::error::Error for UploadError {}

impl From<UploadError> for AppError {
    fn from(e: UploadError) -> Self {
        let status = match e {
            UploadError::Empty => StatusCode::BAD_REQUEST,
            UploadError::TooLarge { .. } => StatusCode::PAYLOAD_TOO_LARGE,
            UploadError::Type => StatusCode::UNSUPPORTED_MEDIA_TYPE,
            UploadError::Store(_) => StatusCode::INTERNAL_SERVER_ERROR,
        };
        Self::new(status, e)
    }
}

impl R2 {
    /// Checks `bytes` against `policy`, then stores them under a fresh [`Upload::key`].
    ///
    /// # Errors
    /// [`Upload::check`] failures, or the R2 put.
    pub async fn upload(
        &self,
        policy: &Upload,
        content_type: &str,
        bytes: Vec<u8>,
    ) -> Result<Stored, UploadError> {
        let ct = policy.check(content_type, bytes.len())?;
        let key = policy.key()?;
        let size = bytes.len();
        self.0
            .put(key.clone(), bytes)
            .http_metadata(HttpMetadata {
                content_type: Some(ct.to_owned()),
                content_disposition: Some("attachment".to_owned()),
                ..HttpMetadata::default()
            })
            .execute()
            .await
            .map_err(|e| UploadError::Store(e.to_string()))?;
        Ok(Stored {
            key,
            content_type: ct,
            size,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::response::IntoResponse;

    const IMG: Upload = Upload::new(1024, &["image/png", "image/jpeg"]);

    #[test]
    fn checks_size_and_type() {
        assert_eq!(IMG.check("image/png", 10), Ok("image/png"));
        assert_eq!(IMG.check("Image/JPEG; charset=x", 1024), Ok("image/jpeg"));
        assert_eq!(IMG.check("image/png", 0), Err(UploadError::Empty));
        assert_eq!(
            IMG.check("image/png", 1025),
            Err(UploadError::TooLarge { max: 1024 })
        );
        assert_eq!(IMG.check("text/html", 10), Err(UploadError::Type));
        assert_eq!(IMG.check("image/png+html", 10), Err(UploadError::Type));
        assert_eq!(IMG.check("", 10), Err(UploadError::Type));
    }

    #[test]
    fn keys_are_server_generated() {
        let a = IMG.key().unwrap();
        let b = IMG.prefix("avatars/").key().unwrap();
        assert!(a.starts_with("uploads/") && a.len() == 8 + 32);
        assert!(b.starts_with("avatars/"));
        assert!(a[8..].bytes().all(|c| c.is_ascii_hexdigit()));
        assert_ne!(a, IMG.key().unwrap());
    }

    #[test]
    fn errors_map_to_statuses() {
        let s = |e: UploadError| AppError::from(e).into_response().status().as_u16();
        assert_eq!(s(UploadError::Empty), 400);
        assert_eq!(s(UploadError::TooLarge { max: 1 }), 413);
        assert_eq!(s(UploadError::Type), 415);
        assert_eq!(s(UploadError::Store("x".into())), 500);
    }
}
