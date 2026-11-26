//! Server-sent events: HTML fragments for the htmx `sse` extension (`sse-swap="<event>"`) or,
//! with the `datastar` feature, Datastar patch events. [`sse`] frames a stream on every
//! target; keep-alive comments and the [`Hub`] fan-out need `native` (tokio). Workers have no
//! long-lived fan-out without Durable Objects, which Phase 3 does not use.

use std::borrow::Cow;
use std::convert::Infallible;

use axum::response::sse::{Event, Sse};
use axum::response::{IntoResponse, Response};
use futures_util::{Stream, StreamExt};

/// One SSE event: `event: <event>` and the HTML as `data:` lines.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Fragment {
    pub event: Cow<'static, str>,
    pub html: String,
}

impl Fragment {
    pub fn new(event: impl Into<Cow<'static, str>>, html: impl Into<String>) -> Self {
        Self {
            event: event.into(),
            html: html.into(),
        }
    }

    /// `None` for an event name that would break the framing (empty, CR/LF); the event is
    /// dropped instead of panicking or injecting fields.
    fn to_event(&self) -> Option<Event> {
        let ok = !self.event.is_empty() && !self.event.contains(['\r', '\n']);
        // `Event::data` turns each line into a `data:` line, so the HTML cannot start a new
        // field. CR line endings are normalised first; axum would keep them in the stream.
        let html = self.html.replace("\r\n", "\n").replace('\r', "\n");
        ok.then(|| Event::default().event(&*self.event).data(html))
    }
}

/// An SSE response (`text/event-stream`, `Cache-Control: no-cache`). Native builds send a
/// keep-alive comment every 15 s so proxies keep the connection open.
pub fn sse<S>(s: S) -> Response
where
    S: Stream<Item = Fragment> + Send + 'static,
{
    let events = s.filter_map(|f| async move { f.to_event().map(Ok::<_, Infallible>) });
    let sse = Sse::new(events);
    #[cfg(feature = "native")]
    let sse = sse.keep_alive(axum::response::sse::KeepAlive::default());
    sse.into_response()
}

/// Datastar `datastar-patch-elements` modes.
#[cfg(feature = "datastar")]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum PatchMode {
    #[default]
    Outer,
    Inner,
    Replace,
    Prepend,
    Append,
    Before,
    After,
    Remove,
}

#[cfg(feature = "datastar")]
impl PatchMode {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Outer => "outer",
            Self::Inner => "inner",
            Self::Replace => "replace",
            Self::Prepend => "prepend",
            Self::Append => "append",
            Self::Before => "before",
            Self::After => "after",
            Self::Remove => "remove",
        }
    }
}

/// A Datastar element patch. Each HTML line becomes an `elements` data line; a `selector` with
/// CR/LF is cut at the first one, so it cannot add data lines.
#[cfg(feature = "datastar")]
pub fn patch_elements(html: &str, selector: Option<&str>, mode: PatchMode) -> Fragment {
    let mut data = String::new();
    if let Some(sel) = selector {
        let sel = sel.split(['\r', '\n']).next().unwrap_or_default();
        data.push_str("selector ");
        data.push_str(sel);
        data.push('\n');
    }
    if mode != PatchMode::Outer {
        data.push_str("mode ");
        data.push_str(mode.as_str());
        data.push('\n');
    }
    let mut lines = html.lines().peekable();
    while let Some(l) = lines.next() {
        data.push_str("elements ");
        data.push_str(l);
        if lines.peek().is_some() {
            data.push('\n');
        }
    }
    Fragment::new(
        "datastar-patch-elements",
        data.trim_end_matches('\n').to_owned(),
    )
}

/// A Datastar signal patch (`signals {json}`; JSON never contains a raw newline).
#[cfg(feature = "datastar")]
pub fn patch_signals(signals: &impl serde::Serialize) -> Result<Fragment, serde_json::Error> {
    Ok(Fragment::new(
        "datastar-patch-signals",
        format!("signals {}", serde_json::to_string(signals)?),
    ))
}

#[cfg(feature = "native")]
pub use hub::{Hub, HubError, Subscription};

#[cfg(feature = "native")]
mod hub {
    use std::collections::HashMap;
    use std::fmt;
    use std::pin::Pin;
    use std::sync::{Arc, Mutex, PoisonError};
    use std::task::{Context, Poll};

    use futures_util::Stream;
    use futures_util::stream::BoxStream;
    use tokio::sync::broadcast;

    /// Why [`Hub::publish`] or [`Hub::subscribe`] refused.
    #[derive(Debug, Clone, PartialEq, Eq)]
    pub enum HubError {
        /// The topic matches no allowlist entry.
        UnknownTopic,
        /// The subscriber key already holds the maximum number of streams.
        TooManySubscriptions,
    }

    impl fmt::Display for HubError {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            f.write_str(match self {
                Self::UnknownTopic => "topic not allowed",
                Self::TooManySubscriptions => "too many subscriptions for this key",
            })
        }
    }

    impl std::error::Error for HubError {}

    struct Inner<T> {
        topics: HashMap<String, broadcast::Sender<T>>,
        per_key: HashMap<String, usize>,
    }

    /// In-process broadcast by topic (tokio `broadcast`). Topic names come from clients, so
    /// only allowlisted ones exist: an exact name, or `prefix:*` whose suffix is
    /// `[A-Za-z0-9_-]{1,64}`. Each subscriber key (a session or user id) holds at most
    /// [`max_per_key`](Self::max_per_key) live streams. A slow subscriber that falls more than
    /// [`capacity`](Self::capacity) messages behind skips the missed ones. Cheap to clone.
    pub struct Hub<T> {
        allow: Arc<[&'static str]>,
        capacity: usize,
        max_per_key: usize,
        inner: Arc<Mutex<Inner<T>>>,
    }

    impl<T> Clone for Hub<T> {
        fn clone(&self) -> Self {
            Self {
                allow: Arc::clone(&self.allow),
                capacity: self.capacity,
                max_per_key: self.max_per_key,
                inner: Arc::clone(&self.inner),
            }
        }
    }

    impl<T> fmt::Debug for Hub<T> {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            f.debug_struct("Hub")
                .field("allow", &self.allow)
                .finish_non_exhaustive()
        }
    }

    fn suffix_ok(s: &str) -> bool {
        (1..=64).contains(&s.len())
            && s.bytes()
                .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
    }

    impl<T: Clone + Send + 'static> Hub<T> {
        /// Capacity 64, 4 streams per key.
        pub fn new(allow: &[&'static str]) -> Self {
            Self {
                allow: allow.into(),
                capacity: 64,
                max_per_key: 4,
                inner: Arc::new(Mutex::new(Inner {
                    topics: HashMap::new(),
                    per_key: HashMap::new(),
                })),
            }
        }

        #[must_use]
        pub fn capacity(mut self, n: usize) -> Self {
            self.capacity = n.max(1);
            self
        }

        #[must_use]
        pub fn max_per_key(mut self, n: usize) -> Self {
            self.max_per_key = n;
            self
        }

        pub fn allows(&self, topic: &str) -> bool {
            self.allow.iter().any(|a| match a.strip_suffix('*') {
                Some(prefix) => topic.strip_prefix(prefix).is_some_and(suffix_ok),
                None => *a == topic,
            })
        }

        /// Sends to the topic's current subscribers; returns how many there were.
        pub fn publish(&self, topic: &str, msg: T) -> Result<usize, HubError> {
            if !self.allows(topic) {
                return Err(HubError::UnknownTopic);
            }
            let mut inner = self.inner.lock().unwrap_or_else(PoisonError::into_inner);
            let Some(tx) = inner.topics.get(topic) else {
                return Ok(0);
            };
            if let Ok(n) = tx.send(msg) {
                Ok(n)
            } else {
                // Nobody listens any more: drop the channel so topics do not pile up.
                inner.topics.remove(topic);
                Ok(0)
            }
        }

        /// A stream of the topic's messages from now on, counted against `key`.
        pub fn subscribe(&self, topic: &str, key: &str) -> Result<Subscription<T>, HubError> {
            if !self.allows(topic) {
                return Err(HubError::UnknownTopic);
            }
            let mut inner = self.inner.lock().unwrap_or_else(PoisonError::into_inner);
            let n = inner.per_key.get(key).copied().unwrap_or(0);
            if n >= self.max_per_key {
                return Err(HubError::TooManySubscriptions);
            }
            inner.per_key.insert(key.to_owned(), n + 1);
            let cap = self.capacity;
            let rx = inner
                .topics
                .entry(topic.to_owned())
                .or_insert_with(|| broadcast::channel(cap).0)
                .subscribe();
            let stream = futures_util::stream::unfold(rx, |mut rx| async move {
                loop {
                    match rx.recv().await {
                        Ok(m) => return Some((m, rx)),
                        Err(broadcast::error::RecvError::Lagged(_)) => {}
                        Err(broadcast::error::RecvError::Closed) => return None,
                    }
                }
            });
            let inner = Arc::clone(&self.inner);
            let key = key.to_owned();
            Ok(Subscription {
                stream: Box::pin(stream),
                release: Some(Box::new(move || {
                    let mut i = inner.lock().unwrap_or_else(PoisonError::into_inner);
                    if let Some(n) = i.per_key.get_mut(&key) {
                        *n -= 1;
                        if *n == 0 {
                            i.per_key.remove(&key);
                        }
                    }
                })),
            })
        }

        /// Live streams held by `key`.
        pub fn subscriptions(&self, key: &str) -> usize {
            let inner = self.inner.lock().unwrap_or_else(PoisonError::into_inner);
            inner.per_key.get(key).copied().unwrap_or(0)
        }
    }

    /// A [`Hub`] stream; dropping it (the client disconnected) frees its slot.
    pub struct Subscription<T> {
        stream: BoxStream<'static, T>,
        release: Option<Box<dyn FnOnce() + Send>>,
    }

    impl<T> fmt::Debug for Subscription<T> {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            f.write_str("Subscription(..)")
        }
    }

    impl<T> Stream for Subscription<T> {
        type Item = T;
        fn poll_next(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<T>> {
            self.stream.as_mut().poll_next(cx)
        }
    }

    impl<T> Drop for Subscription<T> {
        fn drop(&mut self) {
            if let Some(f) = self.release.take() {
                f();
            }
        }
    }
}
