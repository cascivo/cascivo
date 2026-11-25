use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use cascivo_server::AppError;

/// Binding names the [`D1`] and [`R2`] extractors read (`wrangler.jsonc` `binding`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Bindings {
    pub d1: &'static str,
    pub r2: &'static str,
}

impl Default for Bindings {
    fn default() -> Self {
        Self {
            d1: "DB",
            r2: "BUCKET",
        }
    }
}

/// What [`serve`](crate::serve) puts in the request extensions (`worker::Env` is `Send + Sync`).
#[derive(Clone)]
pub(crate) struct EnvExt(pub worker::Env);

fn env(parts: &Parts) -> Result<&worker::Env, AppError> {
    parts
        .extensions
        .get::<EnvExt>()
        .map(|e| &e.0)
        .ok_or_else(|| {
            AppError::internal("no worker::Env: route not served by cascivo_worker::serve")
        })
}

#[cfg_attr(not(any(feature = "d1", feature = "r2")), allow(dead_code))]
fn bindings(parts: &Parts) -> Bindings {
    parts
        .extensions
        .get::<Bindings>()
        .copied()
        .unwrap_or_default()
}

/// The Worker's bindings (vars, secrets, KV, …). 500 outside [`serve`](crate::serve).
#[derive(Debug, Clone)]
pub struct Env(pub worker::Env);

impl<S: Send + Sync> FromRequestParts<S> for Env {
    type Rejection = AppError;
    async fn from_request_parts(parts: &mut Parts, _: &S) -> Result<Self, AppError> {
        env(parts).cloned().map(Self)
    }
}

/// The D1 database bound as [`Bindings::d1`]. 500 when the binding is missing.
#[cfg(feature = "d1")]
#[derive(Debug)]
pub struct D1(pub worker::D1Database);

#[cfg(feature = "d1")]
impl<S: Send + Sync> FromRequestParts<S> for D1 {
    type Rejection = AppError;
    async fn from_request_parts(parts: &mut Parts, _: &S) -> Result<Self, AppError> {
        let name = bindings(parts).d1;
        env(parts)?
            .d1(name)
            .map(Self)
            .map_err(|e| AppError::internal(format!("D1 {name}: {e}")))
    }
}

/// The R2 bucket bound as [`Bindings::r2`]; store user files with [`R2::upload`].
#[cfg(feature = "r2")]
#[derive(Debug, Clone)]
pub struct R2(pub worker::Bucket);

#[cfg(feature = "r2")]
impl<S: Send + Sync> FromRequestParts<S> for R2 {
    type Rejection = AppError;
    async fn from_request_parts(parts: &mut Parts, _: &S) -> Result<Self, AppError> {
        let name = bindings(parts).r2;
        let bucket = env(parts)?
            .bucket(name)
            .map_err(|e| AppError::internal(format!("R2 {name}: {e}")))?;
        Ok(Self(bucket))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::{Request, StatusCode};
    use axum::response::IntoResponse;

    #[test]
    fn default_bindings() {
        assert_eq!(
            Bindings::default(),
            Bindings {
                d1: "DB",
                r2: "BUCKET"
            }
        );
    }

    #[tokio::test]
    async fn outside_serve_is_500() {
        let (mut parts, ()) = Request::new(()).into_parts();
        let e = Env::from_request_parts(&mut parts, &()).await.unwrap_err();
        assert_eq!(
            e.into_response().status(),
            StatusCode::INTERNAL_SERVER_ERROR
        );
        #[cfg(feature = "d1")]
        assert!(D1::from_request_parts(&mut parts, &()).await.is_err());
    }

    #[test]
    fn custom_bindings_win() {
        let (mut parts, ()) = Request::new(()).into_parts();
        assert_eq!(bindings(&parts), Bindings::default());
        let b = Bindings {
            d1: "MAIN",
            r2: "FILES",
        };
        parts.extensions.insert(b);
        assert_eq!(bindings(&parts), b);
    }
}
