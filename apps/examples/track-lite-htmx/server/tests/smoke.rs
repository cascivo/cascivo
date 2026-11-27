//! Smoke test for track-lite-htmx: page, create (valid and 422), advance, delete, CSRF, SSE
//! fan-out and the simulated teammate, all through the real router.

use std::time::Duration;

use axum::body::Body;
use axum::http::{HeaderMap, Request, StatusCode, header};
use futures_util::StreamExt;
use tower::ServiceExt;
use track_lite_htmx_server::app;

fn router() -> (axum::Router, track_lite_htmx_server::Tracker) {
    let assets = std::env::temp_dir().join("track-lite-htmx-smoke");
    std::fs::create_dir_all(&assets).unwrap();
    std::fs::write(assets.join("live.js"), "export default 1").unwrap();
    app(&assets)
}

async fn send(app: &axum::Router, req: Request<Body>) -> (StatusCode, HeaderMap, String) {
    let res = app.clone().oneshot(req).await.unwrap();
    let (status, headers) = (res.status(), res.headers().clone());
    let body = axum::body::to_bytes(res.into_body(), 1 << 20)
        .await
        .unwrap();
    (status, headers, String::from_utf8(body.to_vec()).unwrap())
}

fn get(path: &str) -> Request<Body> {
    Request::get(path).body(Body::empty()).unwrap()
}

/// Session cookie and CSRF token, as the page hands them to htmx (`hx-headers` on `<body>`).
async fn session(app: &axum::Router) -> (String, String) {
    let (_, headers, page) = send(app, get("/")).await;
    let cookie = headers[header::SET_COOKIE].to_str().unwrap();
    let cookie = cookie.split(';').next().unwrap().to_owned();
    let token = page
        .split("X-CSRF-Token\":\"")
        .nth(1)
        .and_then(|t| t.split('"').next())
        .expect("the page carries a CSRF token")
        .to_owned();
    (cookie, token)
}

async fn htmx_post(app: &axum::Router, path: &str, body: &str) -> (StatusCode, HeaderMap, String) {
    let (cookie, token) = session(app).await;
    let req = Request::post(path)
        .header("hx-request", "true")
        .header("sec-fetch-site", "same-origin")
        .header(header::CONTENT_TYPE, "application/x-www-form-urlencoded")
        .header(header::COOKIE, cookie)
        .header("x-csrf-token", token)
        .body(Body::from(body.to_owned()))
        .unwrap();
    send(app, req).await
}

/// Every `cv-*` class in the markup exists in `@cascivo/css`'s contract.
fn assert_contract(html: &str) {
    let contract = include_str!("../../../../../packages/css/contract.json");
    for class in html
        .split("class=\"")
        .skip(1)
        .filter_map(|rest| rest.split('"').next())
        .flat_map(str::split_whitespace)
        .filter(|t| t.starts_with("cv-"))
    {
        assert!(
            contract.contains(&format!("\"{class}\"")),
            "{class} is not in contract.json"
        );
    }
}

#[tokio::test]
async fn page_lists_the_seed_with_dialog_island_and_strict_csp() {
    let (app, _) = router();
    let (status, headers, body) = send(&app, get("/")).await;
    assert_eq!(status, StatusCode::OK);
    assert!(body.contains("6 issues") && body.contains("Fix login redirect loop"));
    assert!(body.contains(r#"<cv-dialog id="new-issue">"#));
    assert!(body.contains(r#"data-island="live""#) && body.contains(r#"sse-connect="/events""#));
    // htmx's injected indicator <style> has no nonce: it must stay off under a strict CSP.
    assert!(body.contains(r#""includeIndicatorStyles":false"#));
    // Tokens come from the shipped theme (`light`/`dark`), not the poster pair.
    assert!(!body.contains("poster"));
    assert_contract(&body);
    let csp = headers[header::CONTENT_SECURITY_POLICY].to_str().unwrap();
    let nonce = csp
        .split("'nonce-")
        .nth(1)
        .unwrap()
        .split('\'')
        .next()
        .unwrap();
    assert!(body.contains(&format!(r#"nonce="{nonce}""#)));
}

#[tokio::test]
async fn creating_an_issue_resets_the_form_updates_the_list_and_closes_the_dialog() {
    let (app, _) = router();
    let (status, headers, body) = htmx_post(
        &app,
        "/issues",
        "title=Ship+the+compare+doc&status=todo&priority=high&assignee=Bob+Chen",
    )
    .await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert!(
        body.starts_with("<cv-form"),
        "the form fragment first: {body}"
    );
    assert!(body.contains("7 issues") && body.contains("Ship the compare doc"));
    assert!(body.contains("Issue created"));
    assert!(
        headers["hx-trigger"]
            .to_str()
            .unwrap()
            .contains("cv-dialog-close")
    );
    assert!(!body.contains("<html"));
    assert_contract(&body);
}

#[tokio::test]
async fn an_invalid_issue_answers_422_with_field_errors() {
    let (app, _) = router();
    for body in [
        "title=ab&status=todo&priority=high",
        "title=Fine+title&status=nope&priority=high",
        "title=Fine+title&status=todo&priority=high&assignee=Mallory",
    ] {
        let (status, _, html) = htmx_post(&app, "/issues", body).await;
        assert_eq!(status, StatusCode::UNPROCESSABLE_ENTITY, "{body}");
        assert!(html.contains(r#"aria-invalid="true""#), "{html}");
    }
    assert!(send(&app, get("/")).await.2.contains("6 issues"));
}

#[tokio::test]
async fn advance_and_delete_answer_with_the_list_fragment() {
    let (app, _) = router();
    let (status, _, body) = htmx_post(&app, "/issues/3/advance", "").await;
    assert_eq!(status, StatusCode::OK);
    let row = body.split(r#"id="issue-3""#).nth(1).unwrap();
    assert!(
        row.split("</li>").next().unwrap().contains(">Todo<"),
        "backlog → todo"
    );

    let (status, _, body) = htmx_post(&app, "/issues/3/delete", "").await;
    assert_eq!(status, StatusCode::OK);
    assert!(body.contains("5 issues") && body.contains("Issue deleted"));
    assert!(!body.contains(r#"id="issue-3""#));
    assert_eq!(
        htmx_post(&app, "/issues/3/delete", "").await.0,
        StatusCode::NOT_FOUND
    );
}

#[tokio::test]
async fn a_post_without_the_csrf_token_is_refused() {
    let (app, _) = router();
    let req = Request::post("/issues/1/delete")
        .header("hx-request", "true")
        .header("sec-fetch-site", "same-origin")
        .body(Body::empty())
        .unwrap();
    assert_eq!(send(&app, req).await.0, StatusCode::FORBIDDEN);
}

/// Opens `/events`, runs `act`, and waits for the `changed` event every open page reacts to.
async fn expect_changed(app: &axum::Router, act: impl AsyncFnOnce()) {
    assert!(changed_data(app, act).await.is_some());
}

/// Like `expect_changed`, returning the event's `data:` (the origin client id).
async fn changed_data(app: &axum::Router, act: impl AsyncFnOnce()) -> Option<String> {
    let (cookie, _) = session(app).await;
    let req = Request::get("/events")
        .header(header::COOKIE, cookie)
        .body(Body::empty())
        .unwrap();
    let res = app.clone().oneshot(req).await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let mut stream = res.into_body().into_data_stream();
    act().await;
    let got = tokio::time::timeout(Duration::from_secs(5), async {
        while let Some(chunk) = stream.next().await {
            let c = String::from_utf8_lossy(&chunk.unwrap()).into_owned();
            if let Some(i) = c.find("event: changed") {
                return c[i..]
                    .lines()
                    .find_map(|l| l.strip_prefix("data:"))
                    .map(|d| d.trim().to_owned());
            }
        }
        None
    })
    .await;
    got.ok().flatten()
}

#[tokio::test]
async fn a_mutation_notifies_every_open_page() {
    let (app, _) = router();
    expect_changed(&app, async || {
        assert_eq!(
            htmx_post(&app, "/issues/1/advance", "").await.0,
            StatusCode::OK
        );
    })
    .await;
}

#[tokio::test]
async fn the_event_carries_the_mutating_clients_id() {
    let (app, _) = router();
    let data = changed_data(&app, async || {
        let (cookie, token) = session(&app).await;
        let req = Request::post("/issues/1/advance")
            .header("hx-request", "true")
            .header("sec-fetch-site", "same-origin")
            .header(header::COOKIE, cookie)
            .header("x-csrf-token", token)
            .header("x-client-id", "tab-42")
            .body(Body::empty())
            .unwrap();
        assert_eq!(send(&app, req).await.0, StatusCode::OK);
    })
    .await;
    assert_eq!(data.as_deref(), Some("tab-42"));
}

#[tokio::test]
async fn the_teammate_publishes_changes() {
    let (app, tracker) = router();
    expect_changed(&app, async || {
        tracker.spawn_teammate(Duration::from_millis(10))
    })
    .await;
}

#[tokio::test]
async fn serves_only_the_built_files() {
    let (app, _) = router();
    assert_eq!(send(&app, get("/assets/live.js")).await.0, StatusCode::OK);
    assert_eq!(
        send(&app, get("/assets/secret.txt")).await.0,
        StatusCode::NOT_FOUND
    );
    assert_eq!(
        send(&app, get("/assets/..%2Fx.js")).await.0,
        StatusCode::NOT_FOUND
    );
}
