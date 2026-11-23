//! `cascivo-web build [site] [--out dist] [--no-clean] [--bundle] [--bundle-out <file>]`, `dev [site] [--port 4321]`, `new <dir>`
//! (starter site) and `deploy [site] [--out dist] [--no-clean] [--pages] [--project-name <p>]
//! [--dry-run] [-- <wrangler args>]` (build, then `wrangler deploy` or `wrangler pages deploy`).

use std::net::TcpListener;
use std::path::PathBuf;
use std::process::ExitCode;
use std::time::Instant;

use cascivo_web::Site;

const USAGE: &str = "usage: cascivo-web build [site-dir] [--out <dir>] [--no-clean] [--bundle] [--bundle-out <file>]\n       cascivo-web dev [site-dir] [--port <n>]\n       cascivo-web new <dir>\n       cascivo-web deploy [site-dir] [--out <dir>] [--no-clean] [--pages] [--project-name <name>] [--dry-run] [-- <wrangler args>]";

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
    let mut clean = true;
    let mut pages = false;
    let mut bundle: Option<Option<PathBuf>> = None;
    let mut project: Option<String> = None;
    let mut extra: Vec<String> = Vec::new();
    let mut it = args[1..].iter();
    while let Some(a) = it.next() {
        match a.as_str() {
            "--dry-run" => dry_run = true,
            "--no-clean" => clean = false,
            "--pages" => pages = true,
            "--bundle" => bundle = Some(bundle.flatten()),
            "--bundle-out" => {
                bundle = Some(Some(it.next().ok_or("--bundle-out needs a file")?.into()));
            }
            "--project-name" => {
                project = Some(it.next().ok_or("--project-name needs a name")?.clone());
            }
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
        "build" => {
            build(&root, out, clean)?;
            match bundle {
                // Next to the site, not in dist/: dist is served publicly.
                Some(to) => write_bundle(&root, &to.unwrap_or_else(|| root.join("app.bundle"))),
                None => Ok(()),
            }
        }
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
            use cascivo_web::deploy::DeployTarget;
            let cfg = std::fs::read_to_string(root.join("site.toml"))
                .map_err(|e| format!("site.toml: {e}"))
                .and_then(|s| cascivo_web::Config::parse(&s).map_err(|e| e.to_string()))?;
            let target = if pages {
                DeployTarget::Pages
            } else {
                cfg.deploy.target
            };
            let project = project.or(cfg.deploy.project);
            let custom_out = out.is_some();
            let dist = out.unwrap_or_else(|| root.join("dist"));
            // Plan first so a missing wrangler config fails before the build.
            let plan = cascivo_web::deploy::plan(&root, &extra, target, project.as_deref(), &dist)?;
            let dist = build(&root, Some(dist), clean)?;
            if target == DeployTarget::Workers && custom_out && dist != root.join("dist") {
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
/// With `clean`, `dist` is emptied first (only a plain folder inside the site; else a warning).
fn build(root: &std::path::Path, out: Option<PathBuf>, clean: bool) -> Result<PathBuf, String> {
    let t = Instant::now();
    let site = Site::load(root).map_err(|e| e.to_string())?;
    let output = site.render().map_err(|e| e.to_string())?;
    let dist = out.unwrap_or_else(|| root.join("dist"));
    if clean && let Err(e) = cascivo_web::out::clean(root, &dist) {
        eprintln!("warning: {e}");
    }
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

/// Writes the request-time template bundle that `Engine::from_bundle` reads.
fn write_bundle(root: &std::path::Path, to: &std::path::Path) -> Result<(), String> {
    let bytes = cascivo_web::Bundle::load(root)
        .map_err(|e| e.to_string())?
        .to_bytes();
    std::fs::write(to, &bytes).map_err(|e| format!("{}: {e}", to.display()))?;
    eprintln!("bundle → {} ({} bytes)", to.display(), bytes.len());
    Ok(())
}
