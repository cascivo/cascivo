//! Kill criterion 4: a content edit is visible over HTTP with no cargo rebuild. The latency
//! (< 1 s) is measured by `scripts/bench-dev.sh`, not asserted here: wall-clock gates flake on a
//! loaded CI machine.

use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::time::{Duration, Instant};

mod common;

/// Only a hang should fail: this is a liveness bound, not a latency budget.
const PATIENCE: Duration = Duration::from_secs(30);

fn get(addr: &str, path: &str) -> String {
    let mut s = TcpStream::connect(addr).unwrap();
    write!(s, "GET {path} HTTP/1.1\r\nHost: x\r\n\r\n").unwrap();
    let mut out = String::new();
    s.read_to_string(&mut out).unwrap();
    out
}

#[test]
fn edit_is_visible_without_rebuild() {
    let dir = common::scratch("dev");
    let l = TcpListener::bind("127.0.0.1:0").unwrap();
    let addr = l.local_addr().unwrap().to_string();
    let root = dir.clone();
    std::thread::spawn(move || cascivo_web::dev::serve(root, l));
    let first = get(&addr, "/blog/first/");
    assert!(
        first.starts_with("HTTP/1.1 200") && first.contains("/__cascivo/events?v=1"),
        "{first}"
    );

    let post = dir.join("content/posts/first.md");
    let src = std::fs::read_to_string(&post)
        .unwrap()
        .replace("Hello from", "Edited marker");
    let t = Instant::now();
    std::fs::write(&post, src).unwrap();
    while !get(&addr, "/blog/first/").contains("Edited marker") {
        assert!(
            t.elapsed() < PATIENCE,
            "edit not visible within {PATIENCE:?}"
        );
        std::thread::sleep(Duration::from_millis(5));
    }

    // A broken edit shows the diagnostic instead of a stale page.
    std::fs::write(&post, "+++\ntitle = 1\n+++\n").unwrap();
    let t = Instant::now();
    loop {
        let r = get(&addr, "/blog/first/");
        if r.starts_with("HTTP/1.1 500") {
            assert!(r.contains("content/posts/first.md"), "{r}");
            break;
        }
        assert!(
            t.elapsed() < PATIENCE,
            "diagnostic not shown within {PATIENCE:?}"
        );
        std::thread::sleep(Duration::from_millis(5));
    }
    let _ = std::fs::remove_dir_all(&dir);
}

#[test]
fn events_stream_announces_reload_for_stale_version() {
    let dir = common::scratch("sse");
    let l = TcpListener::bind("127.0.0.1:0").unwrap();
    let addr = l.local_addr().unwrap().to_string();
    std::thread::spawn(move || cascivo_web::dev::serve(dir, l));
    // Version 0 is older than the server's first build, so the stream answers at once.
    let r = get(&addr, "/__cascivo/events?v=0");
    assert!(
        r.contains("text/event-stream") && r.ends_with("data: reload\n\n"),
        "{r}"
    );
    assert!(get(&addr, "/nope").starts_with("HTTP/1.1 404"));
}
