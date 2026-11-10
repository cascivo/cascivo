//! Snapshot half of conformance: each `tests/conformance/<name>.cv` renders to the committed
//! `<name>.html` body fragment. The TS half (`scripts/html-kit/conformance.test.ts`) proves those
//! fragments equal React `renderToStaticMarkup`. Regenerate with `UPDATE_SNAPSHOTS=1`.

use cascivo_html::render_fragment;
use std::fs;
use std::path::Path;

#[test]
fn snapshots_match() {
    let dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/conformance");
    let update = std::env::var_os("UPDATE_SNAPSHOTS").is_some();
    let mut cv: Vec<_> = fs::read_dir(&dir)
        .expect("conformance dir")
        .filter_map(Result::ok)
        .map(|e| e.path())
        .filter(|p| p.extension().is_some_and(|x| x == "cv"))
        .collect();
    cv.sort();
    for p in cv {
        let src = fs::read_to_string(&p).expect("read cv");
        let got = render_fragment(&src).unwrap_or_else(|e| panic!("{}: {e:?}", p.display()));
        let html = p.with_extension("html");
        if update {
            fs::write(&html, &got).expect("write snapshot");
            continue;
        }
        let want = fs::read_to_string(&html)
            .unwrap_or_else(|_| panic!("missing {} (run with UPDATE_SNAPSHOTS=1)", html.display()));
        assert_eq!(got, want, "{}", p.display());
    }
}
