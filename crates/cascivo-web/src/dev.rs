//! `cascivo-web dev`: a std-only HTTP server that re-reads and re-renders the site whenever a
//! source file changes (templates and content are runtime data, so no cargo rebuild), and
//! tells open pages to reload over Server-Sent Events.

use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::io::{self, Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, PoisonError};
use std::thread;
use std::time::{Duration, Instant};

use crate::out::Output;
use crate::routes::{list_files, list_public};
use crate::site::Site;

const POLL: Duration = Duration::from_millis(20);
const SOURCES: [&str; 4] = ["content", "pages", "layouts", "public"];

/// Changes when any source file is added, removed, resized or touched.
pub fn fingerprint(root: &Path) -> u64 {
    let mut h = DefaultHasher::new();
    let mut add = |p: &Path, rel: &str| {
        rel.hash(&mut h);
        if let Ok(m) = std::fs::metadata(p) {
            m.len().hash(&mut h);
            if let Ok(t) = m.modified() {
                t.hash(&mut h);
            }
        }
    };
    add(&root.join("site.toml"), "site.toml");
    for dir in SOURCES {
        let list = if dir == "public" {
            list_public
        } else {
            list_files
        };
        for f in list(&root.join(dir)).unwrap_or_default() {
            add(&root.join(dir).join(&f), &format!("{dir}/{f}"));
        }
    }
    h.finish()
}

pub fn rebuild(root: &Path) -> Result<Output, String> {
    Site::load(root)
        .and_then(|s| s.render())
        .map_err(|e| e.to_string())
}

struct State {
    version: u64,
    out: Result<Output, String>,
}

type Shared = Arc<Mutex<State>>;

fn lock(s: &Shared) -> std::sync::MutexGuard<'_, State> {
    s.lock().unwrap_or_else(PoisonError::into_inner)
}

/// Serves `root` on `listener` until the process exits. Logs each rebuild's duration.
pub fn serve(root: PathBuf, listener: TcpListener) -> io::Result<()> {
    // The baseline is taken before the first build and before any request is answered: taken
    // later (inside the watcher thread), an edit made in between joins the baseline and never
    // triggers a rebuild, so the server keeps serving the stale page.
    let mut last = fingerprint(&root);
    let state: Shared = Arc::new(Mutex::new(State {
        version: 1,
        out: rebuild(&root),
    }));
    let st = Arc::clone(&state);
    thread::spawn(move || {
        loop {
            thread::sleep(POLL);
            let fp = fingerprint(&root);
            if fp == last {
                continue;
            }
            last = fp;
            let t = Instant::now();
            let out = rebuild(&root);
            match &out {
                Ok(_) => eprintln!("rebuilt in {:.1} ms", t.elapsed().as_secs_f64() * 1e3),
                Err(e) => eprintln!("build failed:\n{e}"),
            }
            let mut s = lock(&st);
            s.out = out;
            s.version += 1;
        }
    });
    for stream in listener.incoming().flatten() {
        let st = Arc::clone(&state);
        thread::spawn(move || {
            let _ = handle(stream, &st);
        });
    }
    Ok(())
}

fn reload_script(version: u64) -> String {
    format!(
        "<script>new EventSource(\"/__cascivo/events?v={version}\").onmessage=()=>location.reload()</script>"
    )
}

fn with_script(html: &[u8], version: u64) -> Vec<u8> {
    let s = String::from_utf8_lossy(html);
    let script = reload_script(version);
    match s.rfind("</body>") {
        Some(i) => format!("{}{script}{}", &s[..i], &s[i..]).into_bytes(),
        None => format!("{s}{script}").into_bytes(),
    }
}

fn respond(s: &mut TcpStream, status: &str, mime: &str, body: &[u8]) -> io::Result<()> {
    write!(
        s,
        "HTTP/1.1 {status}\r\nContent-Type: {mime}\r\nContent-Length: {}\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n",
        body.len()
    )?;
    s.write_all(body)
}

fn handle(mut s: TcpStream, st: &Shared) -> io::Result<()> {
    let mut buf = [0u8; 8192];
    let mut len = 0;
    while !buf[..len].windows(4).any(|w| w == b"\r\n\r\n") && len < buf.len() {
        let n = s.read(&mut buf[len..])?;
        if n == 0 {
            break;
        }
        len += n;
    }
    let req = String::from_utf8_lossy(&buf[..len]);
    let mut parts = req.split_whitespace();
    let (method, path) = (parts.next().unwrap_or(""), parts.next().unwrap_or("/"));
    if method != "GET" && method != "HEAD" {
        return respond(&mut s, "405 Method Not Allowed", "text/plain", b"GET only");
    }
    if let Some(q) = path.strip_prefix("/__cascivo/events") {
        let seen: u64 = q
            .strip_prefix("?v=")
            .and_then(|v| v.parse().ok())
            .unwrap_or(0);
        return events(s, st, seen);
    }
    let (status, mime, body) = {
        let state = lock(st);
        let version = state.version;
        match &state.out {
            Err(e) => {
                let mut body = String::from("<!doctype html><title>Build error</title><body><pre>");
                cascivo_html::html::esc(&mut body, e);
                body.push_str("</pre></body>");
                let body = with_script(body.as_bytes(), version);
                (
                    "500 Build Error",
                    "text/html; charset=utf-8".to_string(),
                    body,
                )
            }
            Ok(out) => match out.get(path) {
                Some((mime, bytes)) if mime.starts_with("text/html") => {
                    ("200 OK", mime.to_string(), with_script(bytes, version))
                }
                Some((mime, bytes)) => ("200 OK", mime.to_string(), bytes.to_vec()),
                None => match out.not_found(path) {
                    Some((mime, bytes)) => (
                        "404 Not Found",
                        mime.to_string(),
                        with_script(bytes, version),
                    ),
                    None => (
                        "404 Not Found",
                        "text/plain".to_string(),
                        b"not found".to_vec(),
                    ),
                },
            },
        }
    };
    respond(&mut s, status, &mime, &body)
}

/// Holds the connection open and sends one `reload` once the site version passes `seen`.
fn events(mut s: TcpStream, st: &Shared, seen: u64) -> io::Result<()> {
    s.write_all(b"HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\nCache-Control: no-store\r\n\r\nretry: 300\n\n")?;
    let mut idle = Duration::ZERO;
    loop {
        if lock(st).version > seen {
            return s.write_all(b"data: reload\n\n");
        }
        thread::sleep(POLL);
        idle += POLL;
        // A comment line now and then notices a closed tab, ending this thread.
        if idle >= Duration::from_secs(10) {
            s.write_all(b": ping\n\n")?;
            idle = Duration::ZERO;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn script_goes_before_body_end() {
        let h = with_script(b"<body>x</body>", 7);
        let h = String::from_utf8(h).unwrap();
        assert!(h.starts_with("<body>x<script>") && h.contains("v=7") && h.ends_with("</body>"));
    }
}
