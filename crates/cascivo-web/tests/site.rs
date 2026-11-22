use cascivo_web::Site;

mod common;
use common::{fixture, scratch};

fn page(out: &cascivo_web::Output, url: &str) -> String {
    String::from_utf8(
        out.get(url)
            .unwrap_or_else(|| panic!("no {url}"))
            .1
            .to_vec(),
    )
    .unwrap()
}

#[test]
fn renders_routes_layouts_collections_and_components() {
    let out = Site::load(&fixture()).unwrap().render().unwrap();
    let keys: Vec<&str> = out.files.keys().map(String::as_str).collect();
    assert_eq!(
        keys,
        [
            "blog/first/index.html",
            "blog/index.html",
            "blog/second/index.html",
            "cascivo.css",
            "index.html",
            "robots.txt",
            "sitemap.xml"
        ]
    );
    let home = page(&out, "/");
    assert!(home.contains("<title>Home · Mini</title>"), "{home}");
    assert!(home.contains("<link rel=\"stylesheet\" href=\"/cascivo.css\">"));
    assert!(home.contains("<h1>Welcome</h1>") && home.contains("Posts"));
    let blog = page(&out, "/blog/");
    let (a, b) = (
        blog.find("Second post").unwrap(),
        blog.find("First post").unwrap(),
    );
    assert!(a < b, "sorted by date desc: {blog}");
    assert!(blog.contains("href=\"/blog/first/\""));
    let post = page(&out, "/blog/first/");
    assert!(
        post.contains("<strong>first</strong>") && post.contains("New"),
        "{post}"
    );
    let css = page(&out, "/cascivo.css");
    for unit in ["cv-badge", "cv-columns", "cv-prose", "cv-page-header"] {
        assert!(css.contains(unit), "css lacks {unit}");
    }
    let sm = page(&out, "/sitemap.xml");
    assert!(
        sm.contains("<loc>https://mini.example/blog/second/</loc>"),
        "{sm}"
    );
}

#[test]
fn render_is_deterministic() {
    let s = Site::load(&fixture()).unwrap();
    assert_eq!(s.render().unwrap(), s.render().unwrap());
}

#[test]
fn schema_errors_name_file_and_field() {
    let dir = scratch("schema");
    std::fs::write(dir.join("content/posts/bad.md"), "+++\ntitle = 3\n+++\nx\n").unwrap();
    let e = Site::load(&dir).unwrap_err().to_string();
    std::fs::remove_dir_all(&dir).unwrap();
    assert!(
        e.contains("content/posts/bad.md:1: field `title`: expected string, found int"),
        "{e}"
    );
    assert!(
        e.contains("content/posts/bad.md:1: missing required field `date`"),
        "{e}"
    );
}

#[test]
fn component_errors_point_at_markdown_line() {
    let dir = scratch("cverr");
    std::fs::write(
        dir.join("content/posts/first.md"),
        "+++\ntitle = \"T\"\ndate = 2026-01-01\n+++\nline five\n\n::card{bogus=1}\n",
    )
    .unwrap();
    let e = Site::load(&dir).unwrap().render().unwrap_err().to_string();
    std::fs::remove_dir_all(&dir).unwrap();
    assert!(e.starts_with("content/posts/first.md:7:"), "{e}");
}

#[test]
fn build_writes_inside_dist_only() {
    let dir = scratch("build");
    let dist = dir.join("dist");
    Site::load(&dir)
        .unwrap()
        .render()
        .unwrap()
        .write(&dist)
        .unwrap();
    assert!(dist.join("blog/first/index.html").is_file());
    assert!(dist.join("robots.txt").is_file());
    std::fs::remove_dir_all(&dir).unwrap();
}

#[test]
fn public_dotfiles_404_page_and_sitemap_metadata() {
    let dir = scratch("issue305");
    let w = |f: &str, s: &str| {
        let p = dir.join(f);
        std::fs::create_dir_all(p.parent().unwrap()).unwrap();
        std::fs::write(p, s).unwrap();
    };
    w("public/_headers", "/*\n  X-Frame-Options: DENY\n");
    w("public/_redirects", "/old /new 301\n");
    w("public/.well-known/security.txt", "Contact: x\n");
    w("public/.DS_Store", "junk");
    w(
        "pages/404.html",
        "+++\ntitle = \"Not found\"\n+++\n{% extends \"default.html\" %}{% block body %}<h1>{{ page.title }}</h1>{% endblock %}\n",
    );
    w(
        "pages/about.html",
        "+++\ntitle = \"About\"\nlastmod = 2026-03-04\n+++\n<p>{{ page.title }} {{ page.url }}</p>\n",
    );
    w(
        "pages/hidden.md",
        "+++\ntitle = \"Hidden\"\nsitemap = false\n+++\nx\n",
    );
    let out = Site::load(&dir).unwrap().render().unwrap();
    for f in [
        "_headers",
        "_redirects",
        ".well-known/security.txt",
        "404.html",
        "about/index.html",
    ] {
        assert!(out.files.contains_key(f), "missing {f}");
    }
    assert!(!out.files.contains_key(".DS_Store") && !out.files.contains_key("404/index.html"));
    let nf = page(&out, "/404.html");
    assert!(nf.contains("<title>Not found · Mini</title>") && nf.contains("<h1>Not found</h1>"));
    assert!(page(&out, "/about/").contains("<p>About /about/</p>"));
    let sm = page(&out, "/sitemap.xml");
    assert!(!sm.contains("404") && !sm.contains("hidden"), "{sm}");
    assert!(
        sm.contains("<loc>https://mini.example/about/</loc><lastmod>2026-03-04</lastmod>"),
        "{sm}"
    );

    w(
        "site.toml",
        "title = \"Mini\"\nbase_url = \"https://mini.example\"\n[build]\ntrailing_slash = false\n",
    );
    let out = Site::load(&dir).unwrap().render().unwrap();
    std::fs::remove_dir_all(&dir).unwrap();
    assert!(out.files.contains_key("about.html") && out.files.contains_key("blog/first.html"));
    assert!(out.files.contains_key("index.html") && out.files.contains_key("404.html"));
    assert!(page(&out, "/about").contains("<p>About /about</p>"));
    assert!(page(&out, "/blog").contains("href=\"/blog/first\""));
    let sm = page(&out, "/sitemap.xml");
    assert!(
        sm.contains("<loc>https://mini.example/blog/first</loc>")
            && sm.contains("<loc>https://mini.example/</loc>"),
        "{sm}"
    );
}

#[test]
fn bad_page_meta_and_template_front_matter_errors() {
    let dir = scratch("badmeta");
    std::fs::write(
        dir.join("pages/x.html"),
        "+++\nsitemap = \"no\"\n+++\n\n{{ nope( }}\n",
    )
    .unwrap();
    let e = Site::load(&dir).unwrap().render().unwrap_err().to_string();
    std::fs::write(
        dir.join("pages/x.html"),
        "+++\ntitle = 1\n+++\n\n{{ nope( }}\n",
    )
    .unwrap();
    let e2 = Site::load(&dir).unwrap().render().unwrap_err().to_string();
    std::fs::remove_dir_all(&dir).unwrap();
    assert!(e.contains("pages/x.html") && e.contains("`sitemap`"), "{e}");
    assert!(e2.starts_with("pages/x.html:5:"), "{e2}");
}
