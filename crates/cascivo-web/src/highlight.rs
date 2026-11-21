//! `highlight(code, lang)`: a hand-written port of the tokenizer in
//! `packages/components/src/code-snippet/highlight.ts`, producing the `<code>` body that
//! `CodeSnippet` renders for a `language`, so its CSS applies unchanged.
//!
//! Every rule below is the TypeScript regex, anchored at the start of the *remaining* text (the
//! TS slices the string, so `\b` never sees the previous character). `\w`, `\d` and `\b` are
//! ASCII, as in JavaScript. First rule that matches non-empty wins; the rest is plain text.

use cascivo_html::html::esc;

type Rule = (&'static str, fn(&str) -> Option<usize>);

fn is_w(c: char) -> bool {
    c.is_ascii_alphanumeric() || c == '_'
}

/// Byte length of the leading run of chars satisfying `f`.
fn run(s: &str, f: impl Fn(char) -> bool) -> usize {
    s.find(|c| !f(c)).unwrap_or(s.len())
}

fn next_is(s: &str, at: usize, c: char) -> bool {
    s[at..].starts_with(c)
}

fn next_is_word(s: &str, at: usize) -> bool {
    s[at..].chars().next().is_some_and(is_w)
}

/// `"(?:[^"\\]|\\.)*"` (and the `'`/`` ` `` forms): `.` does not match line terminators.
fn quoted(s: &str, q: char) -> Option<usize> {
    let mut it = s.char_indices();
    let (_, first) = it.next()?;
    if first != q {
        return None;
    }
    while let Some((i, c)) = it.next() {
        if c == q {
            return Some(i + c.len_utf8());
        }
        if c == '\\' {
            match it.next() {
                Some((_, n)) if !matches!(n, '\n' | '\r' | '\u{2028}' | '\u{2029}') => {}
                _ => return None,
            }
        }
    }
    None
}

fn string(s: &str) -> Option<usize> {
    quoted(s, '"').or_else(|| quoted(s, '\''))
}

fn string_tpl(s: &str) -> Option<usize> {
    string(s).or_else(|| quoted(s, '`'))
}

/// `//[^\n]*`
fn line_comment(s: &str) -> Option<usize> {
    s.starts_with("//").then(|| s.find('\n').unwrap_or(s.len()))
}

/// `/\*[\s\S]*?\*/`
fn block_comment(s: &str) -> Option<usize> {
    s.strip_prefix("/*")?.find("*/").map(|i| i + 4)
}

fn comment_js(s: &str) -> Option<usize> {
    line_comment(s).or_else(|| block_comment(s))
}

/// `#[^\n]*`
fn comment_hash(s: &str) -> Option<usize> {
    s.starts_with('#').then(|| s.find('\n').unwrap_or(s.len()))
}

/// `\b(?:a|b|…)\b`: the whole word run must be one of the keywords (alternation backtracks past
/// prefixes such as `in` in `interface`).
fn keyword(s: &str, set: &[&str]) -> Option<usize> {
    let n = run(s, is_w);
    (n > 0 && set.contains(&&s[..n])).then_some(n)
}

const BASH_KW: &[&str] = &[
    "npx", "npm", "pnpm", "yarn", "bun", "deno", "node", "git", "cd", "ls", "cat", "echo",
    "export", "sudo", "mkdir", "rm", "cp", "mv", "curl", "wget", "chmod", "source",
];
const JS_KW: &[&str] = &[
    "const",
    "let",
    "var",
    "function",
    "return",
    "if",
    "else",
    "for",
    "while",
    "do",
    "switch",
    "case",
    "break",
    "continue",
    "new",
    "class",
    "extends",
    "super",
    "import",
    "export",
    "from",
    "default",
    "async",
    "await",
    "yield",
    "typeof",
    "instanceof",
    "in",
    "of",
    "void",
    "delete",
    "this",
    "null",
    "true",
    "false",
    "undefined",
];
const TS_EXTRA: &[&str] = &[
    "interface",
    "type",
    "as",
    "readonly",
    "enum",
    "implements",
    "public",
    "private",
    "protected",
    "abstract",
    "namespace",
    "declare",
    "satisfies",
    "keyof",
    "infer",
    "is",
    "string",
    "number",
    "boolean",
    "unknown",
    "never",
    "any",
];

fn bash_keyword(s: &str) -> Option<usize> {
    keyword(s, BASH_KW)
}
fn js_keyword(s: &str) -> Option<usize> {
    keyword(s, JS_KW)
}
fn ts_keyword(s: &str) -> Option<usize> {
    js_keyword(s).or_else(|| keyword(s, TS_EXTRA))
}

/// `\$(?= )`
fn prompt(s: &str) -> Option<usize> {
    s.starts_with("$ ").then_some(1)
}

/// `--?[A-Za-z][\w-]*`
fn flag(s: &str) -> Option<usize> {
    let mut i = s.strip_prefix('-')?;
    let mut n = 1;
    if let Some(r) = i.strip_prefix('-') {
        i = r;
        n += 1;
    }
    i.starts_with(|c: char| c.is_ascii_alphabetic())
        .then(|| n + run(i, |c| is_w(c) || c == '-'))
}

/// `\b\d+(?:\.\d+)?\b`
fn bash_number(s: &str) -> Option<usize> {
    let d = run(s, |c| c.is_ascii_digit());
    if d == 0 {
        return None;
    }
    if next_is(s, d, '.') {
        let f = run(&s[d + 1..], |c| c.is_ascii_digit());
        if f > 0 && !next_is_word(s, d + 1 + f) {
            return Some(d + 1 + f);
        }
    }
    (!next_is_word(s, d)).then_some(d)
}

/// `-?\d*\.?\d+` followed by an optional unit of `[a-z%]+` when `unit`.
fn number(s: &str, unit: bool) -> Option<usize> {
    let i = usize::from(s.starts_with('-'));
    let d1 = run(&s[i..], |c| c.is_ascii_digit());
    let mut end = None;
    if next_is(s, i + d1, '.') {
        let d2 = run(&s[i + d1 + 1..], |c| c.is_ascii_digit());
        if d2 > 0 {
            end = Some(i + d1 + 1 + d2);
        }
    }
    let end = end.or_else(|| (d1 > 0).then_some(i + d1))?;
    Some(if unit {
        end + run(&s[end..], |c| c.is_ascii_lowercase() || c == '%')
    } else {
        end
    })
}

fn js_number(s: &str) -> Option<usize> {
    number(s, false)
}

/// `#[0-9a-fA-F]{3,8}\b|-?\d*\.?\d+(?:[a-z%]+)?`
fn css_number(s: &str) -> Option<usize> {
    if let Some(r) = s.strip_prefix('#') {
        let n = run(r, |c| c.is_ascii_hexdigit());
        return ((3..=8).contains(&n) && !next_is_word(s, 1 + n))
            .then_some(1 + n)
            .or(None);
    }
    number(s, true)
}

/// `@[\w-]+`
fn at_rule(s: &str) -> Option<usize> {
    let n = run(s.strip_prefix('@')?, |c| is_w(c) || c == '-');
    (n > 0).then_some(1 + n)
}

/// `--[\w-]+`
fn custom_prop(s: &str) -> Option<usize> {
    let n = run(s.strip_prefix("--")?, |c| is_w(c) || c == '-');
    (n > 0).then_some(2 + n)
}

/// `[\w-]+(?=\()`
fn css_fn(s: &str) -> Option<usize> {
    let n = run(s, |c| is_w(c) || c == '-');
    (n > 0 && next_is(s, n, '(')).then_some(n)
}

/// `[A-Za-z_$][\w$]*(?=\()`
fn js_fn(s: &str) -> Option<usize> {
    if !s.starts_with(|c: char| c.is_ascii_alphabetic() || c == '_' || c == '$') {
        return None;
    }
    let n = run(s, |c| is_w(c) || c == '$');
    next_is(s, n, '(').then_some(n)
}

fn one_of(s: &str, set: &str) -> Option<usize> {
    s.starts_with(|c| set.contains(c)).then_some(1)
}

fn css_punct(s: &str) -> Option<usize> {
    one_of(s, "{}();:,")
}

/// `[{}()\[\];:,.]|=>`
fn js_punct(s: &str) -> Option<usize> {
    one_of(s, "{}()[];:,.").or_else(|| s.starts_with("=>").then_some(2))
}

const BASH: &[Rule] = &[
    ("comment", comment_hash),
    ("string", string),
    ("prompt", prompt),
    ("keyword", bash_keyword),
    ("variable", flag),
    ("number", bash_number),
];
const CSS: &[Rule] = &[
    ("comment", block_comment),
    ("string", string),
    ("keyword", at_rule),
    ("variable", custom_prop),
    ("fn", css_fn),
    ("number", css_number),
    ("punct", css_punct),
];
const JS: &[Rule] = &[
    ("comment", comment_js),
    ("string", string_tpl),
    ("keyword", js_keyword),
    ("fn", js_fn),
    ("number", js_number),
    ("punct", js_punct),
];
const TS: &[Rule] = &[
    ("comment", comment_js),
    ("string", string_tpl),
    ("keyword", ts_keyword),
    ("fn", js_fn),
    ("number", js_number),
    ("punct", js_punct),
];

/// `(type, text)`; `type` is `text` for unhighlighted runs.
pub fn tokenize<'a>(code: &'a str, lang: &str) -> Result<Vec<(&'static str, &'a str)>, String> {
    let rules = match lang {
        "bash" => BASH,
        "css" => CSS,
        "js" => JS,
        "ts" => TS,
        _ => {
            return Err(format!(
                "highlight: unknown language `{lang}` (bash, css, js, ts)"
            ));
        }
    };
    let mut out = Vec::new();
    let (mut i, mut plain) = (0, None::<usize>);
    while i < code.len() {
        let rest = &code[i..];
        let hit = rules
            .iter()
            .find_map(|(t, f)| f(rest).filter(|n| *n > 0).map(|n| (*t, n)));
        if let Some((t, n)) = hit {
            if let Some(p) = plain.take() {
                out.push(("text", &code[p..i]));
            }
            out.push((t, &rest[..n]));
            i += n;
        } else {
            plain.get_or_insert(i);
            i += rest.chars().next().map_or(1, char::len_utf8);
        }
    }
    if let Some(p) = plain {
        out.push(("text", &code[p..]));
    }
    Ok(out)
}

/// `<code class="…">` + one span per token. `code_class` is CodeSnippet's hashed `code` class.
pub fn render(code: &str, lang: &str, code_class: Option<&str>) -> Result<String, String> {
    let mut s = String::from("<code");
    if let Some(c) = code_class {
        s.push_str(" class=\"");
        esc(&mut s, c);
        s.push('"');
    }
    s.push('>');
    for (t, v) in tokenize(code, lang)? {
        if t == "text" {
            s.push_str("<span>");
        } else {
            s.push_str("<span data-tok=\"");
            s.push_str(t);
            s.push_str("\">");
        }
        esc(&mut s, v);
        s.push_str("</span>");
    }
    s.push_str("</code>");
    Ok(s)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn toks(code: &str, lang: &str) -> Vec<(&'static str, String)> {
        tokenize(code, lang)
            .unwrap()
            .into_iter()
            .map(|(t, v)| (t, v.to_string()))
            .collect()
    }

    fn t(t: &'static str, v: &str) -> (&'static str, String) {
        (t, v.to_string())
    }

    #[test]
    fn bash_prompt_keyword_flag_number() {
        assert_eq!(
            toks("$ npx add -y 3", "bash"),
            [
                t("prompt", "$"),
                t("text", " "),
                t("keyword", "npx"),
                t("text", " add "),
                t("variable", "-y"),
                t("text", " "),
                t("number", "3")
            ]
        );
        // `$` without a following space is plain; `#` runs to end of line; `cdx` is not `cd`.
        assert_eq!(toks("$x cdx", "bash"), [t("text", "$x cdx")]);
        assert_eq!(
            toks("ls # hi\n'a b' 1.5x 2.5", "bash"),
            [
                t("keyword", "ls"),
                t("text", " "),
                t("comment", "# hi"),
                t("text", "\n"),
                t("string", "'a b'"),
                t("text", " "),
                t("number", "1"),
                t("text", ".5x "),
                t("number", "2.5")
            ]
        );
        // The slice loses the previous char, so `-cat` after `foo` is still a flag.
        assert_eq!(
            toks("foo-cat", "bash"),
            [t("text", "foo"), t("variable", "-cat")]
        );
    }

    #[test]
    fn css_tokens() {
        assert_eq!(
            toks("a{color:#fff;margin:-1.5rem}", "css"),
            [
                t("text", "a"),
                t("punct", "{"),
                t("text", "color"),
                t("punct", ":"),
                t("number", "#fff"),
                t("punct", ";"),
                t("text", "margin"),
                t("punct", ":"),
                t("number", "-1.5rem"),
                t("punct", "}")
            ]
        );
        assert_eq!(
            toks("@media (--x: calc(1px)) /* c */ #ggg", "css"),
            [
                t("keyword", "@media"),
                t("text", " "),
                t("punct", "("),
                t("variable", "--x"),
                t("punct", ":"),
                t("text", " "),
                t("fn", "calc"),
                t("punct", "("),
                t("number", "1px"),
                t("punct", ")"),
                t("punct", ")"),
                t("text", " "),
                t("comment", "/* c */"),
                t("text", " #ggg")
            ]
        );
        // Unterminated comment and 9-digit hex are plain.
        assert_eq!(toks("/* x", "css"), [t("text", "/* x")]);
        assert_eq!(
            toks("#123456789", "css"),
            [t("text", "#"), t("number", "123456789")]
        );
    }

    #[test]
    fn js_tokens() {
        assert_eq!(
            toks("const x = fn(1, \"a\"); // hi", "js"),
            [
                t("keyword", "const"),
                t("text", " x = "),
                t("fn", "fn"),
                t("punct", "("),
                t("number", "1"),
                t("punct", ","),
                t("text", " "),
                t("string", "\"a\""),
                t("punct", ")"),
                t("punct", ";"),
                t("text", " "),
                t("comment", "// hi")
            ]
        );
        assert_eq!(
            toks("a.b => `t${1}` if(x)", "js"),
            [
                t("text", "a"),
                t("punct", "."),
                t("text", "b "),
                t("punct", "=>"),
                t("text", " "),
                t("string", "`t${1}`"),
                t("text", " "),
                t("keyword", "if"),
                t("punct", "("),
                t("text", "x"),
                t("punct", ")")
            ]
        );
        // `string` is not a keyword in js; an escaped newline cannot continue a string.
        assert_eq!(toks("string", "js"), [t("text", "string")]);
        assert_eq!(toks("\"a\\\nb\"", "js"), [t("text", "\"a\\\nb\"")]);
    }

    #[test]
    fn ts_adds_keywords() {
        assert_eq!(
            toks("type A = string | number", "ts"),
            [
                t("keyword", "type"),
                t("text", " A = "),
                t("keyword", "string"),
                t("text", " | "),
                t("keyword", "number")
            ]
        );
        assert_eq!(
            toks("interface X", "ts"),
            [t("keyword", "interface"), t("text", " X")]
        );
        assert_eq!(
            toks("instanceof in", "ts"),
            [
                t("keyword", "instanceof"),
                t("text", " "),
                t("keyword", "in")
            ]
        );
    }

    #[test]
    fn non_ascii_is_plain_and_kept_whole() {
        assert_eq!(toks("é→x", "js"), [t("text", "é→x")]);
    }

    #[test]
    fn markup_matches_code_snippet() {
        assert_eq!(
            render("a < \"b\" && 'c'", "js", Some("_code_1")).unwrap(),
            "<code class=\"_code_1\"><span>a &lt; </span><span data-tok=\"string\">&quot;b&quot;</span><span> &amp;&amp; </span><span data-tok=\"string\">&#x27;c&#x27;</span></code>"
        );
        assert_eq!(render("", "js", None).unwrap(), "<code></code>");
        assert!(
            render("x", "py", None)
                .unwrap_err()
                .contains("unknown language")
        );
    }
}
