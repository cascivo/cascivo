//! `image`/`svg` sources: embedding, passthrough, limits and diagnostics. No filesystem here.

use cascivo_html::{Options, render};

const PNG: &[u8] = b"\x89PNG\r\n\x1a\n\0\0\0\rIHDR";
const SVG: &str = r##"<svg viewBox="0 0 4 4"><path d="M0 0h4v4z" fill="currentColor"/></svg>"##;

fn opts() -> Options {
    Options {
        assets: vec![
            ("logo.png".into(), PNG.to_vec()),
            ("icon.svg".into(), SVG.as_bytes().to_vec()),
            ("blob.bin".into(), b"nope".to_vec()),
        ],
        ..Options::default()
    }
}

fn ok(src: &str) -> String {
    render(src, &opts()).unwrap_or_else(|e| panic!("{e:?}"))
}

fn err(src: &str, o: &Options) -> String {
    let d = render(src, o).unwrap_err();
    d.iter()
        .map(ToString::to_string)
        .collect::<Vec<_>>()
        .join("\n")
}

#[test]
fn image_file_becomes_data_uri() {
    let h = ok("image logo.png \"Logo\"\n");
    assert!(h.contains("src=\"data:image/png;base64,iVBORw0KGgo"), "{h}");
    assert!(h.contains("alt=\"Logo\""));
}

#[test]
fn image_of_svg_file_uses_data_uri_not_markup() {
    let h = ok("image icon.svg \"Icon\"\n");
    assert!(h.contains("data:image/svg+xml;base64,"), "{h}");
    assert!(!h.contains("<path"));
}

#[test]
fn svg_file_is_inlined_with_a11y_and_size() {
    let h = ok("svg icon.svg \"Chart\" w=64 h=2rem fit=cover\n");
    assert!(
        h.contains("<svg viewBox=\"0 0 4 4\" role=\"img\" aria-label=\"Chart\""),
        "{h}"
    );
    assert!(h.contains("preserveAspectRatio=\"xMidYMid slice\""));
    assert!(h.contains("inline-size:64px;block-size:2rem"));
    assert!(h.contains("fill=\"currentColor\""));
}

#[test]
fn svg_inline_markup_is_sanitized() {
    let h = ok("svg \"<svg onload='x()'><script>alert(1)</script><circle r='1'/></svg>\"\n");
    assert!(
        h.contains("<circle r=\"1\"/>") && h.contains("aria-hidden=\"true\""),
        "{h}"
    );
    assert!(!h.contains("onload") && !h.contains("<script"));
}

#[test]
fn svg_ids_are_unique_per_node_and_deterministic() {
    let src = "svg \"<svg><defs><clipPath id='c'/></defs><g clip-path='url(#c)'/></svg>\"\nsvg \"<svg><defs><clipPath id='c'/></defs></svg>\"\n";
    let a = ok(src);
    assert_eq!(a, ok(src));
    assert!(
        a.contains("id=\"cv-1-c\"") && a.contains("url(#cv-1-c)") && a.contains("id=\"cv-2-c\""),
        "{a}"
    );
}

#[test]
fn rejected_svg_is_a_diagnostic() {
    let e = err("text \"hi\"\nsvg \"<svg><g></svg>\"\n", &opts());
    assert!(e.starts_with("2:1: svg rejected:"), "{e}");
}

#[test]
fn data_uri_passes_through_untouched() {
    let uri = "data:image/png;base64,AAAA";
    let h = render(&format!("image \"{uri}\" x\n"), &Options::default()).unwrap();
    assert!(h.contains(uri));
}

#[test]
fn url_stays_a_reference_without_embedding() {
    let h = render("image https://a.example/x.png x\n", &Options::default()).unwrap();
    assert!(h.contains("src=\"https://a.example/x.png\""));
    // A resolver is not consulted for URLs unless `embed_urls` is set.
    let r: cascivo_html::AssetResolver = &|_| panic!("must not be called");
    let o = Options {
        asset_resolver: Some(r),
        ..Options::default()
    };
    assert!(
        render("image https://a.example/x.png x\n", &o)
            .unwrap()
            .contains("https://a.example")
    );
}

#[test]
fn url_is_resolved_when_embedding_urls() {
    let r: cascivo_html::AssetResolver = &|u| {
        assert_eq!(u, "https://a.example/x.png");
        Ok(PNG.to_vec())
    };
    let o = Options {
        asset_resolver: Some(r),
        embed_urls: true,
        ..Options::default()
    };
    assert!(
        render("image https://a.example/x.png x\n", &o)
            .unwrap()
            .contains("data:image/png;base64,")
    );
}

#[test]
fn svg_url_without_fetching_is_a_diagnostic() {
    let e = err("svg https://a.example/x.svg\n", &Options::default());
    assert!(e.starts_with("1:1: cannot inline"), "{e}");
}

#[test]
fn local_path_without_source_says_how_to_supply_it() {
    let e = err("stat A 1\nimage missing.png x\n", &Options::default());
    assert!(
        e.starts_with("2:1: cannot load 'missing.png'") && e.contains("Options::assets"),
        "{e}"
    );
}

#[test]
fn resolver_errors_carry_position() {
    let r: cascivo_html::AssetResolver = &|_| Err("outside the allowed roots".into());
    let o = Options {
        asset_resolver: Some(r),
        ..Options::default()
    };
    let e = err("text \"x\"\nimage ../x.png\n", &o);
    assert!(
        e.contains("2:1: cannot load '../x.png': outside the allowed roots"),
        "{e}"
    );
}

#[test]
fn size_limit_is_enforced_and_raisable() {
    let big = vec![b'x'; 3000];
    let mut png = PNG.to_vec();
    png.extend(&big);
    let mut o = Options {
        assets: vec![("big.png".into(), png)],
        ..Options::default()
    };
    o.max_asset_bytes = Some(1000);
    assert!(err("image big.png x\n", &o).contains("over the 1000-byte embed limit"));
    o.max_asset_bytes = Some(4000);
    assert!(render("image big.png x\n", &o).is_ok());
    // Default limit is 2 MiB.
    let huge = Options {
        assets: vec![("h.png".into(), vec![0x89; 2 * 1024 * 1024 + 1])],
        ..Options::default()
    };
    assert!(err("image h.png x\n", &huge).contains("embed limit"));
}

#[test]
fn unknown_type_and_wrong_kind_are_diagnostics() {
    assert!(err("image blob.bin x\n", &opts()).contains("unknown image type"));
    assert!(err("svg logo.png\n", &opts()).contains("is not an SVG"));
}

#[test]
fn output_is_deterministic() {
    let src = "image logo.png a w=10 fit=contain\nsvg icon.svg b\n";
    assert_eq!(ok(src), ok(src));
}
