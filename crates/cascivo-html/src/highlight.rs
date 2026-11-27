//! Tiny dependency-free syntax tokenizer, a port of
//! `packages/components/src/code-snippet/highlight.ts`.
//!
//! Same algorithm as the TS: a single left-to-right scan, the first matching rule wins,
//! anything unmatched accumulates into a plain run. The TS rules are anchored regexes; each is
//! hand-written here with the same backtracking outcome (see the notes on the matchers).

type Matcher = fn(&[char]) -> usize;

const JS_KEYWORDS: &[&str] = &[
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
const TS_EXTRA_KEYWORDS: &[&str] = &[
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
const BASH_KEYWORDS: &[&str] = &[
    "npx", "npm", "pnpm", "yarn", "bun", "deno", "node", "git", "cd", "ls", "cat", "echo",
    "export", "sudo", "mkdir", "rm", "cp", "mv", "curl", "wget", "chmod", "source",
];

/// JS `\w`.
fn is_word(c: char) -> bool {
    c.is_ascii_alphanumeric() || c == '_'
}

/// JS `.` does not match these.
fn is_line_terminator(c: char) -> bool {
    matches!(c, '\n' | '\r' | '\u{2028}' | '\u{2029}')
}

/// `q(?:[^q\\]|\\.)*q`. Deterministic: the first unescaped `q` closes; an unterminated string or
/// a backslash before a line terminator / end fails the whole match (the regex backtracks to
/// nothing).
fn quoted(s: &[char], q: char) -> usize {
    if s.first() != Some(&q) {
        return 0;
    }
    let mut i = 1;
    while i < s.len() {
        let c = s[i];
        if c == '\\' {
            match s.get(i + 1) {
                Some(&n) if !is_line_terminator(n) => i += 2,
                _ => return 0,
            }
        } else if c == q {
            return i + 1;
        } else {
            i += 1;
        }
    }
    0
}

fn string_dq_sq(s: &[char]) -> usize {
    let n = quoted(s, '"');
    if n > 0 { n } else { quoted(s, '\'') }
}

fn string_with_template(s: &[char]) -> usize {
    let n = string_dq_sq(s);
    if n > 0 { n } else { quoted(s, '`') }
}

/// `#[^\n]*`
fn hash_comment(s: &[char]) -> usize {
    if s.first() != Some(&'#') {
        return 0;
    }
    line_len(s)
}

/// Length up to (excluding) the next `\n`.
fn line_len(s: &[char]) -> usize {
    s.iter().position(|&c| c == '\n').unwrap_or(s.len())
}

/// `/\*[\s\S]*?\*/`
fn block_comment(s: &[char]) -> usize {
    if !(s.len() >= 2 && s[0] == '/' && s[1] == '*') {
        return 0;
    }
    let mut j = 2;
    while j + 1 < s.len() {
        if s[j] == '*' && s[j + 1] == '/' {
            return j + 2;
        }
        j += 1;
    }
    0
}

/// `//[^\n]*|/\*[\s\S]*?\*/`
fn js_comment(s: &[char]) -> usize {
    if s.len() >= 2 && s[0] == '/' && s[1] == '/' {
        return line_len(s);
    }
    block_comment(s)
}

/// `\$(?= )`: only the `$` is consumed.
fn bash_prompt(s: &[char]) -> usize {
    usize::from(s.first() == Some(&'$') && s.get(1) == Some(&' '))
}

/// `\b(?:kw|...)\b`. The leading `\b` always holds (keywords start with a word char and the TS
/// slices the input, so nothing precedes it); the trailing one needs a non-word char or the end.
fn keyword(s: &[char], words: &[&[&str]]) -> usize {
    for list in words {
        for kw in *list {
            let n = kw.chars().count();
            if s.len() >= n
                && kw.chars().zip(s.iter()).all(|(a, &b)| a == b)
                && s.get(n).is_none_or(|&c| !is_word(c))
            {
                return n;
            }
        }
    }
    0
}

fn bash_keyword(s: &[char]) -> usize {
    keyword(s, &[BASH_KEYWORDS])
}
fn js_keyword(s: &[char]) -> usize {
    keyword(s, &[JS_KEYWORDS])
}
fn ts_keyword(s: &[char]) -> usize {
    keyword(s, &[JS_KEYWORDS, TS_EXTRA_KEYWORDS])
}

/// `--?[A-Za-z][\w-]*`
fn bash_variable(s: &[char]) -> usize {
    if s.first() != Some(&'-') {
        return 0;
    }
    let i = if s.get(1) == Some(&'-') { 2 } else { 1 };
    if !s.get(i).is_some_and(char::is_ascii_alphabetic) {
        return 0;
    }
    let mut j = i + 1;
    while j < s.len() && (is_word(s[j]) || s[j] == '-') {
        j += 1;
    }
    j
}

fn digits(s: &[char]) -> usize {
    s.iter().take_while(|c| c.is_ascii_digit()).count()
}

/// `\b\d+(?:\.\d+)?\b`. The only candidate ends are the full fraction or the full integer (a
/// shorter run is followed by a digit, so there is no boundary there).
fn bash_number(s: &[char]) -> usize {
    let int = digits(s);
    if int == 0 {
        return 0;
    }
    let boundary = |at: usize| s.get(at).is_none_or(|&c| !is_word(c));
    if s.get(int) == Some(&'.') {
        let frac = digits(&s[int + 1..]);
        if frac > 0 && boundary(int + 1 + frac) {
            return int + 1 + frac;
        }
    }
    if boundary(int) { int } else { 0 }
}

/// `-?\d*\.?\d+`: digits, or digits `.` digits, or `.` digits, with an optional leading `-`.
fn decimal(s: &[char]) -> usize {
    let start = usize::from(s.first() == Some(&'-'));
    let int = digits(&s[start..]);
    let p = start + int;
    if s.get(p) == Some(&'.') {
        let frac = digits(&s[p + 1..]);
        if frac > 0 {
            return p + 1 + frac;
        }
    }
    if int > 0 { p } else { 0 }
}

/// `#[0-9a-fA-F]{3,8}\b|-?\d*\.?\d+(?:[a-z%]+)?`
fn css_number(s: &[char]) -> usize {
    if s.first() == Some(&'#') {
        let hex = s[1..].iter().take_while(|c| c.is_ascii_hexdigit()).count();
        let k = hex.min(8);
        // Boundary after the run: only the maximal run can sit next to a non-word char.
        if k >= 3 && s.get(1 + k).is_none_or(|&c| !is_word(c)) {
            return 1 + k;
        }
        return 0;
    }
    let n = decimal(s);
    if n == 0 {
        return 0;
    }
    n + s[n..]
        .iter()
        .take_while(|&&c| c.is_ascii_lowercase() || c == '%')
        .count()
}

fn js_number(s: &[char]) -> usize {
    decimal(s)
}

/// `@[\w-]+`
fn css_at_keyword(s: &[char]) -> usize {
    if s.first() != Some(&'@') {
        return 0;
    }
    let run = s[1..]
        .iter()
        .take_while(|&&c| is_word(c) || c == '-')
        .count();
    if run == 0 { 0 } else { 1 + run }
}

/// `--[\w-]+`
fn css_variable(s: &[char]) -> usize {
    if !(s.len() >= 2 && s[0] == '-' && s[1] == '-') {
        return 0;
    }
    let run = s[2..]
        .iter()
        .take_while(|&&c| is_word(c) || c == '-')
        .count();
    if run == 0 { 0 } else { 2 + run }
}

/// `[\w-]+(?=\()`
fn css_fn(s: &[char]) -> usize {
    let run = s.iter().take_while(|&&c| is_word(c) || c == '-').count();
    if run > 0 && s.get(run) == Some(&'(') {
        run
    } else {
        0
    }
}

/// `[A-Za-z_$][\w$]*(?=\()`
fn js_fn(s: &[char]) -> usize {
    if !s
        .first()
        .is_some_and(|&c| c.is_ascii_alphabetic() || c == '_' || c == '$')
    {
        return 0;
    }
    let run = s.iter().take_while(|&&c| is_word(c) || c == '$').count();
    if s.get(run) == Some(&'(') { run } else { 0 }
}

/// `[{}();:,]`
fn css_punct(s: &[char]) -> usize {
    usize::from(s.first().is_some_and(|c| "{}();:,".contains(*c)))
}

/// `[{}()\[\];:,.]|=>`
fn js_punct(s: &[char]) -> usize {
    if s.first().is_some_and(|c| "{}()[];:,.".contains(*c)) {
        1
    } else if s.len() >= 2 && s[0] == '=' && s[1] == '>' {
        2
    } else {
        0
    }
}

fn rules(lang: &str) -> Option<Vec<(&'static str, Matcher)>> {
    Some(match lang {
        "bash" => vec![
            ("comment", hash_comment as Matcher),
            ("string", string_dq_sq),
            ("prompt", bash_prompt),
            ("keyword", bash_keyword),
            ("variable", bash_variable),
            ("number", bash_number),
        ],
        "css" => vec![
            ("comment", block_comment as Matcher),
            ("string", string_dq_sq),
            ("keyword", css_at_keyword),
            ("variable", css_variable),
            ("fn", css_fn),
            ("number", css_number),
            ("punct", css_punct),
        ],
        "js" => vec![
            ("comment", js_comment as Matcher),
            ("string", string_with_template),
            ("keyword", js_keyword),
            ("fn", js_fn),
            ("number", js_number),
            ("punct", js_punct),
        ],
        "ts" => vec![
            ("comment", js_comment as Matcher),
            ("string", string_with_template),
            ("keyword", ts_keyword),
            ("fn", js_fn),
            ("number", js_number),
            ("punct", js_punct),
        ],
        _ => return None,
    })
}

/// Tokenize `code`; `None` is a plain `text` run, `Some(t)` a `data-tok` type. Unknown `lang`
/// yields one plain token (none for empty input, like the TS).
pub fn tokenize(code: &str, lang: &str) -> Vec<(Option<&'static str>, String)> {
    let mut tokens = Vec::new();
    let Some(rules) = rules(lang) else {
        if !code.is_empty() {
            tokens.push((None, code.to_string()));
        }
        return tokens;
    };
    let chars: Vec<char> = code.chars().collect();
    let mut pos = 0;
    let mut plain = String::new();
    while pos < chars.len() {
        let rest = &chars[pos..];
        let hit = rules.iter().find_map(|&(ty, m)| {
            let n = m(rest);
            (n > 0).then_some((ty, n))
        });
        match hit {
            Some((ty, n)) => {
                if !plain.is_empty() {
                    tokens.push((None, std::mem::take(&mut plain)));
                }
                tokens.push((Some(ty), rest[..n].iter().collect()));
                pos += n;
            }
            None => {
                plain.push(chars[pos]);
                pos += 1;
            }
        }
    }
    if !plain.is_empty() {
        tokens.push((None, plain));
    }
    tokens
}

#[cfg(test)]
mod tests {
    use super::*;

    fn check(code: &str, lang: &str, expected: &[(Option<&str>, &str)]) {
        let got = tokenize(code, lang);
        let got: Vec<(Option<&str>, &str)> = got.iter().map(|(t, v)| (*t, v.as_str())).collect();
        assert_eq!(got, expected, "{lang}: {code:?}");
    }

    #[test]
    fn matches_ts_tokenizer() {
        check(
            "$ pnpm add -D cascivo --save # install\necho \"hi $x\" 12.5x 3.14 42abc",
            "bash",
            &[
                (Some("prompt"), "$"),
                (None, " "),
                (Some("keyword"), "pnpm"),
                (None, " add "),
                (Some("variable"), "-D"),
                (None, " cascivo "),
                (Some("variable"), "--save"),
                (None, " "),
                (Some("comment"), "# install"),
                (None, "\n"),
                (Some("keyword"), "echo"),
                (None, " "),
                (Some("string"), "\"hi $x\""),
                (None, " "),
                (Some("number"), "12"),
                (None, ".5x "),
                (Some("number"), "3.14"),
                (None, " 42abc"),
            ],
        );
        check(
            "git commit -m 'a\\'b' --no-verify\nnode-foo 7",
            "bash",
            &[
                (Some("keyword"), "git"),
                (None, " commit "),
                (Some("variable"), "-m"),
                (None, " "),
                (Some("string"), "'a\\'b'"),
                (None, " "),
                (Some("variable"), "--no-verify"),
                (None, "\n"),
                (Some("keyword"), "node"),
                (Some("variable"), "-foo"),
                (None, " "),
                (Some("number"), "7"),
            ],
        );
        check(
            "unterminated \"str and $x",
            "bash",
            &[(None, "unterminated \"str and $x")],
        );
        check(
            "$x $ cd",
            "bash",
            &[
                (None, "$x "),
                (Some("prompt"), "$"),
                (None, " "),
                (Some("keyword"), "cd"),
            ],
        );
        check(
            "@media (min-width: 40rem) {\n  .a { color: #fff; margin: -1.5rem 0 .5em; width: calc(100% - 2px); --x: var(--y); }\n}",
            "css",
            &[
                (Some("keyword"), "@media"),
                (None, " "),
                (Some("punct"), "("),
                (None, "min-width"),
                (Some("punct"), ":"),
                (None, " "),
                (Some("number"), "40rem"),
                (Some("punct"), ")"),
                (None, " "),
                (Some("punct"), "{"),
                (None, "\n  .a "),
                (Some("punct"), "{"),
                (None, " color"),
                (Some("punct"), ":"),
                (None, " "),
                (Some("number"), "#fff"),
                (Some("punct"), ";"),
                (None, " margin"),
                (Some("punct"), ":"),
                (None, " "),
                (Some("number"), "-1.5rem"),
                (None, " "),
                (Some("number"), "0"),
                (None, " "),
                (Some("number"), ".5em"),
                (Some("punct"), ";"),
                (None, " width"),
                (Some("punct"), ":"),
                (None, " "),
                (Some("fn"), "calc"),
                (Some("punct"), "("),
                (Some("number"), "100%"),
                (None, " - "),
                (Some("number"), "2px"),
                (Some("punct"), ")"),
                (Some("punct"), ";"),
                (None, " "),
                (Some("variable"), "--x"),
                (Some("punct"), ":"),
                (None, " "),
                (Some("fn"), "var"),
                (Some("punct"), "("),
                (Some("variable"), "--y"),
                (Some("punct"), ")"),
                (Some("punct"), ";"),
                (None, " "),
                (Some("punct"), "}"),
                (None, "\n"),
                (Some("punct"), "}"),
            ],
        );
        check(
            "/* c */ a::before{content:\"x\\\"y\"} #abcdefg #abc 10px 1e3 -webkit-box(1) /* open",
            "css",
            &[
                (Some("comment"), "/* c */"),
                (None, " a"),
                (Some("punct"), ":"),
                (Some("punct"), ":"),
                (None, "before"),
                (Some("punct"), "{"),
                (None, "content"),
                (Some("punct"), ":"),
                (Some("string"), "\"x\\\"y\""),
                (Some("punct"), "}"),
                (None, " #abcdefg "),
                (Some("number"), "#abc"),
                (None, " "),
                (Some("number"), "10px"),
                (None, " "),
                (Some("number"), "1e"),
                (Some("number"), "3"),
                (None, " "),
                (Some("fn"), "-webkit-box"),
                (Some("punct"), "("),
                (Some("number"), "1"),
                (Some("punct"), ")"),
                (None, " /* open"),
            ],
        );
        check(
            ".5 -.5% 1. 2.x",
            "css",
            &[
                (Some("number"), ".5"),
                (None, " "),
                (Some("number"), "-.5%"),
                (None, " "),
                (Some("number"), "1"),
                (None, ". "),
                (Some("number"), "2"),
                (None, ".x"),
            ],
        );
        check(
            "const a = (b) => b.c(1.5, \"s\", `t\\`${x}`); // end\n/* m */ let n = -3",
            "js",
            &[
                (Some("keyword"), "const"),
                (None, " a = "),
                (Some("punct"), "("),
                (None, "b"),
                (Some("punct"), ")"),
                (None, " "),
                (Some("punct"), "=>"),
                (None, " b"),
                (Some("punct"), "."),
                (Some("fn"), "c"),
                (Some("punct"), "("),
                (Some("number"), "1.5"),
                (Some("punct"), ","),
                (None, " "),
                (Some("string"), "\"s\""),
                (Some("punct"), ","),
                (None, " "),
                (Some("string"), "`t\\`${x}`"),
                (Some("punct"), ")"),
                (Some("punct"), ";"),
                (None, " "),
                (Some("comment"), "// end"),
                (None, "\n"),
                (Some("comment"), "/* m */"),
                (None, " "),
                (Some("keyword"), "let"),
                (None, " n = "),
                (Some("number"), "-3"),
            ],
        );
        check(
            "async function f$1(x){ return this$y instanceof Foo; in important }",
            "js",
            &[
                (Some("keyword"), "async"),
                (None, " "),
                (Some("keyword"), "function"),
                (None, " "),
                (Some("fn"), "f$1"),
                (Some("punct"), "("),
                (None, "x"),
                (Some("punct"), ")"),
                (Some("punct"), "{"),
                (None, " "),
                (Some("keyword"), "return"),
                (None, " "),
                (Some("keyword"), "this"),
                (None, "$y "),
                (Some("keyword"), "instanceof"),
                (None, " Foo"),
                (Some("punct"), ";"),
                (None, " "),
                (Some("keyword"), "in"),
                (None, " important "),
                (Some("punct"), "}"),
            ],
        );
        check(
            "x = 'abc\nyes' + 'un",
            "js",
            &[
                (None, "x = "),
                (Some("string"), "'abc\nyes'"),
                (None, " + 'un"),
            ],
        );
        check(
            "interface A { x: string; y?: number }\nconst v = foo<string>(1) as any",
            "ts",
            &[
                (Some("keyword"), "interface"),
                (None, " A "),
                (Some("punct"), "{"),
                (None, " x"),
                (Some("punct"), ":"),
                (None, " "),
                (Some("keyword"), "string"),
                (Some("punct"), ";"),
                (None, " y?"),
                (Some("punct"), ":"),
                (None, " "),
                (Some("keyword"), "number"),
                (None, " "),
                (Some("punct"), "}"),
                (None, "\n"),
                (Some("keyword"), "const"),
                (None, " v = foo<"),
                (Some("keyword"), "string"),
                (None, ">"),
                (Some("punct"), "("),
                (Some("number"), "1"),
                (Some("punct"), ")"),
                (None, " "),
                (Some("keyword"), "as"),
                (None, " "),
                (Some("keyword"), "any"),
            ],
        );
        check(
            "type T = keyof typeof x satisfies is; isnt a1",
            "ts",
            &[
                (Some("keyword"), "type"),
                (None, " T = "),
                (Some("keyword"), "keyof"),
                (None, " "),
                (Some("keyword"), "typeof"),
                (None, " x "),
                (Some("keyword"), "satisfies"),
                (None, " "),
                (Some("keyword"), "is"),
                (Some("punct"), ";"),
                (None, " isnt a"),
                (Some("number"), "1"),
            ],
        );
        check(
            "é ünï \"ß\" 日本 `a\nb` => 0.1.2",
            "ts",
            &[
                (None, "é ünï "),
                (Some("string"), "\"ß\""),
                (None, " 日本 "),
                (Some("string"), "`a\nb`"),
                (None, " "),
                (Some("punct"), "=>"),
                (None, " "),
                (Some("number"), "0.1"),
                (Some("number"), ".2"),
            ],
        );
        check("abc", "xx", &[(None, "abc")]);
        assert!(tokenize("", "js").is_empty());
    }
}
