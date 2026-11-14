//! Dashboard app logic, shared by `examples/dashboard.rs` and `tests/example_smoke.rs`.
//!
//! The pattern to copy: one `Msg` enum, plain state in the app, a pure `view`, and an
//! `update` that returns `Cmd`s for effects (quit, ticks, theme switch).

use cascivo_tui::prelude::*;
use cascivo_tui::widgets::Col;

#[derive(Clone, Debug, PartialEq)]
pub enum Msg {
    Tab(usize),
    Row(usize),
    LogRow(usize),
    Activate(usize),
    AskRestart,
    Confirm,
    Close,
    Theme,
    Sample,
    Expire,
    Quit,
}

const SERVICES: [(&str, &str, &str); 6] = [
    ("api", "running", "42ms"),
    ("web", "running", "18ms"),
    ("worker", "degraded", "310ms"),
    ("db", "running", "6ms"),
    ("cache", "running", "1ms"),
    ("cron", "stopped", "-"),
];

const THEME_START: &str = "terminal";

pub struct Dashboard {
    pub tab: usize,
    pub row: usize,
    pub log_row: usize,
    pub confirming: bool,
    pub theme: usize,
    pub load: Vec<u64>,
    pub log: Vec<String>,
    pub toasts: Vec<(Kind, String)>,
    table_scroll: Scroll,
    log_scroll: Scroll,
    seed: u64,
}

impl Default for Dashboard {
    fn default() -> Self {
        let theme = Theme::names()
            .iter()
            .position(|n| *n == THEME_START)
            .unwrap_or(0);
        let mut d = Self {
            tab: 0,
            row: 0,
            log_row: 0,
            confirming: false,
            theme,
            load: Vec::new(),
            log: Vec::new(),
            toasts: Vec::new(),
            table_scroll: Scroll::default(),
            log_scroll: Scroll::default(),
            seed: 7,
        };
        for _ in 0..24 {
            d.sample();
        }
        d
    }
}

impl Dashboard {
    /// A deterministic pseudo-random load sample, so tests and snapshots are stable.
    fn sample(&mut self) {
        self.seed = self
            .seed
            .wrapping_mul(6364136223846793005)
            .wrapping_add(1442695040888963407);
        let v = (self.seed >> 33) % 90 + 5;
        self.load.push(v);
        if self.load.len() > 48 {
            self.load.remove(0);
        }
        self.log
            .push(format!("{:03} load sample {v}%", self.log.len()));
    }

    fn notify(&mut self, kind: Kind, msg: String) -> Cmd<Msg> {
        self.toasts.push((kind, msg));
        Cmd::tick(2000, Msg::Expire)
    }

    fn overview(&self) -> Node<Msg> {
        let now = self.load.last().copied().unwrap_or(0);
        col(
            "gap-1",
            [
                card(
                    "Load",
                    "",
                    [sparkline(&self.load), progress(now as f64 / 100.0, "cpu")],
                ),
                text(format!("{} services, 1 degraded", SERVICES.len()))
                    .muted()
                    .into(),
            ],
        )
    }

    fn services(&self) -> Node<Msg> {
        let rows = SERVICES
            .iter()
            .map(|(n, s, l)| vec![(*n).to_owned(), (*s).to_owned(), (*l).to_owned()])
            .collect();
        table(
            &["Service", "State", "Latency"],
            rows,
            &[Col::Grow(2), Col::Grow(2), Col::Fixed(8)],
            self.row,
            Msg::Row,
        )
        .on_activate(Msg::Activate)
        .scroll(&self.table_scroll)
        .id("services")
    }

    fn logs(&self) -> Node<Msg> {
        list(self.log.clone(), self.log_row, Msg::LogRow)
            .scroll(&self.log_scroll)
            .class("grow")
            .id("log")
    }
}

impl App for Dashboard {
    type Msg = Msg;

    fn init(&mut self) -> Cmd<Msg> {
        Cmd::tick(1000, Msg::Sample)
    }

    fn update(&mut self, msg: Msg) -> Cmd<Msg> {
        match msg {
            Msg::Tab(i) => self.tab = i,
            Msg::Row(i) => self.row = i,
            Msg::LogRow(i) => self.log_row = i,
            Msg::Activate(i) => {
                let name = SERVICES.get(i).map_or("?", |s| s.0);
                return self.notify(Kind::Info, format!("selected {name}"));
            }
            Msg::AskRestart => self.confirming = true,
            Msg::Close => self.confirming = false,
            Msg::Confirm => {
                self.confirming = false;
                let name = SERVICES.get(self.row).map_or("?", |s| s.0);
                return self.notify(Kind::Success, format!("restarted {name}"));
            }
            Msg::Theme => {
                self.theme = (self.theme + 1) % Theme::names().len();
                return Cmd::SetTheme(Theme::names()[self.theme].to_owned());
            }
            Msg::Sample => {
                self.sample();
                return Cmd::tick(1000, Msg::Sample);
            }
            Msg::Expire => {
                if !self.toasts.is_empty() {
                    self.toasts.remove(0);
                }
            }
            Msg::Quit => return Cmd::Quit,
        }
        Cmd::None
    }

    fn view(&self) -> Node<Msg> {
        let body = match self.tab {
            0 => self.overview(),
            1 => self.services(),
            _ => self.logs(),
        };
        let mut kids = vec![
            tabs(&["Overview", "Table", "Log"], self.tab, Msg::Tab).id("tabs"),
            col("grow p-1", [body]),
            statusbar(
                format!("theme: {}", Theme::names()[self.theme]),
                format!("tab {}/3", self.tab + 1),
            ),
            keyhints(&self.keys()),
        ];
        if self.confirming {
            let buttons = row(
                "gap-2",
                [
                    button("Restart", Msg::Confirm).id("yes"),
                    button("Cancel", Msg::Close).id("no"),
                ],
            );
            let name = SERVICES.get(self.row).map_or("?", |s| s.0);
            let body = col("", [text(format!("Restart {name}?")).into(), buttons]);
            kids.push(modal("Confirm", body, Msg::Close));
        }
        // Overlays go last so they paint over the page.
        kids.push(toasts(&self.toasts));
        col("", kids)
    }

    fn keys(&self) -> Keymap<Msg> {
        Keymap::new()
            .bind("r", "restart", Msg::AskRestart)
            .bind("t", "theme", Msg::Theme)
            .bind("q", "quit", Msg::Quit)
    }
}
