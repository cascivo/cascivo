use axum::{Router, extract::Path, response::Html, routing::get};
use minijinja::{Environment, context};
use tower_service::Service;
use worker::{Context, Env, HttpRequest, event};

/// Embedded bundle: stands in for `Engine::from_bundle` (plan task A).
const BUNDLE: &[(&str, &str)] = &[("index.html", include_str!("../templates/index.html"))];

pub fn render_page(name: &str) -> Result<String, minijinja::Error> {
    let mut env = Environment::new();
    for (n, src) in BUNDLE {
        env.add_template(n, src)?;
    }
    env.add_filter("cv", |src: String| {
        cascivo_html::render(&src, &cascivo_html::Options::default())
            .map_err(|_| minijinja::Error::new(minijinja::ErrorKind::InvalidOperation, "cv render failed"))
    });
    env.get_template(name)?.render(context! { title => "Hello from a Worker" })
}

pub fn app() -> Router {
    Router::new().route(
        "/{name}",
        get(|Path(n): Path<String>| async move {
            match render_page(&format!("{n}.html")) {
                Ok(h) => Html(h),
                Err(e) => Html(format!("error: {e}")),
            }
        }),
    )
}

#[event(start)]
fn start() {
    console_error_panic_hook::set_once();
}

#[event(fetch)]
async fn fetch(req: HttpRequest, _env: Env, _ctx: Context) -> worker::Result<axum::http::Response<axum::body::Body>> {
    Ok(app().call(req).await?)
}

#[cfg(test)]
mod tests {
    #[test]
    fn renders() {
        let h = super::render_page("index.html").unwrap();
        assert!(h.contains("Hello from a Worker"));
        assert!(h.contains("<html") || h.contains("card"));
    }
}
