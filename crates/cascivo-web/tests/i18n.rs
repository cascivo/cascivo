#![cfg(feature = "fs")]

use std::path::{Path, PathBuf};

use cascivo_web::{Output, Site};

fn fixture() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/i18n")
}

/// A private copy of the i18n fixture, for tests that edit it.
fn scratch(tag: &str) -> PathBuf {
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
    let dst = std::env::temp_dir().join(format!("cvweb-i18n-{tag}-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&dst);
    copy(&fixture(), &dst);
    dst
}

fn page(out: &Output, url: &str) -> String {
    let (_, b) = out.get(url).unwrap_or_else(|| panic!("no {url}"));
    String::from_utf8(b.to_vec()).unwrap()
}

#[test]
fn locale_routes_with_fallback_messages_and_feeds() {
    let out = Site::load(&fixture()).unwrap().render().unwrap();
    let keys: Vec<&str> = out.files.keys().map(String::as_str).collect();
    assert_eq!(
        keys,
        [
            "about/index.html",
            "blog/a/index.html",
            "blog/b/index.html",
            "cascivo.css",
            "de/about/index.html",
            "de/blog/a/index.html",
            "de/blog/b/index.html",
            "de/index.html",
            "de/rss.xml",
            "index.html",
            "rss.xml",
            "sitemap.xml",
        ]
    );
    let de = page(&out, "/de/");
    assert!(de.contains("<html lang=\"de\">"), "{de}");
    assert!(
        de.contains("Start · Hallo Ada · de") && de.contains("Willkommen."),
        "{de}"
    );
    assert!(
        de.contains("hreflang=\"en\" href=\"https://multi.example/\"")
            && de.contains("hreflang=\"de\" href=\"https://multi.example/de/\""),
        "{de}"
    );
    // Untranslated page: default text, German chrome.
    let about = page(&out, "/de/about/");
    assert!(
        about.contains("About us.") && about.contains("Start ·"),
        "{about}"
    );
    assert!(page(&out, "/about/").contains("Home · Hello Ada · en"));
    let a = page(&out, "/de/blog/a/");
    assert!(
        a.contains("data-locale=\"de\"") && a.contains("Deutsch A."),
        "{a}"
    );
    let b = page(&out, "/de/blog/b/");
    assert!(
        b.contains("data-locale=\"en\"") && b.contains("English B."),
        "{b}"
    );
    let sm = page(&out, "/sitemap.xml");
    assert!(
        sm.contains("xmlns:xhtml=\"http://www.w3.org/1999/xhtml\""),
        "{sm}"
    );
    assert!(
        sm.contains(
            "  <url><loc>https://multi.example/de/blog/a/</loc>\n    <xhtml:link rel=\"alternate\" hreflang=\"en\" href=\"https://multi.example/blog/a/\"/>\n    <xhtml:link rel=\"alternate\" hreflang=\"de\" href=\"https://multi.example/de/blog/a/\"/>\n    <xhtml:link rel=\"alternate\" hreflang=\"x-default\" href=\"https://multi.example/blog/a/\"/>\n  </url>"
        ),
        "{sm}"
    );
    let rss = page(&out, "/de/rss.xml");
    assert!(
        rss.contains("<language>de</language>") && rss.contains("<title>Beitrag A</title>"),
        "{rss}"
    );
    assert!(
        rss.contains("<link>https://multi.example/de/blog/a/</link>"),
        "{rss}"
    );
    assert!(page(&out, "/rss.xml").contains("<title>Post A</title>"));
}

#[test]
fn without_fallback_only_translations_render() {
    let dir = scratch("nofb");
    let cfg = std::fs::read_to_string(dir.join("site.toml")).unwrap();
    std::fs::write(
        dir.join("site.toml"),
        cfg.replace(
            "locales = [\"en\", \"de\"]",
            "locales = [\"en\", \"de\"]\nfallback = false",
        ),
    )
    .unwrap();
    std::fs::write(dir.join("i18n/de.toml"), "nav.home = \"Start\"\n").unwrap();
    let site = Site::load(&dir).unwrap();
    let e = site.render().unwrap_err().to_string();
    assert!(e.contains("no message `hi` in i18n/de.toml"), "{e}");
    std::fs::write(
        dir.join("i18n/de.toml"),
        "hi = \"Hallo {name}\"\nnav.home = \"Start\"\n",
    )
    .unwrap();
    let out = Site::load(&dir).unwrap().render().unwrap();
    assert!(out.get("/de/").is_some() && out.get("/de/blog/a/").is_none());
    assert!(
        out.get("/de/rss.xml").is_none(),
        "no German post pages, no German feed"
    );
    std::fs::create_dir_all(dir.join("pages/de/blog")).unwrap();
    std::fs::write(
        dir.join("pages/de/blog/[posts].html"),
        "{% extends \"default.html\" %}{% block body %}DE {{ page.title }}{% endblock %}",
    )
    .unwrap();
    let out = Site::load(&dir).unwrap().render().unwrap();
    std::fs::remove_dir_all(&dir).unwrap();
    assert!(page(&out, "/de/blog/a/").contains("DE Beitrag A"));
    assert!(out.get("/de/rss.xml").is_some());
    assert!(out.get("/de/about/").is_none() && out.get("/de/blog/b/").is_none());
}

#[test]
fn unknown_locale_directories_are_errors() {
    let dir = scratch("badloc");
    std::fs::create_dir_all(dir.join("content/posts/fr")).unwrap();
    std::fs::create_dir_all(dir.join("content/posts/en")).unwrap();
    std::fs::write(dir.join("i18n/it.toml"), "").unwrap();
    let e = Site::load(&dir).unwrap_err().to_string();
    std::fs::remove_dir_all(&dir).unwrap();
    assert!(
        e.contains("content/posts/fr: `fr` is not a configured locale (en, de)"),
        "{e}"
    );
    assert!(
        e.contains("content/posts/en: `en` is the default locale"),
        "{e}"
    );
    assert!(
        e.contains("i18n/it.toml: `it` is not a configured locale"),
        "{e}"
    );
}
