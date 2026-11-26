//! Randomness, encoding, time and the Workers `Send` bridge shared by sessions, CSRF and auth.

use base64::Engine as _;
use base64::engine::general_purpose::URL_SAFE_NO_PAD;

pub(crate) fn random<const N: usize>() -> Result<[u8; N], getrandom::Error> {
    let mut b = [0u8; N];
    getrandom::fill(&mut b)?;
    Ok(b)
}

/// 256 random bits, base64url (43 characters): session ids, CSRF tokens, OAuth state.
pub(crate) fn token() -> Result<String, getrandom::Error> {
    Ok(b64(&random::<32>()?))
}

pub(crate) fn b64(b: &[u8]) -> String {
    URL_SAFE_NO_PAD.encode(b)
}

pub(crate) fn unb64(s: &str) -> Option<Vec<u8>> {
    URL_SAFE_NO_PAD.decode(s).ok()
}

/// Equality whose time does not depend on where the inputs differ (token checks).
pub(crate) fn ct_eq(a: &[u8], b: &[u8]) -> bool {
    a.len() == b.len() && a.iter().zip(b).fold(0u8, |acc, (x, y)| acc | (x ^ y)) == 0
}

/// Percent-encodes everything but RFC 3986 unreserved characters (a query value).
pub(crate) fn encode_component(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for b in s.bytes() {
        if b.is_ascii_alphanumeric() || matches!(b, b'-' | b'.' | b'_' | b'~') {
            out.push(b as char);
        } else {
            out.push_str(&format!("%{b:02X}"));
        }
    }
    out
}

/// Unix seconds. `SystemTime::now` panics on wasm32-unknown-unknown, so Workers ask JS.
#[cfg(all(target_arch = "wasm32", target_os = "unknown"))]
pub(crate) fn now() -> u64 {
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    let s = (js_sys::Date::now() / 1000.0) as u64;
    s
}

#[cfg(not(all(target_arch = "wasm32", target_os = "unknown")))]
pub(crate) fn now() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |d| d.as_secs())
}

// axum middleware needs `Send` futures and state. Native stores are `Send` (`MaybeSend`), so
// these are identities there. Workers stores hold `!Send` JS handles; see `Local`.

#[cfg(any(feature = "native", not(feature = "workers")))]
pub(crate) fn send<F: Future + Send>(f: F) -> F {
    f
}

#[cfg(any(feature = "native", not(feature = "workers")))]
#[derive(Debug)]
pub(crate) struct Local<T>(pub T);

#[cfg(all(feature = "workers", not(feature = "native")))]
pub(crate) fn send<F: Future + 'static>(f: F) -> Local<std::pin::Pin<Box<F>>> {
    Local(Box::pin(f))
}

#[cfg(all(
    feature = "workers",
    not(feature = "native"),
    target_feature = "atomics"
))]
compile_error!("cascivo-server `workers` assumes single-threaded wasm (no `atomics`)");

/// Workers-only builds: a value or future that is `!Send` because it holds JS handles.
#[cfg(all(feature = "workers", not(feature = "native")))]
#[derive(Debug)]
pub(crate) struct Local<T>(pub T);

// SAFETY: a workers-only build runs on Cloudflare Workers' single-threaded wasm (no `atomics`,
// enforced above), so a `Local` is never touched from two threads.
#[cfg(all(feature = "workers", not(feature = "native")))]
unsafe impl<T> Send for Local<T> {}
// SAFETY: as above.
#[cfg(all(feature = "workers", not(feature = "native")))]
unsafe impl<T> Sync for Local<T> {}

#[cfg(all(feature = "workers", not(feature = "native")))]
impl<F: Future + Unpin> Future for Local<F> {
    type Output = F::Output;
    fn poll(
        mut self: std::pin::Pin<&mut Self>,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<F::Output> {
        std::pin::Pin::new(&mut self.0).poll(cx)
    }
}

impl<T> Clone for Local<std::sync::Arc<T>> {
    fn clone(&self) -> Self {
        Self(self.0.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn helpers() {
        assert_eq!(token().unwrap().len(), 43);
        assert_ne!(token().unwrap(), token().unwrap());
        assert!(ct_eq(b"abc", b"abc") && !ct_eq(b"abc", b"abd") && !ct_eq(b"ab", b"abc"));
        assert_eq!(encode_component("/a?b=c d~"), "%2Fa%3Fb%3Dc%20d~");
        assert_eq!(unb64(&b64(b"xyz")).unwrap(), b"xyz");
        assert!(now() > 1_700_000_000);
    }
}
