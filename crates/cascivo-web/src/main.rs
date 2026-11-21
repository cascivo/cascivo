//! `cascivo-web build [site] [--out dist]` and `cascivo-web dev [site] [--port 4321]`.

use std::net::TcpListener;
use std::path::PathBuf;
use std::process::ExitCode;
use std::time::Instant;

use cascivo_web::Site;

const USAGE: &str = "usage: cascivo-web build [site-dir] [--out <dir>]\n       cascivo-web dev [site-dir] [--port <n>]";

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    match run(&args) {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("{e}");
            ExitCode::FAILURE
        }
    }
}

fn run(args: &[String]) -> Result<(), String> {
    let cmd = args.first().map(String::as_str).ok_or(USAGE)?;
    let mut root = PathBuf::from(".");
    let mut out: Option<PathBuf> = None;
    let mut port = 4321u16;
    let mut it = args[1..].iter();
    while let Some(a) = it.next() {
        match a.as_str() {
            "--out" => out = Some(it.next().ok_or("--out needs a directory")?.into()),
            "--port" => {
                port = it
                    .next()
                    .and_then(|p| p.parse().ok())
                    .ok_or("--port needs a number")?;
            }
            s if s.starts_with('-') => return Err(format!("unknown flag {s}\n{USAGE}")),
            s => root = s.into(),
        }
    }
    match cmd {
        "build" => {
            let t = Instant::now();
            let site = Site::load(&root).map_err(|e| e.to_string())?;
            let output = site.render().map_err(|e| e.to_string())?;
            let dist = out.unwrap_or_else(|| root.join("dist"));
            output
                .write(&dist)
                .map_err(|e| format!("{}: {e}", dist.display()))?;
            eprintln!(
                "{} files → {} in {:.1} ms",
                output.files.len(),
                dist.display(),
                t.elapsed().as_secs_f64() * 1e3
            );
            Ok(())
        }
        "dev" => {
            let l = TcpListener::bind(("127.0.0.1", port)).map_err(|e| e.to_string())?;
            eprintln!("cascivo-web dev on http://127.0.0.1:{port}/");
            cascivo_web::dev::serve(root, l).map_err(|e| e.to_string())
        }
        _ => Err(USAGE.into()),
    }
}
