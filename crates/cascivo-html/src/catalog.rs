//! Component catalog types and lookup. Data lives in `catalog_gen`.

use crate::catalog_gen::CATALOG;

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CompSpec {
    pub name: &'static str,
    pub component: &'static str,
    pub aliases: &'static [&'static str],
    pub args: &'static [ArgSpec],
    pub props: &'static [PropSpec],
    pub children: Children,
    pub client_js: ClientJs,
    pub css: &'static [&'static str],
    pub summary: &'static str,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ArgSpec {
    pub name: &'static str,
    pub kind: ArgKind,
    pub required: bool,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ArgKind {
    Str,
    Num,
    Pairs,
    Nums,
    Rows,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct PropSpec {
    pub name: &'static str,
    pub kind: PropKind,
    pub default: Option<&'static str>,
    pub summary: &'static str,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum PropKind {
    Str,
    Num,
    Bool,
    Enum(&'static [&'static str]),
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Children {
    None,
    Text,
    Nodes,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ClientJs {
    None,
    Enhancement,
    Required,
}

/// Exact match on a component name or any of its aliases.
pub fn lookup(name: &str) -> Option<&'static CompSpec> {
    CATALOG
        .iter()
        .find(|c| c.name == name || c.aliases.contains(&name))
}

/// Closest name or alias within Levenshtein distance 2. Ties go to the
/// alphabetically first candidate. Returns the matched string itself (an
/// alias stays an alias) so the hint is something the author can type as-is.
pub fn suggest(name: &str) -> Option<&'static str> {
    closest(
        name,
        CATALOG
            .iter()
            .flat_map(|c| std::iter::once(c.name).chain(c.aliases.iter().copied())),
    )
}

/// Closest candidate within edit distance 2; ties go to the alphabetically first.
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

/// Char-based edit distance with a rolling row.
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lookup_by_name_and_alias() {
        assert_eq!(lookup("card").map(|c| c.name), Some("card"));
        assert_eq!(lookup("cols").map(|c| c.name), Some("columns"));
        assert_eq!(lookup("row").map(|c| c.name), Some("flex"));
        assert!(lookup("nope").is_none());
    }

    #[test]
    fn suggest_close_names() {
        assert_eq!(suggest("crad"), Some("card"));
        assert_eq!(suggest("zzzzzzz"), None);
    }

    #[test]
    fn suggest_tie_is_alphabetical() {
        // "cow" is 1 from both "col" and "row".
        assert_eq!(suggest("cow"), Some("col"));
    }

    #[test]
    fn catalog_sorted_and_unique() {
        let names: Vec<&str> = CATALOG.iter().map(|c| c.name).collect();
        let mut sorted = names.clone();
        sorted.sort_unstable();
        assert_eq!(names, sorted);

        let mut all: Vec<&str> = CATALOG
            .iter()
            .flat_map(|c| std::iter::once(c.name).chain(c.aliases.iter().copied()))
            .collect();
        let total = all.len();
        all.sort_unstable();
        all.dedup();
        assert_eq!(all.len(), total);
    }
}
