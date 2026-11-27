//! `Accept-Language` negotiation against the locales the engine has bundles for.

/// The best of `available` for an `Accept-Language` value: highest `q` first, a tag matching
/// exactly (`de-AT`) or by primary subtag (`de` for `de-AT`, either way); `q=0` and `*` never
/// match. `None` when nothing fits, so the caller keeps the default locale.
pub(crate) fn negotiate(header: &str, available: &[String]) -> Option<String> {
    let mut prefs: Vec<(f32, usize, &str)> = header
        .split(',')
        .enumerate()
        .filter_map(|(i, part)| {
            let mut it = part.split(';');
            let tag = it.next()?.trim();
            let q = it
                .find_map(|p| p.trim().strip_prefix("q=")?.trim().parse::<f32>().ok())
                .unwrap_or(1.0);
            (!tag.is_empty() && tag != "*" && q > 0.0).then_some((q, i, tag))
        })
        .collect();
    // Stable on position among equal q.
    prefs.sort_by(|a, b| b.0.total_cmp(&a.0).then(a.1.cmp(&b.1)));
    let primary = |t: &str| t.split(['-', '_']).next().unwrap_or(t).to_ascii_lowercase();
    for (_, _, tag) in prefs {
        if let Some(l) = available.iter().find(|l| l.eq_ignore_ascii_case(tag)) {
            return Some(l.clone());
        }
        let p = primary(tag);
        if let Some(l) = available.iter().find(|l| primary(l) == p) {
            return Some(l.clone());
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    fn av(v: &[&str]) -> Vec<String> {
        v.iter().map(|s| (*s).to_owned()).collect()
    }

    #[test]
    fn picks_by_q_then_exact_then_primary() {
        let a = av(&["en", "de", "pt-BR"]);
        assert_eq!(
            negotiate("de-AT,de;q=0.9,en;q=0.8", &a).as_deref(),
            Some("de")
        );
        assert_eq!(
            negotiate("fr;q=0.9, en;q=0.5, de;q=0.7", &a).as_deref(),
            Some("de")
        );
        assert_eq!(negotiate("pt", &a).as_deref(), Some("pt-BR"));
        assert_eq!(negotiate("PT-br", &a).as_deref(), Some("pt-BR"));
        assert_eq!(negotiate("de;q=0, en", &a).as_deref(), Some("en"));
        assert_eq!(negotiate("fr, *", &a), None);
        assert_eq!(negotiate("", &a), None);
    }
}
