//! `Accept-Language` picks the locale of `t()` in templates when the session has none.

use std::collections::BTreeMap;

use axum::Router;
use axum::body::Body;
use axum::extract::Extension;
use axum::http::{Request, header};
use axum::routing::get;
use cascivo_server::{App, Facts, View};
use cascivo_web::{Bundle, Config, Engine};
use tower::ServiceExt;

fn app() -> Router {
    let msgs = |t: &str| BTreeMap::from([("hi".to_string(), t.to_string())]);
    let engine = Engine::new(&Bundle {
        format: cascivo_web::engine::BUNDLE_FORMAT,
        config: Config::parse(
            "title = \"T\"\n[i18n]\ndefault = \"en\"\nlocales = [\"en\", \"de\"]",
        )
        .unwrap(),
        templates: BTreeMap::from([("p.html".into(), "{{ t('hi') }}|{{ request.locale }}".into())]),
        messages: BTreeMap::from([("en".into(), msgs("Hello")), ("de".into(), msgs("Hallo"))]),
        vite_manifest: None,
        css_modules: None,
        data: serde_json::Value::Null,
    })
    .unwrap();
    App::new(engine)
        .routes(
            Router::new()
                .route("/", get(|| async { View::page("p.html") }))
                .route(
                    "/own",
                    get(|| async {
                        (
                            Extension(Facts {
                                locale: "en".into(),
                                ..Facts::default()
                            }),
                            View::page("p.html"),
                        )
                    }),
                ),
        )
        .into_router()
}

async fn get_text(path: &str, lang: Option<&str>) -> String {
    let mut r = Request::get(path);
    if let Some(l) = lang {
        r = r.header(header::ACCEPT_LANGUAGE, l);
    }
    let res = app().oneshot(r.body(Body::empty()).unwrap()).await.unwrap();
    let b = axum::body::to_bytes(res.into_body(), 1 << 20)
        .await
        .unwrap();
    String::from_utf8(b.to_vec()).unwrap()
}

#[tokio::test]
async fn accept_language_selects_the_template_locale() {
    assert_eq!(
        get_text("/", Some("de-AT,de;q=0.9,en;q=0.5")).await,
        "Hallo|de"
    );
    assert_eq!(get_text("/", Some("fr")).await, "Hello|");
    assert_eq!(get_text("/", None).await, "Hello|");
    // A handler's own locale wins.
    assert_eq!(get_text("/own", Some("de")).await, "Hello|en");
}
