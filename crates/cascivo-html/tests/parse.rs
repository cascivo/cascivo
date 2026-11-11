use cascivo_html::{BrandItem, Directive, Doc, Node, Value, parse};
use std::fs;
use std::path::Path;

fn ok(src: &str) -> Doc {
    match parse(src) {
        Ok(d) => d,
        Err(e) => panic!("unexpected diagnostics: {e:?}"),
    }
}

fn errs(src: &str) -> Vec<String> {
    match parse(src) {
        Ok(d) => panic!("expected diagnostics, got {d:?}"),
        Err(e) => e.iter().map(ToString::to_string).collect(),
    }
}

fn one(src: &str) -> Node {
    let mut d = ok(src);
    assert_eq!(d.nodes.len(), 1, "{src}");
    d.nodes.remove(0)
}

fn prop<'a>(n: &'a Node, name: &str) -> Option<&'a Value> {
    n.props.iter().find(|(k, _)| *k == name).map(|(_, v)| v)
}

fn s(v: &str) -> Value {
    Value::Str(v.to_string())
}

#[test]
fn spec_example() {
    let d = ok("@brand #5b5bd6 r8 gap4 font=Inter dark
cols 2
  card \"Revenue\"
    bar Q1:12 Q2:18 Q3:9
  card \"Users\"
    line 3 5 8 13
");
    let item = |k: &str, v: Option<&str>| BrandItem {
        key: k.to_string(),
        value: v.map(str::to_string),
    };
    assert_eq!(
        d.directives,
        vec![Directive::Brand(vec![
            item("#5b5bd6", None),
            item("r8", None),
            item("gap4", None),
            item("font", Some("Inter")),
            item("dark", None),
        ])]
    );
    assert_eq!(d.nodes.len(), 1);
    let cols = &d.nodes[0];
    assert_eq!(cols.spec.name, "columns");
    assert_eq!(cols.args, vec![Value::Num(2.0)]);
    assert_eq!(cols.children.len(), 2);
    let [rev, users] = &cols.children[..] else {
        unreachable!()
    };
    assert_eq!(
        (rev.spec.name, &rev.args[..]),
        ("card", &[s("Revenue")][..])
    );
    assert_eq!(rev.children.len(), 1);
    assert_eq!(
        rev.children[0].args,
        vec![Value::Pairs(vec![
            ("Q1".into(), 12.0),
            ("Q2".into(), 18.0),
            ("Q3".into(), 9.0)
        ])]
    );
    assert_eq!(users.args, vec![s("Users")]);
    assert_eq!(users.children[0].spec.name, "line");
    assert_eq!(users.line, 5);
}

#[test]
fn repeat_clones_subtree() {
    let d = ok("3x card \"A\"\n  text \"t\"\n");
    assert_eq!(d.nodes.len(), 3);
    assert!(
        d.nodes
            .iter()
            .all(|n| n.args == vec![s("A")] && n.children.len() == 1)
    );
}

#[test]
fn data_args() {
    assert_eq!(
        one("table Name,Age | Ann,31").args,
        vec![Value::Rows(vec![
            vec!["Name".into(), "Age".into()],
            vec!["Ann".into(), "31".into()]
        ])]
    );
    assert_eq!(
        one("bar Q1:12 Q2:18").args,
        vec![Value::Pairs(vec![("Q1".into(), 12.0), ("Q2".into(), 18.0)])]
    );
    assert_eq!(
        one("line 3 5 8").args,
        vec![Value::Nums(vec![3.0, 5.0, 8.0])]
    );
    // Rows are raw: quotes and escapes are not tokenized, flags before rows still apply.
    let t = one("table zebra \"A ,B\\x | 1, 2 ");
    assert_eq!(prop(&t, "zebra"), Some(&Value::Bool(true)));
    assert_eq!(
        t.args,
        vec![Value::Rows(vec![
            vec!["\"A".into(), "B\\x".into()],
            vec!["1".into(), "2".into()]
        ])]
    );
}

#[test]
fn text_kept_raw() {
    let n = one("text \"<b>\" ");
    assert_eq!(n.text.as_deref(), Some("<b>"));
    assert_eq!(one("card \"<b>\"").args, vec![s("<b>")]);
    assert_eq!(
        one(r#"p "say \"hi\" \\ ok""#).text.as_deref(),
        Some(r#"say "hi" \ ok"#)
    );
    assert_eq!(one("card \"日本 🎉\"").args, vec![s("日本 🎉")]);
}

#[test]
fn aliases_apply_defaults() {
    let r = one("row");
    assert_eq!(r.spec.name, "flex");
    assert_eq!(prop(&r, "direction"), Some(&s("horizontal")));
    assert_eq!(prop(&one("col"), "direction"), Some(&s("vertical")));
    let h = one("h2 \"X\"");
    assert_eq!((h.spec.name, prop(&h, "level")), ("heading", Some(&s("2"))));
    // Explicit prop beats alias default; non-alias name gets no default.
    assert_eq!(prop(&one("h1 \"X\" level=4"), "level"), Some(&s("4")));
    assert_eq!(prop(&one("flex"), "direction"), None);
    assert!(one("p \"x\"").props.is_empty());
}

#[test]
fn flags_and_props() {
    let b = one("button \"Save\" primary");
    assert!(b.args.is_empty());
    assert_eq!(b.text.as_deref(), Some("Save"));
    assert_eq!(prop(&b, "variant"), Some(&s("primary")));
    // Props come out in catalog order regardless of source order.
    let b = one("button disabled size=lg ghost \"Go now\"");
    let names: Vec<&str> = b.props.iter().map(|(k, _)| *k).collect();
    assert_eq!(names, ["variant", "size", "disabled"]);
    assert_eq!(prop(&b, "disabled"), Some(&Value::Bool(true)));
    assert_eq!(b.text.as_deref(), Some("Go now"));
    assert_eq!(
        prop(&one("bar Q1:1 height=200"), "height"),
        Some(&Value::Num(200.0))
    );
    assert_eq!(
        prop(&one("table zebra=false A"), "zebra"),
        Some(&Value::Bool(false))
    );
    assert_eq!(
        prop(&one("button \"a b\" variant=\"ghost\""), "variant"),
        Some(&s("ghost"))
    );
    assert_eq!(
        errs("flex center"),
        ["1:6: ambiguous flag 'center' for flex; use align=center or justify=center"]
    );
    assert_eq!(
        prop(&one("flex justify=center"), "justify"),
        Some(&s("center"))
    );
}

#[test]
fn empty_comment_and_directive_only_inputs() {
    for src in ["", "\n\n  \n", "# a\n   # b\n\t# c\n", "\u{feff}"] {
        assert_eq!(ok(src), Doc::default(), "{src:?}");
    }
    let d = ok("@title Q3 report\n@lang de\n@brand-file brand.cv\n# end\n");
    assert!(d.nodes.is_empty());
    assert_eq!(
        d.directives,
        vec![
            Directive::Title("Q3 report".into()),
            Directive::Lang("de".into()),
            Directive::BrandFile("brand.cv".into()),
        ]
    );
}

#[test]
fn directive_between_nodes_closes_tree() {
    let d = ok("card\n  text \"a\"\n@title \"T\"\ncard\r\n");
    assert_eq!(d.nodes.len(), 2);
    assert_eq!(d.directives, vec![Directive::Title("T".into())]);
}

#[test]
fn repeat_expansion_is_bounded() {
    let e = errs("1000x card\n  1000x card\n");
    assert_eq!(e, ["1:1: document expands to more than 100000 nodes"]);
    // Few nodes but large payload: 1000 × 40 × 20 KB would be ~800 MB of clones.
    let big = format!(
        "1000x flex\n  40x flex\n    text \"{}\"\n",
        "x".repeat(20_000)
    );
    let e = errs(&big);
    assert_eq!(e, ["1:1: document expands to more than 16 MiB of content"]);
}

#[test]
fn golden_diagnostics() {
    let dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/diag");
    let mut cases: Vec<_> = fs::read_dir(&dir)
        .unwrap()
        .map(|e| e.unwrap().path())
        .filter(|p| p.extension().is_some_and(|x| x == "cv"))
        .collect();
    cases.sort();
    assert!(cases.len() >= 10);
    for cv in cases {
        let src = fs::read_to_string(&cv).unwrap();
        let want = fs::read_to_string(cv.with_extension("txt")).unwrap();
        let got = errs(&src).join("\n");
        assert_eq!(got, want.trim_end(), "{}", cv.display());
    }
}

/// Fixed-seed LCG so the "fuzz" run is deterministic.
struct Lcg(u64);
impl Lcg {
    fn next(&mut self) -> usize {
        self.0 = self
            .0
            .wrapping_mul(6_364_136_223_846_793_005)
            .wrapping_add(1_442_695_040_888_963_407);
        (self.0 >> 33) as usize
    }
    fn pick<T: Copy>(&mut self, xs: &[T]) -> T {
        xs[self.next() % xs.len()]
    }
}

const ALPHABET: &[char] = &[
    'a', 'c', 'r', 'd', 'x', ' ', ' ', ' ', ' ', '\t', '\r', '"', '"', '\\', '|', ':', '=', ',',
    '.', '-', '0', '1', '2', '9', '@', '#', 'é', '日', '🎉', '\u{0}',
];
const VALID: &[&str] = &[
    "@brand #5b5bd6 r8 gap4 font=Inter dark",
    "cols 2",
    "  card \"Revenue\" variant=elevated",
    "    bar Q1:12 Q2:18 Q3:9",
    "    line 3 5 8 13",
    "  3x stat \"Users\" \"1,204\" \"+3%\" up",
    "  table sortable Name,Age | Ann,31",
    "  button \"Save\" primary",
    "  h2 \"Title\"",
];

#[test]
fn fuzz_never_panics() {
    let mut rng = Lcg(0x5eed);
    let mut doc = String::new();
    for _ in 0..10_000 {
        match rng.next() % 3 {
            0 => {
                let len = rng.next() % 40;
                doc.extend((0..len).map(|_| rng.pick(ALPHABET)));
            }
            1 => {
                let mut chars: Vec<char> = rng.pick(VALID).chars().collect();
                for _ in 0..1 + rng.next() % 4 {
                    let at = rng.next() % (chars.len() + 1);
                    match rng.next() % 3 {
                        0 => chars.insert(at, rng.pick(ALPHABET)),
                        1 if at < chars.len() => {
                            chars.remove(at);
                        }
                        _ if at < chars.len() => chars[at] = rng.pick(ALPHABET),
                        _ => {}
                    }
                }
                doc.extend(chars);
            }
            _ => {
                let bytes: Vec<u8> = (0..rng.next() % 40).map(|_| rng.next() as u8).collect();
                doc.push_str(&String::from_utf8_lossy(&bytes));
            }
        }
        doc.push('\n');
    }
    // Whole document, then each line alone (small inputs reach the Ok path more often).
    let _ = parse(&doc);
    for line in doc.lines() {
        let _ = parse(line);
    }
    // Deep but valid nesting and pathological repeats stay cheap.
    let deep: String = (0..200)
        .map(|i| format!("{}card\n", "  ".repeat(i)))
        .collect();
    let _ = parse(&deep);
    let wide: String = (0..100)
        .map(|i| format!("{}1000x card\n", "  ".repeat(i)))
        .collect();
    let _ = parse(&wide);
}
