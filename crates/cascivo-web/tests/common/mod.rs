use std::path::{Path, PathBuf};

pub fn fixture() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/mini")
}

/// Copies the fixture into a fresh temp dir so a test can edit it.
pub fn scratch(tag: &str) -> PathBuf {
    let dst = std::env::temp_dir().join(format!("cvweb-{tag}-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&dst);
    copy(&fixture(), &dst);
    dst
}

fn copy(src: &Path, dst: &Path) {
    std::fs::create_dir_all(dst).unwrap();
    for e in std::fs::read_dir(src).unwrap().flatten() {
        let to = dst.join(e.file_name());
        if e.path().is_dir() {
            copy(&e.path(), &to);
        } else {
            std::fs::copy(e.path(), to).unwrap();
        }
    }
}
