use std::convert::Infallible;

use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use axum::http::{HeaderMap, Uri};

/// htmx request facts. All untrusted and informational: a handler names its blocks statically,
/// never from `target` or `trigger`. Values over 1 KiB or not visible ASCII read as absent.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Hx {
    /// `HX-Request: true`.
    pub request: bool,
    /// `HX-Boosted: true` (an `hx-boost` link or form: it swaps the whole body).
    pub boosted: bool,
    /// `HX-History-Restore-Request: true` (a cache miss on back/forward: wants the full page).
    pub history_restore: bool,
    pub target: Option<String>,
    pub trigger: Option<String>,
    pub current_url: Option<Uri>,
}

const MAX: usize = 1024;

impl Hx {
    pub fn from_headers(h: &HeaderMap) -> Self {
        let text = |name: &str| {
            h.get(name)
                .and_then(|v| v.to_str().ok())
                .filter(|s| !s.is_empty() && s.len() <= MAX)
                .map(str::to_owned)
        };
        let flag = |name: &str| text(name).is_some_and(|v| v == "true");
        Self {
            request: flag("hx-request"),
            boosted: flag("hx-boosted"),
            history_restore: flag("hx-history-restore-request"),
            target: text("hx-target"),
            trigger: text("hx-trigger"),
            current_url: text("hx-current-url").and_then(|s| s.parse().ok()),
        }
    }

    /// An htmx request that swaps part of the page: it gets a view's fragment and OOB swaps.
    /// Boosted and history-restore requests get the whole page.
    pub fn is_partial(&self) -> bool {
        self.request && !self.boosted && !self.history_restore
    }
}

impl<S: Sync> FromRequestParts<S> for Hx {
    type Rejection = Infallible;

    async fn from_request_parts(parts: &mut Parts, _: &S) -> Result<Self, Self::Rejection> {
        Ok(Self::from_headers(&parts.headers))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn hx(pairs: &[(&str, &str)]) -> Hx {
        let mut h = HeaderMap::new();
        for (k, v) in pairs {
            h.insert(
                axum::http::HeaderName::from_bytes(k.as_bytes()).unwrap(),
                v.parse().unwrap(),
            );
        }
        Hx::from_headers(&h)
    }

    #[test]
    fn reads_flags_and_values() {
        let x = hx(&[
            ("HX-Request", "true"),
            ("HX-Target", "todos"),
            ("HX-Trigger", "add"),
            ("HX-Current-URL", "https://a.example/todos?x=1"),
        ]);
        assert!(x.request && !x.boosted && !x.history_restore && x.is_partial());
        assert_eq!(x.target.as_deref(), Some("todos"));
        assert_eq!(x.trigger.as_deref(), Some("add"));
        assert_eq!(x.current_url.unwrap().path(), "/todos");
        assert!(!hx(&[("HX-Request", "true"), ("HX-Boosted", "true")]).is_partial());
        assert!(
            !hx(&[
                ("HX-Request", "true"),
                ("HX-History-Restore-Request", "true")
            ])
            .is_partial()
        );
    }

    #[test]
    fn only_exact_true_is_a_flag_and_oversized_values_are_absent() {
        assert!(!hx(&[("HX-Request", "1")]).request);
        assert!(!hx(&[("HX-Request", "TRUE")]).request);
        assert_eq!(hx(&[]), Hx::default());
        let long = "a".repeat(MAX + 1);
        assert_eq!(hx(&[("HX-Target", &long)]).target, None);
        assert_eq!(hx(&[("HX-Current-URL", "not a url")]).current_url, None);
    }
}
