//! Line tokenizer. Works on `char_indices` so columns count chars and nothing slices
//! through a UTF-8 sequence.

use crate::diag::Diagnostic;

#[derive(Debug, Clone, PartialEq)]
pub(crate) enum Tok {
    Word(String),
    Str(String),
    Prop { key: String, value: String },
}

impl Tok {
    /// Source-like text, for directives that take any token as a plain value.
    pub(crate) fn text(&self) -> String {
        match self {
            Tok::Word(s) | Tok::Str(s) => s.clone(),
            Tok::Prop { key, value } => format!("{key}={value}"),
        }
    }
}

pub(crate) struct Token {
    pub tok: Tok,
    pub col: u32,
    /// Byte offset of the token in the line (always a char boundary).
    pub start: usize,
}

pub(crate) struct Lexed {
    pub tokens: Vec<Token>,
    /// Keyed by byte offset so the parser can drop errors inside a raw `Rows` tail.
    pub errors: Vec<(usize, Diagnostic)>,
}

/// 1-based column from a 0-based char index.
pub(crate) fn col(i: usize) -> u32 {
    u32::try_from(i.saturating_add(1)).unwrap_or(u32::MAX)
}

fn is_space(c: char) -> bool {
    matches!(c, ' ' | '\t' | '\r')
}

/// Tokenizes `chars` (a line's `char_indices`) starting at char index `from`.
pub(crate) fn lex(chars: &[(usize, char)], ln: u32, from: usize) -> Lexed {
    let mut lx = Lexer {
        chars,
        ln,
        i: from,
        out: Lexed {
            tokens: Vec::new(),
            errors: Vec::new(),
        },
    };
    while let Some(c) = lx.peek() {
        if is_space(c) {
            lx.i += 1;
            continue;
        }
        let (at, start) = (lx.i, lx.byte(lx.i));
        let tok = if c == '"' {
            Tok::Str(lx.string())
        } else {
            lx.word()
        };
        lx.out.tokens.push(Token {
            tok,
            col: col(at),
            start,
        });
    }
    lx.out
}

struct Lexer<'a> {
    chars: &'a [(usize, char)],
    ln: u32,
    i: usize,
    out: Lexed,
}

impl Lexer<'_> {
    fn peek(&self) -> Option<char> {
        self.chars.get(self.i).map(|&(_, c)| c)
    }

    fn byte(&self, i: usize) -> usize {
        self.chars.get(i).map_or(usize::MAX, |&(b, _)| b)
    }

    fn err(&mut self, i: usize, msg: impl Into<String>) {
        let d = Diagnostic::new(self.ln, col(i), msg);
        self.out.errors.push((self.byte(i), d));
    }

    /// Bare word, or `key=value` where only the value may be quoted (`label="a b"`).
    fn word(&mut self) -> Tok {
        let mut w = String::new();
        while let Some(c) = self.peek() {
            if is_space(c) {
                break;
            }
            self.i += 1;
            if c == '=' && !w.is_empty() && !w.contains('=') && self.peek() == Some('"') {
                let value = self.string();
                return Tok::Prop { key: w, value };
            }
            w.push(c);
        }
        match w.split_once('=') {
            Some((k, v)) if !k.is_empty() => Tok::Prop {
                key: k.to_string(),
                value: v.to_string(),
            },
            _ => Tok::Word(w),
        }
    }

    /// Called on an opening quote; consumes through the closing one (or end of line).
    fn string(&mut self) -> String {
        let open = self.i;
        self.i += 1;
        let mut s = String::new();
        loop {
            let Some(c) = self.peek() else {
                self.err(open, "unterminated string");
                return s;
            };
            self.i += 1;
            match c {
                '"' => break,
                '\\' => match self.peek() {
                    Some(e @ ('"' | '\\')) => {
                        s.push(e);
                        self.i += 1;
                    }
                    Some(e) => {
                        self.err(self.i - 1, format!("unknown escape '\\{e}'"));
                        s.push('\\');
                    }
                    None => {
                        self.err(open, "unterminated string");
                        return s;
                    }
                },
                c => s.push(c),
            }
        }
        if self.peek().is_some_and(|c| !is_space(c)) {
            self.err(self.i, "expected a space after the closing quote");
            // Skip the glued junk so it does not cascade into more errors.
            while self.peek().is_some_and(|c| !is_space(c)) {
                self.i += 1;
            }
        }
        s
    }
}
