//! `theme_script(...)`: the inline no-flash theme script. Same behaviour as the one in
//! `apps/site/index.html` (which mirrors `themePreloadScript` in `@cascivo/core`): the persisted
//! value (versioned envelope `{"v":1,"value":…}` or a bare string) wins; otherwise the OS colour
//! scheme picks `default_light` / `default_dark`; a value outside `blocking` (themes whose CSS
//! loads later) paints as that fallback.

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

pub fn script(a: &Args) -> Result<String, String> {
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
    let body = format!(
        "(function(){{try{{var l=typeof matchMedia==='function'&&matchMedia('(prefers-color-scheme: light)').matches,\
f=l?{light}:{dark},v=f,raw=localStorage.getItem({key});\
if(raw){{v=raw;try{{var e=JSON.parse(raw);if(e&&typeof e==='object'&&'value'in e)v=e.value}}catch(_){{}}}}\
document.documentElement.setAttribute({attr},{blocking}.indexOf(v)>=0?v:f)}}catch(_){{}}}})();",
        light = js(&light)?,
        dark = js(&dark)?,
    );
    Ok(format!("<script>{}</script>", script_json(&body)))
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
