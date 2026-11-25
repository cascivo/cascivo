//! CSP-safe output (`Options::inline_styles = false`), external scripts and the #305 fixes.

use cascivo_html::{
    Options, render, render_parts, script, script_bundle, script_names, style_rules,
};
use std::collections::BTreeSet;

const STYLED: &str = "\
row justify=between align=end gap=2
  flex basis=10rem
    text \"a\"
grid 3 align=center
  text \"b\"
cols 2
  text \"c\"
auto-grid min=12rem
  text \"d\"
center maxWidth=40rem
  text \"e\"
section \"S\"
  text \"f\"
spacer size=6
progress-bar 40
meter 30
skeleton width=8rem
image https://x.test/logo.png \"Logo\" w=64 fit=cover
svg \"<svg viewBox='0 0 8 8'><circle cx='4' cy='4' r='3'/></svg>\" \"Dot\" w=32
bar Q1:12 Q2:18 labels=true legend=true
line 3 5 8 labels=true
area 1 4 2
pie a:1 b:2 labels=true
scatter 1:2 3:4
spark 1 3 2
gauge 50
table sort Name,Age | Ann,31
";

fn csp() -> Options {
    Options {
        inline_styles: false,
        ..Options::default()
    }
}

fn body(page: &str) -> &str {
    let at = page.find("<body>").expect("body");
    &page[at..]
}

#[test]
fn default_still_inlines_styles() {
    let f = render_parts(STYLED, &Options::default()).unwrap();
    assert!(f.html.contains(" style=\""));
    assert!(!f.html.contains("data-cv-style"));
    assert!(f.styles.is_empty());
}

#[test]
fn csp_mode_emits_no_style_attributes() {
    let f = render_parts(STYLED, &csp()).unwrap();
    assert!(!f.html.contains(" style="), "{}", f.html);
    assert!(f.html.contains("data-cv-style=\""));
    // Every hook has a rule, and every rule is used.
    let keys: BTreeSet<&str> = f
        .html
        .split("data-cv-style=\"")
        .skip(1)
        .map(|s| &s[..s.find('"').unwrap()])
        .collect();
    assert_eq!(keys, f.styles.keys().map(String::as_str).collect());
    let css = style_rules(&f.styles);
    assert!(css.starts_with("@layer cascivo.override{[data-cv-style=\""));
    assert!(css.contains(
        "--_flex-gap:var(--cascivo-space-2);align-items:flex-end;justify-content:space-between"
    ));
    assert!(css.contains("--cascivo-progress-value:40%"));
    assert!(css.contains("inline-size:64px"));
    assert!(css.contains("pointer-events:none"));
}

#[test]
fn csp_mode_is_deterministic_and_dedupes() {
    let a = render_parts("2x spacer\n", &csp()).unwrap();
    let b = render_parts("spacer\n", &csp()).unwrap();
    assert_eq!(a.styles, b.styles);
    assert_eq!(a.styles.len(), 1);
}

#[test]
fn csp_render_puts_rules_in_the_head_only() {
    let page = render(STYLED, &csp()).unwrap();
    assert!(!body(&page).contains(" style="));
    let f = render_parts(STYLED, &csp()).unwrap();
    assert!(page.contains(&style_rules(&f.styles)));
}

#[test]
fn style_rules_drop_breakouts() {
    let mut m = std::collections::BTreeMap::new();
    m.insert("ab12".to_string(), "color:red}body{color:blue".to_string());
    m.insert("x\"]".to_string(), "color:red".to_string());
    m.insert("cd34".to_string(), "color:red".to_string());
    assert_eq!(
        style_rules(&m),
        "@layer cascivo.override{[data-cv-style=\"cd34\"]{color:red}}"
    );
    assert_eq!(style_rules(&Default::default()), "");
}

#[test]
fn scripts_inline_by_default_or_reference_script_src() {
    let src = "table sort Name | Ann\n";
    let inline = render(src, &Options::default()).unwrap();
    assert!(inline.contains("<script>(()=>"));
    let ext = render(
        src,
        &Options {
            script_src: Some("/cascivo.js".into()),
            ..Options::default()
        },
    )
    .unwrap();
    assert!(ext.contains("<script src=\"/cascivo.js\" defer></script>"));
    assert!(!ext.contains("<script>"));
    let none = render(
        "badge \"x\"\n",
        &Options {
            script_src: Some("/cascivo.js".into()),
            ..Options::default()
        },
    )
    .unwrap();
    assert!(!none.contains("<script"));
}

#[test]
fn script_bundle_covers_every_script() {
    let names: Vec<_> = script_names().collect();
    assert!(names.contains(&"table-sort") && names.contains(&"cv-tabs"));
    assert!(names.contains(&"cv-dialog") && names.contains(&"cv-toaster"));
    let all = script_bundle(None);
    for n in &names {
        assert!(all.contains(script(n).unwrap().trim_end()));
    }
    let used = render_parts(
        "table sort A | b\ntabs\n  text \"x\"\ndialog \"d\"\ntoaster\ncode-snippet \"x\" showCopyButton\n",
        &Options::default(),
    )
    .unwrap();
    let set: BTreeSet<&str> = used.scripts.iter().copied().collect();
    assert_eq!(script_bundle(Some(&set)), all);
    let sort_only = render_parts("table sort A | b\n", &Options::default()).unwrap();
    let set: BTreeSet<&str> = sort_only.scripts.iter().copied().collect();
    assert_eq!(script_bundle(Some(&set)), script("table-sort").unwrap());
    assert_eq!(script_bundle(Some(&BTreeSet::new())), "");
}

#[test]
fn button_href_is_a_link_and_unsafe_urls_drop() {
    let f = render_parts("button \"Go\" href=\"/a?b=1&c=2\"\n", &Options::default()).unwrap();
    assert!(f.html.starts_with("<a "));
    assert!(f.html.contains("href=\"/a?b=1&amp;c=2\""));
    assert!(f.html.ends_with("</a>"));
    let bad = render_parts(
        "button \"Go\" href=\"javascript:alert(1)\"\n",
        &Options::default(),
    )
    .unwrap();
    assert!(bad.html.starts_with("<button") && !bad.html.contains("javascript"));
    let loading = render_parts("button \"Go\" href=/a loading\n", &Options::default()).unwrap();
    assert!(loading.html.starts_with("<button") && loading.html.contains(" disabled"));
}

#[test]
fn alert_and_notification_default_to_note() {
    for c in [
        "alert \"T\" variant=destructive",
        "notification \"T\" variant=error",
    ] {
        let f = render_parts(&format!("{c}\n"), &Options::default()).unwrap();
        assert!(f.html.contains("role=\"note\""), "{c}");
        let f = render_parts(&format!("{c} role=alert\n"), &Options::default()).unwrap();
        assert!(f.html.contains("role=\"alert\""), "{c}");
    }
    assert!(cascivo_html::check("alert role=bogus\n").len() == 1);
}

#[test]
fn row_cells_escape_commas_and_bars() {
    let f = render_parts(
        "table Place,Note | Paris\\, France,a \\| b | x\\\\,y\n",
        &Options::default(),
    )
    .unwrap();
    assert!(f.html.contains(">Paris, France</td>"));
    assert!(f.html.contains(">a | b</td>"));
    assert!(f.html.contains(">x\\</td>"));
    assert!(f.html.contains(">y</td>"));
}
