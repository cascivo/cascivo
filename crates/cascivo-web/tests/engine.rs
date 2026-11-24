#![cfg(feature = "fs")]

use std::path::{Path, PathBuf};

use cascivo_web::{Bundle, Engine, ReqCtx};
use minijinja::context;

fn fixture() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/dynamic")
}

fn scratch(tag: &str) -> PathBuf {
    let dst = std::env::temp_dir().join(format!("cvweb-engine-{tag}-{}", std::process::id()));
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

const LIST: &str = "todos/list.html";

#[test]
fn renders_pages_and_blocks_from_a_site_folder() {
    let e = Engine::load(&fixture()).unwrap();
    let ctx = context! { todos => vec!["milk", "<script>"] };
    let req = ReqCtx {
        path: "/todos",
        locale: "de",
        ..ReqCtx::default()
    };
    let page = e.render(LIST, &ctx, &req).unwrap();
    assert!(
        page.contains("<html lang=\"de\">") && page.contains("<title>Aufgaben</title>"),
        "{page}"
    );
    let items = e.render_block(LIST, "items", &ctx, &req).unwrap();
    assert_eq!(items, "<li>milk</li><li>&lt;script&gt;</li>");
    assert!(page.contains(&format!("<ul id=\"todos\">{items}</ul>")));
    assert_eq!(e.locales(), ["en", "de"]);
}

#[test]
fn bundle_bytes_render_the_same_as_the_folder() {
    let ctx = context! { todos => vec!["a"] };
    let req = ReqCtx {
        path: "/",
        ..ReqCtx::default()
    };
    let from_dir = Engine::load(&fixture())
        .unwrap()
        .render(LIST, &ctx, &req)
        .unwrap();
    let bytes = Bundle::load(&fixture()).unwrap().to_bytes();
    let from_bundle = Engine::from_bundle(&bytes)
        .unwrap()
        .render(LIST, &ctx, &req)
        .unwrap();
    assert_eq!(from_dir, from_bundle);
}

#[test]
fn template_name_clash_between_layouts_and_templates_is_an_error() {
    let d = scratch("clash");
    std::fs::write(d.join("templates/base.html"), "x").unwrap();
    let e = Bundle::load(&d).unwrap_err().to_string();
    std::fs::remove_dir_all(&d).unwrap();
    assert!(e.contains("templates/base.html"), "{e}");
}

#[test]
fn reload_swaps_templates_and_keeps_the_last_good_ones_on_error() {
    let d = scratch("reload");
    let e = Engine::load(&d).unwrap();
    let (ctx, req) = (context! { todos => vec!["a"] }, ReqCtx::default());
    assert!(!e.reload().unwrap());
    assert_eq!(e.version(), 1);

    let tpl = d.join("templates/todos/list.html");
    let src = std::fs::read_to_string(&tpl).unwrap();
    // A different length changes the fingerprint even within one mtime tick.
    std::fs::write(&tpl, src.replace("<li>", "<li class=\"x\">")).unwrap();
    assert!(e.reload().unwrap());
    assert_eq!(e.version(), 2);
    assert!(
        e.render_block(LIST, "items", &ctx, &req)
            .unwrap()
            .contains("class=\"x\"")
    );

    std::fs::write(&tpl, "{% if %}").unwrap();
    assert!(e.reload().is_err());
    // The error is reported once, and the previous templates still serve.
    assert!(!e.reload().unwrap());
    assert_eq!(e.version(), 2);
    assert!(
        e.render_block(LIST, "items", &ctx, &req)
            .unwrap()
            .contains("class=\"x\"")
    );

    std::fs::write(d.join("i18n/en.toml"), "title = \"Tasks!\"\n").unwrap();
    std::fs::write(&tpl, src).unwrap();
    assert!(e.reload().unwrap());
    assert!(
        e.render(LIST, &ctx, &req)
            .unwrap()
            .contains("<h1>Tasks!</h1>")
    );
    std::fs::remove_dir_all(&d).unwrap();
}
