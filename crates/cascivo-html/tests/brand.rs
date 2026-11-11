use cascivo_html::brand::{Brand, Mode, brand_css, document_brand, hex_to_oklch, parse_brand};
use cascivo_html::render::Options;
use cascivo_html::{BrandItem, parse};

fn items(src: &str) -> Vec<BrandItem> {
    let doc = parse(&format!("@brand {src}")).expect("parses");
    match doc.directives.into_iter().next() {
        Some(cascivo_html::Directive::Brand(i)) => i,
        other => panic!("not a brand directive: {other:?}"),
    }
}

fn css(src: &str) -> String {
    brand_css(&parse_brand(&items(src)).expect("valid brand"))
}

fn doc_brand(src: &str, opts: &Options) -> Result<(Option<String>, String), Vec<String>> {
    let doc = parse(src).expect("parses");
    document_brand(&doc, opts).map_err(|e| e.iter().map(ToString::to_string).collect())
}

/// Accent lines of the TS `configToCSS` fixture, minified the way we print them.
fn fixture_accent_decls(name: &str) -> Vec<String> {
    let path = format!("{}/tests/brand/{name}.snap", env!("CARGO_MANIFEST_DIR"));
    std::fs::read_to_string(path)
        .expect("fixture")
        .lines()
        .map(str::trim)
        .filter(|l| l.starts_with("--cascivo-color-accent"))
        .map(|l| l.replace(": ", ":"))
        .collect()
}

#[test]
fn accent_matches_theme_kit_fixtures() {
    for (name, src) in [
        ("indigo-light", "#5b5bd6 light"),
        ("rose-dark", "#e11d48 dark"),
        ("green-light", "#16a34a light"),
    ] {
        let out = css(src);
        let decls = fixture_accent_decls(name);
        assert_eq!(decls.len(), 6, "{name}");
        for d in decls {
            assert!(out.contains(&d), "{name}: missing {d}\nin {out}");
        }
    }
}

#[test]
fn hex_math() {
    let o = hex_to_oklch("#ffffff").unwrap();
    assert_eq!((o.c, o.h), (0.0, 0.0));
    assert_eq!(hex_to_oklch("#fff"), hex_to_oklch("#ffffff"));
    assert!(hex_to_oklch("#12345").is_none());
    assert!(hex_to_oklch("#gggggg").is_none());
}

#[test]
fn radius_gap_density_fonts() {
    let out = css("r8 gap4 density=compact font=\"Open Sans\" mono=Menlo");
    assert!(out.starts_with("@layer cascivo.theme{:root:root{"));
    assert!(out.contains("--cascivo-radius-base:8px;"));
    assert!(out.contains("--cascivo-gap-default:var(--cascivo-space-4);"));
    assert!(out.contains("--cascivo-density:0.875;"));
    assert!(out.contains("--cascivo-font-sans:'Open Sans',ui-sans-serif"));
    assert!(out.contains("--cascivo-font-mono:Menlo,ui-monospace"));
}

#[test]
fn primary_drives_accent_unless_overridden() {
    let both = css("#5b5bd6");
    assert!(both.contains("--cascivo-color-primary:"));
    assert!(both.contains("--cascivo-color-accent:"));
    let split = css("#5b5bd6 accent=#e11d48");
    let accent_hue = hex_to_oklch("#e11d48").unwrap().h;
    assert!(split.contains(&format!(
        "--cascivo-color-accent:oklch(0.52 {:.3} {accent_hue})",
        hex_to_oklch("#e11d48").unwrap().c
    )));
}

#[test]
fn auto_emits_dark_media_block() {
    let out = css("#5b5bd6 auto");
    assert!(out.contains(
        "@media (prefers-color-scheme:dark){:root:root{--cascivo-color-accent:oklch(0.65"
    ));
}

#[test]
fn empty_brand_is_empty_css() {
    assert_eq!(brand_css(&Brand::default()), "");
}

#[test]
fn brand_file_needs_resolver() {
    let e = doc_brand("@brand-file brand.cv", &Options::default()).unwrap_err();
    assert_eq!(e, vec!["1:1: brand files need a resolver"]);
}

#[test]
fn brand_file_traversal_never_reads_anything() {
    // Default options carry no resolver, so the library has no way to touch the filesystem.
    let e = doc_brand("@brand-file ../../etc/passwd", &Options::default()).unwrap_err();
    assert_eq!(e, vec!["1:1: brand files need a resolver"]);
}

fn resolver(path: &str) -> Result<String, String> {
    match path {
        "b.cv" => Ok("# house style\n#5b5bd6 r6\n\nfont=\"Open Sans\" dark\n".into()),
        "bad.cv" => Ok("r6\nrr6\n".into()),
        _ => Err("not found".into()),
    }
}

#[test]
fn brand_file_via_resolver_and_override() {
    let r: &'static dyn Fn(&str) -> Result<String, String> = &resolver;
    let opts = Options {
        brand_resolver: Some(r),
        ..Options::default()
    };
    let (theme, out) = doc_brand("@brand-file b.cv\n@brand r12", &opts).unwrap();
    assert_eq!(theme.as_deref(), Some("dark"));
    assert!(
        out.contains("--cascivo-radius-base:12px;"),
        "later @brand wins"
    );
    assert!(out.contains("'Open Sans'"));
    assert!(out.contains("--cascivo-color-accent:oklch(0.65 "));

    let over = Options {
        brand: Some(Brand {
            mode: Some(Mode::Light),
            theme: Some("warm".into()),
            ..Brand::default()
        }),
        brand_resolver: Some(r),
        ..Options::default()
    };
    let (theme, out) = doc_brand("@brand-file b.cv", &over).unwrap();
    assert_eq!(theme.as_deref(), Some("warm"));
    assert!(out.contains("oklch(0.52 "), "opts.brand mode overrides");

    let e = doc_brand("@brand-file bad.cv", &opts).unwrap_err();
    assert_eq!(e.len(), 1);
    assert!(e[0].starts_with("2:1: unknown brand key 'rr6'"), "{e:?}");
    let e = doc_brand("@brand-file missing.cv", &opts).unwrap_err();
    assert_eq!(
        e,
        vec!["1:1: cannot load brand file 'missing.cv': not found"]
    );
}

#[test]
fn unknown_keys_get_hints() {
    let e = parse_brand(&items("theem=warm")).unwrap_err();
    assert_eq!(
        e[0].msg,
        "unknown brand key 'theem=warm'; did you mean 'theme'?"
    );
    let e = parse_brand(&items("theme=warn")).unwrap_err();
    assert_eq!(e[0].msg, "unknown theme 'warn'; did you mean 'warm'?");
    let e = parse_brand(&items("#12 r99 gap7 density=wide")).unwrap_err();
    assert_eq!(e.len(), 4);
}

#[test]
fn font_values_cannot_inject_css() {
    for bad in ["a;b", "a}b", "a</style>", "a(b)"] {
        let it = vec![BrandItem {
            key: "font".into(),
            value: Some(bad.into()),
        }];
        assert!(parse_brand(&it).is_err(), "{bad}");
    }
}

#[test]
fn deterministic() {
    assert_eq!(css("#5b5bd6 r8 gap4 auto"), css("#5b5bd6 r8 gap4 auto"));
}

#[test]
fn caller_built_brand_is_sanitized() {
    let b = Brand {
        font: Some("x;}body{display:none".into()),
        primary: Some(cascivo_html::brand::Oklch {
            h: f64::NAN,
            c: 1e300,
        }),
        ..Brand::default()
    };
    let out = brand_css(&b);
    assert!(!out.contains("display:none") && !out.contains("NaN") && !out.contains("e300"));
}

#[test]
fn dark_theme_picks_dark_scale() {
    let b = parse_brand(&items("#5b5bd6 theme=midnight")).unwrap();
    assert!(brand_css(&b).contains("oklch(0.65 "));
}

#[test]
fn chart_scale_follows_brand_only_when_given() {
    let branded = css("#5b5bd6 light");
    assert!(branded.contains("--cascivo-chart-8:"));
    // Series 1 carries the brand hue.
    let o = hex_to_oklch("#5b5bd6").expect("hex");
    let c = o.c.clamp(0.1, 0.16);
    assert!(branded.contains(&format!("--cascivo-chart-1:oklch(0.62 {c:.3} {}", o.h)));
    assert!(css("dark").is_empty() || !css("dark").contains("--cascivo-chart-"));
    // Dark mode lifts lightness.
    assert!(css("#5b5bd6 dark").contains("--cascivo-chart-1:oklch(0.74 "));
}
