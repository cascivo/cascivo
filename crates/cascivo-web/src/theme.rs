//! `theme_script(...)`: the no-flash theme script (inline, or a file with
//! `[build] external_scripts`), and [`site_css`], the theme part of `cascivo.css`. Same behaviour as the one in
//! `apps/site/index.html` (which mirrors `themePreloadScript` in `@cascivo/core`): the persisted
//! value (versioned envelope `{"v":1,"value":…}` or a bare string) wins; otherwise the OS colour
//! scheme picks `default_light` / `default_dark`; a value outside `blocking` (themes whose CSS
//! loads later) paints as that fallback.

use std::collections::{BTreeMap, BTreeSet};

use crate::config::Config;
use crate::head::script_json;
use crate::web::Args;

pub const PARAMS: &[&str] = &[
    "storage_key",
    "attribute",
    "default_light",
    "default_dark",
    "blocking",
];

fn js(s: &str) -> Result<String, String> {
    serde_json::to_string(s).map_err(|e| e.to_string())
}

/// The script source, without the `<script>` tag.
pub fn body(a: &Args) -> Result<String, String> {
    let e = |m: minijinja::Error| m.to_string();
    let key = js(&a.or("storage_key", "cascade-theme").map_err(e)?)?;
    let attr = js(&a.or("attribute", "data-theme").map_err(e)?)?;
    let light = a.or("default_light", "poster").map_err(e)?;
    let dark = a.or("default_dark", "poster-dark").map_err(e)?;
    let blocking = a.strings("blocking").map_err(e)?.unwrap_or_else(|| {
        let mut b = vec![light.clone(), dark.clone()];
        for t in ["light", "dark", "warm"] {
            if !b.iter().any(|x| x == t) {
                b.push(t.to_string());
            }
        }
        b
    });
    let blocking = serde_json::to_string(&blocking).map_err(|x| x.to_string())?;
    Ok(format!(
        "(function(){{try{{var l=typeof matchMedia==='function'&&matchMedia('(prefers-color-scheme: light)').matches,\
f=l?{light}:{dark},v=f,raw=localStorage.getItem({key});\
if(raw){{v=raw;try{{var e=JSON.parse(raw);if(e&&typeof e==='object'&&'value'in e)v=e.value}}catch(_){{}}}}\
document.documentElement.setAttribute({attr},{blocking}.indexOf(v)>=0?v:f)}}catch(_){{}}}})();",
        light = js(&light)?,
        dark = js(&dark)?,
    ))
}

pub fn script(a: &Args) -> Result<String, String> {
    Ok(format!("<script>{}</script>", script_json(&body(a)?)))
}

/// `cascivo.css`: base, `theme` and component CSS; with `dark_theme`, that theme for explicit
/// `data-theme` and, under `prefers-color-scheme: dark`, for pages without one (then `theme`
/// also applies to those); `[brand]` token overrides; CSP-safe `data-cv-style` rules.
pub fn site_css(
    cfg: &Config,
    used: &BTreeSet<&'static str>,
    styles: &BTreeMap<String, String>,
) -> String {
    let mut css = cascivo_html::stylesheet(&cfg.theme, used);
    let root = ":root:not([data-theme])";
    if let Some(dark) = cfg.dark_theme.as_deref().filter(|d| *d != cfg.theme)
        && let Some(dark_css) = cascivo_html::theme_css(dark)
    {
        // `light` already covers `:root:not([data-theme])`.
        if cfg.theme != "light"
            && let Some(t) = cascivo_html::theme_css(&cfg.theme)
        {
            css.push_str(&t.replace(&format!("[data-theme={}]", cfg.theme), root));
        }
        css.push_str(dark_css);
        css.push_str("@media (prefers-color-scheme:dark){");
        css.push_str(&dark_css.replace(&format!("[data-theme={dark}]"), root));
        css.push('}');
    }
    if let Some(Ok(mut b)) = cfg.brand.as_ref().map(crate::config::BrandConfig::to_brand) {
        b.theme = Some(cfg.theme.clone());
        if cfg.dark_theme.is_some() {
            b.mode = Some(cascivo_html::brand::Mode::Auto);
        }
        css.push_str(&cascivo_html::brand::brand_css(&b));
    }
    css.push_str(&cascivo_html::style_rules(styles));
    css
}

#[cfg(test)]
mod tests {
    use minijinja::value::{Kwargs, Rest};
    use minijinja::{Environment, Value, context};

    use super::*;

    fn run(call: &str) -> String {
        let mut env = Environment::new();
        env.add_function("theme_script", |rest: Rest<Value>, kw: Kwargs| {
            let a = Args::parse("theme_script", PARAMS, &rest, Some(kw))?;
            script(&a)
                .map(Value::from_safe_string)
                .map_err(crate::web::err)
        });
        env.render_str(call, context! {}).unwrap()
    }

    #[test]
    fn defaults_mirror_the_site_script() {
        let s = run("{{ theme_script() }}");
        assert!(
            s.starts_with("<script>(function(){try{") && s.ends_with("})();</script>"),
            "{s}"
        );
        for needle in [
            "matchMedia('(prefers-color-scheme: light)').matches",
            "f=l?\"poster\":\"poster-dark\"",
            "localStorage.getItem(\"cascade-theme\")",
            "'value'in e",
            "setAttribute(\"data-theme\",[\"poster\",\"poster-dark\",\"light\",\"dark\",\"warm\"].indexOf(v)>=0?v:f)",
        ] {
            assert!(s.contains(needle), "missing {needle} in {s}");
        }
    }

    #[test]
    fn arguments_are_applied_and_quoted() {
        let s = run(
            "{{ theme_script(storage_key='k\"', attribute='data-x', default_light='a', default_dark='b', blocking=['a','b']) }}",
        );
        assert!(
            s.contains("getItem(\"k\\\"\")")
                && s.contains("setAttribute(\"data-x\",[\"a\",\"b\"].indexOf"),
            "{s}"
        );
        assert!(s.contains("f=l?\"a\":\"b\""), "{s}");
    }
}
