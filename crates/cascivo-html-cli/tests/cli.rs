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
