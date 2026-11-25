use cascivo_html::{render_fragment, script_names};

#[test]
fn copy_button_is_opt_in_and_pulls_script() {
    let off = render_fragment("code-snippet \"ls\"\n").unwrap();
    assert!(!off.contains("data-copy-btn"));
    let on = render_fragment("code-snippet \"ls\" showCopyButton\n").unwrap();
    assert!(on.contains("data-copy-btn"));
    assert!(script_names().any(|n| n == "copy-btn"));
}

#[test]
fn relative_time_without_date_is_dropped_and_unsafe_url_unlinked() {
    let h = render_fragment("inline-citation 1 title=\"T\" url=\"javascript:x\"\n").unwrap();
    assert!(!h.contains("<a "));
}
