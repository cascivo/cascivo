//! Parser diagnostics and did-you-mean hints.

use std::fmt;

/// One problem in `.cv` source. Columns count chars, 1-based.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Diagnostic {
    pub line: u32,
    pub col: u32,
    pub msg: String,
}

impl Diagnostic {
    pub(crate) fn new(line: u32, col: u32, msg: impl Into<String>) -> Self {
        Self {
            line,
            col,
            msg: msg.into(),
        }
    }
}

impl fmt::Display for Diagnostic {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}:{}: {}", self.line, self.col, self.msg)
    }
}

impl std::error::Error for Diagnostic {}

/// Closest candidate within edit distance 2; ties go to the alphabetically first.
/// Mirrors `catalog::suggest` for lists that are not component names (props, directives).
pub(crate) fn closest<'a>(
    name: &str,
    candidates: impl IntoIterator<Item = &'a str>,
) -> Option<&'a str> {
    let mut best: Option<(usize, &'a str)> = None;
    for cand in candidates {
        let d = levenshtein(name, cand);
        if d <= 2 && best.is_none_or(|(bd, bs)| d < bd || (d == bd && cand < bs)) {
            best = Some((d, cand));
        }
    }
    best.map(|(_, s)| s)
}

fn levenshtein(a: &str, b: &str) -> usize {
    let b: Vec<char> = b.chars().collect();
    let mut prev: Vec<usize> = (0..=b.len()).collect();
    for (i, ca) in a.chars().enumerate() {
        let mut cur = vec![i + 1];
        for (j, &cb) in b.iter().enumerate() {
            let sub = prev[j] + usize::from(ca != cb);
            cur.push(sub.min(prev[j + 1] + 1).min(cur[j] + 1));
        }
        prev = cur;
    }
    prev[b.len()]
}
