//! `axum` adapter: the rendered site as a `Router` (pages, stylesheet, public files, sitemap).

use std::sync::Arc;

use axum::Router;
use axum::http::{StatusCode, Uri, header};
use axum::response::IntoResponse;

use crate::error::Result;
use crate::site::Site;

/// Renders `site` once and serves it from memory; mount it with `Router::merge` or `nest`.
pub fn router(site: &Site) -> Result<Router> {
    let out = Arc::new(site.render()?);
    Ok(Router::new().fallback(move |uri: Uri| {
        let out = Arc::clone(&out);
        async move {
            match out.get(uri.path()) {
                Some((mime, bytes)) => {
                    ([(header::CONTENT_TYPE, mime.to_string())], bytes.to_vec()).into_response()
                }
                None => match out.not_found(uri.path()) {
                    Some((mime, bytes)) => (
                        StatusCode::NOT_FOUND,
                        [(header::CONTENT_TYPE, mime.to_string())],
                        bytes.to_vec(),
                    )
                        .into_response(),
                    None => (StatusCode::NOT_FOUND, "not found").into_response(),
                },
            }
        }
    }))
}
