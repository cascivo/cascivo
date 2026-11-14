//! Drift guard: the guide's class table must list exactly `class::VOCABULARY`, and the skill's
//! example must be real API (checked by `src/lib.rs` compiling the guide's code blocks).

use std::collections::BTreeSet;

use cascivo_tui::class::VOCABULARY;

fn guide() -> String {
    let path = concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../docs/USING-CASCIVO-TUI.md"
    );
    std::fs::read_to_string(path).expect("docs/USING-CASCIVO-TUI.md is readable")
}

/// Backticked tokens in the first column of the table under `## Class table`.
fn documented_classes(md: &str) -> Vec<String> {
    let mut in_section = false;
    let mut out = Vec::new();
    for line in md.lines() {
        if let Some(h) = line.strip_prefix("## ") {
            in_section = h.trim() == "Class table";
            continue;
        }
        if !in_section || !line.starts_with('|') {
            continue;
        }
        let cell = line.trim_start_matches('|').split('|').next().unwrap_or("");
        let mut parts = cell.split('`');
        parts.next();
        out.extend(parts.step_by(2).map(str::to_owned));
    }
    out
}

#[test]
fn class_table_matches_vocabulary() {
    let doc = documented_classes(&guide());
    let doc_set: BTreeSet<&str> = doc.iter().map(String::as_str).collect();
    let vocab: BTreeSet<&str> = VOCABULARY.iter().copied().collect();
    assert_eq!(
        doc.len(),
        doc_set.len(),
        "a class is listed twice in the guide"
    );
    let missing: Vec<_> = vocab.difference(&doc_set).collect();
    let extra: Vec<_> = doc_set.difference(&vocab).collect();
    assert!(
        missing.is_empty() && extra.is_empty(),
        "guide class table drifted from VOCABULARY; missing from guide: {missing:?}; not in VOCABULARY: {extra:?}"
    );
}

#[test]
fn guide_lists_every_theme() {
    let md = guide();
    for name in cascivo_tui::theme::Theme::names() {
        assert!(
            md.contains(&format!("`{name}`")),
            "theme {name} missing from the guide"
        );
    }
}
