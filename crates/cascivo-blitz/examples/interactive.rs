//! `cargo run -p cascivo-blitz --example interactive`
//!
//! A signal-driven counter, plus native table sort, tabs and accordion.
use cascivo_blitz::{App, Event, Options, Signal};

const SRC: &str = r#"@title "Interactive"
h1 "Interactive"
card "Counter"
  text "0"
  row gap=2
    button "-"
    button "+" primary
    button "Reset"
tabs
  section "Table"
    table sort Name,Qty | Pear,12 | Apple,3 | Fig,30
  section "Notes"
    text "Click a header to sort. Arrow keys move between tabs."
accordion
  section "Details"
    text "Opens and closes natively."
"#;

fn main() {
    let count = Signal::new(0i64);
    let (on_click, shown) = (count.clone(), count.clone());
    let app = App::from_cv(SRC, Options::default())
        .on(".cv-card-card button", Event::Click, move |ctx| {
            let current = ctx.current();
            match ctx.dom().text(current).trim() {
                "-" => on_click.update(|n| *n -= 1),
                "+" => on_click.update(|n| *n += 1),
                _ => on_click.set(0),
            }
        })
        .bind_text(".cv-card-card p", move || shown.get().to_string());
    if let Err(e) = app.launch() {
        eprintln!("{e}");
        std::process::exit(1);
    }
}
