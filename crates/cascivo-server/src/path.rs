use std::fmt;

use axum::http::{HeaderValue, StatusCode, header};
use axum::response::{IntoResponse, Response};

use crate::Hx;

/// A same-origin path (`/…`, with an optional query and fragment): the only redirect target
/// cascivo-server accepts, so user input (`?next=`) cannot send a visitor off-site.
/// Rejected: anything not starting with one `/` (`//evil`, `https:`, `evil`), any `\` (browsers
/// read `/\evil` as `//evil`), whitespace, control and non-ASCII characters (percent-encode
/// them), and more than 2048 bytes.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct LocalPath(String);

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LocalPathError;

impl fmt::Display for LocalPathError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("not a same-origin path")
    }
}

impl std::error::Error for LocalPathError {}

impl LocalPath {
    pub fn parse(s: &str) -> Result<Self, LocalPathError> {
        let b = s.as_bytes();
        let ok = b.first() == Some(&b'/')
            && !matches!(b.get(1), Some(b'/' | b'\\'))
            && b.len() <= 2048
            && b.iter().all(|c| c.is_ascii_graphic() && *c != b'\\');
        if ok {
            Ok(Self(s.to_owned()))
        } else {
            Err(LocalPathError)
        }
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }

    fn header(&self) -> HeaderValue {
        // Visible ASCII only (checked in `parse`), which is always a valid header value.
        HeaderValue::from_str(&self.0).unwrap_or_else(|_| HeaderValue::from_static("/"))
    }
}

impl TryFrom<&str> for LocalPath {
    type Error = LocalPathError;
    fn try_from(s: &str) -> Result<Self, Self::Error> {
        Self::parse(s)
    }
}

impl fmt::Display for LocalPath {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

/// Post/redirect/get: `303 See Other` to `to`, or for an htmx request `200` with
/// `HX-Location` (htmx cannot see a redirect `fetch` followed; this navigates with history).
pub fn see_other(hx: &Hx, to: &LocalPath) -> Response {
    let mut r = see_other_inner(hx, to);
    r.headers_mut()
        .append(header::VARY, HeaderValue::from_static("HX-Request"));
    r
}

fn see_other_inner(hx: &Hx, to: &LocalPath) -> Response {
    if hx.request {
        let mut r = StatusCode::OK.into_response();
        r.headers_mut().insert("hx-location", to.header());
        r
    } else {
        let mut r = StatusCode::SEE_OTHER.into_response();
        r.headers_mut().insert(header::LOCATION, to.header());
        r
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_local_paths() {
        for p in ["/", "/todos", "/todos?x=1&y=%2F#top", "/a/b.c-d_e~f"] {
            assert_eq!(LocalPath::parse(p).unwrap().as_str(), p);
        }
    }

    #[test]
    fn rejects_everything_else() {
        let long = format!("/{}", "a".repeat(2048));
        for p in [
            "",
            "todos",
            "//evil.example",
            "/\\evil.example",
            "\\\\evil",
            "/a\\b",
            "https://evil.example",
            "javascript:alert(1)",
            "/a b",
            "/a\tb",
            "/a\nb",
            "/é",
            long.as_str(),
        ] {
            assert_eq!(LocalPath::parse(p), Err(LocalPathError), "{p:?}");
        }
    }
}
