//! `head(...)`: title, description, canonical, robots, Open Graph, Twitter and JSON-LD tags.

use cascivo_html::html::esc;

use crate::config::Config;
use crate::web::Args;

pub const PARAMS: &[&str] = &[
    "title",
    "description",
    "canonical",
    "og_title",
    "og_description",
    "og_image",
    "og_image_alt",
    "og_image_width",
    "og_image_height",
    "og_type",
    "robots",
    "twitter_card",
    "jsonld",
    "theme_color",
];

fn meta(out: &mut Vec<String>, key: &str, name: &str, content: &str) {
    let mut s = format!("<meta {key}=\"{name}\" content=\"");
    esc(&mut s, content);
    s.push_str("\">");
    out.push(s);
}

/// `base_url` + a root-relative path; anything already absolute (or with no base) is kept.
fn absolute(base: &str, p: &str) -> String {
    if base.is_empty() || p.contains("://") || p.starts_with("//") {
        return p.to_string();
    }
    format!(
        "{}/{}",
        base.trim_end_matches('/'),
        p.trim_start_matches('/')
    )
}

/// JSON for an inline `<script>`: `</` can never close it.
pub fn script_json(json: &str) -> String {
    json.replace("</", "<\\/")
}

pub fn render(cfg: &Config, page_url: &str, a: &Args) -> Result<String, String> {
    let e = |m: minijinja::Error| m.to_string();
    let title = a.req("title").map_err(e)?;
    let description = a.req("description").map_err(e)?;
    let canonical = match a.str("canonical").map_err(e)? {
        Some(c) => Some(absolute(&cfg.base_url, &c)),
        None if !cfg.base_url.is_empty() => Some(absolute(&cfg.base_url, page_url)),
        None => None,
    };
    let og_title = a
        .str("og_title")
        .map_err(e)?
        .unwrap_or_else(|| title.clone());
    let og_desc = a
        .str("og_description")
        .map_err(e)?
        .unwrap_or_else(|| description.clone());
    let mut t = Vec::new();
    let mut s = String::from("<title>");
    esc(&mut s, &title);
    s.push_str("</title>");
    t.push(s);
    meta(&mut t, "name", "description", &description);
    if let Some(c) = &canonical {
        let mut s = String::from("<link rel=\"canonical\" href=\"");
        esc(&mut s, c);
        s.push_str("\">");
        t.push(s);
    }
    // `robots=false` or `''` omits the tag; the default is `[head] robots`, `noindex` on 404s.
    let robots = match a.value("robots") {
        Some(v) if v.kind() == minijinja::value::ValueKind::Bool && !v.is_true() => String::new(),
        Some(_) => a.req("robots").map_err(e)?,
        None if page_url.ends_with("/404.html") => "noindex".into(),
        None => cfg.head.robots.clone(),
    };
    if !robots.is_empty() {
        meta(&mut t, "name", "robots", &robots);
    }
    match a.value("theme_color") {
        None => {}
        Some(v) if v.as_str().is_some() => {
            meta(
                &mut t,
                "name",
                "theme-color",
                v.as_str().unwrap_or_default(),
            );
        }
        Some(v) => {
            for scheme in ["light", "dark"] {
                if let Ok(c) = v.get_item(&minijinja::Value::from(scheme))
                    && let Some(c) = c.as_str()
                {
                    let mut s = format!(
                        "<meta name=\"theme-color\" media=\"(prefers-color-scheme: {scheme})\" content=\""
                    );
                    esc(&mut s, c);
                    s.push_str("\">");
                    t.push(s);
                }
            }
        }
    }
    meta(&mut t, "property", "og:site_name", &cfg.title);
    meta(&mut t, "property", "og:title", &og_title);
    meta(&mut t, "property", "og:description", &og_desc);
    if let Some(c) = &canonical {
        meta(&mut t, "property", "og:url", c);
    }
    meta(
        &mut t,
        "property",
        "og:type",
        &a.or("og_type", "website").map_err(e)?,
    );
    let image = a
        .str("og_image")
        .map_err(e)?
        .map(|i| absolute(&cfg.base_url, &i));
    if let Some(i) = &image {
        meta(&mut t, "property", "og:image", i);
        for (k, n) in [
            ("og_image_alt", "og:image:alt"),
            ("og_image_width", "og:image:width"),
            ("og_image_height", "og:image:height"),
        ] {
            if let Some(v) = a.str(k).map_err(e)? {
                meta(&mut t, "property", n, &v);
            }
        }
    }
    meta(
        &mut t,
        "name",
        "twitter:card",
        &a.or("twitter_card", "summary_large_image").map_err(e)?,
    );
    meta(&mut t, "name", "twitter:title", &og_title);
    meta(&mut t, "name", "twitter:description", &og_desc);
    if let Some(i) = &image {
        meta(&mut t, "name", "twitter:image", i);
    }
    if let Some(j) = a.value("jsonld") {
        let json = serde_json::to_string(j).map_err(|x| format!("jsonld: {x}"))?;
        t.push(format!(
            "<script type=\"application/ld+json\">{}</script>",
            script_json(&json)
        ));
    }
    Ok(t.join("\n"))
}

#[cfg(test)]
mod tests {
    use minijinja::value::{Kwargs, Rest};
    use minijinja::{Environment, Value, context};

    use super::*;

    fn cfg(base: &str) -> Config {
        Config::parse(&format!("title = \"Site\"\nbase_url = \"{base}\"")).unwrap()
    }

    fn run(base: &str, call: &str) -> Result<String, String> {
        let c = cfg(base);
        let mut env = Environment::new();
        env.add_function("head", move |rest: Rest<Value>, kw: Kwargs| {
            let a = Args::parse("head", PARAMS, &rest, Some(kw))?;
            render(&c, "/docs/", &a)
                .map(Value::from_safe_string)
                .map_err(crate::web::err)
        });
        env.render_str(call, context! {}).map_err(|e| e.to_string())
    }

    #[test]
    fn minimal_defaults() {
        let h = run("https://x.dev/", "{{ head('T & co', 'D \"q\"') }}").unwrap();
        let want = [
            "<title>T &amp; co</title>",
            "<meta name=\"description\" content=\"D &quot;q&quot;\">",
            "<link rel=\"canonical\" href=\"https://x.dev/docs/\">",
            "<meta name=\"robots\" content=\"index, follow\">",
            "<meta property=\"og:site_name\" content=\"Site\">",
            "<meta property=\"og:title\" content=\"T &amp; co\">",
            "<meta property=\"og:description\" content=\"D &quot;q&quot;\">",
            "<meta property=\"og:url\" content=\"https://x.dev/docs/\">",
            "<meta property=\"og:type\" content=\"website\">",
            "<meta name=\"twitter:card\" content=\"summary_large_image\">",
            "<meta name=\"twitter:title\" content=\"T &amp; co\">",
            "<meta name=\"twitter:description\" content=\"D &quot;q&quot;\">",
        ]
        .join("\n");
        assert_eq!(h, want);
    }

    #[test]
    fn no_base_url_means_no_canonical() {
        let h = run("", "{{ head('T', 'D') }}").unwrap();
        assert!(!h.contains("canonical") && !h.contains("og:url"), "{h}");
    }

    #[test]
    fn image_alt_size_and_theme_colors() {
        let h = run(
            "https://x.dev",
            "{{ head('T', 'D', canonical='/', og_title='O', og_image='og.png', og_image_alt='a<b', og_image_width=1200, og_image_height=630, og_type='article', robots='noindex', twitter_card='summary', theme_color={'light':'#fff','dark':'#000'}) }}",
        )
        .unwrap();
        for s in [
            "<link rel=\"canonical\" href=\"https://x.dev/\">",
            "<meta name=\"robots\" content=\"noindex\">",
            "<meta name=\"theme-color\" media=\"(prefers-color-scheme: light)\" content=\"#fff\">",
            "<meta name=\"theme-color\" media=\"(prefers-color-scheme: dark)\" content=\"#000\">",
            "<meta property=\"og:title\" content=\"O\">",
            "<meta property=\"og:type\" content=\"article\">",
            "<meta property=\"og:image\" content=\"https://x.dev/og.png\">",
            "<meta property=\"og:image:alt\" content=\"a&lt;b\">",
            "<meta property=\"og:image:width\" content=\"1200\">",
            "<meta property=\"og:image:height\" content=\"630\">",
            "<meta name=\"twitter:card\" content=\"summary\">",
            "<meta name=\"twitter:image\" content=\"https://x.dev/og.png\">",
        ] {
            assert!(h.contains(s), "missing {s} in\n{h}");
        }
        let h = run(
            "https://x.dev",
            "{{ head('T', 'D', og_image='https://cdn.x/i.png', theme_color='#abc') }}",
        )
        .unwrap();
        assert!(
            h.contains("content=\"https://cdn.x/i.png\"")
                && h.contains("name=\"theme-color\" content=\"#abc\""),
            "{h}"
        );
    }

    #[test]
    fn jsonld_is_serialised_and_cannot_close_the_script() {
        let h = run(
            "",
            "{{ head('T', 'D', jsonld={'@context':'https://schema.org','@graph':[{'name':'</script><b>'}]}) }}",
        )
        .unwrap();
        assert!(h.contains("<script type=\"application/ld+json\">{\"@context\":\"https://schema.org\",\"@graph\":[{\"name\":\"<\\/script><b>\"}]}</script>"), "{h}");
        assert_eq!(h.matches("</script>").count(), 1);
    }

    #[test]
    fn robots_can_be_omitted_or_defaulted() {
        for call in [
            "{{ head('T', 'D', robots=false) }}",
            "{{ head('T', 'D', robots='') }}",
        ] {
            assert!(!run("", call).unwrap().contains("robots"), "{call}");
        }
        let mut c = cfg("");
        c.head.robots = String::new();
        let a = Args::parse("head", PARAMS, &[Value::from("T"), Value::from("D")], None).unwrap();
        assert!(!render(&c, "/", &a).unwrap().contains("robots"));
        c.head.robots = "noai".into();
        assert!(render(&c, "/", &a).unwrap().contains("content=\"noai\""));
        assert!(
            render(&c, "/404.html", &a)
                .unwrap()
                .contains("content=\"noindex\"")
        );
    }

    #[test]
    fn missing_title_is_an_error() {
        assert!(
            run("", "{{ head(description='D') }}")
                .unwrap_err()
                .contains("title")
        );
    }
}
