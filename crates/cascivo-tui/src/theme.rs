//! Themes: a 15-colour palette per cascivo theme plus colour-depth fallbacks.
//!
//! Palettes live in the generated `theme_gen.rs` (`pnpm tui-kit:generate`). A [`Theme`] turns a
//! [`ClassStyle`] and [`StateFlags`] into a ratatui [`Style`]; [`Theme::quantize`] adapts the
//! palette to 256-colour, 16-colour or monochrome terminals.

use std::sync::OnceLock;

use ratatui::style::{Color, Style};

use crate::class::{ClassStyle, Role};
use crate::theme_gen::{THEME_NAMES, THEMES};

/// Raw generated palette; `colors` is indexed in [`Role::ALL`] order.
pub(crate) struct ThemeData {
    pub(crate) name: &'static str,
    pub(crate) colors: [(u8, u8, u8); 15],
}

/// Terminal colour capability.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum ColorDepth {
    /// 24-bit colour.
    #[default]
    TrueColor,
    /// xterm 256-colour palette.
    Ansi256,
    /// The 16 basic ANSI colours.
    Ansi16,
    /// No colour (`NO_COLOR`): styles keep modifiers only.
    None,
}

impl ColorDepth {
    /// Detects the depth from `NO_COLOR` and `COLORTERM`.
    pub fn from_env() -> Self {
        Self::from_vars(
            std::env::var("NO_COLOR").ok().as_deref(),
            std::env::var("COLORTERM").ok().as_deref(),
        )
    }

    /// Pure form of [`ColorDepth::from_env`]: a non-empty `NO_COLOR` disables colour,
    /// `COLORTERM` of `truecolor`/`24bit` means true colour, anything else 256 colours.
    ///
    /// ```
    /// use cascivo_tui::theme::ColorDepth;
    ///
    /// assert_eq!(ColorDepth::from_vars(Some("1"), Some("truecolor")), ColorDepth::None);
    /// assert_eq!(ColorDepth::from_vars(None, Some("24bit")), ColorDepth::TrueColor);
    /// assert_eq!(ColorDepth::from_vars(None, None), ColorDepth::Ansi256);
    /// ```
    pub fn from_vars(no_color: Option<&str>, colorterm: Option<&str>) -> Self {
        if no_color.is_some_and(|v| !v.is_empty()) {
            return Self::None;
        }
        match colorterm {
            Some("truecolor" | "24bit") => Self::TrueColor,
            _ => Self::Ansi256,
        }
    }
}

/// Interaction state used to pick `focus:`/`selected:`/`disabled:` variants.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct StateFlags {
    /// The node has keyboard focus.
    pub focused: bool,
    /// The node is the selected item.
    pub selected: bool,
    /// The node is disabled.
    pub disabled: bool,
}

/// A resolved palette at a given colour depth.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Theme {
    name: &'static str,
    colors: [(u8, u8, u8); 15],
    depth: ColorDepth,
}

fn all() -> &'static [Theme] {
    static ALL: OnceLock<Vec<Theme>> = OnceLock::new();
    ALL.get_or_init(|| {
        THEMES
            .iter()
            .map(|d| Theme {
                name: d.name,
                colors: d.colors,
                depth: ColorDepth::TrueColor,
            })
            .collect()
    })
}

impl Default for Theme {
    /// The `terminal` theme.
    fn default() -> Self {
        Self::by_name("terminal")
            .cloned()
            .unwrap_or_else(|| all()[0].clone())
    }
}

impl Theme {
    /// Looks a theme up by name (`"terminal"`, `"dark"`, …).
    ///
    /// ```
    /// use cascivo_tui::theme::Theme;
    ///
    /// assert!(Theme::by_name("terminal").is_some());
    /// assert!(Theme::by_name("nope").is_none());
    /// ```
    pub fn by_name(name: &str) -> Option<&'static Self> {
        all().iter().find(|t| t.name == name)
    }

    /// Every theme name.
    pub fn names() -> &'static [&'static str] {
        THEME_NAMES
    }

    /// The theme's name.
    pub fn name(&self) -> &'static str {
        self.name
    }

    /// The colour depth this theme renders at.
    pub fn depth(&self) -> ColorDepth {
        self.depth
    }

    /// Returns this palette adapted to `depth`.
    #[must_use]
    pub fn quantize(&self, depth: ColorDepth) -> Self {
        Self {
            depth,
            ..self.clone()
        }
    }

    /// The role's colour at this theme's depth.
    pub fn color(&self, role: Role) -> Color {
        let (r, g, b) = self.colors[Role::ALL.iter().position(|x| *x == role).unwrap_or(0)];
        match self.depth {
            ColorDepth::TrueColor => Color::Rgb(r, g, b),
            ColorDepth::Ansi256 => Color::Indexed(to_256(r, g, b)),
            ColorDepth::Ansi16 => to_16(r, g, b),
            ColorDepth::None => Color::Reset,
        }
    }

    fn resolve(cs: &ClassStyle, st: StateFlags) -> ClassStyle {
        let mut out = cs.clone();
        // Later overlays win: disabled < selected < focus.
        for (on, v) in [
            (st.disabled, &cs.disabled),
            (st.selected, &cs.selected),
            (st.focused, &cs.focus),
        ] {
            if let (true, Some(v)) = (on, v) {
                out = out.merge(v);
            }
        }
        out
    }

    /// The text style (fg, bg, modifiers) for `cs` in state `st`.
    ///
    /// ```
    /// use cascivo_tui::class::parse;
    /// use cascivo_tui::theme::{StateFlags, Theme};
    ///
    /// let cs = parse("text-muted focus:text-accent").unwrap();
    /// let t = Theme::default();
    /// let on = StateFlags { focused: true, ..StateFlags::default() };
    /// assert_ne!(t.style_for(&cs, on).fg, t.style_for(&cs, StateFlags::default()).fg);
    /// ```
    pub fn style_for(&self, cs: &ClassStyle, st: StateFlags) -> Style {
        let m = Self::resolve(cs, st);
        let mut style = Style::default().add_modifier(m.modifiers);
        if let Some(r) = m.fg {
            style = style.fg(self.color(r));
        }
        if let Some(r) = m.bg {
            style = style.bg(self.color(r));
        }
        style
    }

    /// The border colour style: `border-<role>` if given, else `border_strong` when focused,
    /// else `border`.
    pub fn border_style(&self, cs: &ClassStyle, st: StateFlags) -> Style {
        let m = Self::resolve(cs, st);
        let role = m.border_color.unwrap_or(if st.focused {
            Role::BorderStrong
        } else {
            Role::Border
        });
        Style::default().fg(self.color(role))
    }
}

/// Nearest xterm-256 index: best of the 6x6x6 cube and the 24-step gray ramp.
fn to_256(r: u8, g: u8, b: u8) -> u8 {
    const LEVELS: [i32; 6] = [0, 95, 135, 175, 215, 255];
    let near = |v: u8| {
        (0..6)
            .min_by_key(|&i| (LEVELS[i] - i32::from(v)).abs())
            .unwrap_or(0)
    };
    let (ci, cj, ck) = (near(r), near(g), near(b));
    let cube = [LEVELS[ci], LEVELS[cj], LEVELS[ck]];
    let gi = (0..24)
        .min_by_key(|&i| {
            let v = 8 + 10 * i;
            dist((r, g, b), (v, v, v))
        })
        .unwrap_or(0);
    let gv = 8 + 10 * gi;
    let cube_d = dist((r, g, b), (cube[0], cube[1], cube[2]));
    if dist((r, g, b), (gv, gv, gv)) < cube_d {
        232 + u8::try_from(gi).unwrap_or(0)
    } else {
        16 + u8::try_from(36 * ci + 6 * cj + ck).unwrap_or(0)
    }
}

fn dist(a: (u8, u8, u8), b: (i32, i32, i32)) -> i32 {
    let d = |x: u8, y: i32| (i32::from(x) - y).pow(2);
    d(a.0, b.0) + d(a.1, b.1) + d(a.2, b.2)
}

/// Nearest of the 16 basic colours (xterm values) by RGB distance.
fn to_16(r: u8, g: u8, b: u8) -> Color {
    const BASIC: [((i32, i32, i32), Color); 16] = [
        ((0, 0, 0), Color::Black),
        ((205, 0, 0), Color::Red),
        ((0, 205, 0), Color::Green),
        ((205, 205, 0), Color::Yellow),
        ((0, 0, 238), Color::Blue),
        ((205, 0, 205), Color::Magenta),
        ((0, 205, 205), Color::Cyan),
        ((229, 229, 229), Color::Gray),
        ((127, 127, 127), Color::DarkGray),
        ((255, 0, 0), Color::LightRed),
        ((0, 255, 0), Color::LightGreen),
        ((255, 255, 0), Color::LightYellow),
        ((92, 92, 255), Color::LightBlue),
        ((255, 0, 255), Color::LightMagenta),
        ((0, 255, 255), Color::LightCyan),
        ((255, 255, 255), Color::White),
    ];
    // A saturated colour keeps its hue: pick the closest-hue chromatic entry, using RGB distance
    // only to choose between its normal and bright variants.
    let chromatic = r.max(g).max(b) - r.min(g).min(b) > 48;
    let hue = hue_of((i32::from(r), i32::from(g), i32::from(b)));
    BASIC
        .iter()
        .filter(|(c, _)| !chromatic || *c != (c.0, c.0, c.0))
        .min_by_key(|(c, _)| {
            let d = dist((r, g, b), *c);
            if chromatic {
                let dh = (hue - hue_of(*c)).abs();
                i64::from(dh.min(360 - dh)) * 1_000_000 + i64::from(d)
            } else {
                i64::from(d)
            }
        })
        .map_or(Color::Reset, |(_, name)| *name)
}

/// Hue in whole degrees (0..360) of a non-gray RGB triple.
fn hue_of((r, g, b): (i32, i32, i32)) -> i32 {
    let (mx, mn) = (r.max(g).max(b), r.min(g).min(b));
    let d = (mx - mn).max(1);
    let h = if mx == r {
        60 * (g - b) / d
    } else if mx == g {
        120 + 60 * (b - r) / d
    } else {
        240 + 60 * (r - g) / d
    };
    h.rem_euclid(360)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::class::parse;
    use ratatui::style::Modifier;

    #[test]
    fn unknown_theme_is_none_and_default_is_terminal() {
        assert!(Theme::by_name("nope").is_none());
        assert_eq!(Theme::default().name(), "terminal");
        assert!(Theme::names().contains(&"terminal"));
    }

    #[test]
    fn terminal_accent_is_phosphor_green() {
        assert_eq!(
            Theme::default().color(Role::Accent),
            Color::Rgb(96, 229, 107)
        );
    }

    #[test]
    fn depth_from_vars() {
        use ColorDepth::*;
        assert_eq!(ColorDepth::from_vars(Some("1"), Some("truecolor")), None);
        assert_eq!(ColorDepth::from_vars(Some(""), Some("24bit")), TrueColor);
        assert_eq!(
            ColorDepth::from_vars(Option::None, Some("truecolor")),
            TrueColor
        );
        assert_eq!(
            ColorDepth::from_vars(Option::None, Some("256color")),
            Ansi256
        );
        assert_eq!(ColorDepth::from_vars(Option::None, Option::None), Ansi256);
    }

    #[test]
    fn ansi16_maps_accent_to_a_named_color() {
        let c = Theme::default()
            .quantize(ColorDepth::Ansi16)
            .color(Role::Accent);
        assert!(
            !matches!(c, Color::Reset | Color::Rgb(..) | Color::Indexed(_)),
            "{c:?}"
        );
        assert!(matches!(c, Color::Green | Color::LightGreen), "{c:?}");
    }

    #[test]
    fn ansi256_uses_cube_and_gray_ramp() {
        assert_eq!(to_256(255, 255, 255), 231);
        assert_eq!(to_256(0, 0, 0), 16);
        assert_eq!(to_256(255, 0, 0), 196);
        assert_eq!(to_256(128, 128, 128), 244);
        let c = Theme::default()
            .quantize(ColorDepth::Ansi256)
            .color(Role::Accent);
        assert!(matches!(c, Color::Indexed(_)));
    }

    #[test]
    fn no_color_resets_colors_but_keeps_modifiers() {
        let t = Theme::default().quantize(ColorDepth::None);
        let cs = parse("text-accent bg-surface bold underline").unwrap();
        let s = t.style_for(&cs, StateFlags::default());
        assert_eq!(s.fg, Some(Color::Reset));
        assert_eq!(s.bg, Some(Color::Reset));
        assert!(
            s.add_modifier
                .contains(Modifier::BOLD | Modifier::UNDERLINED)
        );
    }

    #[test]
    fn focus_variant_applies_only_when_focused() {
        let t = Theme::default();
        let cs = parse("text-muted focus:text-accent focus:bold").unwrap();
        let off = t.style_for(&cs, StateFlags::default());
        let on = t.style_for(
            &cs,
            StateFlags {
                focused: true,
                ..StateFlags::default()
            },
        );
        assert_eq!(off.fg, Some(t.color(Role::Muted)));
        assert_eq!(on.fg, Some(t.color(Role::Accent)));
        assert!(!off.add_modifier.contains(Modifier::BOLD));
        assert!(on.add_modifier.contains(Modifier::BOLD));
    }

    #[test]
    fn variant_order_is_disabled_selected_focus() {
        let t = Theme::default();
        let cs = parse("disabled:text-danger selected:text-info focus:text-success").unwrap();
        let st = |d, s, f| StateFlags {
            disabled: d,
            selected: s,
            focused: f,
        };
        assert_eq!(
            t.style_for(&cs, st(true, true, false)).fg,
            Some(t.color(Role::Info))
        );
        assert_eq!(
            t.style_for(&cs, st(true, true, true)).fg,
            Some(t.color(Role::Success))
        );
        assert_eq!(
            t.style_for(&cs, st(true, false, false)).fg,
            Some(t.color(Role::Danger))
        );
    }

    #[test]
    fn border_style_defaults_and_overrides() {
        let t = Theme::default();
        let plain = parse("border").unwrap();
        let off = StateFlags::default();
        let on = StateFlags {
            focused: true,
            ..off
        };
        assert_eq!(t.border_style(&plain, off).fg, Some(t.color(Role::Border)));
        assert_eq!(
            t.border_style(&plain, on).fg,
            Some(t.color(Role::BorderStrong))
        );
        let red = parse("border border-danger").unwrap();
        assert_eq!(t.border_style(&red, on).fg, Some(t.color(Role::Danger)));
    }

    #[test]
    fn theme_gen_is_current() {
        let manifest = std::path::Path::new(env!("CARGO_MANIFEST_DIR"));
        let css = manifest.join("../../scripts/html-kit/build-css.ts");
        let themes = manifest.join("../../packages/themes/src");
        let Ok(src) = std::fs::read_to_string(&css) else {
            eprintln!("skipping theme_gen_is_current: repo sources not present (packaged crate)");
            return;
        };
        assert!(themes.exists(), "packages/themes/src missing");
        let list = src.split("export const THEME_NAMES = [").nth(1).unwrap();
        let list = list.split(']').next().unwrap();
        let expected: Vec<&str> = list.split('\'').skip(1).step_by(2).collect();
        assert!(expected.len() >= 12, "parsed {expected:?}");
        assert_eq!(
            Theme::names(),
            expected.as_slice(),
            "run `pnpm tui-kit:generate`"
        );
        for name in expected {
            assert!(themes.join(format!("{name}.css")).exists(), "{name}.css");
            let t = Theme::by_name(name).unwrap_or_else(|| panic!("no theme {name}"));
            for r in Role::ALL {
                assert!(matches!(t.color(r), Color::Rgb(..)), "{name} {r:?}");
            }
        }
    }
}
