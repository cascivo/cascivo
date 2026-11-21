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
