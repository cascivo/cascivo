use std::fmt::Write as _;

use axum::http::{HeaderMap, HeaderName, HeaderValue, header};

/// The CSP nonce of one request: 128 random bits, hex. In the request extensions
/// (`Extension<Nonce>`) and in every template as `request.nonce`; `theme_script()` and
/// `islands_script()` add it themselves.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Nonce(String);

impl Nonce {
    pub fn generate() -> Result<Self, getrandom::Error> {
        let mut b = [0u8; 16];
        getrandom::fill(&mut b)?;
        let mut s = String::with_capacity(32);
        for x in b {
            let _ = write!(s, "{x:02x}");
        }
        Ok(Self(s))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// Security headers added to every response, unless the handler already set that header.
/// `None` leaves a header out. In `csp`, `{nonce}` becomes the request's [`Nonce`].
///
/// The default CSP is strict: scripts only by nonce (`'strict-dynamic'` lets them load
/// modules), no `unsafe-inline`/`unsafe-eval`, no `<object>`, no `<base>`, no framing, forms
/// post to the same origin. htmx then needs `allowEval: false` and no `hx-on`/`js:` values.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Headers {
    pub csp: Option<String>,
    /// `Strict-Transport-Security`; remove it for plain-HTTP development hosts other than localhost.
    pub hsts: Option<String>,
    pub referrer_policy: Option<String>,
    pub permissions_policy: Option<String>,
    /// `X-Frame-Options`, for browsers without CSP `frame-ancestors`.
    pub frame_options: Option<String>,
    /// `X-Content-Type-Options: nosniff`.
    pub nosniff: bool,
}

pub const DEFAULT_CSP: &str = "default-src 'self'; script-src 'nonce-{nonce}' 'strict-dynamic'; \
     style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; \
     object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'";

impl Default for Headers {
    fn default() -> Self {
        Self {
            csp: Some(DEFAULT_CSP.into()),
            hsts: Some("max-age=63072000; includeSubDomains".into()),
            referrer_policy: Some("strict-origin-when-cross-origin".into()),
            permissions_policy: Some(
                "camera=(), microphone=(), geolocation=(), payment=(), usb=()".into(),
            ),
            frame_options: Some("DENY".into()),
            nosniff: true,
        }
    }
}

impl Headers {
    /// No security headers at all (tests, or a proxy that sets them).
    pub fn none() -> Self {
        Self {
            csp: None,
            hsts: None,
            referrer_policy: None,
            permissions_policy: None,
            frame_options: None,
            nosniff: false,
        }
    }

    /// Checks every value once, so a typo fails at startup instead of silently dropping a
    /// header (and with it the CSP) on each response.
    pub(crate) fn compile(&self) -> Result<Compiled, String> {
        let value = |name: &str, v: &str| {
            HeaderValue::from_str(v)
                .map_err(|_| format!("security header `{name}`: invalid value {v:?}"))
        };
        let mut fixed = Vec::new();
        let named = [
            (header::STRICT_TRANSPORT_SECURITY, &self.hsts),
            (header::REFERRER_POLICY, &self.referrer_policy),
            (
                HeaderName::from_static("permissions-policy"),
                &self.permissions_policy,
            ),
            (header::X_FRAME_OPTIONS, &self.frame_options),
        ];
        for (name, v) in named {
            if let Some(v) = v {
                fixed.push((name.clone(), value(name.as_str(), v)?));
            }
        }
        if self.nosniff {
            fixed.push((
                header::X_CONTENT_TYPE_OPTIONS,
                HeaderValue::from_static("nosniff"),
            ));
        }
        if let Some(csp) = &self.csp {
            value(
                "content-security-policy",
                &csp.replace("{nonce}", &"0".repeat(32)),
            )?;
        }
        Ok(Compiled {
            fixed,
            csp: self.csp.clone(),
        })
    }
}

#[derive(Debug, Clone)]
pub(crate) struct Compiled {
    fixed: Vec<(HeaderName, HeaderValue)>,
    csp: Option<String>,
}

impl Compiled {
    pub(crate) fn apply(&self, h: &mut HeaderMap, nonce: &Nonce) {
        for (name, v) in &self.fixed {
            h.entry(name).or_insert_with(|| v.clone());
        }
        if let Some(csp) = &self.csp
            && !h.contains_key(header::CONTENT_SECURITY_POLICY)
            // Valid: checked in `compile` with a nonce of the same shape (32 hex digits).
            && let Ok(v) = HeaderValue::from_str(&csp.replace("{nonce}", nonce.as_str()))
        {
            h.insert(header::CONTENT_SECURITY_POLICY, v);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn nonces_are_hex_and_differ() {
        let (a, b) = (Nonce::generate().unwrap(), Nonce::generate().unwrap());
        assert_ne!(a, b);
        assert!(a.as_str().len() == 32 && a.as_str().bytes().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn invalid_values_fail_compile() {
        let h = Headers {
            referrer_policy: Some("a\nb".into()),
            ..Headers::default()
        };
        assert!(h.compile().unwrap_err().contains("referrer-policy"));
        let h = Headers {
            csp: Some("x\u{0}".into()),
            ..Headers::none()
        };
        assert!(h.compile().is_err());
        assert!(Headers::default().compile().is_ok());
    }
}
