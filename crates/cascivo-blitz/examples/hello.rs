//! `cargo run -p cascivo-blitz --example hello [file.cv]`
const DEFAULT: &str = r#"@title "Hello Blitz"
center
  h1 "Hello, Blitz"
  p "cascivo, rendered natively."
  row gap=3
    button "Primary" primary
    button "Plain"
  card "A card"
    p "No browser. No Dioxus."
"#;

fn main() {
    let src = match std::env::args().nth(1) {
        Some(path) => std::fs::read_to_string(path).expect("read .cv file"),
        None => DEFAULT.to_owned(),
    };
    if let Err(e) = cascivo_blitz::launch_cv(&src, cascivo_blitz::Options::default()) {
        eprintln!("{e}");
        std::process::exit(1);
    }
}
