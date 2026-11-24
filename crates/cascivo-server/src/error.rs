use std::fmt;

use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};

/// A handler failure: the client sees only the status and its reason phrase; the detail is
/// logged to stderr (never echoed, it may hold internals).
#[derive(Debug)]
pub struct AppError {
    pub status: StatusCode,
    pub detail: String,
}

impl AppError {
    pub fn new(status: StatusCode, detail: impl fmt::Display) -> Self {
        Self {
            status,
            detail: detail.to_string(),
        }
    }

    pub fn internal(detail: impl fmt::Display) -> Self {
        Self::new(StatusCode::INTERNAL_SERVER_ERROR, detail)
    }
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}: {}", self.status, self.detail)
    }
}

impl std::error::Error for AppError {}

impl From<cascivo_web::Errors> for AppError {
    fn from(e: cascivo_web::Errors) -> Self {
        Self::internal(e)
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        if self.status.is_server_error() {
            eprintln!("cascivo-server: {self}");
        }
        let reason = self.status.canonical_reason().unwrap_or("Error");
        (self.status, reason).into_response()
    }
}
