//! The `interactive` example's document, driven headlessly.
use cascivo_blitz::{App, Event, Options, Signal};

#[test]
fn counter_card_buttons() {
    let src = "card \"Counter\"\n  text \"0\"\n  row gap=2\n    button \"-\"\n    button \"+\" primary\n    button \"Reset\"\n";
    let count = Signal::new(0i64);
    let (c, shown) = (count.clone(), count.clone());
    let mut doc = App::from_cv(src, Options::default())
        .on(".cv-card-card button", Event::Click, move |ctx| {
            let cur = ctx.current();
            match ctx.dom().text(cur).trim() {
                "-" => c.update(|n| *n -= 1),
                "+" => c.update(|n| *n += 1),
                _ => c.set(0),
            }
        })
        .bind_text(".cv-card-card p", move || shown.get().to_string())
        .build()
        .unwrap();
    assert!(doc.click("button:nth-of-type(2)"));
    assert!(doc.click("button:nth-of-type(2)"));
    assert!(doc.click("button:nth-of-type(1)"));
    assert_eq!(doc.text("p").as_deref(), Some("1"));
}
