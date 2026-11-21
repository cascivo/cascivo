//! Islands: static fallback markup plus the attributes a tiny loader uses to hydrate it with a
//! Vite-built module (`export default (el, props) => void`).

use cascivo_html::html::esc;

use crate::web::{Args, WebState};

pub const PARAMS: &[&str] = &["name", "client", "props"];

/// `data-island … data-src … data-css … [data-props='…']`, ready to drop into a start tag.
pub fn attrs(state: &WebState, a: &Args) -> Result<String, String> {
    let e = |m: minijinja::Error| m.to_string();
    let name = a.req("name").map_err(e)?;
    if name.is_empty()
        || !name
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        return Err(format!(
            "island(): bad name `{name}` (letters, digits, `-`, `_`)"
        ));
    }
    let client = a.or("client", "visible").map_err(e)?;
    if !["visible", "idle", "load"].contains(&client.as_str()) {
        return Err(format!(
            "island(): client must be visible, idle or load, not `{client}`"
        ));
    }
    let entry = state.cfg.vite.islands.replace("{name}", &name);
    let src = state
        .vite
        .url(&entry)
        .map_err(|m| format!("island(`{name}`): {m}"))?;
    let css = state.vite.css(&entry)?.join(" ");
    let mut s = String::new();
    s.push_str("data-island=\"");
    esc(&mut s, &name);
    s.push_str("\" data-client=\"");
    s.push_str(&client);
    // `src` and `css` are already escaped by the Vite module.
    s.push_str("\" data-src=\"");
    s.push_str(&src);
    s.push_str("\" data-css=\"");
    s.push_str(&css);
    s.push('"');
    if let Some(p) = a.value("props") {
        let json = serde_json::to_string(p).map_err(|x| format!("island(): props: {x}"))?;
        s.push_str(" data-props='");
        s.push_str(&json.replace('&', "&amp;").replace('\'', "&#39;"));
        s.push('\'');
    }
    Ok(s)
}

/// Hand-minified. Per `[data-island]`: wait (`load` now, `idle` requestIdleCallback or 200 ms,
/// `visible` IntersectionObserver with 200px margin), add the missing stylesheets and wait for
/// them, import the module and call its default export. Any failure leaves the fallback markup
/// (and is logged). `visible` observes the first child: wrappers are `display: contents`, which
/// has no box and so never intersects.
const LOADER: &str = "document.querySelectorAll('[data-island]').forEach(e=>{const d=e.dataset;new Promise(r=>{const c=d.client;if(c=='load'||(c=='visible'&&!window.IntersectionObserver))r();else if(c=='idle')window.requestIdleCallback?requestIdleCallback(r):setTimeout(r,200);else{const o=new IntersectionObserver(a=>a.some(x=>x.isIntersecting)&&(o.disconnect(),r()),{rootMargin:'200px'});o.observe(e.firstElementChild||e)}}).then(()=>Promise.all((d.css||'').split(' ').filter(Boolean).map(h=>[...document.querySelectorAll('link[rel=stylesheet]')].some(l=>l.getAttribute('href')==h)?0:new Promise(r=>{const l=document.createElement('link');l.rel='stylesheet';l.href=h;l.onload=l.onerror=r;document.head.append(l)})))).then(()=>import(d.src)).then(m=>m.default(e,JSON.parse(d.props||'{}'))).catch(x=>console.error('island',d.island,x))})";

pub fn script() -> String {
    format!("<script type=\"module\">{LOADER}</script>")
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use minijinja::value::{Kwargs, Rest};
    use minijinja::{Environment, Value, context};

    use super::*;
    use crate::config::Config;
    use crate::vite::Vite;

    #[test]
    fn loader_is_small_and_has_the_contract_pieces() {
        assert!(LOADER.len() <= 1200, "{} bytes", LOADER.len());
        for p in [
            "rootMargin:'200px'",
            "requestIdleCallback",
            "setTimeout(r,200)",
            "import(d.src)",
            "JSON.parse(d.props||'{}')",
            "catch",
            // Island wrappers are `display: contents` (no box), so observe the fallback inside.
            "o.observe(e.firstElementChild||e)",
            "console.error",
        ] {
            assert!(LOADER.contains(p), "missing {p}");
        }
        assert!(
            script().starts_with("<script type=\"module\">") && script().ends_with("</script>")
        );
    }

    fn state() -> Arc<WebState> {
        let m = r#"{"src/marketing/islands/signals.tsx":{"file":"assets/signals-1.js","css":["assets/s.css"],"imports":["_c.js"]},
                    "_c.js":{"file":"assets/c.js","css":["assets/c.css"]}}"#;
        Arc::new(WebState::for_tests(
            Config::parse("title = \"x\"").unwrap(),
            Vite::parse(Some(m), None).unwrap(),
        ))
    }

    fn run(call: &str) -> Result<String, String> {
        let s = state();
        let mut env = Environment::new();
        env.add_function("island", move |rest: Rest<Value>, kw: Kwargs| {
            let a = Args::parse("island", PARAMS, &rest, Some(kw))?;
            attrs(&s, &a)
                .map(Value::from_safe_string)
                .map_err(crate::web::err)
        });
        env.render_str(call, context! {}).map_err(|e| e.to_string())
    }

    #[test]
    fn attributes_follow_the_contract() {
        assert_eq!(
            run("{{ island('signals') }}").unwrap(),
            "data-island=\"signals\" data-client=\"visible\" data-src=\"/assets/signals-1.js\" data-css=\"/assets/c.css /assets/s.css\""
        );
        let s =
            run("{{ island('signals', client='idle', props={'a': \"it's & ok\", 'n': [1, 2]}) }}")
                .unwrap();
        assert!(s.contains("data-client=\"idle\""), "{s}");
        assert!(
            s.ends_with("data-props='{\"a\":\"it&#39;s &amp; ok\",\"n\":[1,2]}'"),
            "{s}"
        );
    }

    #[test]
    fn bad_input_is_an_error() {
        assert!(
            run("{{ island('nope') }}")
                .unwrap_err()
                .contains("unknown vite entry")
        );
        assert!(
            run("{{ island('signals', client='soon') }}")
                .unwrap_err()
                .contains("client must be")
        );
        assert!(
            run("{{ island('a\"b') }}")
                .unwrap_err()
                .contains("bad name")
        );
    }
}
