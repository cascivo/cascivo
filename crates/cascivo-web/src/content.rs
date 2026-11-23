//! Content collections: `content/<name>/_schema.toml` plus one Markdown file per entry with
//! `+++`-fenced TOML front matter, validated against the schema.

use std::collections::BTreeMap;
use std::path::Path;

use serde::Deserialize;
use serde::de::DeserializeOwned;

use crate::config::line_of;
use crate::error::{Error, Errors, Result};

#[derive(Debug, Clone, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct Schema {
    #[serde(default)]
    pub fields: BTreeMap<String, Field>,
}

#[derive(Debug, Clone, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct Field {
    #[serde(rename = "type")]
    pub kind: FieldKind,
    #[serde(default)]
    pub required: bool,
}

#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum FieldKind {
    String,
    Int,
    Float,
    Bool,
    /// A TOML date (`2026-01-31`) or a `YYYY-MM-DD` string.
    Date,
    Array,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Entry {
    pub slug: String,
    /// Site-relative source path, for diagnostics.
    pub file: String,
    pub data: toml::Table,
    pub body: String,
    /// 1-based line where `body` starts in `file`.
    pub body_line: u32,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Collection {
    pub name: String,
    pub schema: Schema,
    /// Sorted by slug, so output never depends on directory order.
    pub entries: Vec<Entry>,
    /// Translations: `content/<name>/<locale>/*.md`, keyed by locale, each sorted by slug.
    pub locales: BTreeMap<String, Vec<Entry>>,
}

impl Collection {
    /// Entries' front matter as a typed struct, for Rust callers that want more than the schema.
    pub fn parse_as<T: DeserializeOwned>(&self) -> Result<Vec<T>> {
        let mut out = Vec::new();
        let mut errs = Vec::new();
        for e in &self.entries {
            match e.data.clone().try_into::<T>() {
                Ok(v) => out.push(v),
                Err(err) => errs.push(Error::new(&e.file, Some(1), err.to_string())),
            }
        }
        if errs.is_empty() {
            Ok(out)
        } else {
            Err(Errors(errs))
        }
    }
}

/// A slug is a URL segment and a directory name, so keep it boring: `[a-z0-9-]`, no leading dash.
pub fn valid_slug(s: &str) -> bool {
    !s.is_empty()
        && !s.starts_with('-')
        && s.bytes()
            .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')
}

/// Splits `+++\n<toml>\n+++\n<body>`; returns (front matter, body, body start line).
pub fn split_front_matter(src: &str) -> std::result::Result<(&str, &str, u32), String> {
    let src = src.strip_prefix('\u{feff}').unwrap_or(src);
    let Some(rest) = src
        .strip_prefix("+++\n")
        .or_else(|| src.strip_prefix("+++\r\n"))
    else {
        return Ok(("", src, 1));
    };
    let mut at = 0;
    for line in rest.split_inclusive('\n') {
        if line.trim_end() == "+++" {
            let fm = &rest[..at];
            let body = &rest[at + line.len()..];
            let lines = u32::try_from(fm.lines().count()).unwrap_or(0);
            return Ok((fm, body, lines + 3));
        }
        at += line.len();
    }
    Err("front matter opened with `+++` is never closed".into())
}

fn kind_name(v: &toml::Value) -> &'static str {
    match v {
        toml::Value::String(_) => "string",
        toml::Value::Integer(_) => "int",
        toml::Value::Float(_) => "float",
        toml::Value::Boolean(_) => "bool",
        toml::Value::Datetime(_) => "date",
        toml::Value::Array(_) => "array",
        toml::Value::Table(_) => "table",
    }
}

fn is_iso_date(s: &str) -> bool {
    let b = s.as_bytes();
    b.len() == 10
        && b[4] == b'-'
        && b[7] == b'-'
        && b.iter()
            .enumerate()
            .all(|(i, c)| i == 4 || i == 7 || c.is_ascii_digit())
}

fn matches(kind: FieldKind, v: &toml::Value) -> bool {
    use toml::Value as V;
    match (kind, v) {
        (FieldKind::String, V::String(_))
        | (FieldKind::Int, V::Integer(_))
        | (FieldKind::Float, V::Float(_) | V::Integer(_))
        | (FieldKind::Bool, V::Boolean(_))
        | (FieldKind::Date, V::Datetime(_))
        | (FieldKind::Array, V::Array(_)) => true,
        (FieldKind::Date, V::String(s)) => is_iso_date(s),
        _ => false,
    }
}

/// Front-matter keys every page and entry may set without a schema field.
pub const PAGE_META: &[&str] = &["sitemap", "lastmod"];

/// `sitemap` must be a bool and `lastmod` a date; `None` for any other key or a valid value.
pub fn page_meta_error(name: &str, v: &toml::Value) -> Option<String> {
    let ok = match name {
        "sitemap" => v.is_bool(),
        "lastmod" => matches(FieldKind::Date, v),
        _ => true,
    };
    (!ok).then(|| {
        format!(
            "`{name}`: expected {}",
            if name == "sitemap" {
                "a bool"
            } else {
                "a date"
            }
        )
    })
}

/// Every schema violation in `data`, one message each.
pub fn validate(schema: &Schema, data: &toml::Table) -> Vec<String> {
    let mut out = Vec::new();
    for (name, f) in &schema.fields {
        match data.get(name) {
            None if f.required => out.push(format!("missing required field `{name}`")),
            None => {}
            Some(v) if !matches(f.kind, v) => out.push(format!(
                "field `{name}`: expected {}, found {} `{v}`",
                format!("{:?}", f.kind).to_lowercase(),
                kind_name(v)
            )),
            Some(_) => {}
        }
    }
    for (name, v) in data {
        if schema.fields.contains_key(name) {
            continue;
        }
        if let Some(m) = page_meta_error(name, v) {
            out.push(m);
        } else if !PAGE_META.contains(&name.as_str()) {
            let known: Vec<&str> = schema.fields.keys().map(String::as_str).collect();
            out.push(format!(
                "unknown field `{name}` (schema has: {})",
                known.join(", ")
            ));
        }
    }
    out
}

/// Parses one entry file. `file` is the site-relative path used in diagnostics.
pub fn parse_entry(schema: &Schema, file: &str, slug: &str, src: &str) -> Result<Entry> {
    let (fm, body, body_line) =
        split_front_matter(src).map_err(|m| Errors::one(file, Some(1), m))?;
    let data: toml::Table = toml::from_str(fm).map_err(|e| {
        let line = e.span().map_or(2, |s| line_of(fm, s.start) + 1);
        Errors::one(file, Some(line), e.message().to_string())
    })?;
    let errs: Vec<Error> = validate(schema, &data)
        .into_iter()
        .map(|m| Error::new(file, Some(1), m))
        .collect();
    if !errs.is_empty() {
        return Err(Errors(errs));
    }
    Ok(Entry {
        slug: slug.to_string(),
        file: file.to_string(),
        data,
        body: body.to_string(),
        body_line,
    })
}

fn read(path: &Path, rel: &str) -> Result<String> {
    std::fs::read_to_string(path).map_err(|e| Errors::one(rel, None, e.to_string()))
}

/// Every `*.md` entry directly inside `dir`; `rel` is its site-relative path for diagnostics.
fn load_entries(dir: &Path, rel: &str, schema: &Schema, errs: &mut Vec<Error>) -> Vec<Entry> {
    let mut files: Vec<_> = std::fs::read_dir(dir)
        .map(|r| r.flatten().map(|e| e.path()).collect())
        .unwrap_or_default();
    files.retain(|p| p.is_file() && p.extension().is_some_and(|x| x == "md"));
    files.sort();
    let mut entries = Vec::new();
    for p in files {
        let stem = p
            .file_stem()
            .map(|s| s.to_string_lossy().into_owned())
            .unwrap_or_default();
        let file = format!("{rel}/{stem}.md");
        if !valid_slug(&stem) {
            errs.push(Error::new(
                &file,
                None,
                "file name must be a slug: lowercase a-z, 0-9 and '-'",
            ));
            continue;
        }
        match read(&p, &file).and_then(|src| parse_entry(schema, &file, &stem, &src)) {
            Ok(e) => entries.push(e),
            Err(e) => errs.extend(e.0),
        }
    }
    entries
}

/// Loads every collection under `root/content`. A missing `content/` is no collections.
pub fn load(root: &Path) -> Result<BTreeMap<String, Collection>> {
    let dir = root.join("content");
    let mut out = BTreeMap::new();
    let mut errs = Vec::new();
    let Ok(rd) = std::fs::read_dir(&dir) else {
        return Ok(out);
    };
    let mut dirs: Vec<_> = rd.flatten().filter(|e| e.path().is_dir()).collect();
    dirs.sort_by_key(std::fs::DirEntry::file_name);
    for d in dirs {
        let name = d.file_name().to_string_lossy().into_owned();
        let schema_rel = format!("content/{name}/_schema.toml");
        let schema_src = match read(&d.path().join("_schema.toml"), &schema_rel) {
            Ok(s) => s,
            Err(_) => {
                errs.push(Error::new(
                    &schema_rel,
                    None,
                    "every collection needs a schema file",
                ));
                continue;
            }
        };
        let schema: Schema = match toml::from_str(&schema_src) {
            Ok(s) => s,
            Err(e) => {
                let line = e.span().map(|s| line_of(&schema_src, s.start));
                errs.push(Error::new(&schema_rel, line, e.message().to_string()));
                continue;
            }
        };
        let entries = load_entries(&d.path(), &format!("content/{name}"), &schema, &mut errs);
        // Each subdirectory holds one locale's translations (`content/posts/de/hello.md`).
        let mut locales = BTreeMap::new();
        let mut subs: Vec<_> = std::fs::read_dir(d.path())
            .map(|r| r.flatten().filter(|e| e.path().is_dir()).collect())
            .unwrap_or_default();
        subs.sort_by_key(std::fs::DirEntry::file_name);
        for s in subs {
            let loc = s.file_name().to_string_lossy().into_owned();
            let rel = format!("content/{name}/{loc}");
            locales.insert(loc, load_entries(&s.path(), &rel, &schema, &mut errs));
        }
        out.insert(
            name.clone(),
            Collection {
                name,
                schema,
                entries,
                locales,
            },
        );
    }
    if errs.is_empty() {
        Ok(out)
    } else {
        Err(Errors(errs))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn schema() -> Schema {
        toml::from_str(
            "[fields]\ntitle = { type = \"string\", required = true }\ndate = { type = \"date\" }\ntags = { type = \"array\" }",
        )
        .unwrap()
    }

    #[test]
    fn splits_front_matter_and_counts_body_line() {
        let (fm, body, line) = split_front_matter("+++\na = 1\nb = 2\n+++\n# Hi\n").unwrap();
        assert_eq!((fm, body, line), ("a = 1\nb = 2\n", "# Hi\n", 5));
        assert_eq!(split_front_matter("# no fm").unwrap(), ("", "# no fm", 1));
        assert!(split_front_matter("+++\na=1\n").is_err());
    }

    #[test]
    fn valid_entry() {
        let e = parse_entry(
            &schema(),
            "p.md",
            "p",
            "+++\ntitle = \"T\"\ndate = 2026-01-02\n+++\nbody",
        )
        .unwrap();
        assert_eq!(e.body, "body");
        assert_eq!(e.data["title"].as_str(), Some("T"));
    }

    #[test]
    fn reports_every_violation() {
        let err = parse_entry(
            &schema(),
            "p.md",
            "p",
            "+++\ndate = \"soon\"\ncolour = 1\n+++\n",
        )
        .unwrap_err();
        let s = err.to_string();
        assert!(s.contains("missing required field `title`"), "{s}");
        assert!(
            s.contains("field `date`: expected date, found string"),
            "{s}"
        );
        assert!(s.contains("unknown field `colour`"), "{s}");
    }

    #[test]
    fn sitemap_and_lastmod_need_no_schema_field() {
        let ok = "+++\ntitle = \"T\"\nsitemap = false\nlastmod = 2026-01-02\n+++\n";
        assert!(parse_entry(&schema(), "p.md", "p", ok).is_ok());
        let bad = "+++\ntitle = \"T\"\nsitemap = 1\nlastmod = \"later\"\n+++\n";
        let s = parse_entry(&schema(), "p.md", "p", bad)
            .unwrap_err()
            .to_string();
        assert!(
            s.contains("`sitemap`: expected a bool") && s.contains("`lastmod`: expected a date"),
            "{s}"
        );
    }

    #[test]
    fn toml_syntax_error_points_at_line() {
        let err =
            parse_entry(&schema(), "p.md", "p", "+++\ntitle = \"T\"\nbad bad\n+++\n").unwrap_err();
        assert_eq!(err.0[0].line, Some(3), "{err}");
    }

    #[test]
    fn slugs() {
        assert!(valid_slug("hello-2"));
        for bad in ["", "-a", "A", "a_b", "a.b", ".."] {
            assert!(!valid_slug(bad), "{bad}");
        }
    }

    #[test]
    fn typed_parse() {
        #[derive(Deserialize)]
        struct Post {
            title: String,
        }
        let c = Collection {
            name: "p".into(),
            schema: schema(),
            entries: vec![
                parse_entry(&schema(), "p.md", "p", "+++\ntitle = \"T\"\n+++\n").unwrap(),
            ],
            locales: BTreeMap::new(),
        };
        assert_eq!(c.parse_as::<Post>().unwrap()[0].title, "T");
    }
}
