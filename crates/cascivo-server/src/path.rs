use std::fmt;

use axum::http::{HeaderValue, StatusCode, header};
use axum::response::{IntoResponse, Response};

use crate::Hx;

/// A same-origin path (`/…`, with an optional query and fragment): the only redirect target
/// cascivo-server accepts, so user input (`?next=`) cannot send a visitor off-site.
/// Rejected: anything not starting with one `/` (`//evil`, `https:`, `evil`), any `\` (browsers
/// read `/\evil` as `//evil`), an encoded `/` or `\` right after the first `/` (`/%2F/evil`,
/// which a decoding proxy turns into `//evil`), whitespace, control and non-ASCII characters
/// (percent-encode them), and more than 2048 bytes. Deserializing parses too, so a form or
/// query field typed `LocalPath` is safe to redirect to.
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
            && !b
                .get(1..4)
                .is_some_and(|p| p.eq_ignore_ascii_case(b"%2f") || p.eq_ignore_ascii_case(b"%5c"))
            && b.len() <= 2048
            && b.iter().all(|c| c.is_ascii_graphic() && *c != b'\\');
        if ok {
            Ok(Self(s.to_owned()))
        } else {
            Err(LocalPathError)
        }
    }

    /// `s` if it is a local path, else `/` (a `?next=` that may be missing or hostile).
    pub fn parse_or_root(s: Option<&str>) -> Self {
        s.and_then(|s| Self::parse(s).ok())
            .unwrap_or_else(|| Self("/".into()))
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

impl<'de> serde::Deserialize<'de> for LocalPath {
    fn deserialize<D: serde::Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        let s = <std::borrow::Cow<'de, str>>::deserialize(d)?;
        Self::parse(&s).map_err(serde::de::Error::custom)
    }
}

impl serde::Serialize for LocalPath {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.0)
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
    fn parse_or_root_and_serde() {
        assert_eq!(LocalPath::parse_or_root(Some("/a")).as_str(), "/a");
        assert_eq!(LocalPath::parse_or_root(Some("//evil")).as_str(), "/");
        assert_eq!(LocalPath::parse_or_root(None).as_str(), "/");
        let ok: LocalPath = serde_json::from_str("\"/a?b=1\"").unwrap();
        assert_eq!(ok.as_str(), "/a?b=1");
        assert!(serde_json::from_str::<LocalPath>("\"//evil\"").is_err());
        assert_eq!(serde_json::to_string(&ok).unwrap(), "\"/a?b=1\"");
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
            "/%2F/evil.example",
            "/%2fevil.example",
            "/%5Cevil.example",
            "/%5c/evil.example",
            long.as_str(),
        ] {
            assert_eq!(LocalPath::parse(p), Err(LocalPathError), "{p:?}");
        }
    }
}
