//! Headless: build a document, resolve styles, read computed values. No window, no GPU.

use cascivo_blitz::{ColorScheme, Error, Options, document_from_cv, html_from_cv};

const SAMPLE: &str = "button \"Go\" primary\ncard \"T\"\n  p \"x\"\ncard\n  p \"y\"\n";

fn dark() -> Options {
    Options {
        theme: Some("dark".into()),
        color_scheme: ColorScheme::Dark,
        ..Options::default()
    }
}

fn style(opts: &Options, sel: &str, prop: &str) -> String {
    let mut doc = document_from_cv(SAMPLE, opts).unwrap();
    doc.resolve(0.0);
    let id = doc.query_selector(sel).unwrap().unwrap();
    doc.resolved_style_value(id, prop)
}

#[test]
fn button_background_comes_from_the_theme_token() {
    // `--cascivo-color-primary` is oklch(20.5% 0 0) in the light theme, oklch(92.2% 0 0) in dark.
    let bg = |o: &Options| style(o, "button", "background-color");
    assert_eq!(bg(&Options::default()), "oklch(0.205 0 0)");
    assert_eq!(bg(&dark()), "oklch(0.922 0 0)");
}

#[test]
fn has_rule_applies() {
    // `.cv-card-card:has(> .cv-card-header)` zeroes the padding; a bare card keeps `md` (24px).
    let o = Options::default();
    assert_eq!(style(&o, ".cv-card-card", "padding-top"), "0px");
    assert_eq!(
        style(&o, ".cv-card-card + .cv-card-card", "padding-top"),
        "24px"
    );
}

#[test]
fn layout_runs() {
    let mut doc = document_from_cv(SAMPLE, &Options::default()).unwrap();
    doc.resolve(0.0);
    let id = doc.query_selector("button").unwrap().unwrap();
    let rect = doc.get_client_bounding_rect(id).unwrap();
    assert!(rect.width > 0.0 && rect.height > 0.0);
}

#[test]
fn theme_none_follows_the_file() {
    let html = html_from_cv("@brand theme=midnight\nh1 \"x\"\n", &Options::default()).unwrap();
    assert!(html.contains("data-theme=\"midnight\""));
    let o = Options {
        theme: Some("dark".into()),
        ..Options::default()
    };
    let html = html_from_cv("@brand theme=midnight\nh1 \"x\"\n", &o).unwrap();
    assert!(html.contains("data-theme=\"dark\""));
}

#[test]
fn bad_cv_is_an_error() {
    let Err(Error::Cv(diags)) = document_from_cv("nonsense-component \"x\"\n", &Options::default())
    else {
        panic!("expected diagnostics");
    };
    assert!(!diags.is_empty());
}
