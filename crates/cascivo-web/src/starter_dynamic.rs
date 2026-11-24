//! The `cascivo-web new --dynamic --target native|workers|containers` starter: a
//! `cascivo-server` app (notes CRUD behind sign-in, a Solid island, a server island, SSE and the
//! `/c/*` interaction demos), embedded in the binary.
//!
//! Every target shares `src/{app,auth,notes,demo}.rs`, the templates and `web/` (the Vite build
//! of htmx, `@cascivo/elements` and the island); only the entry point, `platform.rs` and the
//! deploy files differ. Placeholders: `__NAME__` (package), `__NAME_SNAKE__` (crate),
//! `__CASCIVO_SERVER__`/`__CASCIVO_WEB__`/`__CASCIVO_WORKER__` (Cargo source) and
//! `__CASCIVO_JS__` (where the unpublished JS packages are linked from).

use std::path::{Path, PathBuf};

/// Where the generated project runs.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Target {
    /// axum + tokio, `cargo run`.
    Native,
    /// Cloudflare Workers (wasm32), `wrangler dev`.
    Workers,
    /// The native server in a container behind a Worker (Cloudflare Containers).
    Containers,
}

impl std::str::FromStr for Target {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, String> {
        match s {
            "native" => Ok(Self::Native),
            "workers" => Ok(Self::Workers),
            "containers" => Ok(Self::Containers),
            _ => Err(format!(
                "unknown target `{s}` (native, workers or containers)"
            )),
        }
    }
}

macro_rules! files {
    ($($to:literal <- $from:literal),* $(,)?) => {
        &[$(($to, include_str!(concat!("../starter-dynamic/", $from)))),*]
    };
}

type Files = &'static [(&'static str, &'static str)];

const COMMON: Files = files![
    ".gitignore" <- "common/gitignore",
    "site.toml" <- "common/site.toml",
    "src/app.rs" <- "common/src/app.rs",
    "src/auth.rs" <- "common/src/auth.rs",
    "src/demo.rs" <- "common/src/demo.rs",
    "src/notes.rs" <- "common/src/notes.rs",
    "templates/base.html" <- "common/templates/base.html",
    "templates/home.html" <- "common/templates/home.html",
    "templates/login.html" <- "common/templates/login.html",
    "templates/notes.html" <- "common/templates/notes.html",
    "templates/note.html" <- "common/templates/note.html",
    "templates/c/form.html" <- "common/templates/c/form.html",
    "templates/c/dialog.html" <- "common/templates/c/dialog.html",
    "templates/c/toast.html" <- "common/templates/c/toast.html",
    "templates/c/island.html" <- "common/templates/c/island.html",
    "templates/c/sse.html" <- "common/templates/c/sse.html",
    "templates/c/tabs.html" <- "common/templates/c/tabs.html",
    "web/package.json" <- "common/web/package.json",
    "web/tsconfig.json" <- "common/web/tsconfig.json",
    "web/vite.config.ts" <- "common/web/vite.config.ts",
    "web/src/ambient.d.ts" <- "common/web/src/ambient.d.ts",
    "web/src/elements.ts" <- "common/web/src/elements.ts",
    "web/src/htmx.ts" <- "common/web/src/htmx.ts",
    "web/src/island.tsx" <- "common/web/src/island.tsx",
];

/// The native server; Containers ships the same binary.
const NATIVE: Files = files![
    "Cargo.toml" <- "native/Cargo.toml",
    "src/lib.rs" <- "native/src/lib.rs",
    "src/main.rs" <- "native/src/main.rs",
    "src/platform.rs" <- "native/src/platform.rs",
    "tests/views.rs" <- "native/tests/views.rs",
];

const NATIVE_ONLY: Files = files!["README.md" <- "native/README.md"];

const CONTAINERS: Files = files![
    "README.md" <- "containers/README.md",
    "Dockerfile" <- "containers/Dockerfile",
    ".dockerignore" <- "containers/.dockerignore",
    "worker/package.json" <- "containers/worker/package.json",
    "worker/tsconfig.json" <- "containers/worker/tsconfig.json",
    "worker/wrangler.jsonc" <- "containers/worker/wrangler.jsonc",
    "worker/src/index.ts" <- "containers/worker/src/index.ts",
];

const WORKERS: Files = files![
    "Cargo.toml" <- "workers/Cargo.toml",
    "README.md" <- "workers/README.md",
    "wrangler.jsonc" <- "workers/wrangler.jsonc",
    "src/lib.rs" <- "workers/src/lib.rs",
    "src/platform.rs" <- "workers/src/platform.rs",
];

const REPO: &str = "https://github.com/cascivo/cascivo";

/// `name`: a package name (`[a-z0-9-]`). `cascivo`: a cascivo checkout to depend on by path
/// (Cargo `path`, npm `link:`); without it, Cargo uses the git repository and npm links
/// `../cascivo` next to the project.
pub fn files(name: &str, target: Target, cascivo: Option<&Path>) -> Vec<(&'static str, String)> {
    let snake = name.replace('-', "_");
    let cargo = |krate: &str| match cascivo {
        Some(p) => format!("path = {:?}", p.join("crates").join(krate)),
        None => format!("git = \"{REPO}\""),
    };
    // From `web/`: the checkout's packages directory.
    let js = match cascivo {
        Some(p) => format!("link:{}", p.join("packages").display()),
        None => "link:../../cascivo/packages".into(),
    };
    let vars = [
        ("__NAME_SNAKE__", snake),
        ("__NAME__", name.to_owned()),
        ("__CASCIVO_SERVER__", cargo("cascivo-server")),
        ("__CASCIVO_WEB__", cargo("cascivo-web")),
        ("__CASCIVO_WORKER__", cargo("cascivo-worker")),
        ("__CASCIVO_JS__", js),
    ];
    let sets: &[Files] = match target {
        Target::Native => &[COMMON, NATIVE, NATIVE_ONLY],
        Target::Containers => &[COMMON, NATIVE, CONTAINERS],
        Target::Workers => &[COMMON, WORKERS],
    };
    sets.iter()
        .flat_map(|s| s.iter())
        .map(|(p, c)| {
            let body = vars
                .iter()
                .fold((*c).to_owned(), |b, (k, v)| b.replace(k, v));
            (*p, body)
        })
        .collect()
}

/// A Cargo package name from the directory: the slug, prefixed when it starts with a digit.
fn package_name(dir: &Path) -> String {
    let base = dir
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_default();
    let s = crate::starter::slug(&base);
    if s.starts_with(|c: char| c.is_ascii_digit()) {
        format!("app-{s}")
    } else {
        s
    }
}

/// Writes the starter into `dir` (missing or empty) and returns the written paths.
pub fn create(dir: &Path, target: Target, cascivo: Option<&Path>) -> Result<Vec<String>, String> {
    if dir.exists() {
        let mut entries = std::fs::read_dir(dir).map_err(|e| format!("{}: {e}", dir.display()))?;
        if entries.next().is_some() {
            return Err(format!("{} already exists and is not empty", dir.display()));
        }
    }
    let abs = std::path::absolute(dir).map_err(|e| format!("{}: {e}", dir.display()))?;
    let cascivo: Option<PathBuf> = match cascivo {
        Some(p) => {
            let p = std::fs::canonicalize(p).map_err(|e| format!("{}: {e}", p.display()))?;
            if !p.join("crates/cascivo-server/Cargo.toml").is_file() {
                return Err(format!("{} is not a cascivo checkout", p.display()));
            }
            Some(p)
        }
        None => None,
    };
    let mut written = Vec::new();
    for (rel, body) in files(&package_name(&abs), target, cascivo.as_deref()) {
        let to = dir.join(rel);
        if let Some(parent) = to.parent() {
            std::fs::create_dir_all(parent).map_err(|e| format!("{}: {e}", parent.display()))?;
        }
        std::fs::write(&to, body).map_err(|e| format!("{}: {e}", to.display()))?;
        written.push(rel.to_owned());
    }
    Ok(written)
}

#[cfg(test)]
mod tests {
    use super::*;

    const ALL: [Target; 3] = [Target::Native, Target::Workers, Target::Containers];

    fn get(f: &[(&str, String)], p: &str) -> String {
        f.iter()
            .find(|(r, _)| *r == p)
            .unwrap_or_else(|| panic!("missing {p}"))
            .1
            .clone()
    }

    #[test]
    fn targets_parse() {
        assert_eq!("workers".parse::<Target>(), Ok(Target::Workers));
        assert!("lambda".parse::<Target>().unwrap_err().contains("native"));
    }

    #[test]
    fn every_placeholder_is_filled() {
        for t in ALL {
            for cascivo in [None, Some(Path::new("/src/cascivo"))] {
                let f = files("my-app", t, cascivo);
                for (p, c) in &f {
                    assert!(!c.contains("__"), "{t:?} {p}: placeholder left");
                }
                let cargo: toml::Table = toml::from_str(&get(&f, "Cargo.toml"))
                    .unwrap_or_else(|e| panic!("{t:?} Cargo.toml: {e}"));
                assert_eq!(cargo["package"]["name"].as_str(), Some("my-app"));
                assert!(cargo["dependencies"].get("cascivo-server").is_some());
            }
        }
    }

    #[test]
    fn each_target_has_its_entry_point_and_deploy_files() {
        let has = |t, p: &str| files("a", t, None).iter().any(|(r, _)| *r == p);
        assert!(has(Target::Native, "src/main.rs") && !has(Target::Native, "Dockerfile"));
        assert!(
            has(Target::Containers, "Dockerfile")
                && has(Target::Containers, "worker/wrangler.jsonc")
        );
        assert!(has(Target::Workers, "wrangler.jsonc") && !has(Target::Workers, "src/main.rs"));
        for t in ALL {
            assert!(
                has(t, "src/notes.rs")
                    && has(t, "web/src/island.tsx")
                    && has(t, "templates/c/form.html")
            );
        }
        let w = files("a", Target::Workers, None);
        assert!(get(&w, "Cargo.toml").contains("features = [\"workers\"]"));
        assert!(get(&w, "src/lib.rs").contains("worker::event(fetch)"));
    }

    #[test]
    fn sources_are_git_or_a_checkout() {
        let git = files("a", Target::Native, None);
        assert!(
            get(&git, "Cargo.toml")
                .contains("cascivo-server = { git = \"https://github.com/cascivo/cascivo\"")
        );
        assert!(get(&git, "web/package.json").contains("\"link:../../cascivo/packages/elements\""));
        let local = files("a", Target::Native, Some(Path::new("/src/cascivo")));
        assert!(
            get(&local, "Cargo.toml").contains("path = \"/src/cascivo/crates/cascivo-server\"")
        );
        assert!(get(&local, "web/package.json").contains("\"link:/src/cascivo/packages/solid\""));
    }

    #[test]
    fn create_names_the_crate_and_refuses_non_empty() {
        let root = std::env::temp_dir().join(format!("cvweb-dyn-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        let d = root.join("2 Notes");
        create(&d, Target::Native, None).unwrap();
        let cargo = std::fs::read_to_string(d.join("Cargo.toml")).unwrap();
        assert!(cargo.contains("name = \"app-2-notes\""));
        let main = std::fs::read_to_string(d.join("src/main.rs")).unwrap();
        assert!(main.contains("app_2_notes::router"));
        assert!(d.join(".gitignore").is_file());
        assert!(
            create(&d, Target::Native, None)
                .unwrap_err()
                .contains("not empty")
        );
        assert!(
            create(&root.join("x"), Target::Native, Some(&root))
                .unwrap_err()
                .contains("not a cascivo checkout")
        );
        let _ = std::fs::remove_dir_all(&root);
    }
}
