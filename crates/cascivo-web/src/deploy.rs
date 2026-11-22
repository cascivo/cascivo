//! `cascivo-web deploy`: plans the `wrangler deploy` invocation (Cloudflare Workers Static
//! Assets) or `wrangler pages deploy <dist>` (Cloudflare Pages).

use std::path::{Path, PathBuf};

pub use crate::config::DeployTarget;

const CONFIGS: &[&str] = &["wrangler.jsonc", "wrangler.json", "wrangler.toml"];

/// A command to run after the site is built.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Plan {
    pub cwd: PathBuf,
    pub program: String,
    pub args: Vec<String>,
}

impl Plan {
    /// Shell-ish rendering, e.g. `npx wrangler deploy --dry-run`.
    pub fn display(&self) -> String {
        std::iter::once(&self.program)
            .chain(&self.args)
            .map(|a| {
                if a.is_empty() || a.contains(char::is_whitespace) {
                    format!("'{a}'")
                } else {
                    a.clone()
                }
            })
            .collect::<Vec<_>>()
            .join(" ")
    }
}

/// Workers: requires a wrangler config in `root`; `extra` args are appended after
/// `wrangler deploy`. Pages: `wrangler pages deploy <dist> [--project-name <p>] <extra>`.
pub fn plan(
    root: &Path,
    extra: &[String],
    target: DeployTarget,
    project: Option<&str>,
    dist: &Path,
) -> Result<Plan, String> {
    if target == DeployTarget::Pages {
        let mut args = vec!["wrangler".to_string(), "pages".into(), "deploy".into()];
        args.push(
            dist.strip_prefix(root)
                .unwrap_or(dist)
                .to_string_lossy()
                .into_owned(),
        );
        if let Some(p) = project {
            args.extend(["--project-name".to_string(), p.to_string()]);
        }
        args.extend(extra.iter().cloned());
        return Ok(Plan {
            cwd: root.to_path_buf(),
            program: "npx".into(),
            args,
        });
    }
    if !CONFIGS.iter().any(|c| root.join(c).is_file()) {
        return Err(format!(
            "no wrangler.jsonc, wrangler.json or wrangler.toml in {}\n\
             run `cascivo-web new <dir>` for a starter, or add a wrangler.jsonc:\n\
             {{ \"name\": \"my-site\", \"compatibility_date\": \"2026-11-01\", \"assets\": {{ \"directory\": \"./dist\" }} }}",
            root.display()
        ) + "\nor deploy to Cloudflare Pages with `--pages --project-name <name>`");
    }
    let mut args = vec!["wrangler".to_string(), "deploy".to_string()];
    args.extend(extra.iter().cloned());
    Ok(Plan {
        cwd: root.to_path_buf(),
        program: "npx".into(),
        args,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tmp(tag: &str) -> PathBuf {
        let d = std::env::temp_dir().join(format!("cvweb-deploy-{tag}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        std::fs::create_dir_all(&d).unwrap();
        d
    }

    #[test]
    fn requires_config() {
        let d = tmp("none");
        let e = plan(&d, &[], DeployTarget::Workers, None, &d.join("dist")).unwrap_err();
        assert!(e.contains("cascivo-web new") && e.contains("\"assets\""));
        let _ = std::fs::remove_dir_all(&d);
    }

    #[test]
    fn plans_with_each_config_and_extra_args() {
        for c in CONFIGS {
            let d = tmp(c);
            std::fs::write(d.join(c), "").unwrap();
            let p = plan(
                &d,
                &["--env".into(), "prod".into()],
                DeployTarget::Workers,
                None,
                &d.join("dist"),
            )
            .unwrap();
            assert_eq!(p.cwd, d);
            assert_eq!(p.display(), "npx wrangler deploy --env prod");
            let _ = std::fs::remove_dir_all(&d);
        }
    }

    #[test]
    fn pages_needs_no_config_and_names_dist_and_project() {
        let d = tmp("pages");
        let p = plan(
            &d,
            &["--branch".into(), "main".into()],
            DeployTarget::Pages,
            Some("my-site"),
            &d.join("dist"),
        )
        .unwrap();
        assert_eq!(
            p.display(),
            "npx wrangler pages deploy dist --project-name my-site --branch main"
        );
        let p = plan(&d, &[], DeployTarget::Pages, None, Path::new("/x/out")).unwrap();
        assert_eq!(p.display(), "npx wrangler pages deploy /x/out");
        let _ = std::fs::remove_dir_all(&d);
    }

    #[test]
    fn display_quotes_spaces() {
        let p = Plan {
            cwd: ".".into(),
            program: "npx".into(),
            args: vec!["a b".into()],
        };
        assert_eq!(p.display(), "npx 'a b'");
    }
}
