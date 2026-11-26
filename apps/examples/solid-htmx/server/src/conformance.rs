//! Fixture routes for the dynamic-app conformance harness (`scripts/checks/dynamic`): one small
//! page per flow (form with validation errors, dialog, toast, server island, SSE, lazy tabs).
//! The harness drives them in Chromium; a new target (the H starter) serves the same paths.

use std::time::Duration;

use axum::Router;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::get;
use cascivo_server::{
    AppError, Form, FormErrors, FormState, Fragment, IslandKey, Msg, Rule, Submission, ToastKind,
    Validate, View, sse,
};
use futures_util::stream;
use minijinja::context;
use serde::{Deserialize, Serialize};

/// Dev-only secrets: this is an example. A real app reads them from the environment.
pub const ISLAND_SECRET: &[u8] = b"solid-htmx-example-island-secret-0123456789";

pub const TEMPLATES: [(&str, &str); 6] = [
    ("c/form.html", include_str!("../templates/c/form.html")),
    ("c/dialog.html", include_str!("../templates/c/dialog.html")),
    ("c/toast.html", include_str!("../templates/c/toast.html")),
    ("c/island.html", include_str!("../templates/c/island.html")),
    ("c/sse.html", include_str!("../templates/c/sse.html")),
    ("c/tabs.html", include_str!("../templates/c/tabs.html")),
];

pub const MESSAGES: [(&str, &str); 4] = [
    ("c.saved", "Profile saved"),
    ("c.dialog", "Name updated"),
    ("c.taken", "{name} is taken"),
    ("c.fix", "Fix the errors below"),
];

#[derive(Debug, Deserialize, Serialize)]
struct Signup {
    name: String,
    email: Option<String>,
}

impl Validate for Signup {
    const RULES: &'static [(&'static str, Rule)] = &[
        ("name", Rule::text().required().min_len(3).max_len(20)),
        ("email", Rule::email()),
    ];

    fn validate(&self, e: &mut FormErrors) {
        if self.name == "taken" {
            e.add("name", Msg::new("c.taken").arg("name", &self.name));
            e.add_form(Msg::new("c.fix"));
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct Stats {
    visits: u32,
}

fn form_view(form: FormState) -> View {
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

/// Counts forever, one `tick` event every 150 ms, until the client goes away.
async fn ticks() -> impl IntoResponse {
    sse(stream::unfold(0u32, |n| async move {
        tokio::time::sleep(Duration::from_millis(150)).await;
        let n = n + 1;
        Some((
            Fragment::new("tick", format!("<p class=\"tick\">tick {n}</p>")),
            n,
        ))
    }))
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
            get(|| async { View::page("c/dialog.html") }).post(|| async {
                // `cv-dialog-close` closes the dialog around the trigger; the toast confirms.
                View::page("c/dialog.html")
                    .fragment("status")
                    .ctx(context! { saved => true })
                    .trigger("cv-dialog-close", ())
                    .toast(ToastKind::Success, "c.dialog")
            }),
        )
        .route(
            "/c/toast",
            page("c/toast.html").post(|| async {
                View::page("c/toast.html")
                    .fragment("status")
                    .ctx(context! { saved => true })
                    .toast(ToastKind::Success, "c.saved")
            }),
        )
        .route(
            "/c/island",
            get(move || {
                let key = key.clone();
                async move {
                    let stats = key
                        .placeholder("stats", &Stats { visits: 7 }, "<p>Loading stats…</p>")
                        .map_err(|e| {
                            AppError::new(StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
                        })?;
                    Ok::<_, AppError>(View::page("c/island.html").ctx(context! { stats }))
                }
            }),
        )
        .route("/c/sse", page("c/sse.html"))
        .route("/c/sse/stream", get(ticks))
        .route("/c/tabs", page("c/tabs.html"))
        .route(
            "/c/tabs/{panel}",
            get(
                |axum::extract::Path(p): axum::extract::Path<String>| async move {
                    let p = match p.as_str() {
                        "details" | "history" => p,
                        _ => return Err(StatusCode::NOT_FOUND),
                    };
                    Ok(View::page("c/tabs.html")
                        .fragment("panel")
                        .ctx(context! { panel => p }))
                },
            ),
        )
}

pub fn stats_island(
    p: Stats,
    _: axum::http::request::Parts,
) -> impl std::future::Future<Output = Result<View, AppError>> {
    std::future::ready(Ok(View::page("c/island.html")
        .fragment("stats_body")
        .ctx(context! { visits => p.visits })))
}
