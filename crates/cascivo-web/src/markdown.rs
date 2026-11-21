//! Markdown → HTML with cascivo components: a ` ```cv ` fence holds `.cv` text, and a line
//! `::name[text]{key=value flag}` is one component. Both render through cascivo-html.

use std::collections::BTreeSet;

use pulldown_cmark::{CodeBlockKind, Event, Options, Parser, Tag, TagEnd, html};

use crate::config::line_of;
use crate::error::{Error, Errors, Result};

/// HTML plus the cascivo CSS units and scripts it needs.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct Rendered {
    pub html: String,
    pub used: BTreeSet<&'static str>,
    pub scripts: BTreeSet<&'static str>,
}

impl Rendered {
    pub fn absorb(&mut self, f: cascivo_html::Fragment) -> String {
        self.used.extend(f.used);
        self.scripts.extend(f.scripts);
        f.html
    }
}

/// Renders `.cv` text; diagnostics are shifted to `first_line` of `file`.
pub fn cv(src: &str, file: &str, first_line: u32, out: &mut Rendered) -> Result<String> {
    cascivo_html::render_parts(src, &cascivo_html::Options::default())
        .map(|f| out.absorb(f))
        .map_err(|ds| {
            Errors(
                ds.into_iter()
                    .map(|d| Error::new(file, Some(first_line + d.line.saturating_sub(1)), d.msg))
                    .collect(),
            )
        })
}

fn quote(s: &str) -> String {
    format!("\"{}\"", s.replace('\\', "\\\\").replace('"', "\\\""))
}

/// `{a=1 b="x y" flag}` → pairs; a bare word has no value.
fn attrs(s: &str) -> std::result::Result<Vec<(String, Option<String>)>, String> {
    let mut out = Vec::new();
    let mut it = s.chars().peekable();
    loop {
        while it.next_if(|c| c.is_whitespace()).is_some() {}
        let Some(&c) = it.peek() else { break };
        if c == '"' || c == '=' {
            return Err(format!("unexpected `{c}` in attributes"));
        }
        let mut key = String::new();
        while let Some(c) = it.next_if(|c| !c.is_whitespace() && *c != '=') {
            key.push(c);
        }
        if it.next_if_eq(&'=').is_none() {
            out.push((key, None));
            continue;
        }
        let mut val = String::new();
        if it.next_if_eq(&'"').is_some() {
            loop {
                match it.next() {
                    Some('"') => break,
                    Some('\\') => val.extend(it.next()),
                    Some(c) => val.push(c),
                    None => return Err(format!("unterminated quote in `{key}`")),
                }
            }
        } else {
            while let Some(c) = it.next_if(|c| !c.is_whitespace()) {
                val.push(c);
            }
        }
        out.push((key, Some(val)));
    }
    Ok(out)
}

/// `::card[Body]{title=Hi variant=outline}` → `card "Hi" variant="outline" "Body"`. Attributes
/// named like a positional argument fill it, so authors need not know argument order.
pub fn directive_to_cv(line: &str) -> std::result::Result<String, String> {
    let rest = line
        .trim_end()
        .strip_prefix("::")
        .ok_or("not a directive")?;
    let name_end = rest
        .find(|c: char| !(c.is_ascii_alphanumeric() || c == '-'))
        .unwrap_or(rest.len());
    let (name, mut rest) = rest.split_at(name_end);
    let spec = cascivo_html::lookup(name).ok_or_else(|| {
        let hint = cascivo_html::suggest(name)
            .map(|s| format!(" (did you mean `{s}`?)"))
            .unwrap_or_default();
        format!("unknown component `{name}`{hint}")
    })?;
    let mut text = None;
    if let Some(r) = rest.strip_prefix('[') {
        let end = r.find(']').ok_or("`[` is never closed")?;
        text = Some(&r[..end]);
        rest = &r[end + 1..];
    }
    let mut pairs = Vec::new();
    if let Some(r) = rest.strip_prefix('{') {
        let r = r
            .strip_suffix('}')
            .ok_or("`{` is never closed at end of line")?;
        pairs = attrs(r)?;
        rest = "";
    }
    if !rest.trim().is_empty() {
        return Err(format!("unexpected `{}` after the directive", rest.trim()));
    }
    let mut cv = spec.name.to_string();
    let mut gap: Option<&str> = None;
    for a in spec.args {
        match pairs.iter().position(|(k, v)| k == a.name && v.is_some()) {
            Some(i) => {
                if let Some(g) = gap {
                    return Err(format!(
                        "`{}` needs `{g}` too (arguments are positional)",
                        a.name
                    ));
                }
                let (_, v) = pairs.remove(i);
                cv.push(' ');
                cv.push_str(&quote(&v.unwrap_or_default()));
            }
            None => gap = gap.or(Some(a.name)),
        }
    }
    for (k, v) in pairs {
        cv.push(' ');
        cv.push_str(&k);
        if let Some(v) = v {
            cv.push('=');
            cv.push_str(&quote(&v));
        }
    }
    if let Some(t) = text {
        cv.push(' ');
        cv.push_str(&quote(t));
    }
    Ok(cv)
}

const MARK: &str = "<!--cascivo-directive-->";

/// Replaces each directive line (outside code fences) by an HTML comment the parser keeps as a
/// raw block; line count is unchanged so diagnostics keep their line numbers.
fn mark_directives(md: &str) -> (String, Vec<(u32, String)>) {
    let mut out = String::with_capacity(md.len());
    let mut found = Vec::new();
    let mut fence: Option<&str> = None;
    for (i, line) in md.split_inclusive('\n').enumerate() {
        let t = line.trim_start();
        let marker = ["```", "~~~"].into_iter().find(|m| t.starts_with(m));
        match (fence, marker) {
            (None, Some(m)) => fence = Some(m),
            (Some(f), Some(m)) if f == m && t.trim_end() == m => fence = None,
            _ => {}
        }
        if fence.is_none() && line.starts_with("::") && !line.starts_with(":::") {
            found.push((u32::try_from(i).unwrap_or(0), line.trim_end().to_string()));
            out.push_str(MARK);
            out.push('\n');
        } else {
            out.push_str(line);
        }
    }
    (out, found)
}

/// Renders a Markdown body. `first_line` is where it starts in `file` (after front matter).
pub fn render(md: &str, file: &str, first_line: u32) -> Result<Rendered> {
    let (md, directives) = mark_directives(md);
    let mut out = Rendered::default();
    let mut errs = Vec::new();
    let mut dirs = directives.into_iter();
    let mut events = Vec::new();
    let mut fence: Option<(u32, String)> = None;
    let opts = Options::ENABLE_TABLES | Options::ENABLE_STRIKETHROUGH | Options::ENABLE_TASKLISTS;
    for (ev, range) in Parser::new_ext(&md, opts).into_offset_iter() {
        let line = first_line + line_of(&md, range.start) - 1;
        match ev {
            Event::Start(Tag::CodeBlock(CodeBlockKind::Fenced(lang))) if &*lang == "cv" => {
                fence = Some((line + 1, String::new()));
            }
            Event::Text(t) if fence.is_some() => {
                if let Some((_, buf)) = fence.as_mut() {
                    buf.push_str(&t);
                }
            }
            Event::End(TagEnd::CodeBlock) if fence.is_some() => {
                let (at, src) = fence.take().unwrap_or_default();
                match cv(&src, file, at, &mut out) {
                    Ok(h) => events.push(Event::Html(h.into())),
                    Err(e) => errs.extend(e.0),
                }
            }
            Event::Html(h) if h.trim_end() == MARK => {
                let Some((rel, src)) = dirs.next() else {
                    continue;
                };
                let at = first_line + rel;
                match directive_to_cv(&src) {
                    Ok(c) => match cv(&c, file, at, &mut out) {
                        Ok(h) => events.push(Event::Html(h.into())),
                        // Columns point into the generated line, so report the line only.
                        Err(e) => errs.extend(e.0.into_iter().map(|mut x| {
                            x.line = Some(at);
                            x
                        })),
                    },
                    Err(m) => errs.push(Error::new(file, Some(at), m)),
                }
            }
            ev => events.push(ev),
        }
    }
    if !errs.is_empty() {
        return Err(Errors(errs));
    }
    html::push_html(&mut out.html, events.into_iter());
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn plain_markdown() {
        let r = render("# Hi\n\nSome *text*.\n", "a.md", 1).unwrap();
        assert!(
            r.html.contains("<h1>Hi</h1>") && r.html.contains("<em>text</em>"),
            "{}",
            r.html
        );
        assert!(r.used.is_empty());
    }

    #[test]
    fn directive_maps_named_args() {
        assert_eq!(
            directive_to_cv("::card[Body text]{title=\"Hi there\" variant=outline}").unwrap(),
            "card \"Hi there\" variant=\"outline\" \"Body text\""
        );
        assert_eq!(directive_to_cv("::badge[New]").unwrap(), "badge \"New\"");
    }

    #[test]
    fn directive_errors_are_clear() {
        assert!(
            directive_to_cv("::crad")
                .unwrap_err()
                .contains("did you mean `card`")
        );
        assert!(
            directive_to_cv("::card{title=x")
                .unwrap_err()
                .contains("never closed")
        );
        assert!(
            directive_to_cv("::stat{value=3}")
                .unwrap_err()
                .contains("needs `label`")
        );
    }

    #[test]
    fn directive_renders_component_and_tracks_css() {
        let r = render("Intro\n::badge[New]{variant=success}\n\nAfter\n", "a.md", 1).unwrap();
        assert!(
            r.html.contains("New") && r.html.contains("<p>Intro</p>"),
            "{}",
            r.html
        );
        assert!(r.used.contains("badge"), "{:?}", r.used);
    }

    #[test]
    fn cv_fence_renders_tree() {
        let r = render(
            "```cv\ncols 2\n  stat Users 12\n  stat Churn 2%\n```\n",
            "a.md",
            1,
        )
        .unwrap();
        assert!(
            r.html.contains("Users") && !r.html.contains("<code"),
            "{}",
            r.html
        );
        assert!(r.used.contains("columns"));
    }

    #[test]
    fn directives_inside_code_fences_stay_text() {
        let r = render("```\n::card{title=x}\n```\n", "a.md", 1).unwrap();
        assert!(r.html.contains("::card{title=x}"), "{}", r.html);
    }

    #[test]
    fn errors_carry_file_lines() {
        let e = render("a\n\n::nope\n", "p.md", 10).unwrap_err();
        assert_eq!(e.0[0].line, Some(12), "{e}");
        let e = render("x\n\n```cv\ncard \"a\" bogus=1\n```\n", "p.md", 5).unwrap_err();
        assert_eq!(e.0[0].line, Some(8), "{e}");
    }
}
