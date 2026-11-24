//! One small page per interaction pattern (`/c/*`): form with validation errors, dialog,
//! toast + menu, server island, SSE and lazy tabs. They double as the fixtures of cascivo's
//! dynamic conformance harness (axe after every swap, focus, JS weight), so keep their ids.

use std::time::Duration;

use axum::Router;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::http::request::Parts;
use axum::response::IntoResponse;
use axum::routing::get;
use cascivo_server::{
    AppError, Form, FormErrors, FormState, Fragment, IslandKey, Msg, Rule, Submission, ToastKind,
    Validate, View, sse,
};
use futures_util::stream;
use minijinja::context;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct Signup {
    name: String,
    email: Option<String>,
}

impl Validate for Signup {
    const RULES: &'static [(&'static str, Rule)] = &[
        ("name", Rule::text().required().min_len(3).max_len(20)),
        ("email", Rule::email()),
    ];

    /// Server-only rules run after the declared ones pass, like a uniqueness check would.
    fn validate(&self, e: &mut FormErrors) {
        if self.name == "taken" {
            e.add("name", Msg::new("c.taken").arg("name", &self.name));
            e.add_form(Msg::new("c.fix"));
        }
    }
}

/// Props of the `stats` server island: signed into the placeholder URL, so the client can
/// neither read nor change them.
#[derive(Serialize, Deserialize)]
pub struct Stats {
    visits: u32,
}

pub fn form_view(form: FormState) -> View {
    View::page("c/form.html")
        .fragment("signup")
        .ctx(context! { form })
}

async fn submit(Form(s): Form<Signup>) -> impl IntoResponse {
    match s {
        Submission::Valid(_) => {
            form_view(FormState::new::<Signup>()).toast(ToastKind::Success, "c.saved")
        }
        Submission::Invalid(form) => form_view(form).status(StatusCode::UNPROCESSABLE_ENTITY),
    }
}

/// One `tick` event every 150 ms until the client goes away.
async fn ticks() -> impl IntoResponse {
    sse(stream::unfold(0u32, |n| async move {
        crate::platform::sleep(Duration::from_millis(150)).await;
        let n = n + 1;
        Some((
            Fragment::new("tick", format!("<p class=\"tick\">tick {n}</p>")),
            n,
        ))
    }))
}

pub fn status_view(tpl: &'static str, saved: bool) -> View {
    View::page(tpl).fragment("status").ctx(context! { saved })
}

/// A lazy tab panel; each panel is its own block, so the request picks from an allowlist.
pub fn tab_view(panel: &'static str) -> View {
    View::page("c/tabs.html")
        .fragment(panel)
        .ctx(context! { panel })
}

async fn tab(Path(p): Path<String>) -> Result<View, StatusCode> {
    match p.as_str() {
        "details" => Ok(tab_view("details")),
        "history" => Ok(tab_view("history")),
        _ => Err(StatusCode::NOT_FOUND),
    }
}

pub fn routes<S: Clone + Send + Sync + 'static>(key: IslandKey) -> Router<S> {
    let page = |t: &'static str| get(move || async move { View::page(t) });
    Router::new()
        .route(
            "/c/form",
            get(|| async { form_view(FormState::new::<Signup>()) }).post(submit),
        )
        .route(
            "/c/dialog",
            page("c/dialog.html").post(|| async {
                // `cv-dialog-close` closes the dialog around the trigger; the toast confirms.
                status_view("c/dialog.html", true)
                    .trigger("cv-dialog-close", ())
                    .toast(ToastKind::Success, "c.dialog")
            }),
        )
        .route(
            "/c/toast",
            page("c/toast.html").post(|| async {
                status_view("c/toast.html", true).toast(ToastKind::Success, "c.saved")
            }),
        )
        .route(
            "/c/island",
            get(move || {
                let key = key.clone();
                async move {
                    let stats = key
                        .placeholder("stats", &Stats { visits: 7 }, "<p>Loading stats…</p>")
                        .map_err(|e| AppError::internal(e.to_string()))?;
                    Ok::<_, AppError>(View::page("c/island.html").ctx(context! { stats }))
                }
            }),
        )
        .route("/c/sse", page("c/sse.html"))
        .route("/c/sse/stream", get(ticks))
        .route("/c/tabs", page("c/tabs.html"))
        .route("/c/tabs/{panel}", get(tab))
}

pub fn stats_view(visits: u32) -> View {
    View::page("c/island.html")
        .fragment("stats_body")
        .ctx(context! { visits })
}

pub fn stats_island(
    p: Stats,
    _: Parts,
) -> impl std::future::Future<Output = Result<View, AppError>> {
    std::future::ready(Ok(stats_view(p.visits)))
}
