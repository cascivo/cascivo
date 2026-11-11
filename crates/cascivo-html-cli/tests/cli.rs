use std::io::Write;
use std::path::PathBuf;
use std::process::{Command, Stdio};

const BIN: &str = env!("CARGO_BIN_EXE_cascivo-html");

struct Out {
    code: i32,
    stdout: String,
    stderr: String,
}

fn run(args: &[&str], stdin: &str, cwd: Option<&PathBuf>) -> Out {
    let mut c = Command::new(BIN);
    c.args(args)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    if let Some(d) = cwd {
        c.current_dir(d);
    }
    let mut child = c.spawn().unwrap();
    child
        .stdin
        .take()
        .unwrap()
        .write_all(stdin.as_bytes())
        .unwrap();
    let o = child.wait_with_output().unwrap();
    Out {
        code: o.status.code().unwrap(),
        stdout: String::from_utf8(o.stdout).unwrap(),
        stderr: String::from_utf8(o.stderr).unwrap(),
    }
}

fn tmp(name: &str) -> PathBuf {
    let d = std::env::temp_dir().join(format!("cvhtml-cli-{}-{name}", std::process::id()));
    let _ = std::fs::remove_dir_all(&d);
    std::fs::create_dir_all(&d).unwrap();
    d
}

#[test]
fn stdin_to_stdout_round_trip() {
    let o = run(&["render"], "@title Hi\ncard \"Hello\"\n", None);
    assert_eq!(o.code, 0, "{}", o.stderr);
    assert!(o.stdout.starts_with("<!doctype html>"));
    assert!(o.stdout.contains("<title>Hi</title>") && o.stdout.contains("Hello"));
    let dash = run(&["render", "-"], "card \"Hello\"\n", None);
    assert_eq!(dash.code, 0);
}

#[test]
fn render_file_to_file() {
    let d = tmp("file");
    std::fs::write(d.join("a.cv"), "h1 \"Yo\"\n").unwrap();
    let out = d.join("a.html");
    let o = run(
        &[
            "render",
            d.join("a.cv").to_str().unwrap(),
            "-o",
            out.to_str().unwrap(),
        ],
        "",
        None,
    );
    assert_eq!(o.code, 0, "{}", o.stderr);
    assert!(o.stdout.is_empty());
    assert!(std::fs::read_to_string(out).unwrap().contains("Yo"));
}

#[test]
fn invalid_input_exits_1_with_diagnostics() {
    let o = run(&["check"], "crad \"x\"\n", None);
    assert_eq!(o.code, 1);
    assert!(o.stderr.contains("<stdin>:1:1:") && o.stderr.contains("did you mean 'card'"));
    assert!(o.stdout.is_empty());
    assert_eq!(run(&["check"], "card \"x\"\n", None).code, 0);
    assert_eq!(run(&["render"], "crad\n", None).code, 1);
}

#[test]
fn usage_errors_exit_2() {
    assert_eq!(run(&[], "", None).code, 2);
    assert_eq!(run(&["nope"], "", None).code, 2);
    assert_eq!(run(&["render", "--bogus"], "", None).code, 2);
    assert_eq!(run(&["render", "-o"], "", None).code, 2);
    assert_eq!(run(&["render", "/definitely/missing.cv"], "", None).code, 2);
}

#[test]
fn brand_flag_applies() {
    let d = tmp("brand");
    std::fs::write(d.join("b.cv"), "#5b5bd6 r8 dark\n").unwrap();
    let o = run(&["render", "--brand", "b.cv"], "card \"x\"\n", Some(&d));
    assert_eq!(o.code, 0, "{}", o.stderr);
    assert!(o.stdout.contains("data-theme=\"dark\""));
    assert!(o.stdout.contains("cascivo.theme"));
}

#[test]
fn brand_is_confined_to_input_dir() {
    let d = tmp("conf");
    std::fs::write(d.parent().unwrap().join("cvhtml-secret.cv"), "dark\n").unwrap();
    for bad in ["../cvhtml-secret.cv", "/etc/passwd", "sub/../../x"] {
        let o = run(&["render", "--brand", bad], "card x\n", Some(&d));
        assert_eq!(o.code, 2, "{bad}");
        assert!(o.stderr.contains("relative path"), "{bad}: {}", o.stderr);
        let o = run(&["render"], &format!("@brand-file {bad}\n"), Some(&d));
        assert_eq!(o.code, 1, "{bad}");
        assert!(o.stderr.contains("relative path"), "{bad}: {}", o.stderr);
    }
}

#[cfg(unix)]
#[test]
fn symlink_escape_is_rejected() {
    let d = tmp("sym");
    let outside = tmp("sym-out");
    std::fs::write(outside.join("b.cv"), "dark\n").unwrap();
    std::os::unix::fs::symlink(outside.join("b.cv"), d.join("link.cv")).unwrap();
    let o = run(&["render", "--brand", "link.cv"], "card x\n", Some(&d));
    assert_eq!(o.code, 2);
    assert!(o.stderr.contains("outside"));
}

#[test]
fn brand_file_directive_resolves_next_to_input() {
    let d = tmp("dir");
    std::fs::write(d.join("b.cv"), "dark\n").unwrap();
    std::fs::write(d.join("p.cv"), "@brand-file b.cv\ncard x\n").unwrap();
    let o = run(&["render", d.join("p.cv").to_str().unwrap()], "", None);
    assert_eq!(o.code, 0, "{}", o.stderr);
    assert!(o.stdout.contains("data-theme=\"dark\""));
}

#[test]
fn guide_and_help() {
    let g = run(&["guide"], "", None);
    assert_eq!(g.code, 0);
    assert!(g.stdout.contains("stat <label>"));
    let c = run(&["guide", "stat"], "", None);
    assert_eq!(c.code, 0);
    assert!(c.stdout.contains("example: stat"));
    let u = run(&["guide", "stta"], "", None);
    assert_eq!(u.code, 1);
    assert!(u.stderr.contains("did you mean 'stat'"));
    assert_eq!(run(&["--help"], "", None).code, 0);
    assert!(
        run(&["--version"], "", None)
            .stdout
            .starts_with("cascivo-html ")
    );
}

const PNG: &[u8] = b"\x89PNG\r\n\x1a\n\0\0\0\rIHDR";
const SVG: &str =
    "<svg viewBox=\"0 0 2 2\"><rect width=\"2\" height=\"2\" fill=\"currentColor\"/></svg>";

fn site(name: &str) -> PathBuf {
    let d = tmp(name);
    std::fs::write(d.join("logo.png"), PNG).unwrap();
    std::fs::write(d.join("icon.svg"), SVG).unwrap();
    d
}

#[test]
fn assets_relative_to_the_input_file() {
    let d = site("assets-rel");
    std::fs::write(
        d.join("p.cv"),
        "image logo.png \"Logo\" w=40\nsvg icon.svg \"Icon\"\n",
    )
    .unwrap();
    let o = run(&["render", d.join("p.cv").to_str().unwrap()], "", None);
    assert_eq!(o.code, 0, "{}", o.stderr);
    assert!(o.stdout.contains("data:image/png;base64,iVBORw0KGgo"));
    assert!(
        o.stdout
            .contains("<svg viewBox=\"0 0 2 2\" role=\"img\" aria-label=\"Icon\"")
    );
    // Stdin reads from the current directory.
    let s = run(&["render"], "image logo.png x\n", Some(&d));
    assert_eq!(s.code, 0, "{}", s.stderr);
    assert!(s.stdout.contains("data:image/png;base64,"));
}

#[test]
fn extra_assets_root_and_escapes() {
    let d = tmp("assets-roots");
    let shared = site("assets-shared");
    std::fs::write(d.join("p.cv"), "image logo.png x\n").unwrap();
    let p = d.join("p.cv");
    let p = p.to_str().unwrap();
    // Not in the input dir: error naming the file, with line:col.
    let miss = run(&["render", p], "", None);
    assert_eq!(miss.code, 1);
    assert!(
        miss.stderr.contains(":1:1: cannot load 'logo.png'"),
        "{}",
        miss.stderr
    );
    let ok = run(
        &["render", p, "--assets", shared.to_str().unwrap()],
        "",
        None,
    );
    assert_eq!(ok.code, 0, "{}", ok.stderr);

    // `..` and absolute paths never escape the roots, even when the target exists.
    for bad in [
        "../x.png",
        "/etc/hostname",
        &format!("{}/logo.png", shared.display()),
    ] {
        let cv = d.join("e.cv");
        std::fs::write(&cv, format!("image \"{bad}\" x\n")).unwrap();
        let o = run(&["render", cv.to_str().unwrap()], "", None);
        assert_eq!(o.code, 1, "{bad}");
        assert!(o.stderr.contains("relative path"), "{bad}: {}", o.stderr);
    }
    assert_eq!(
        run(&["render", p, "--assets", "/nonexistent-dir"], "", None).code,
        2
    );
}

#[test]
fn asset_symlink_escape_is_rejected() {
    #[cfg(unix)]
    {
        let d = site("assets-link");
        let out = tmp("assets-link-out");
        std::fs::write(out.join("secret.png"), PNG).unwrap();
        std::os::unix::fs::symlink(out.join("secret.png"), d.join("s.png")).unwrap();
        std::fs::write(d.join("p.cv"), "image s.png x\n").unwrap();
        let o = run(&["render", d.join("p.cv").to_str().unwrap()], "", None);
        assert_eq!(o.code, 1);
        assert!(o.stderr.contains("outside"), "{}", o.stderr);
    }
}

#[test]
fn size_limit_and_max_asset_flag() {
    let d = site("assets-size");
    let mut big = PNG.to_vec();
    big.extend(vec![0u8; 5000]);
    std::fs::write(d.join("big.png"), &big).unwrap();
    std::fs::write(d.join("p.cv"), "image big.png x\n").unwrap();
    let p = d.join("p.cv");
    let p = p.to_str().unwrap();
    let o = run(&["render", p, "--max-asset", "1000"], "", None);
    assert_eq!(o.code, 1);
    assert!(o.stderr.contains("embed limit"), "{}", o.stderr);
    assert_eq!(run(&["render", p, "--max-asset", "9000"], "", None).code, 0);
    assert_eq!(run(&["render", p, "--max-asset", "lots"], "", None).code, 2);
}

#[test]
fn urls_stay_references_without_fetch() {
    let o = run(&["render"], "image https://a.example/x.png x\n", None);
    assert_eq!(o.code, 0, "{}", o.stderr);
    assert!(o.stdout.contains("src=\"https://a.example/x.png\""));
}

#[test]
fn same_input_same_bytes() {
    let d = site("assets-det");
    std::fs::write(d.join("p.cv"), "image logo.png x\nsvg icon.svg y\n").unwrap();
    let p = d.join("p.cv");
    let p = p.to_str().unwrap();
    assert_eq!(
        run(&["render", p], "", None).stdout,
        run(&["render", p], "", None).stdout
    );
}

#[cfg(feature = "fetch")]
#[test]
fn fetch_embeds_urls_with_a_size_cap() {
    use std::io::Read;
    use std::net::TcpListener;
    let l = TcpListener::bind("127.0.0.1:0").unwrap();
    let port = l.local_addr().unwrap().port();
    std::thread::spawn(move || {
        for s in l.incoming().take(2) {
            let mut s = s.unwrap();
            let mut buf = [0u8; 2048];
            let _ = s.read(&mut buf);
            let head = format!(
                "HTTP/1.1 200 OK\r\ncontent-type: image/png\r\ncontent-length: {}\r\nconnection: close\r\n\r\n",
                PNG.len()
            );
            let _ = s.write_all(head.as_bytes());
            let _ = s.write_all(PNG);
        }
    });
    let src = format!("image http://127.0.0.1:{port}/x.png x\n");
    let mut c = Command::new(BIN);
    c.args(["render", "--fetch"])
        .env_remove("HTTP_PROXY")
        .env_remove("http_proxy")
        .env_remove("ALL_PROXY")
        .env_remove("all_proxy")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    let mut child = c.spawn().unwrap();
    child
        .stdin
        .take()
        .unwrap()
        .write_all(src.as_bytes())
        .unwrap();
    let o = child.wait_with_output().unwrap();
    let out = String::from_utf8(o.stdout).unwrap();
    assert!(o.status.success(), "{}", String::from_utf8_lossy(&o.stderr));
    assert!(out.contains("data:image/png;base64,iVBORw0KGgo"), "{out}");
    // Over the cap: refused, not truncated.
    let mut c = Command::new(BIN);
    c.args(["render", "--fetch", "--max-asset", "5"])
        .env_remove("HTTP_PROXY")
        .env_remove("http_proxy")
        .env_remove("ALL_PROXY")
        .env_remove("all_proxy")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    let mut child = c.spawn().unwrap();
    child
        .stdin
        .take()
        .unwrap()
        .write_all(src.as_bytes())
        .unwrap();
    let o = child.wait_with_output().unwrap();
    assert_eq!(o.status.code(), Some(1));
}
