//! `cascivo-web build [site] [--out dist]`, `dev [site] [--port 4321]`, `new <dir>` (starter site)
//! and `deploy [site] [--out dist] [--dry-run] [-- <wrangler args>]` (build, then `wrangler deploy`).

use std::net::TcpListener;
use std::path::PathBuf;
use std::process::ExitCode;
use std::time::Instant;

use cascivo_web::Site;

const USAGE: &str = "usage: cascivo-web build [site-dir] [--out <dir>]\n       cascivo-web dev [site-dir] [--port <n>]\n       cascivo-web new <dir>\n       cascivo-web deploy [site-dir] [--out <dir>] [--dry-run] [-- <wrangler args>]";

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
    let mut dry_run = false;
    let mut extra: Vec<String> = Vec::new();
    let mut it = args[1..].iter();
    while let Some(a) = it.next() {
        match a.as_str() {
            "--dry-run" => dry_run = true,
            "--" => {
                extra = it.by_ref().cloned().collect();
            }
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
        "build" => build(&root, out).map(|_| ()),
        "new" => {
            if args.len() < 2 {
                return Err(USAGE.into());
            }
            let written = cascivo_web::starter::create(&root)?;
            for f in &written {
                println!("created {}", root.join(f).display());
            }
            println!(
                "\nnext steps:\n  cascivo-web dev {d}\n  cascivo-web build {d}\n  cascivo-web deploy {d} --dry-run",
                d = root.display()
            );
            Ok(())
        }
        "deploy" => {
            // Plan first so a missing wrangler config fails before the build.
            let plan = cascivo_web::deploy::plan(&root, &extra)?;
            let custom_out = out.clone();
            let dist = build(&root, out)?;
            if custom_out.is_some() && dist != root.join("dist") {
                eprintln!(
                    "warning: wrangler assets.directory is ./dist by default, but the site was built to {}",
                    dist.display()
                );
            }
            if dry_run {
                println!("would run: {} (in {})", plan.display(), plan.cwd.display());
                return Ok(());
            }
            let status = std::process::Command::new(&plan.program)
                .args(&plan.args)
                .current_dir(&plan.cwd)
                .status()
                .map_err(|e| format!("{}: {e}", plan.program))?;
            if status.success() {
                Ok(())
            } else {
                Err(format!("`{}` failed: {status}", plan.display()))
            }
        }
        "dev" => {
            let l = TcpListener::bind(("127.0.0.1", port)).map_err(|e| e.to_string())?;
            eprintln!("cascivo-web dev on http://127.0.0.1:{port}/");
            cascivo_web::dev::serve(root, l).map_err(|e| e.to_string())
        }
        _ => Err(USAGE.into()),
    }
}

/// Loads, renders and writes the site; returns the output directory.
fn build(root: &std::path::Path, out: Option<PathBuf>) -> Result<PathBuf, String> {
    let t = Instant::now();
    let site = Site::load(root).map_err(|e| e.to_string())?;
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
    Ok(dist)
}
