use std::path::{Path, PathBuf};

use cascivo_web::Site;

fn root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/web")
}

fn text(out: &cascivo_web::Output, rel: &str) -> String {
    String::from_utf8(
        out.files
            .get(rel)
            .unwrap_or_else(|| panic!("no {rel}"))
            .clone(),
    )
    .unwrap()
}

#[test]
fn renders_head_assets_vite_islands_images_highlight_and_data() {
    let out = Site::load(&root()).unwrap().render().unwrap();
    let home = text(&out, "index.html");

    // head + cascivo_css = false
    assert!(home.contains("<title>Home</title>"), "{home}");
    assert!(home.contains("content=\"The &quot;home&quot; page\""));
    assert!(home.contains("<link rel=\"canonical\" href=\"https://web.example/\">"));
    assert!(home.contains("<meta property=\"og:image\" content=\"https://web.example/og.png\">"));
    assert!(home.contains("\"name\":\"a<\\/script>\""), "{home}");
    assert!(!home.contains("cascivo.css") && !out.files.contains_key("cascivo.css"));

    // theme_script
    assert!(home.contains("localStorage.getItem(\"cascade-theme\")"));

    // vite, vite_css, m
    assert!(home.contains("<link rel=\"stylesheet\" href=\"/assets/home-123.css\">"));
    assert!(home.contains("<a href=\"/assets/home-123.js\">"));
    assert!(home.contains("class=\"_value_mwa4g_26\""));

    // css_bundle: one hashed file, dependencies first, layer statements hoisted once
    let b = out
        .files
        .keys()
        .find(|k| k.starts_with("_cw/home.") && k.ends_with(".css"))
        .expect("bundle written");
    assert!(
        home.contains(&format!("<link rel=\"stylesheet\" href=\"/{b}\">")),
        "{home}"
    );
    let css = text(&out, b);
    // encounter order = the order separate sheets would have applied
    assert!(
        css.starts_with("@layer base,component;\n@layer reset,base,component;\n.")
            || css.starts_with(
                "@layer base,component;\n@layer reset,base,component;\n@layer component"
            ),
        "{css}"
    );
    assert_eq!(
        css.matches("@layer reset,base,component;").count(),
        1,
        "{css}"
    );
    let (sh, sig, hm) = (
        css.find(".sh{").unwrap(),
        css.find(".sig{").unwrap(),
        css.find(".home{").unwrap(),
    );
    assert!(sh < sig && sig < hm, "{css}");

    // island + islands_script
    assert!(home.contains("data-island=\"signals\" data-client=\"idle\" data-src=\"/assets/signals-abc.js\" data-css=\"/assets/shared-def.css /assets/signals-abc.css\" data-props='{\"n\":12}'"), "{home}");
    assert!(home.contains("<script type=\"module\">document.querySelectorAll('[data-island]')"));

    // data
    assert!(home.contains("<p>a,b True</p>"), "{home}");

    // asset
    let js = out
        .files
        .keys()
        .find(|k| k.starts_with("_cw/copy.") && k.ends_with(".js"))
        .expect("asset written");
    assert!(
        home.contains(&format!("<script src=\"/{js}\" defer>")),
        "{home}"
    );
    assert_eq!(js.len(), "_cw/copy..js".len() + 8);

    // img
    let imgs: Vec<&String> = out
        .files
        .keys()
        .filter(|k| k.starts_with("_cw/img/hero-"))
        .collect();
    assert_eq!(imgs.len(), 2, "{imgs:?}");
    assert!(home.contains("width=\"32\" height=\"16\" alt=\"Hero\" loading=\"lazy\" decoding=\"async\" class=\"hero\""), "{home}");
    assert!(home.contains("sizes=\"100vw\"") && home.contains(" 16w, ") && home.contains(" 32w\""));
    // img(priority=true): eager + fetchpriority, and one preload in <head> ahead of the first
    // head resource (the theme script), not in the body where the image is
    let h16 = imgs
        .iter()
        .find(|k| k.starts_with("_cw/img/hero-16."))
        .unwrap();
    assert!(
        home.contains("alt=\"Lead\" loading=\"eager\" fetchpriority=\"high\""),
        "{home}"
    );
    let pre = format!(
        "<link rel=\"preload\" as=\"image\" href=\"/{h16}\" imagesrcset=\"/{h16} 16w\" fetchpriority=\"high\">"
    );
    let at = home.find(&pre).expect("preload in the page");
    assert_eq!(home.matches(&pre).count(), 1);
    assert!(
        at < home.find("<script").unwrap() && at < home.find("</head>").unwrap(),
        "{home}"
    );

    // highlight
    assert!(home.contains("<code class=\"_code_x9\"><span data-tok=\"keyword\">const</span><span> a = </span><span data-tok=\"number\">1</span><span> </span><span data-tok=\"comment\">// x</span></code>"), "{home}");
}

#[test]
fn render_is_deterministic() {
    let site = Site::load(&root()).unwrap();
    assert_eq!(site.render().unwrap(), site.render().unwrap());
}

#[test]
fn template_function_errors_carry_file_and_line() {
    let tmp = std::env::temp_dir().join(format!("cvweb-weberr-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&tmp);
    std::fs::create_dir_all(tmp.join("pages")).unwrap();
    std::fs::write(tmp.join("site.toml"), "title = \"x\"\n").unwrap();
    std::fs::write(
        tmp.join("pages/index.html"),
        "ok\n{{ asset('missing.js') }}\n",
    )
    .unwrap();
    let e = Site::load(&tmp).unwrap().render().unwrap_err();
    let _ = std::fs::remove_dir_all(&tmp);
    assert_eq!(e.0[0].file, "pages/index.html");
    assert_eq!(e.0[0].line, Some(2));
    assert!(e.0[0].msg.contains("asset(): cannot read"), "{e}");
}
