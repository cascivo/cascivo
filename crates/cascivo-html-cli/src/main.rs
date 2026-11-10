//! `cascivo-html render|check|guide`. Args are parsed by hand; the library never touches the
//! filesystem, so all file access (and its confinement) lives here.

use std::io::{Read, Write};
use std::path::{Component, Path, PathBuf};
use std::process::ExitCode;

use cascivo_html::{Diagnostic, Options, parse_brand_file};

const USAGE: &str = "\
cascivo-html: render agent-written .cv text into one static HTML file

usage:
  cascivo-html render [in.cv|-] [-o out.html] [--brand brand.cv]
  cascivo-html check [in.cv|-] [--brand brand.cv]
  cascivo-html guide [component]
  cascivo-html --help | --version

`-` or no input reads stdin. Without -o, HTML goes to stdout.
Brand files (--brand, @brand-file) are read only from the input file's directory
(the current directory for stdin); absolute paths and `..` are rejected.
exit: 0 ok, 1 invalid .cv, 2 usage or I/O error";

/// `Err` carries a message and the exit code.
type Fail = (String, u8);

fn usage_err(msg: impl Into<String>) -> Fail {
    (format!("{}\n(see cascivo-html --help)", msg.into()), 2)
}

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    match run(&args) {
        Ok(()) => ExitCode::SUCCESS,
        Err((msg, code)) => {
            if !msg.is_empty() {
                eprintln!("{msg}");
            }
            ExitCode::from(code)
        }
    }
}

fn run(args: &[String]) -> Result<(), Fail> {
    let Some((cmd, rest)) = args.split_first() else {
        return Err(usage_err("missing command: render, check or guide"));
    };
    match cmd.as_str() {
        "-h" | "--help" | "help" => {
            println!("{USAGE}");
            Ok(())
        }
        "-V" | "--version" => {
            println!("cascivo-html {}", env!("CARGO_PKG_VERSION"));
            Ok(())
        }
        "render" => build(rest, true),
        "check" => build(rest, false),
        "guide" => guide(rest),
        other => Err(usage_err(format!(
            "unknown command '{other}'; expected render, check or guide"
        ))),
    }
}

fn guide(args: &[String]) -> Result<(), Fail> {
    match args {
        [] => print!("{}", cascivo_html::GUIDE),
        [name] => match cascivo_html::guide_for(name) {
            Some(g) => print!("{g}"),
            None => {
                let hint = cascivo_html::suggest(name)
                    .map(|s| format!("; did you mean '{s}'?"))
                    .unwrap_or_default();
                return Err((
                    format!("unknown component '{name}'{hint} (cascivo-html guide lists all)"),
                    1,
                ));
            }
        },
        _ => return Err(usage_err("guide takes at most one component name")),
    }
    Ok(())
}

struct BuildArgs {
    input: Option<String>,
    output: Option<String>,
    brand: Option<String>,
}

fn parse_build_args(args: &[String], render: bool) -> Result<BuildArgs, Fail> {
    let mut a = BuildArgs {
        input: None,
        output: None,
        brand: None,
    };
    let mut it = args.iter();
    while let Some(arg) = it.next() {
        match arg.as_str() {
            "-o" | "--output" if render => {
                a.output = Some(
                    it.next()
                        .ok_or_else(|| usage_err("-o needs a file name"))?
                        .clone(),
                );
            }
            "--brand" => {
                a.brand = Some(
                    it.next()
                        .ok_or_else(|| usage_err("--brand needs a file name"))?
                        .clone(),
                );
            }
            "-" => set_input(&mut a, "-")?,
            f if f.starts_with('-') => return Err(usage_err(format!("unknown option '{f}'"))),
            f => set_input(&mut a, f)?,
        }
    }
    Ok(a)
}

fn set_input(a: &mut BuildArgs, f: &str) -> Result<(), Fail> {
    if a.input.replace(f.to_string()).is_some() {
        return Err(usage_err("only one input file is allowed"));
    }
    Ok(())
}

/// A path that stays inside `dir`: relative, no `..`, and (after symlinks) still under it.
fn confined(dir: &Path, rel: &str) -> Result<PathBuf, String> {
    let p = Path::new(rel);
    let ok = !rel.is_empty()
        && p.components()
            .all(|c| matches!(c, Component::Normal(_) | Component::CurDir));
    if !ok {
        return Err(format!(
            "'{rel}' must be a relative path inside the input file's directory (no '..', no absolute paths)"
        ));
    }
    let full = dir.join(p);
    let real = full.canonicalize().map_err(|e| e.to_string())?;
    let base = dir.canonicalize().map_err(|e| e.to_string())?;
    if !real.starts_with(&base) {
        return Err(format!(
            "'{rel}' resolves outside the input file's directory"
        ));
    }
    Ok(real)
}

fn read_brand(dir: &Path, rel: &str) -> Result<String, String> {
    let path = confined(dir, rel)?;
    std::fs::read_to_string(&path).map_err(|e| format!("{rel}: {e}"))
}

fn print_diags(name: &str, diags: &[Diagnostic]) -> Fail {
    let lines: Vec<String> = diags.iter().map(|d| format!("{name}:{d}")).collect();
    (lines.join("\n"), 1)
}

fn build(args: &[String], render: bool) -> Result<(), Fail> {
    let a = parse_build_args(args, render)?;
    let (name, src, dir) = match a.input.as_deref() {
        None | Some("-") => {
            let mut s = String::new();
            std::io::stdin()
                .read_to_string(&mut s)
                .map_err(|e| (format!("<stdin>: {e}"), 2))?;
            ("<stdin>".to_string(), s, PathBuf::from("."))
        }
        Some(f) => {
            let s = std::fs::read_to_string(f).map_err(|e| (format!("{f}: {e}"), 2))?;
            let dir = Path::new(f)
                .parent()
                .filter(|p| !p.as_os_str().is_empty())
                .map_or_else(|| PathBuf::from("."), Path::to_path_buf);
            (f.to_string(), s, dir)
        }
    };

    // The library wants a 'static resolver; the CLI is a one-shot process, so leaking is fine.
    let base = dir.clone();
    let resolver: &'static dyn Fn(&str) -> Result<String, String> =
        Box::leak(Box::new(move |p: &str| read_brand(&base, p)));
    let mut opts = Options {
        brand_resolver: Some(resolver),
        ..Options::default()
    };
    if let Some(b) = &a.brand {
        let text = read_brand(&dir, b).map_err(|e| (format!("--brand {e}"), 2))?;
        opts.brand = Some(parse_brand_file(&text).map_err(|d| print_diags(b, &d))?);
    }

    let html = cascivo_html::render(&src, &opts).map_err(|d| print_diags(&name, &d))?;
    if !render {
        return Ok(());
    }
    match a.output {
        Some(o) => std::fs::write(&o, html).map_err(|e| (format!("{o}: {e}"), 2)),
        None => std::io::stdout()
            .lock()
            .write_all(html.as_bytes())
            .map_err(|e| (e.to_string(), 2)),
    }
}
