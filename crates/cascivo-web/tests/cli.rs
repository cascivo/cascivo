use std::path::PathBuf;
use std::process::{Command, Output};

fn bin(args: &[&str]) -> Output {
    Command::new(env!("CARGO_BIN_EXE_cascivo-web"))
        .args(args)
        .output()
        .unwrap()
}

fn tmp(tag: &str) -> PathBuf {
    let d = std::env::temp_dir().join(format!("cvweb-cli-{tag}-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&d);
    std::fs::create_dir_all(&d).unwrap();
    d
}

fn s(p: &std::path::Path) -> &str {
    p.to_str().unwrap()
}

#[test]
fn new_then_build() {
    let t = tmp("build");
    let site = t.join("my-site");
    let o = bin(&["new", s(&site)]);
    assert!(o.status.success(), "{}", String::from_utf8_lossy(&o.stderr));
    let o = bin(&["build", s(&site)]);
    assert!(o.status.success(), "{}", String::from_utf8_lossy(&o.stderr));
    for f in [
        "index.html",
        "blog/hello-world/index.html",
        "cascivo.css",
        "404.html",
        "rss.xml",
    ] {
        assert!(site.join("dist").join(f).is_file(), "missing dist/{f}");
    }
    let _ = std::fs::remove_dir_all(&t);
}

#[test]
fn deploy_dry_run_builds_and_prints_command() {
    let t = tmp("dry");
    let site = t.join("site");
    assert!(bin(&["new", s(&site)]).status.success());
    let o = bin(&["deploy", s(&site), "--dry-run"]);
    let out = String::from_utf8_lossy(&o.stdout);
    assert!(o.status.success(), "{}", String::from_utf8_lossy(&o.stderr));
    assert!(out.contains("would run: npx wrangler deploy"), "{out}");
    assert!(site.join("dist/index.html").is_file());
    let _ = std::fs::remove_dir_all(&t);
}

#[test]
fn new_refuses_non_empty_dir() {
    let t = tmp("nonempty");
    std::fs::write(t.join("x.txt"), "x").unwrap();
    let o = bin(&["new", s(&t)]);
    assert!(!o.status.success());
    assert!(String::from_utf8_lossy(&o.stderr).contains("not empty"));
    let _ = std::fs::remove_dir_all(&t);
}

#[test]
fn deploy_without_wrangler_config_fails_with_hint() {
    let t = tmp("nowr");
    let site = t.join("site");
    assert!(bin(&["new", s(&site)]).status.success());
    std::fs::remove_file(site.join("wrangler.jsonc")).unwrap();
    let o = bin(&["deploy", s(&site), "--dry-run"]);
    assert!(!o.status.success());
    assert!(String::from_utf8_lossy(&o.stderr).contains("cascivo-web new"));
    let _ = std::fs::remove_dir_all(&t);
}
