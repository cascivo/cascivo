//! RSS 2.0 feeds from a content collection, configured in `site.toml`:
//!
//! ```toml
//! [[feeds]]
//! collection = "posts"   # needs a `[posts]` dynamic route for item links
//! path = "rss.xml"       # default
//! title = "Blog"         # default: site title
//! description = "…"      # default: empty
//! limit = 20             # default: newest 20
//! ```
//!
//! Items read `title` and `date` (required) and `description` (optional) from front matter.
//! Output is a pure function of the sources: `lastBuildDate` is the newest item, not the clock.

use serde::{Deserialize, Serialize};

use crate::config::Config;
use crate::content::Collection;
use crate::error::{Error, Errors, Result};
use crate::routes::{Kind, Route};

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct Feed {
    pub collection: String,
    #[serde(default = "path")]
    pub path: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(default = "limit")]
    pub limit: usize,
}

fn path() -> String {
    "rss.xml".into()
}

fn limit() -> usize {
    20
}

/// `YYYY-MM-DD…` → (y, m, d).
fn ymd(s: &str) -> Option<(i64, u32, u32)> {
    let y = s.get(..4)?.parse().ok()?;
    let m = s.get(5..7)?.parse().ok()?;
    let d = s.get(8..10)?.parse().ok()?;
    (s.as_bytes().get(4) == Some(&b'-') && (1..=12).contains(&m) && (1..=31).contains(&d))
        .then_some((y, m, d))
}

/// RFC 822 date at midnight UTC, as RSS `pubDate` wants.
pub fn rfc822(iso: &str) -> Option<String> {
    const DAYS: [&str; 7] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const MONTHS: [&str; 12] = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    let (y, m, d) = ymd(iso)?;
    // Sakamoto's day-of-week.
    const T: [i64; 12] = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
    let yy = if m < 3 { y - 1 } else { y };
    let mi = usize::try_from(m - 1).ok()?;
    let dow = (yy + yy / 4 - yy / 100 + yy / 400 + T[mi] + i64::from(d)).rem_euclid(7);
    Some(format!(
        "{}, {d:02} {} {y:04} 00:00:00 GMT",
        DAYS[usize::try_from(dow).ok()?],
        MONTHS[mi]
    ))
}

fn esc(s: &str) -> String {
    let mut o = String::new();
    cascivo_html::html::esc(&mut o, s);
    o
}

/// Renders one feed. `prefix` is the locale URL prefix (`/de`) or empty.
pub fn render(
    cfg: &Config,
    feed: &Feed,
    coll: Option<&Collection>,
    routes: &[Route],
    prefix: &str,
) -> Result<String> {
    let at = "site.toml";
    let err = |m: String| Errors::one(at, None, format!("[[feeds]] `{}`: {m}", feed.collection));
    if cfg.base_url.is_empty() {
        return Err(err("feeds need `base_url` for absolute links".into()));
    }
    let coll = coll.ok_or_else(|| err("no such collection under content/".into()))?;
    let route = routes
        .iter()
        .find(|r| r.kind == Kind::Dynamic(feed.collection.clone()))
        .ok_or_else(|| {
            err(format!(
                "no dynamic route; add pages/…/[{}].html for item links",
                feed.collection
            ))
        })?;
    let base = cfg.base_url.trim_end_matches('/');
    let mut items = Vec::new();
    let mut errs = Vec::new();
    for e in &coll.entries {
        let title = e.data.get("title").and_then(toml::Value::as_str);
        let date = e.data.get("date").map(|d| match d {
            toml::Value::String(s) => s.clone(),
            v => v.to_string(),
        });
        let date = date
            .as_deref()
            .and_then(|d| rfc822(d).map(|r| (d[..10].to_string(), r)));
        match (title, date) {
            (Some(t), Some((iso, pub_date))) => items.push((iso, t, pub_date, e)),
            _ => errs.push(Error::new(
                &e.file,
                Some(1),
                "feed items need a string `title` and a `date`",
            )),
        }
    }
    if !errs.is_empty() {
        return Err(Errors(errs));
    }
    // Newest first; slug breaks ties so equal dates stay deterministic.
    items.sort_by(|a, b| b.0.cmp(&a.0).then_with(|| a.3.slug.cmp(&b.3.slug)));
    items.truncate(feed.limit);
    let home = format!("{base}{}", cfg.url(&format!("{prefix}/")));
    let self_url = format!("{base}{prefix}/{}", feed.path);
    let mut s = String::from(
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<rss version=\"2.0\" xmlns:atom=\"http://www.w3.org/2005/Atom\">\n<channel>\n",
    );
    let title = feed.title.as_deref().unwrap_or(&cfg.title);
    s += &format!("  <title>{}</title>\n", esc(title));
    s += &format!("  <link>{}</link>\n", esc(&home));
    s += &format!(
        "  <description>{}</description>\n",
        esc(feed.description.as_deref().unwrap_or(""))
    );
    s += &format!("  <language>{}</language>\n", esc(&cfg.lang));
    s += &format!(
        "  <atom:link href=\"{}\" rel=\"self\" type=\"application/rss+xml\"/>\n",
        esc(&self_url)
    );
    if let Some((_, _, d, _)) = items.first() {
        s += &format!("  <lastBuildDate>{d}</lastBuildDate>\n");
    }
    for (_, t, d, e) in &items {
        let link = format!("{base}{}", cfg.url(&route.entry_url(&e.slug)));
        s += "  <item>\n";
        s += &format!("    <title>{}</title>\n", esc(t));
        s += &format!("    <link>{}</link>\n", esc(&link));
        s += &format!("    <guid isPermaLink=\"true\">{}</guid>\n", esc(&link));
        s += &format!("    <pubDate>{d}</pubDate>\n");
        if let Some(desc) = e.data.get("description").and_then(toml::Value::as_str) {
            s += &format!("    <description>{}</description>\n", esc(desc));
        }
        s += "  </item>\n";
    }
    s += "</channel>\n</rss>\n";
    Ok(s)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::content::{Schema, parse_entry};
    use crate::routes::route_for;

    fn coll() -> Collection {
        let schema: Schema = toml::from_str(
            "[fields]\ntitle = { type = \"string\" }\ndate = { type = \"date\" }\ndescription = { type = \"string\" }",
        )
        .unwrap();
        let e = |slug: &str, fm: &str| {
            parse_entry(
                &schema,
                &format!("{slug}.md"),
                slug,
                &format!("+++\n{fm}\n+++\n"),
            )
            .unwrap()
        };
        Collection {
            name: "posts".into(),
            entries: vec![
                e(
                    "a",
                    "title = \"A & B\"\ndate = 2026-01-02\ndescription = \"<x>\"",
                ),
                e("b", "title = \"B\"\ndate = \"2026-11-21\""),
                e("c", "title = \"C\"\ndate = 2025-06-30"),
            ],
            schema,
            locales: Default::default(),
        }
    }

    fn cfg() -> Config {
        Config::parse("title = \"Site\"\nbase_url = \"https://x.dev/\"").unwrap()
    }

    fn feed(limit: usize) -> Feed {
        Feed {
            collection: "posts".into(),
            path: path(),
            title: None,
            description: None,
            limit,
        }
    }

    #[test]
    fn rfc822_dates() {
        assert_eq!(
            rfc822("2026-11-21").unwrap(),
            "Sat, 21 Nov 2026 00:00:00 GMT"
        );
        assert_eq!(
            rfc822("2000-02-29").unwrap(),
            "Tue, 29 Feb 2000 00:00:00 GMT"
        );
        assert_eq!(
            rfc822("2024-01-01").unwrap(),
            "Mon, 01 Jan 2024 00:00:00 GMT"
        );
        assert!(rfc822("soon").is_none() && rfc822("2026-13-01").is_none());
    }

    #[test]
    fn newest_first_escaped_absolute_and_limited() {
        let routes = [route_for("blog/[posts].html").unwrap()];
        let x = render(&cfg(), &feed(2), Some(&coll()), &routes, "").unwrap();
        let b = x.find("<title>B</title>").unwrap();
        let a = x.find("<title>A &amp; B</title>").unwrap();
        assert!(b < a, "{x}");
        assert!(!x.contains("<title>C</title>"), "limit: {x}");
        assert!(x.contains("<link>https://x.dev/blog/a/</link>"), "{x}");
        assert!(x.contains("<description>&lt;x&gt;</description>"), "{x}");
        assert!(x.contains("<lastBuildDate>Sat, 21 Nov 2026 00:00:00 GMT</lastBuildDate>"));
        assert!(
            x.contains("href=\"https://x.dev/rss.xml\" rel=\"self\""),
            "{x}"
        );
    }

    #[test]
    fn locale_prefix_moves_home_and_self() {
        let routes = [route_for("de/blog/[posts].html").unwrap()];
        let x = render(&cfg(), &feed(20), Some(&coll()), &routes, "/de").unwrap();
        assert!(x.contains("<link>https://x.dev/de/</link>"), "{x}");
        assert!(x.contains("https://x.dev/de/rss.xml"), "{x}");
        assert!(x.contains("https://x.dev/de/blog/a/"), "{x}");
    }

    #[test]
    fn explains_missing_pieces() {
        let routes = [route_for("blog/[posts].html").unwrap()];
        let mut c = cfg();
        c.base_url.clear();
        let e = render(&c, &feed(20), Some(&coll()), &routes, "").unwrap_err();
        assert!(e.to_string().contains("base_url"), "{e}");
        let e = render(&cfg(), &feed(20), Some(&coll()), &[], "").unwrap_err();
        assert!(e.to_string().contains("[posts].html"), "{e}");
        let e = render(&cfg(), &feed(20), None, &routes, "").unwrap_err();
        assert!(e.to_string().contains("no such collection"), "{e}");
    }
}
