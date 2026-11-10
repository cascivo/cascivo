//! `.cv` parser: lines → tree of catalog-validated nodes, collecting every diagnostic.
//!
//! Decisions beyond the spec:
//! - Indentation is spaces only, two per level. A tab, an odd count or a jump of more than one
//!   level is an error; the line becomes a placeholder whose children are dropped silently, so
//!   they never attach to the wrong parent or cascade into more errors.
//! - Comment lines (`#` after any indentation) and blank lines are skipped; an inline `#` is
//!   ordinary text (`@brand #5b5bd6`).
//! - A bare word fills a pending `Str` arg only when it is not a flag, so `button Save primary`
//!   is label=Save, variant=primary; quote a label that collides with a flag (`badge "new"`).
//!   For `Num`/`Pairs`/`Nums` args the numeric reading wins over a flag.
//! - `Rows` swallows the rest of the line raw, so table props/flags go before the rows.
//! - Limits keep hostile input cheap: repeat ≤ 1000, nesting < 64, and after repeats ≤ 100 000
//!   nodes and ≤ 16 MiB of string/number payload (both checked before any clone).

use crate::ast::{BrandItem, Directive, Doc, Node, Value};
use crate::catalog::{self, ArgKind, Children, CompSpec, PropKind, PropSpec, closest};
use crate::diag::Diagnostic;
use crate::lex::{Lexed, Tok, Token, col, lex};

const INDENT_MSG: &str = "indentation must be multiples of 2 spaces";
const MAX_REPEAT: u32 = 1000;
const MAX_DEPTH: usize = 64;
const MAX_NODES: u64 = 100_000;
const MAX_BYTES: u64 = 16 << 20;
const DIRECTIVES: &[&str] = &["brand", "brand-file", "title", "lang"];

/// Props an alias implies. Catalog types have no field for this; applied only when the spec has
/// the prop and the author did not set it.
const ALIAS_DEFAULTS: &[(&str, &str, &str)] = &[
    ("row", "direction", "horizontal"),
    ("col", "direction", "vertical"),
    ("h1", "level", "1"),
    ("h2", "level", "2"),
    ("h3", "level", "3"),
];

/// Parses `.cv` source. On error, returns every diagnostic sorted by position.
pub fn parse(src: &str) -> Result<Doc, Vec<Diagnostic>> {
    let src = src.strip_prefix('\u{feff}').unwrap_or(src);
    let mut p = Parser::default();
    for (i, line) in src.lines().enumerate() {
        p.line(u32::try_from(i + 1).unwrap_or(u32::MAX), line);
    }
    p.close_to(0);
    if p.diags.is_empty() {
        return Ok(p.doc);
    }
    let mut d = p.diags;
    d.sort_by_key(|d| (d.line, d.col));
    d.dedup();
    Err(d)
}

/// An open node on the indentation stack. `node: None` is a placeholder for a broken line.
struct Frame {
    node: Option<Node>,
    repeat: u32,
    keep: bool,
    /// Cost of this subtree (one copy), to bound repeat expansion before cloning.
    cost: Cost,
    col: u32,
}

#[derive(Default)]
struct Parser {
    doc: Doc,
    diags: Vec<Diagnostic>,
    stack: Vec<Frame>,
    total: Cost,
}

/// Nodes and payload bytes a subtree will hold once expanded.
#[derive(Default, Clone, Copy)]
struct Cost {
    nodes: u64,
    bytes: u64,
}

impl Cost {
    fn of(node: &Node) -> Self {
        let str_len = |s: &str| s.len() as u64;
        let value = |v: &Value| match v {
            Value::Str(s) => str_len(s),
            Value::Num(_) | Value::Bool(_) => 8,
            Value::Pairs(ps) => ps.iter().map(|(l, _)| str_len(l) + 8).sum(),
            Value::Nums(ns) => 8 * ns.len() as u64,
            Value::Rows(rs) => rs.iter().flatten().map(|c| str_len(c)).sum(),
        };
        let bytes = node.args.iter().map(value).sum::<u64>()
            + node.props.iter().map(|(_, v)| value(v)).sum::<u64>()
            + node.text.as_deref().map_or(0, str_len);
        Self { nodes: 1, bytes }
    }

    fn times(self, n: u32) -> Self {
        Self {
            nodes: self.nodes.saturating_mul(u64::from(n)),
            bytes: self.bytes.saturating_mul(u64::from(n)),
        }
    }

    fn plus(self, o: Self) -> Self {
        Self {
            nodes: self.nodes.saturating_add(o.nodes),
            bytes: self.bytes.saturating_add(o.bytes),
        }
    }
}

impl Parser {
    fn err(&mut self, ln: u32, col: u32, msg: impl Into<String>) {
        self.diags.push(Diagnostic::new(ln, col, msg));
    }

    fn line(&mut self, ln: u32, line: &str) {
        let chars: Vec<(usize, char)> = line.char_indices().collect();
        let indent = chars
            .iter()
            .take_while(|&&(_, c)| c == ' ' || c == '\t')
            .count();
        let Some(&(_, first)) = chars.get(indent) else {
            return;
        };
        if first == '#' {
            return;
        }
        let lexed = lex(&chars, ln, indent);
        if lexed.tokens.is_empty() {
            return;
        }
        if first == '@' {
            if indent > 0 {
                self.err(ln, col(indent), "directives must not be indented");
                return;
            }
            self.close_to(0);
            self.diags.extend(lexed.errors.into_iter().map(|(_, d)| d));
            self.directive(ln, &lexed.tokens);
            return;
        }

        let depth = indent / 2;
        let tab = chars.iter().take(indent).position(|&(_, c)| c == '\t');
        if tab.is_some() || indent % 2 == 1 {
            self.err(ln, col(tab.unwrap_or(indent)), INDENT_MSG);
            self.placeholder(depth.min(self.stack.len()));
            return;
        }
        if depth > self.stack.len() {
            self.err(ln, col(indent), "indentation jumps more than one level");
            self.placeholder(self.stack.len());
            return;
        }
        if depth >= MAX_DEPTH {
            self.err(
                ln,
                col(indent),
                format!("nesting deeper than {MAX_DEPTH} levels"),
            );
            self.placeholder(depth);
            return;
        }

        self.close_to(depth);
        let (keep, refused) = match self.stack.last() {
            None => (true, None),
            Some(f) => match &f.node {
                Some(p) if f.keep && p.spec.children != Children::Nodes => {
                    (false, Some(format!("{} takes no children", p.spec.name)))
                }
                Some(_) => (f.keep, None),
                None => (false, None),
            },
        };
        if let Some(msg) = refused {
            self.err(ln, col(indent), msg);
        }
        match self.node(ln, line, lexed) {
            Some((node, repeat)) => self.stack.push(Frame {
                cost: Cost::of(&node),
                node: Some(node),
                repeat,
                keep,
                col: col(indent),
            }),
            None => self.placeholder(depth),
        }
    }

    fn placeholder(&mut self, depth: usize) {
        self.close_to(depth);
        self.stack.push(Frame {
            node: None,
            repeat: 1,
            keep: false,
            cost: Cost::default(),
            col: 1,
        });
    }

    /// Closes open nodes deeper than `depth`, attaching each (repeated) to its parent.
    fn close_to(&mut self, depth: usize) {
        while self.stack.len() > depth {
            let Some(f) = self.stack.pop() else { break };
            let Some(node) = f.node.filter(|_| f.keep) else {
                continue;
            };
            let cost = f.cost.times(f.repeat);
            let after = match self.stack.last() {
                Some(p) => p.cost,
                None => self.total,
            }
            .plus(cost);
            let over = if after.nodes > MAX_NODES {
                Some(format!("document expands to more than {MAX_NODES} nodes"))
            } else if after.bytes > MAX_BYTES {
                Some(format!(
                    "document expands to more than {} MiB of content",
                    MAX_BYTES >> 20
                ))
            } else {
                None
            };
            if let Some(msg) = over {
                self.err(node.line, f.col, msg);
                continue;
            }
            let siblings = match self.stack.last_mut() {
                Some(p) => {
                    p.cost = after;
                    match &mut p.node {
                        Some(n) => &mut n.children,
                        None => continue,
                    }
                }
                None => {
                    self.total = after;
                    &mut self.doc.nodes
                }
            };
            for _ in 1..f.repeat {
                siblings.push(node.clone());
            }
            siblings.push(node);
        }
    }

    fn directive(&mut self, ln: u32, toks: &[Token]) {
        let Some((head, rest)) = toks.split_first() else {
            return;
        };
        let raw = head.tok.text();
        let name = raw.strip_prefix('@').unwrap_or(&raw);
        let one = |p: &mut Self| match rest {
            [t] => Some(t.tok.text()),
            [] => {
                p.err(ln, head.col, format!("@{name} needs a value"));
                None
            }
            [_, extra, ..] => {
                p.err(ln, extra.col, "unexpected argument");
                None
            }
        };
        let d = match name {
            "brand" if rest.is_empty() => {
                self.err(ln, head.col, "@brand needs at least one item");
                None
            }
            "brand" => Some(Directive::Brand(
                rest.iter()
                    .map(|t| match &t.tok {
                        Tok::Prop { key, value } => BrandItem {
                            key: key.clone(),
                            value: Some(value.clone()),
                        },
                        Tok::Word(s) | Tok::Str(s) => BrandItem {
                            key: s.clone(),
                            value: None,
                        },
                    })
                    .collect(),
            )),
            "brand-file" => one(self).map(Directive::BrandFile),
            "lang" => one(self).map(Directive::Lang),
            "title" if rest.is_empty() => {
                self.err(ln, head.col, "@title needs a value");
                None
            }
            "title" => Some(Directive::Title(
                rest.iter()
                    .map(|t| t.tok.text())
                    .collect::<Vec<_>>()
                    .join(" "),
            )),
            _ => {
                let msg = match closest(name, DIRECTIVES.iter().copied()) {
                    Some(s) => format!("unknown directive '@{name}'; did you mean '@{s}'?"),
                    None => format!(
                        "unknown directive '@{name}'; expected one of: @brand, @brand-file, @title, @lang"
                    ),
                };
                self.err(ln, head.col, msg);
                None
            }
        };
        self.doc.directives.extend(d);
    }

    fn node(&mut self, ln: u32, line: &str, lexed: Lexed) -> Option<(Node, u32)> {
        let mut diags = Vec::new();
        let (res, rows_from) = parse_node(ln, line, &lexed.tokens, &mut diags);
        // Lex errors inside a raw rows tail are not errors: that text is never tokenized.
        self.diags.extend(
            lexed
                .errors
                .into_iter()
                .filter(|(at, _)| rows_from.is_none_or(|r| *at < r))
                .map(|(_, d)| d),
        );
        self.diags.extend(diags);
        res
    }
}

/// `3x` → Some(3); out-of-range or overflowing counts → Some(0); not a repeat → None.
fn repeat_prefix(w: &str) -> Option<u32> {
    let digits = w.strip_suffix('x')?;
    if digits.is_empty() || !digits.bytes().all(|b| b.is_ascii_digit()) {
        return None;
    }
    Some(digits.parse().unwrap_or(0))
}

fn number(s: &str) -> Option<f64> {
    s.parse::<f64>().ok().filter(|x| x.is_finite())
}

/// Returns the node (and repeat count) plus the byte offset where a raw rows tail began.
fn parse_node(
    ln: u32,
    line: &str,
    toks: &[Token],
    diags: &mut Vec<Diagnostic>,
) -> (Option<(Node, u32)>, Option<usize>) {
    let mut toks = toks;
    let mut repeat = 1;
    if let Some(Token {
        tok: Tok::Word(w),
        col: c,
        ..
    }) = toks.first()
    {
        if let Some(n) = repeat_prefix(w) {
            if (1..=MAX_REPEAT).contains(&n) {
                repeat = n;
            } else {
                let msg = format!("repeat count must be between 1 and {MAX_REPEAT}");
                diags.push(Diagnostic::new(ln, *c, msg));
            }
            if toks.len() == 1 {
                let msg = format!("missing component name after '{w}'");
                diags.push(Diagnostic::new(ln, *c, msg));
                return (None, None);
            }
            toks = &toks[1..];
        }
    }
    let Some((head, rest)) = toks.split_first() else {
        return (None, None);
    };
    let Tok::Word(written) = &head.tok else {
        diags.push(Diagnostic::new(ln, head.col, "expected a component name"));
        return (None, None);
    };
    let Some(spec) = catalog::lookup(written) else {
        let msg = match catalog::suggest(written) {
            Some(s) => format!("unknown component '{written}'; did you mean '{s}'?"),
            None => format!("unknown component '{written}'"),
        };
        diags.push(Diagnostic::new(ln, head.col, msg));
        return (None, None);
    };

    let mut b = Build {
        spec,
        ln,
        diags,
        args: Vec::new(),
        next: 0,
        pairs: Vec::new(),
        nums: Vec::new(),
        open: false,
        props: Vec::new(),
        text: None,
    };
    let mut rows_from = None;
    let mut k = 0;
    while let Some(t) = rest.get(k) {
        let pending = spec.args.get(b.next).map(|a| a.kind);
        if b.accumulate(pending, t) {
            k += 1;
            continue;
        }
        if b.flush(pending) {
            continue; // re-handle this token against the next arg
        }
        if pending == Some(ArgKind::Rows) && !b.is_option(t) {
            rows_from = Some(t.start);
            b.args
                .push(Value::Rows(rows(line.get(t.start..).unwrap_or(""))));
            b.next += 1;
            break;
        }
        b.token(pending, t);
        k += 1;
    }
    b.flush(spec.args.get(b.next).map(|a| a.kind));
    let node = b.finish(written, head.col);
    (Some((node, repeat)), rows_from)
}

fn rows(raw: &str) -> Vec<Vec<String>> {
    raw.trim_end()
        .split(" | ")
        .map(|r| r.split(',').map(|c| c.trim().to_string()).collect())
        .collect()
}

/// Props a bare word could set: enums listing it as a value, bools named by it.
fn flag_props(spec: &'static CompSpec, w: &str) -> Vec<&'static PropSpec> {
    spec.props
        .iter()
        .filter(|p| match p.kind {
            PropKind::Enum(vals) => vals.contains(&w),
            PropKind::Bool => p.name == w,
            _ => false,
        })
        .collect()
}

fn typed(kind: PropKind, raw: &str) -> Result<Value, String> {
    match kind {
        PropKind::Str => Ok(Value::Str(raw.to_string())),
        PropKind::Num => number(raw)
            .map(Value::Num)
            .ok_or_else(|| "a number".to_string()),
        PropKind::Bool => match raw {
            "true" => Ok(Value::Bool(true)),
            "false" => Ok(Value::Bool(false)),
            _ => Err("true or false".to_string()),
        },
        PropKind::Enum(vals) if vals.contains(&raw) => Ok(Value::Str(raw.to_string())),
        PropKind::Enum(vals) => Err(format!("one of: {}", vals.join(", "))),
    }
}

/// `stat <label> <value> [delta]`
fn signature(spec: &CompSpec) -> String {
    let mut s = spec.name.to_string();
    for a in spec.args {
        if a.required {
            s += &format!(" <{}>", a.name);
        } else {
            s += &format!(" [{}]", a.name);
        }
    }
    s
}

/// Per-line node state while consuming tokens.
struct Build<'a> {
    spec: &'static CompSpec,
    ln: u32,
    diags: &'a mut Vec<Diagnostic>,
    args: Vec<Value>,
    /// Index of the next unfilled `ArgSpec`.
    next: usize,
    pairs: Vec<(String, f64)>,
    nums: Vec<f64>,
    /// A `Pairs`/`Nums` arg has started consuming tokens.
    open: bool,
    props: Vec<(&'static str, Value)>,
    text: Option<String>,
}

impl Build<'_> {
    fn err(&mut self, col: u32, msg: impl Into<String>) {
        self.diags.push(Diagnostic::new(self.ln, col, msg));
    }

    /// Feeds `label:num` / number tokens into a pending `Pairs` / `Nums` arg.
    fn accumulate(&mut self, pending: Option<ArgKind>, t: &Token) -> bool {
        let Tok::Word(w) = &t.tok else { return false };
        match pending {
            Some(ArgKind::Pairs) => {
                let Some((label, v)) = w.rsplit_once(':') else {
                    return false;
                };
                match number(v) {
                    Some(x) if !label.is_empty() => self.pairs.push((label.to_string(), x)),
                    _ => self.err(t.col, format!("invalid pair '{w}'; expected label:number")),
                }
            }
            Some(ArgKind::Nums) => match number(w) {
                Some(x) => self.nums.push(x),
                None => return false,
            },
            _ => return false,
        }
        self.open = true;
        true
    }

    /// Closes an open `Pairs` / `Nums` arg. Returns whether one was closed.
    fn flush(&mut self, pending: Option<ArgKind>) -> bool {
        if !self.open {
            return false;
        }
        self.open = false;
        self.args.push(match pending {
            Some(ArgKind::Nums) => Value::Nums(std::mem::take(&mut self.nums)),
            _ => Value::Pairs(std::mem::take(&mut self.pairs)),
        });
        self.next += 1;
        true
    }

    fn is_option(&self, t: &Token) -> bool {
        match &t.tok {
            Tok::Prop { .. } => true,
            Tok::Word(w) => !flag_props(self.spec, w).is_empty(),
            Tok::Str(_) => false,
        }
    }

    fn token(&mut self, pending: Option<ArgKind>, t: &Token) {
        let name = self.spec.name;
        match &t.tok {
            Tok::Prop { key, value } => self.set_prop(t.col, key, value),
            Tok::Str(s) => {
                if pending == Some(ArgKind::Str) {
                    self.args.push(Value::Str(s.clone()));
                    self.next += 1;
                } else if self.spec.children != Children::Text {
                    self.err(t.col, format!("{name} takes no text"));
                } else if self.text.is_some() {
                    self.err(t.col, format!("unexpected argument \"{s}\" for {name}"));
                } else {
                    self.text = Some(s.clone());
                }
            }
            Tok::Word(w) => {
                let flags = flag_props(self.spec, w);
                match pending {
                    Some(ArgKind::Str) if flags.is_empty() => {
                        self.args.push(Value::Str(w.clone()));
                        self.next += 1;
                        return;
                    }
                    Some(ArgKind::Num) => {
                        if let Some(x) = number(w) {
                            self.args.push(Value::Num(x));
                            self.next += 1;
                            return;
                        }
                    }
                    _ => {}
                }
                match flags.as_slice() {
                    [p] => {
                        let v = match p.kind {
                            PropKind::Bool => Value::Bool(true),
                            _ => Value::Str(w.clone()),
                        };
                        self.insert(t.col, p.name, v);
                    }
                    [_, _, ..] => {
                        let uses: Vec<String> =
                            flags.iter().map(|p| format!("{}={w}", p.name)).collect();
                        let msg =
                            format!("ambiguous flag '{w}' for {name}; use {}", uses.join(" or "));
                        self.err(t.col, msg);
                    }
                    [] => self.stray_word(t.col, w),
                }
            }
        }
    }

    fn stray_word(&mut self, col: u32, w: &str) {
        let name = self.spec.name;
        if let Some(arg) = self.spec.args.get(self.next) {
            let want = match arg.kind {
                ArgKind::Num => "a number",
                ArgKind::Pairs => "label:value pairs",
                ArgKind::Nums => "numbers",
                ArgKind::Str | ArgKind::Rows => "a value",
            };
            self.err(
                col,
                format!("expected {want} for {}, found '{w}'", arg.name),
            );
            self.next += 1; // reported; don't also report it as missing
            return;
        }
        let mut choices: Vec<&str> = Vec::new();
        for p in self.spec.props {
            let vals: &[&str] = match &p.kind {
                PropKind::Enum(vals) => vals,
                PropKind::Bool => std::slice::from_ref(&p.name),
                _ => &[],
            };
            for v in vals {
                if !choices.contains(v) {
                    choices.push(v);
                }
            }
        }
        if choices.is_empty() || number(w).is_some() {
            self.err(col, format!("unexpected argument '{w}' for {name}"));
        } else {
            let msg = format!(
                "unknown flag '{w}' for {name}; expected one of: {}",
                choices.join(", ")
            );
            self.err(col, msg);
        }
    }

    fn set_prop(&mut self, col: u32, key: &str, raw: &str) {
        let spec = self.spec;
        let Some(p) = spec.props.iter().find(|p| p.name == key) else {
            let names = spec.props.iter().map(|p| p.name);
            let msg = if spec.props.is_empty() {
                format!("{} takes no props", spec.name)
            } else if let Some(s) = closest(key, names.clone()) {
                format!(
                    "unknown prop '{key}' for {}; did you mean '{s}'?",
                    spec.name
                )
            } else {
                let all: Vec<&str> = names.collect();
                format!(
                    "unknown prop '{key}' for {}; expected one of: {}",
                    spec.name,
                    all.join(", ")
                )
            };
            self.err(col, msg);
            return;
        };
        match typed(p.kind, raw) {
            Ok(v) => self.insert(col, p.name, v),
            Err(want) => {
                let msg = format!(
                    "invalid value '{raw}' for {} {}; expected {want}",
                    spec.name, p.name
                );
                self.err(col, msg);
            }
        }
    }

    fn insert(&mut self, col: u32, name: &'static str, v: Value) {
        if self.props.iter().any(|(n, _)| *n == name) {
            let msg = format!("duplicate prop '{name}' for {}", self.spec.name);
            self.err(col, msg);
        } else {
            self.props.push((name, v));
        }
    }

    fn finish(mut self, written: &str, col: u32) -> Node {
        let spec = self.spec;
        if let Some(a) = spec.args.iter().skip(self.next).find(|a| a.required) {
            let msg = format!("missing {}; expected: {}", a.name, signature(spec));
            self.err(col, msg);
        }
        for &(alias, prop, value) in ALIAS_DEFAULTS {
            if alias != written || self.props.iter().any(|(n, _)| *n == prop) {
                continue;
            }
            if let Some(p) = spec.props.iter().find(|p| p.name == prop) {
                if let Ok(v) = typed(p.kind, value) {
                    self.props.push((p.name, v));
                }
            }
        }
        let order = |n: &str| spec.props.iter().position(|p| p.name == n);
        self.props.sort_by_key(|(n, _)| order(n));
        Node {
            spec,
            args: self.args,
            props: self.props,
            text: self.text,
            children: Vec::new(),
            line: self.ln,
        }
    }
}
