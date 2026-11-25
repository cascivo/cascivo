//! `multipart/form-data` forms with file inputs: [`MultipartForm`] runs the text fields through
//! the same [`Validate`] pipeline as [`Form`](crate::Form) and hands the files over separately.
//!
//! The body is buffered (to [`UPLOAD_LIMIT`]), so this suits avatars and attachments; stream
//! large objects straight to storage (R2 on Workers) instead. Send the CSRF token in the
//! `X-CSRF-Token` header (`hx-headers`), as the form field is not read from multipart bodies.

use axum::extract::{FromRequest, Request};
use axum::http::{StatusCode, header};

use crate::error::AppError;
use crate::forms::{Submission, Validate, parse};

/// The largest multipart body buffered (413 beyond it).
pub const UPLOAD_LIMIT: usize = 8 * 1024 * 1024;

/// One uploaded file. `filename` is the client's name with any directory part dropped:
/// still untrusted, never use it as a storage path.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct File {
    pub field: String,
    pub filename: String,
    pub content_type: String,
    pub bytes: Vec<u8>,
}

/// A parsed multipart body: the text fields (as `name=value` pairs) and the files.
#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct Parts {
    pub fields: Vec<(String, String)>,
    pub files: Vec<File>,
}

/// A form with files: `submission` is what [`Form`](crate::Form) would give for the text
/// fields, `files` the non-empty file parts (an unchosen file input sends none).
#[derive(Debug, Clone)]
pub struct MultipartForm<T> {
    pub submission: Submission<T>,
    pub files: Vec<File>,
}

impl<T, S> FromRequest<S> for MultipartForm<T>
where
    T: serde::de::DeserializeOwned + Validate,
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request(req: Request, _: &S) -> Result<Self, AppError> {
        let ct = req
            .headers()
            .get(header::CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .unwrap_or_default()
            .to_owned();
        let boundary = boundary(&ct).ok_or_else(|| {
            AppError::new(
                StatusCode::UNSUPPORTED_MEDIA_TYPE,
                "form: expected multipart/form-data with a boundary",
            )
        })?;
        let bytes = axum::body::to_bytes(req.into_body(), UPLOAD_LIMIT)
            .await
            .map_err(|_| AppError::new(StatusCode::PAYLOAD_TOO_LARGE, "form: body too large"))?;
        let parts = parse_multipart(&boundary, &bytes).ok_or_else(|| {
            AppError::new(StatusCode::BAD_REQUEST, "form: malformed multipart body")
        })?;
        let encoded = form_urlencoded::Serializer::new(String::new())
            .extend_pairs(parts.fields.iter().map(|(k, v)| (k.as_str(), v.as_str())))
            .finish();
        Ok(Self {
            submission: parse::<T>(encoded.as_bytes()),
            files: parts.files,
        })
    }
}

/// The `boundary` parameter of a `multipart/form-data` content type.
pub fn boundary(content_type: &str) -> Option<String> {
    let mut it = content_type.split(';');
    if !it
        .next()?
        .trim()
        .eq_ignore_ascii_case("multipart/form-data")
    {
        return None;
    }
    let b = it.find_map(|p| {
        let (k, v) = p.split_once('=')?;
        k.trim().eq_ignore_ascii_case("boundary").then(|| v.trim())
    })?;
    let b = b.trim_matches('"');
    (!b.is_empty() && b.len() <= 200).then(|| b.to_owned())
}

fn find(hay: &[u8], needle: &[u8], from: usize) -> Option<usize> {
    hay.get(from..)?
        .windows(needle.len())
        .position(|w| w == needle)
        .map(|i| i + from)
}

/// `;`-separated `key=value` / `key="value"` parameters, quotes honoured.
fn params(s: &str) -> Vec<(String, String)> {
    let (mut out, mut cur, mut quoted) = (Vec::new(), String::new(), false);
    for c in s.chars() {
        match c {
            '"' => {
                quoted = !quoted;
                cur.push(c);
            }
            ';' if !quoted => out.push(std::mem::take(&mut cur)),
            _ => cur.push(c),
        }
    }
    out.push(cur);
    out.into_iter()
        .filter_map(|p| {
            let (k, v) = p.split_once('=')?;
            Some((
                k.trim().to_ascii_lowercase(),
                v.trim().trim_matches('"').to_owned(),
            ))
        })
        .collect()
}

/// Parses a body delimited by `boundary`. `None` when it is not well-formed.
pub fn parse_multipart(boundary: &str, body: &[u8]) -> Option<Parts> {
    let delim = format!("--{boundary}").into_bytes();
    let sep = [b"\r\n".as_slice(), &delim].concat();
    let mut out = Parts::default();
    let mut at = find(body, &delim, 0)? + delim.len();
    loop {
        if body.get(at..at + 2)? == b"--" {
            return Some(out);
        }
        // Transport padding may precede the CRLF.
        let head_start = find(body, b"\r\n", at)? + 2;
        let head_end = find(body, b"\r\n\r\n", head_start)?;
        let head = std::str::from_utf8(body.get(head_start..head_end)?).ok()?;
        // The CRLF ending the headers may also be the one before the delimiter (empty data).
        let mut data_end = find(body, &sep, head_end + 2)?;
        // A real delimiter ends in CRLF or `--`; `--XyZ-x` inside the data is data.
        while !matches!(
            body.get(data_end + sep.len()..data_end + sep.len() + 2),
            Some(b"\r\n" | b"--")
        ) {
            data_end = find(body, &sep, data_end + 1)?;
        }
        let data = body.get(head_end + 4..data_end).unwrap_or_default();
        let (mut name, mut filename, mut ctype) = (None, None, None);
        for line in head.split("\r\n").filter(|l| !l.is_empty()) {
            let (h, v) = line.split_once(':')?;
            match h.trim().to_ascii_lowercase().as_str() {
                "content-disposition" => {
                    for (k, v) in params(v) {
                        match k.as_str() {
                            "name" => name = Some(v),
                            "filename" => filename = Some(v),
                            _ => {}
                        }
                    }
                }
                "content-type" => ctype = Some(v.trim().to_owned()),
                _ => {}
            }
        }
        let name = name?;
        match filename {
            Some(f) => {
                let f = f.rsplit(['/', '\\']).next().unwrap_or_default().to_owned();
                if !f.is_empty() || !data.is_empty() {
                    out.files.push(File {
                        field: name,
                        filename: f,
                        content_type: ctype.unwrap_or_else(|| "application/octet-stream".into()),
                        bytes: data.to_vec(),
                    });
                }
            }
            None => out
                .fields
                .push((name, String::from_utf8_lossy(data).into_owned())),
        }
        at = data_end + sep.len();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn body(parts: &[&str]) -> Vec<u8> {
        let mut s = String::new();
        for p in parts {
            s.push_str("--XyZ\r\n");
            s.push_str(p);
            s.push_str("\r\n");
        }
        s.push_str("--XyZ--\r\n");
        s.into_bytes()
    }

    #[test]
    fn fields_and_files() {
        let b = body(&[
            "Content-Disposition: form-data; name=\"title\"\r\n\r\nhi there",
            "Content-Disposition: form-data; name=\"doc\"; filename=\"C:\\x\\a;b.txt\"\r\nContent-Type: text/plain\r\n\r\nl1\r\n--XyZ-not-a-boundary\r\nl2",
            "Content-Disposition: form-data; name=\"none\"; filename=\"\"\r\nContent-Type: application/octet-stream\r\n\r\n",
        ]);
        let p = parse_multipart("XyZ", &b).unwrap();
        assert_eq!(p.fields, [("title".into(), "hi there".into())]);
        assert_eq!(p.files.len(), 1);
        assert_eq!(p.files[0].filename, "a;b.txt");
        assert_eq!(p.files[0].content_type, "text/plain");
        assert_eq!(p.files[0].bytes, b"l1\r\n--XyZ-not-a-boundary\r\nl2");
    }

    #[test]
    fn malformed_bodies_are_none() {
        assert!(parse_multipart("XyZ", b"nothing").is_none());
        assert!(
            parse_multipart(
                "XyZ",
                b"--XyZ\r\nContent-Disposition: form-data; name=\"a\"\r\n\r\nx"
            )
            .is_none()
        );
    }

    #[test]
    fn boundary_parsing() {
        assert_eq!(
            boundary("multipart/form-data; boundary=ab").as_deref(),
            Some("ab")
        );
        assert_eq!(
            boundary("Multipart/Form-Data;boundary=\"a b\"").as_deref(),
            Some("a b")
        );
        assert_eq!(boundary("multipart/form-data"), None);
        assert_eq!(boundary("application/json; boundary=x"), None);
    }
}
