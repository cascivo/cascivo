//! Notes CRUD behind sign-in. Every view is one template whose blocks are the htmx fragments
//! (`note_form`, `notes`), so a fragment is always the same markup as the page around it.
//! Without JavaScript the forms post and redirect (post/redirect/get).
//!
//! The store is in memory: per process natively, per isolate on Workers. Replace `Notes` with
//! SQLite (native, containers) or D1 (`cascivo_worker::D1`) for real data.

use std::sync::{Arc, Mutex, PoisonError};

use axum::Router;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use cascivo_server::{
    Form, FormErrors, FormState, Hx, LocalPath, Rule, Session, Submission, ToastKind, User,
    Validate, View, see_other,
};
use minijinja::value::Serde;
use minijinja::{Value, context};
use serde::{Deserialize, Serialize};

use crate::auth::Account;

#[derive(Debug, Clone, Serialize)]
pub struct Note {
    pub id: u64,
    pub owner: String,
    pub title: String,
    pub body: String,
}

#[derive(Default)]
struct Store {
    next: u64,
    items: Vec<Note>,
}

#[derive(Clone, Default)]
pub struct Notes(Arc<Mutex<Store>>);

impl Notes {
    fn with<R>(&self, f: impl FnOnce(&mut Store) -> R) -> R {
        // A panic mid-update leaves at worst one half-written note; keep serving.
        f(&mut self.0.lock().unwrap_or_else(PoisonError::into_inner))
    }

    pub fn list(&self, owner: &str) -> Vec<Note> {
        self.with(|s| {
            s.items
                .iter()
                .filter(|n| n.owner == owner)
                .cloned()
                .collect()
        })
    }

    pub fn add(&self, owner: &str, n: NoteInput) -> u64 {
        self.with(|s| {
            s.next += 1;
            let id = s.next;
            s.items.push(Note {
                id,
                owner: owner.to_owned(),
                title: n.title,
                body: n.body.unwrap_or_default(),
            });
            id
        })
    }

    pub fn get(&self, owner: &str, id: u64) -> Option<Note> {
        self.with(|s| {
            s.items
                .iter()
                .find(|n| n.id == id && n.owner == owner)
                .cloned()
        })
    }

    fn update(&self, owner: &str, id: u64, n: NoteInput) -> bool {
        self.with(
            |s| match s.items.iter_mut().find(|x| x.id == id && x.owner == owner) {
                Some(x) => {
                    x.title = n.title;
                    x.body = n.body.unwrap_or_default();
                    true
                }
                None => false,
            },
        )
    }

    fn delete(&self, owner: &str, id: u64) -> bool {
        self.with(|s| {
            let before = s.items.len();
            s.items.retain(|n| !(n.id == id && n.owner == owner));
            s.items.len() != before
        })
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub struct NoteInput {
    pub title: String,
    pub body: Option<String>,
}

impl Validate for NoteInput {
    const RULES: &'static [(&'static str, Rule)] = &[
        ("title", Rule::text().required().max_len(80)),
        ("body", Rule::text().max_len(2000)),
    ];

    fn validate(&self, _: &mut FormErrors) {}
}

/// The list page; an htmx request gets `fragment` (the form after a create, the list after a
/// delete) and, after a create, the list out of band.
pub fn list_view(notes: Vec<Note>, form: FormState, fragment: &'static str) -> View {
    View::page("notes.html")
        .fragment(fragment)
        .ctx(context! { notes => Value::from(Serde(&notes)), form })
}

pub fn edit_view(id: u64, form: FormState) -> View {
    View::page("note.html")
        .fragment("note_form")
        .ctx(context! { id, form })
}

fn not_found() -> Response {
    StatusCode::NOT_FOUND.into_response()
}

fn notes_path() -> LocalPath {
    LocalPath::parse_or_root(Some("/notes"))
}

/// Always the whole page: `HX-Location` (after sign-in, an edit) navigates here with an htmx
/// request, and that swap needs the page, not a block.
async fn index(State(db): State<Notes>, User(u): User<Account>) -> View {
    let notes = db.list(&u.name);
    View::page("notes.html").ctx(context! {
        notes => Value::from(Serde(&notes)),
        form => FormState::new::<NoteInput>(),
    })
}

async fn create(
    hx: Hx,
    session: Session,
    State(db): State<Notes>,
    User(u): User<Account>,
    Form(f): Form<NoteInput>,
) -> Response {
    match f {
        Submission::Valid(n) => {
            db.add(&u.name, n);
            if !hx.is_partial() {
                session.flash(ToastKind::Success, "notes.created");
                return see_other(&hx, &notes_path());
            }
            let notes = db.list(&u.name);
            list_view(notes.clone(), FormState::new::<NoteInput>(), "note_form")
                .oob("notes.html", "notes", context! { notes => Value::from(Serde(&notes)), form => FormState::new::<NoteInput>() })
                .toast(ToastKind::Success, "notes.created")
                .into_response()
        }
        Submission::Invalid(form) => list_view(db.list(&u.name), form, "note_form")
            .status(StatusCode::UNPROCESSABLE_ENTITY)
            .into_response(),
    }
}

async fn edit(State(db): State<Notes>, User(u): User<Account>, Path(id): Path<u64>) -> Response {
    let Some(n) = db.get(&u.name, id) else {
        return not_found();
    };
    let form = FormState::new::<NoteInput>().values(NoteInput {
        title: n.title,
        body: Some(n.body),
    });
    edit_view(id, form).into_response()
}

async fn update(
    hx: Hx,
    session: Session,
    State(db): State<Notes>,
    User(u): User<Account>,
    Path(id): Path<u64>,
    Form(f): Form<NoteInput>,
) -> Response {
    match f {
        Submission::Valid(n) => {
            if !db.update(&u.name, id, n) {
                return not_found();
            }
            session.flash(ToastKind::Success, "notes.updated");
            see_other(&hx, &notes_path())
        }
        Submission::Invalid(form) => edit_view(id, form)
            .status(StatusCode::UNPROCESSABLE_ENTITY)
            .into_response(),
    }
}

async fn delete(
    hx: Hx,
    session: Session,
    State(db): State<Notes>,
    User(u): User<Account>,
    Path(id): Path<u64>,
) -> Response {
    if !db.delete(&u.name, id) {
        return not_found();
    }
    if !hx.is_partial() {
        session.flash(ToastKind::Success, "notes.deleted");
        return see_other(&hx, &notes_path());
    }
    list_view(db.list(&u.name), FormState::new::<NoteInput>(), "notes")
        .toast(ToastKind::Success, "notes.deleted")
        .into_response()
}

pub fn routes() -> Router<Notes> {
    Router::new()
        .route("/notes", get(index).post(create))
        .route("/notes/{id}", post(update))
        .route("/notes/{id}/edit", get(edit))
        .route("/notes/{id}/delete", post(delete))
}
