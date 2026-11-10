//! Each `examples/*.cv` renders to the byte-identical `examples/*.html` next to it.
//! Regenerate after an intended change: `UPDATE_SNAPSHOTS=1 cargo test --test examples`.

use std::path::PathBuf;

use cascivo_html::{Options, render};

fn dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("examples")
}

fn cases() -> Vec<(String, String)> {
    let mut v: Vec<_> = std::fs::read_dir(dir())
        .unwrap()
        .map(|e| e.unwrap().path())
        .filter(|p| p.extension().is_some_and(|x| x == "cv"))
        .map(|p| {
            let name = p.file_stem().unwrap().to_string_lossy().into_owned();
            (name, std::fs::read_to_string(p).unwrap())
        })
        .collect();
    v.sort();
    v
}

fn html(src: &str) -> String {
    render(src, &Options::default()).unwrap_or_else(|e| panic!("{e:?}"))
}

#[test]
fn examples_match_snapshots() {
    let cases = cases();
    assert!(cases.len() >= 3);
    for (name, src) in cases {
        let got = html(&src);
        let path = dir().join(format!("{name}.html"));
        if std::env::var_os("UPDATE_SNAPSHOTS").is_some() {
            std::fs::write(&path, &got).unwrap();
        }
        let want = std::fs::read_to_string(&path)
            .unwrap_or_else(|_| panic!("missing {name}.html; run with UPDATE_SNAPSHOTS=1"));
        assert!(
            got == want,
            "{name}.html is stale; run with UPDATE_SNAPSHOTS=1"
        );
    }
}

#[test]
fn rendering_is_deterministic_twice_and_across_threads() {
    for (name, src) in cases() {
        let first = html(&src);
        assert_eq!(first, html(&src), "{name}: second render differs");
        let handles: Vec<_> = (0..8)
            .map(|_| {
                let s = src.clone();
                std::thread::spawn(move || html(&s))
            })
            .collect();
        for h in handles {
            assert_eq!(first, h.join().unwrap(), "{name}: threaded render differs");
        }
    }
}
