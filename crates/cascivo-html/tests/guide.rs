use cascivo_html::{GUIDE, Options, check, guide_for, render};

/// Every fenced `cv` block in GUIDE.
fn examples() -> Vec<&'static str> {
    GUIDE
        .split("```cv\n")
        .skip(1)
        .map(|s| s.split("```").next().unwrap())
        .collect()
}

#[test]
fn guide_fits_budget() {
    assert!(GUIDE.chars().count() <= 6000, "{}", GUIDE.chars().count());
}

#[test]
fn guide_lists_every_component() {
    let names = include_str!("../src/catalog_gen.rs")
        .lines()
        .filter_map(|l| l.trim().strip_prefix("name: \""))
        .filter_map(|l| l.split('"').next())
        .collect::<Vec<_>>();
    assert!(names.len() >= 50);
    for n in names {
        assert!(
            GUIDE.lines().any(|l| l.split(' ').next() == Some(n)),
            "{n} missing from GUIDE"
        );
    }
}

#[test]
fn guide_examples_render_clean() {
    let ex = examples();
    assert_eq!(ex.len(), 3);
    for e in ex {
        assert!(check(e).is_empty(), "{e}: {:?}", check(e));
        render(e, &Options::default()).unwrap();
    }
}

#[test]
fn guide_for_every_component_has_valid_example() {
    for name in [
        "card", "stat", "table", "bar", "line", "pie", "gauge", "cols", "h1", "p",
    ] {
        let g = guide_for(name).unwrap_or_else(|| panic!("{name}"));
        let ex = g.lines().find_map(|l| l.strip_prefix("example: ")).unwrap();
        assert!(check(ex).is_empty(), "{ex}: {:?}", check(ex));
    }
    assert!(guide_for("nope").is_none());
    assert!(guide_for("button").unwrap().contains("primary"));
}

#[test]
fn every_component_example_parses() {
    let src = include_str!("../src/catalog_gen.rs");
    for n in src
        .lines()
        .filter_map(|l| l.trim().strip_prefix("name: \""))
        .filter_map(|l| l.split('"').next())
    {
        let g = guide_for(n).unwrap();
        let ex = g.lines().find_map(|l| l.strip_prefix("example: ")).unwrap();
        assert!(check(ex).is_empty(), "{n}: {ex}: {:?}", check(ex));
    }
}
