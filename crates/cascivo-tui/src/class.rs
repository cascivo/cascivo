//! Utility-class parser: turns `"col gap-1 p-1 border rounded text-accent"`-style strings
//! into a [`ClassStyle`].
//!
//! Rules:
//! - Tokens are split on whitespace; matching is case-sensitive.
//! - Conflicting tokens resolve **last-wins** (`w-4 w-8` → width 8). Exceptions that
//!   accumulate instead: text modifiers (`bold italic`) and border sides (`border-t border-l`
//!   draws both; `border` sets all sides, `border-none` clears them).
//! - Unknown tokens are errors, never ignored. The suggestion is the closest
//!   [`VOCABULARY`] entry (Levenshtein ≤ 2) or a common alias (`bg-primary` → `bg-accent`).
//! - `row`/`col` are node kinds chosen by the builder, not classes.
//! - Role names in classes are the [`Role::name`] snake names: `text-accent_fg`,
//!   `bg-surface2`, `border-border_strong`.

use std::collections::HashMap;
use std::rc::Rc;

use ratatui::style::Modifier;
use ratatui::widgets::{BorderType, Borders};

use crate::error::ClassError;

/// A terminal colour role; themes map each role to a concrete colour.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Role {
    /// Screen background (`bg`).
    Bg,
    /// Card / input surface (`surface`).
    Surface,
    /// Raised surface: active tab, modal (`surface2`).
    Surface2,
    /// Default border (`border`).
    Border,
    /// Emphasised border (`border_strong`).
    BorderStrong,
    /// Default text (`fg`).
    Fg,
    /// Secondary text (`muted`).
    Muted,
    /// Brand / primary action (`accent`).
    Accent,
    /// Text on an accent background (`accent_fg`).
    AccentFg,
    /// Success status (`success`).
    Success,
    /// Warning status (`warning`).
    Warning,
    /// Destructive / error status (`danger`).
    Danger,
    /// Informational status (`info`).
    Info,
    /// Focus ring (`focus`).
    Focus,
    /// Selected row background (`selection`).
    Selection,
}

impl Role {
    /// Every role, in theme-table order.
    pub const ALL: [Self; 15] = [
        Self::Bg,
        Self::Surface,
        Self::Surface2,
        Self::Border,
        Self::BorderStrong,
        Self::Fg,
        Self::Muted,
        Self::Accent,
        Self::AccentFg,
        Self::Success,
        Self::Warning,
        Self::Danger,
        Self::Info,
        Self::Focus,
        Self::Selection,
    ];

    /// The role's name as used in classes and theme tables, e.g. `"accent_fg"`.
    pub const fn name(self) -> &'static str {
        match self {
            Self::Bg => "bg",
            Self::Surface => "surface",
            Self::Surface2 => "surface2",
            Self::Border => "border",
            Self::BorderStrong => "border_strong",
            Self::Fg => "fg",
            Self::Muted => "muted",
            Self::Accent => "accent",
            Self::AccentFg => "accent_fg",
            Self::Success => "success",
            Self::Warning => "warning",
            Self::Danger => "danger",
            Self::Info => "info",
            Self::Focus => "focus",
            Self::Selection => "selection",
        }
    }

    /// Inverse of [`Role::name`].
    pub fn from_name(s: &str) -> Option<Self> {
        Self::ALL.into_iter().find(|r| r.name() == s)
    }
}

/// Roles accepted by `text-<role>`.
const TEXT_ROLES: [Role; 8] = [
    Role::Fg,
    Role::Muted,
    Role::Accent,
    Role::AccentFg,
    Role::Success,
    Role::Warning,
    Role::Danger,
    Role::Info,
];

/// Roles accepted by `bg-<role>`.
const BG_ROLES: [Role; 9] = [
    Role::Bg,
    Role::Surface,
    Role::Surface2,
    Role::Accent,
    Role::Selection,
    Role::Success,
    Role::Warning,
    Role::Danger,
    Role::Info,
];

/// Every base class, in documentation order. `N` stands for an integer 0..=64
/// (`grow-N`: 0..=16). Variant prefixes are listed separately in [`VARIANTS`].
pub const VOCABULARY: &[&str] = &[
    "gap-N",
    "p-N",
    "px-N",
    "py-N",
    "pt-N",
    "pr-N",
    "pb-N",
    "pl-N",
    "w-N",
    "h-N",
    "w-full",
    "h-full",
    "w-1/2",
    "w-1/3",
    "w-2/3",
    "w-1/4",
    "w-3/4",
    "h-1/2",
    "h-1/3",
    "h-2/3",
    "h-1/4",
    "h-3/4",
    "min-w-N",
    "min-h-N",
    "max-w-N",
    "max-h-N",
    "grow",
    "grow-N",
    "shrink-0",
    "justify-start",
    "justify-center",
    "justify-end",
    "justify-between",
    "justify-around",
    "justify-evenly",
    "items-start",
    "items-center",
    "items-end",
    "items-stretch",
    "border",
    "border-none",
    "border-t",
    "border-r",
    "border-b",
    "border-l",
    "border-x",
    "border-y",
    "rounded",
    "border-double",
    "border-thick",
    "border-plain",
    "border-bg",
    "border-surface",
    "border-surface2",
    "border-border",
    "border-border_strong",
    "border-fg",
    "border-muted",
    "border-accent",
    "border-accent_fg",
    "border-success",
    "border-warning",
    "border-danger",
    "border-info",
    "border-focus",
    "border-selection",
    "text-fg",
    "text-muted",
    "text-accent",
    "text-accent_fg",
    "text-success",
    "text-warning",
    "text-danger",
    "text-info",
    "bg-bg",
    "bg-surface",
    "bg-surface2",
    "bg-accent",
    "bg-selection",
    "bg-success",
    "bg-warning",
    "bg-danger",
    "bg-info",
    "bold",
    "italic",
    "underline",
    "strike",
    "dim",
    "reverse",
    "text-left",
    "text-center",
    "text-right",
    "truncate",
    "wrap",
    "nowrap",
    "scroll-y",
    "clip",
    "hidden",
];

/// Variant prefixes (`focus:bold`). The first three accept only colour, modifier and
/// border classes; `narrow` (terminal narrower than 80 columns) accepts any class.
pub const VARIANTS: &[&str] = &["focus", "selected", "disabled", "narrow"];

/// Upper bound for `N` in most numeric classes.
const MAX_N: u32 = 64;
/// Upper bound for `grow-N`.
const MAX_GROW: u32 = 16;

/// Common design-system words mapped to their cascivo role name, for suggestions only.
const ALIASES: &[(&str, &str)] = &[
    ("primary", "accent"),
    ("destructive", "danger"),
    ("error", "danger"),
    ("foreground", "fg"),
    ("background", "bg"),
];

/// A size along one axis.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Size {
    /// A fixed number of terminal cells (`w-8`).
    Cells(u16),
    /// The whole available extent (`w-full`).
    Full,
    /// A fraction of the available extent (`w-1/3` → `Ratio(1, 3)`).
    Ratio(u32, u32),
}

/// Per-side padding in cells; `None` means "not set".
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct Sides {
    /// Top padding.
    pub top: Option<u16>,
    /// Right padding.
    pub right: Option<u16>,
    /// Bottom padding.
    pub bottom: Option<u16>,
    /// Left padding.
    pub left: Option<u16>,
}

/// Main-axis distribution (`justify-*`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Justify {
    /// `justify-start`.
    Start,
    /// `justify-center`.
    Center,
    /// `justify-end`.
    End,
    /// `justify-between`.
    Between,
    /// `justify-around`.
    Around,
    /// `justify-evenly`.
    Evenly,
}

/// Cross-axis alignment (`items-*`); unset means stretch.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Items {
    /// `items-start`.
    Start,
    /// `items-center`.
    Center,
    /// `items-end`.
    End,
    /// `items-stretch`.
    Stretch,
}

/// Horizontal text alignment (`text-left/center/right`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TextAlign {
    /// `text-left`.
    Left,
    /// `text-center`.
    Center,
    /// `text-right`.
    Right,
}

/// What text does when it is wider than its box.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Flow {
    /// `truncate`: cut with an ellipsis.
    Truncate,
    /// `wrap`: wrap at word boundaries.
    Wrap,
    /// `nowrap`: cut without an ellipsis.
    NoWrap,
}

/// The parsed form of a class string. `None` / empty fields mean "not set" (use the default).
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct ClassStyle {
    /// `gap-N`.
    pub gap: Option<u16>,
    /// `p-N`, `px-N`, `py-N`, `pt/pr/pb/pl-N`.
    pub padding: Sides,
    /// `w-N`, `w-full`, `w-1/2`…
    pub width: Option<Size>,
    /// `h-N`, `h-full`, `h-1/2`…
    pub height: Option<Size>,
    /// `min-w-N`.
    pub min_w: Option<Size>,
    /// `min-h-N`.
    pub min_h: Option<Size>,
    /// `max-w-N`.
    pub max_w: Option<Size>,
    /// `max-h-N`.
    pub max_h: Option<Size>,
    /// `grow` (1) or `grow-N`.
    pub grow: Option<u16>,
    /// `shrink-0`.
    pub shrink0: bool,
    /// `justify-*`.
    pub justify: Option<Justify>,
    /// `items-*`.
    pub items: Option<Items>,
    /// `border`, `border-none`, `border-t/r/b/l/x/y`.
    pub borders: Option<Borders>,
    /// `rounded`, `border-double`, `border-thick`, `border-plain`.
    pub border_type: Option<BorderType>,
    /// `border-<role>`.
    pub border_color: Option<Role>,
    /// `text-<role>`.
    pub fg: Option<Role>,
    /// `bg-<role>`.
    pub bg: Option<Role>,
    /// `bold`, `italic`, `underline`, `strike`, `dim`, `reverse` (accumulate).
    pub modifiers: Modifier,
    /// `text-left/center/right`.
    pub align: Option<TextAlign>,
    /// `truncate`, `wrap`, `nowrap`.
    pub flow: Option<Flow>,
    /// `scroll-y` (`Some(true)`) or `clip` (`Some(false)`).
    pub scroll_y: Option<bool>,
    /// `hidden`.
    pub hidden: bool,
    /// `focus:<class>` overlay.
    pub focus: Option<Box<ClassStyle>>,
    /// `selected:<class>` overlay.
    pub selected: Option<Box<ClassStyle>>,
    /// `disabled:<class>` overlay.
    pub disabled: Option<Box<ClassStyle>>,
    /// `narrow:<class>` overlay.
    pub narrow: Option<Box<ClassStyle>>,
}

impl ClassStyle {
    /// Returns `self` with every field set in `overlay` taking precedence (used to apply a
    /// variant). Modifiers and border sides are unioned; `hidden`/`shrink0` are or-ed.
    ///
    /// ```
    /// use cascivo_tui::class::{parse, Role};
    ///
    /// let base = parse("text-muted focus:text-accent").unwrap();
    /// let focused = base.merge(base.focus.as_deref().unwrap());
    /// assert_eq!(focused.fg, Some(Role::Accent));
    /// ```
    #[must_use]
    pub fn merge(&self, overlay: &Self) -> Self {
        let pick = |a: Option<u16>, b: Option<u16>| b.or(a);
        Self {
            gap: overlay.gap.or(self.gap),
            padding: Sides {
                top: pick(self.padding.top, overlay.padding.top),
                right: pick(self.padding.right, overlay.padding.right),
                bottom: pick(self.padding.bottom, overlay.padding.bottom),
                left: pick(self.padding.left, overlay.padding.left),
            },
            width: overlay.width.or(self.width),
            height: overlay.height.or(self.height),
            min_w: overlay.min_w.or(self.min_w),
            min_h: overlay.min_h.or(self.min_h),
            max_w: overlay.max_w.or(self.max_w),
            max_h: overlay.max_h.or(self.max_h),
            grow: overlay.grow.or(self.grow),
            shrink0: self.shrink0 || overlay.shrink0,
            justify: overlay.justify.or(self.justify),
            items: overlay.items.or(self.items),
            borders: match (self.borders, overlay.borders) {
                (Some(a), Some(b)) if !b.is_empty() => Some(a | b),
                (a, b) => b.or(a),
            },
            border_type: overlay.border_type.or(self.border_type),
            border_color: overlay.border_color.or(self.border_color),
            fg: overlay.fg.or(self.fg),
            bg: overlay.bg.or(self.bg),
            modifiers: self.modifiers | overlay.modifiers,
            align: overlay.align.or(self.align),
            flow: overlay.flow.or(self.flow),
            scroll_y: overlay.scroll_y.or(self.scroll_y),
            hidden: self.hidden || overlay.hidden,
            focus: overlay.focus.clone().or_else(|| self.focus.clone()),
            selected: overlay.selected.clone().or_else(|| self.selected.clone()),
            disabled: overlay.disabled.clone().or_else(|| self.disabled.clone()),
            narrow: overlay.narrow.clone().or_else(|| self.narrow.clone()),
        }
    }
}

/// Parses a class string. Empty or whitespace-only input yields the default style.
///
/// ```
/// use cascivo_tui::class::{parse, Role, Size};
///
/// let s = parse("w-1/2 p-1 border rounded text-accent focus:bold").unwrap();
/// assert_eq!(s.width, Some(Size::Ratio(1, 2)));
/// assert_eq!(s.fg, Some(Role::Accent));
/// assert!(s.focus.is_some());
///
/// let e = parse("bg-primary").unwrap_err();
/// assert_eq!(e.suggestion.as_deref(), Some("bg-accent"));
/// ```
pub fn parse(s: &str) -> Result<ClassStyle, ClassError> {
    let mut out = ClassStyle::default();
    for tok in s.split_whitespace() {
        parse_token(&mut out, tok)?;
    }
    Ok(out)
}

fn parse_token(out: &mut ClassStyle, tok: &str) -> Result<(), ClassError> {
    let err = |message: &str, suggestion: Option<String>| ClassError {
        token: tok.to_owned(),
        message: message.to_owned(),
        suggestion,
    };
    let (variant, base) = match tok.split_once(':') {
        Some((v, b)) => (Some(v), b),
        None => (None, tok),
    };
    let prefixed = |s: String| match variant {
        Some(v) => format!("{v}:{s}"),
        None => s,
    };
    if base.contains(':') {
        return Err(err("variant not allowed", None));
    }
    let target = match variant {
        None => out,
        Some(v) => {
            let slot = match v {
                "focus" => &mut out.focus,
                "selected" => &mut out.selected,
                "disabled" => &mut out.disabled,
                "narrow" => &mut out.narrow,
                _ => {
                    let sugg = closest(v, VARIANTS.iter().copied())
                        .zip(base_ok(base).then_some(base))
                        .map(|(v, b)| format!("{v}:{b}"));
                    return Err(err("unknown class", sugg));
                }
            };
            slot.get_or_insert_with(Box::default)
        }
    };
    match apply(target, base) {
        Ok(false) if matches!(variant, Some("focus" | "selected" | "disabled")) => {
            Err(err("variant not allowed", Some(base.to_owned())))
        }
        Ok(_) => Ok(()),
        Err(Fail::Range(p, max)) => Err(err("out of range", Some(prefixed(format!("{p}{max}"))))),
        Err(Fail::Unknown) => Err(err("unknown class", suggest(base).map(prefixed))),
    }
}

enum Fail {
    Unknown,
    Range(&'static str, u32),
}

fn base_ok(t: &str) -> bool {
    apply(&mut ClassStyle::default(), t).is_ok()
}

/// Applies one base token; `Ok(true)` when it is a colour/modifier/border class (allowed
/// under state variants).
fn apply(s: &mut ClassStyle, t: &str) -> Result<bool, Fail> {
    let modifier = match t {
        "bold" => Some(Modifier::BOLD),
        "italic" => Some(Modifier::ITALIC),
        "underline" => Some(Modifier::UNDERLINED),
        "strike" => Some(Modifier::CROSSED_OUT),
        "dim" => Some(Modifier::DIM),
        "reverse" => Some(Modifier::REVERSED),
        _ => None,
    };
    if let Some(m) = modifier {
        s.modifiers |= m;
        return Ok(true);
    }
    let side = match t {
        "border-t" => Some(Borders::TOP),
        "border-r" => Some(Borders::RIGHT),
        "border-b" => Some(Borders::BOTTOM),
        "border-l" => Some(Borders::LEFT),
        "border-x" => Some(Borders::LEFT | Borders::RIGHT),
        "border-y" => Some(Borders::TOP | Borders::BOTTOM),
        _ => None,
    };
    if let Some(b) = side {
        s.borders = Some(s.borders.unwrap_or(Borders::NONE) | b);
        return Ok(true);
    }
    let border = match t {
        "border" => Some((Some(Borders::ALL), None)),
        "border-none" => Some((Some(Borders::NONE), None)),
        "rounded" => Some((None, Some(BorderType::Rounded))),
        "border-double" => Some((None, Some(BorderType::Double))),
        "border-thick" => Some((None, Some(BorderType::Thick))),
        "border-plain" => Some((None, Some(BorderType::Plain))),
        _ => None,
    };
    if let Some((b, k)) = border {
        s.borders = b.or(s.borders);
        s.border_type = k.or(s.border_type);
        return Ok(true);
    }
    let role = |prefix: &str, allowed: &[Role]| {
        t.strip_prefix(prefix)
            .and_then(Role::from_name)
            .filter(|r| allowed.contains(r))
    };
    if let Some(r) = role("border-", &Role::ALL) {
        s.border_color = Some(r);
        return Ok(true);
    }
    if let Some(r) = role("text-", &TEXT_ROLES) {
        s.fg = Some(r);
        return Ok(true);
    }
    if let Some(r) = role("bg-", &BG_ROLES) {
        s.bg = Some(r);
        return Ok(true);
    }
    match t {
        "w-full" => s.width = Some(Size::Full),
        "h-full" => s.height = Some(Size::Full),
        "grow" => s.grow = Some(1),
        "shrink-0" => s.shrink0 = true,
        "justify-start" => s.justify = Some(Justify::Start),
        "justify-center" => s.justify = Some(Justify::Center),
        "justify-end" => s.justify = Some(Justify::End),
        "justify-between" => s.justify = Some(Justify::Between),
        "justify-around" => s.justify = Some(Justify::Around),
        "justify-evenly" => s.justify = Some(Justify::Evenly),
        "items-start" => s.items = Some(Items::Start),
        "items-center" => s.items = Some(Items::Center),
        "items-end" => s.items = Some(Items::End),
        "items-stretch" => s.items = Some(Items::Stretch),
        "text-left" => s.align = Some(TextAlign::Left),
        "text-center" => s.align = Some(TextAlign::Center),
        "text-right" => s.align = Some(TextAlign::Right),
        "truncate" => s.flow = Some(Flow::Truncate),
        "wrap" => s.flow = Some(Flow::Wrap),
        "nowrap" => s.flow = Some(Flow::NoWrap),
        "scroll-y" => s.scroll_y = Some(true),
        "clip" => s.scroll_y = Some(false),
        "hidden" => s.hidden = true,
        _ => return apply_numeric(s, t).map(|()| false),
    }
    Ok(false)
}

fn apply_numeric(s: &mut ClassStyle, t: &str) -> Result<(), Fail> {
    // Longer prefixes first so `min-w-` is not read as something shorter.
    const PREFIXES: [&str; 15] = [
        "min-w-", "min-h-", "max-w-", "max-h-", "grow-", "gap-", "px-", "py-", "pt-", "pr-", "pb-",
        "pl-", "p-", "w-", "h-",
    ];
    let Some((p, v)) = PREFIXES
        .iter()
        .find_map(|p| t.strip_prefix(p).map(|v| (*p, v)))
    else {
        return Err(Fail::Unknown);
    };
    if p == "w-" || p == "h-" {
        let ratio = match v {
            "1/2" => Some((1, 2)),
            "1/3" => Some((1, 3)),
            "2/3" => Some((2, 3)),
            "1/4" => Some((1, 4)),
            "3/4" => Some((3, 4)),
            _ => None,
        };
        if let Some((a, b)) = ratio {
            let slot = if p == "w-" {
                &mut s.width
            } else {
                &mut s.height
            };
            *slot = Some(Size::Ratio(a, b));
            return Ok(());
        }
    }
    if v.is_empty() || !v.bytes().all(|b| b.is_ascii_digit()) {
        return Err(Fail::Unknown);
    }
    let max = if p == "grow-" { MAX_GROW } else { MAX_N };
    let n = v
        .parse::<u32>()
        .ok()
        .filter(|n| *n <= max)
        .and_then(|n| u16::try_from(n).ok())
        .ok_or(Fail::Range(p, max))?;
    let pad = &mut s.padding;
    match p {
        "gap-" => s.gap = Some(n),
        "grow-" => s.grow = Some(n),
        "p-" => {
            *pad = Sides {
                top: Some(n),
                right: Some(n),
                bottom: Some(n),
                left: Some(n),
            }
        }
        "px-" => (pad.left, pad.right) = (Some(n), Some(n)),
        "py-" => (pad.top, pad.bottom) = (Some(n), Some(n)),
        "pt-" => pad.top = Some(n),
        "pr-" => pad.right = Some(n),
        "pb-" => pad.bottom = Some(n),
        "pl-" => pad.left = Some(n),
        "w-" => s.width = Some(Size::Cells(n)),
        "h-" => s.height = Some(Size::Cells(n)),
        "min-w-" => s.min_w = Some(Size::Cells(n)),
        "min-h-" => s.min_h = Some(Size::Cells(n)),
        "max-w-" => s.max_w = Some(Size::Cells(n)),
        _ => s.max_h = Some(Size::Cells(n)),
    }
    Ok(())
}

/// Closest valid base class for an unknown token: alias table first, then the nearest
/// [`VOCABULARY`] entry within edit distance 2 (`N` filled from the token's trailing digits).
fn suggest(t: &str) -> Option<String> {
    // Node kinds, not classes: `row` would otherwise suggest `grow`, `col` suggest `bold`.
    if matches!(t, "row" | "col") {
        return None;
    }
    for (from, to) in ALIASES {
        if let Some(head) = t.strip_suffix(from).filter(|h| h.ends_with('-')) {
            let c = format!("{head}{to}");
            if base_ok(&c) {
                return Some(c);
            }
        }
    }
    let digits = t.trim_start_matches(|c: char| !c.is_ascii_digit());
    let n = if !digits.is_empty() && digits.bytes().all(|b| b.is_ascii_digit()) {
        digits
    } else {
        "1"
    };
    let candidates: Vec<String> = VOCABULARY
        .iter()
        .map(|v| match v.strip_suffix("-N") {
            Some(p) => format!("{p}-{n}"),
            None => (*v).to_owned(),
        })
        .collect();
    closest(t, candidates.iter().map(String::as_str)).map(str::to_owned)
}

fn closest<'a>(t: &str, candidates: impl Iterator<Item = &'a str>) -> Option<&'a str> {
    candidates
        .map(|c| (levenshtein(t, c), c))
        .filter(|(d, _)| *d <= 2)
        .min_by_key(|(d, _)| *d)
        .map(|(_, c)| c)
}

fn levenshtein(a: &str, b: &str) -> usize {
    let b: Vec<char> = b.chars().collect();
    let mut prev: Vec<usize> = (0..=b.len()).collect();
    for (i, ca) in a.chars().enumerate() {
        let mut cur = vec![i + 1; b.len() + 1];
        for (j, cb) in b.iter().enumerate() {
            let sub = prev[j] + usize::from(ca != *cb);
            cur[j + 1] = sub.min(prev[j + 1] + 1).min(cur[j] + 1);
        }
        prev = cur;
    }
    prev[b.len()]
}

/// A bounded memo of [`parse`] results keyed by the exact class string.
///
/// Eviction is deliberately simple: when [`ClassCache::CAPACITY`] entries are held, the
/// next miss clears the whole map. Class strings in a UI are few and repeat every frame, so
/// a full clear is rare and cheap compared with tracking recency.
#[derive(Debug, Default)]
pub struct ClassCache {
    map: HashMap<String, Result<Rc<ClassStyle>, ClassError>>,
}

impl ClassCache {
    /// Maximum number of cached class strings.
    pub const CAPACITY: usize = 256;

    /// An empty cache.
    pub fn new() -> Self {
        Self::default()
    }

    /// Parses `s`, or returns the cached result (the same `Rc` on a hit).
    ///
    /// ```
    /// use cascivo_tui::class::ClassCache;
    /// use std::rc::Rc;
    ///
    /// let mut c = ClassCache::new();
    /// let a = c.get("bold").unwrap();
    /// assert!(Rc::ptr_eq(&a, &c.get("bold").unwrap()));
    /// ```
    pub fn get(&mut self, s: &str) -> Result<Rc<ClassStyle>, ClassError> {
        if let Some(r) = self.map.get(s) {
            return r.clone();
        }
        if self.map.len() >= Self::CAPACITY {
            self.map.clear();
        }
        let r = parse(s).map(Rc::new);
        self.map.insert(s.to_owned(), r.clone());
        r
    }

    /// Number of cached entries.
    pub fn len(&self) -> usize {
        self.map.len()
    }

    /// Whether the cache holds no entries.
    pub fn is_empty(&self) -> bool {
        self.map.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn st(f: impl FnOnce(&mut ClassStyle)) -> ClassStyle {
        let mut s = ClassStyle::default();
        f(&mut s);
        s
    }

    fn sides(t: u16, r: u16, b: u16, l: u16) -> Sides {
        let o = |n: u16| (n != 0).then_some(n);
        Sides {
            top: o(t),
            right: o(r),
            bottom: o(b),
            left: o(l),
        }
    }

    #[test]
    fn every_vocabulary_row_parses_to_expected_field() {
        use Size::{Cells, Full, Ratio};
        let table: Vec<(&str, ClassStyle)> = vec![
            ("gap-3", st(|s| s.gap = Some(3))),
            ("p-2", st(|s| s.padding = sides(2, 2, 2, 2))),
            ("px-2", st(|s| s.padding = sides(0, 2, 0, 2))),
            ("py-2", st(|s| s.padding = sides(2, 0, 2, 0))),
            ("pt-1", st(|s| s.padding = sides(1, 0, 0, 0))),
            ("pr-1", st(|s| s.padding = sides(0, 1, 0, 0))),
            ("pb-1", st(|s| s.padding = sides(0, 0, 1, 0))),
            ("pl-1", st(|s| s.padding = sides(0, 0, 0, 1))),
            ("w-64", st(|s| s.width = Some(Cells(64)))),
            ("h-0", st(|s| s.height = Some(Cells(0)))),
            ("w-full", st(|s| s.width = Some(Full))),
            ("h-full", st(|s| s.height = Some(Full))),
            ("w-1/2", st(|s| s.width = Some(Ratio(1, 2)))),
            ("w-1/3", st(|s| s.width = Some(Ratio(1, 3)))),
            ("w-2/3", st(|s| s.width = Some(Ratio(2, 3)))),
            ("w-1/4", st(|s| s.width = Some(Ratio(1, 4)))),
            ("h-3/4", st(|s| s.height = Some(Ratio(3, 4)))),
            ("min-w-5", st(|s| s.min_w = Some(Cells(5)))),
            ("min-h-5", st(|s| s.min_h = Some(Cells(5)))),
            ("max-w-5", st(|s| s.max_w = Some(Cells(5)))),
            ("max-h-5", st(|s| s.max_h = Some(Cells(5)))),
            ("grow", st(|s| s.grow = Some(1))),
            ("grow-16", st(|s| s.grow = Some(16))),
            ("shrink-0", st(|s| s.shrink0 = true)),
            ("justify-start", st(|s| s.justify = Some(Justify::Start))),
            ("justify-center", st(|s| s.justify = Some(Justify::Center))),
            ("justify-end", st(|s| s.justify = Some(Justify::End))),
            (
                "justify-between",
                st(|s| s.justify = Some(Justify::Between)),
            ),
            ("justify-around", st(|s| s.justify = Some(Justify::Around))),
            ("justify-evenly", st(|s| s.justify = Some(Justify::Evenly))),
            ("items-start", st(|s| s.items = Some(Items::Start))),
            ("items-center", st(|s| s.items = Some(Items::Center))),
            ("items-end", st(|s| s.items = Some(Items::End))),
            ("items-stretch", st(|s| s.items = Some(Items::Stretch))),
            ("border", st(|s| s.borders = Some(Borders::ALL))),
            ("border-none", st(|s| s.borders = Some(Borders::NONE))),
            ("border-t", st(|s| s.borders = Some(Borders::TOP))),
            ("border-r", st(|s| s.borders = Some(Borders::RIGHT))),
            ("border-b", st(|s| s.borders = Some(Borders::BOTTOM))),
            ("border-l", st(|s| s.borders = Some(Borders::LEFT))),
            (
                "border-x",
                st(|s| s.borders = Some(Borders::LEFT | Borders::RIGHT)),
            ),
            (
                "border-y",
                st(|s| s.borders = Some(Borders::TOP | Borders::BOTTOM)),
            ),
            (
                "border-t border-l",
                st(|s| s.borders = Some(Borders::TOP | Borders::LEFT)),
            ),
            ("rounded", st(|s| s.border_type = Some(BorderType::Rounded))),
            (
                "border-double",
                st(|s| s.border_type = Some(BorderType::Double)),
            ),
            (
                "border-thick",
                st(|s| s.border_type = Some(BorderType::Thick)),
            ),
            (
                "border-plain",
                st(|s| s.border_type = Some(BorderType::Plain)),
            ),
            ("border-accent", st(|s| s.border_color = Some(Role::Accent))),
            (
                "border-border_strong",
                st(|s| s.border_color = Some(Role::BorderStrong)),
            ),
            ("text-accent_fg", st(|s| s.fg = Some(Role::AccentFg))),
            ("text-muted", st(|s| s.fg = Some(Role::Muted))),
            ("bg-surface2", st(|s| s.bg = Some(Role::Surface2))),
            ("bg-selection", st(|s| s.bg = Some(Role::Selection))),
            ("bold", st(|s| s.modifiers = Modifier::BOLD)),
            ("italic", st(|s| s.modifiers = Modifier::ITALIC)),
            ("underline", st(|s| s.modifiers = Modifier::UNDERLINED)),
            ("strike", st(|s| s.modifiers = Modifier::CROSSED_OUT)),
            ("dim", st(|s| s.modifiers = Modifier::DIM)),
            ("reverse", st(|s| s.modifiers = Modifier::REVERSED)),
            (
                "bold dim",
                st(|s| s.modifiers = Modifier::BOLD | Modifier::DIM),
            ),
            ("text-left", st(|s| s.align = Some(TextAlign::Left))),
            ("text-center", st(|s| s.align = Some(TextAlign::Center))),
            ("text-right", st(|s| s.align = Some(TextAlign::Right))),
            ("truncate", st(|s| s.flow = Some(Flow::Truncate))),
            ("wrap", st(|s| s.flow = Some(Flow::Wrap))),
            ("nowrap", st(|s| s.flow = Some(Flow::NoWrap))),
            ("scroll-y", st(|s| s.scroll_y = Some(true))),
            ("clip", st(|s| s.scroll_y = Some(false))),
            ("hidden", st(|s| s.hidden = true)),
            (
                "focus:text-accent",
                st(|s| s.focus = Some(Box::new(st(|f| f.fg = Some(Role::Accent))))),
            ),
            (
                "selected:bg-selection",
                st(|s| s.selected = Some(Box::new(st(|f| f.bg = Some(Role::Selection))))),
            ),
            (
                "disabled:dim",
                st(|s| s.disabled = Some(Box::new(st(|f| f.modifiers = Modifier::DIM)))),
            ),
            (
                "narrow:hidden",
                st(|s| s.narrow = Some(Box::new(st(|f| f.hidden = true)))),
            ),
            (
                "narrow:w-4",
                st(|s| s.narrow = Some(Box::new(st(|f| f.width = Some(Cells(4)))))),
            ),
        ];
        for (tok, want) in table {
            assert_eq!(parse(tok), Ok(want), "{tok}");
        }
    }

    #[test]
    fn every_vocabulary_entry_parses() {
        for v in VOCABULARY {
            let t = v.replace("-N", "-1");
            assert!(parse(&t).is_ok(), "{t}");
        }
    }

    #[test]
    fn role_classes_are_all_listed() {
        for r in Role::ALL {
            assert_eq!(Role::from_name(r.name()), Some(r));
            assert!(VOCABULARY.contains(&format!("border-{}", r.name()).as_str()));
        }
        for r in TEXT_ROLES {
            assert!(VOCABULARY.contains(&format!("text-{}", r.name()).as_str()));
        }
        for r in BG_ROLES {
            assert!(VOCABULARY.contains(&format!("bg-{}", r.name()).as_str()));
        }
        assert!(parse("text-selection").is_err());
        assert!(parse("bg-muted").is_err());
    }

    fn err(s: &str) -> ClassError {
        parse(s).expect_err(s)
    }

    #[test]
    fn unknown_tokens_error_with_token_and_suggestion() {
        let cases = [
            ("bg-primary", Some("bg-accent")),
            ("text-destructive", Some("text-danger")),
            ("border-error", Some("border-danger")),
            ("text-foreground", Some("text-fg")),
            ("bg-background", Some("bg-bg")),
            ("gap1", Some("gap-1")),
            ("gpa-4", Some("gap-4")),
            ("bodl", Some("bold")),
            ("roundd", Some("rounded")),
            ("focus:bg-primary", Some("focus:bg-accent")),
            ("focs:bold", Some("focus:bold")),
            ("row", None),
            ("col", None),
            ("zzzzzzzz", None),
            ("focus:", None),
        ];
        for (tok, sugg) in cases {
            let e = err(&format!("bold {tok}"));
            assert_eq!(e.token, tok);
            assert_eq!(e.message, "unknown class", "{tok}");
            assert_eq!(e.suggestion.as_deref(), sugg, "{tok}");
        }
    }

    #[test]
    fn out_of_range() {
        for (tok, sugg) in [
            ("gap-65", "gap-64"),
            ("gap-99", "gap-64"),
            ("w-99999999999", "w-64"),
            ("grow-17", "grow-16"),
            ("narrow:p-70", "narrow:p-64"),
        ] {
            let e = err(tok);
            assert_eq!(
                (e.token.as_str(), e.message.as_str()),
                (tok, "out of range")
            );
            assert_eq!(e.suggestion.as_deref(), Some(sugg));
        }
    }

    #[test]
    fn last_wins() {
        assert_eq!(parse("w-4 w-8").unwrap().width, Some(Size::Cells(8)));
        assert_eq!(
            parse("text-muted text-accent").unwrap().fg,
            Some(Role::Accent)
        );
        assert_eq!(
            parse("p-2 pt-0").unwrap().padding,
            Sides {
                top: Some(0),
                ..sides(2, 2, 2, 2)
            }
        );
        assert_eq!(parse("scroll-y clip").unwrap().scroll_y, Some(false));
        assert_eq!(
            parse("border border-none").unwrap().borders,
            Some(Borders::NONE)
        );
    }

    #[test]
    fn variant_rules() {
        for tok in [
            "focus:w-4",
            "selected:hidden",
            "disabled:gap-1",
            "focus:grow",
        ] {
            let e = err(tok);
            assert_eq!(e.message, "variant not allowed", "{tok}");
            assert_eq!(e.token, tok);
        }
        let e = err("focus:narrow:bold");
        assert_eq!(e.message, "variant not allowed");
        assert!(parse("narrow:hidden narrow:p-0 focus:border-accent focus:rounded").is_ok());
    }

    #[test]
    fn merge_applies_overlay() {
        let s = parse("text-muted border-t bold focus:text-accent focus:border-b focus:italic")
            .unwrap();
        let m = s.merge(s.focus.as_deref().unwrap());
        assert_eq!(m.fg, Some(Role::Accent));
        assert_eq!(m.borders, Some(Borders::TOP | Borders::BOTTOM));
        assert_eq!(m.modifiers, Modifier::BOLD | Modifier::ITALIC);
        let n = parse("border narrow:border-none").unwrap();
        assert_eq!(
            n.merge(n.narrow.as_deref().unwrap()).borders,
            Some(Borders::NONE)
        );
        assert_eq!(s.merge(&ClassStyle::default()), s);
    }

    #[test]
    fn empty_is_default() {
        assert_eq!(parse(""), Ok(ClassStyle::default()));
        assert_eq!(parse(" \t\n "), Ok(ClassStyle::default()));
    }

    #[test]
    fn cache_returns_same_rc_and_is_bounded() {
        let mut c = ClassCache::new();
        let a = c.get("p-1 bold").unwrap();
        assert!(Rc::ptr_eq(&a, &c.get("p-1 bold").unwrap()));
        assert_eq!(c.get("bg-primary"), Err(err("bg-primary")));
        for i in 0..(ClassCache::CAPACITY * 2) {
            let _ = c.get(&format!("w-{}", i % 65));
            let _ = c.get(&format!("h-{i}"));
            assert!(c.len() <= ClassCache::CAPACITY);
        }
        assert!(!c.is_empty());
    }

    #[test]
    fn fuzz_never_panics() {
        const ALPHABET: &[char] = &[
            'a', 'b', 'g', 'p', 'w', 'h', 'x', 'r', 'o', 'u', 'n', 'd', 'e', 't', '-', '/', ':',
            '0', '1', '6', '9', ' ', 'é', '\u{200b}', '_',
        ];
        let mut seed: u64 = 0x2545_f491_4f6c_dd1d;
        let mut next = || {
            seed = seed
                .wrapping_mul(6_364_136_223_846_793_005)
                .wrapping_add(1_442_695_040_888_963_407);
            usize::try_from(seed >> 33).unwrap_or(0)
        };
        let mut cache = ClassCache::new();
        for _ in 0..5_000 {
            let len = next() % 24;
            let s: String = (0..len)
                .map(|_| ALPHABET[next() % ALPHABET.len()])
                .collect();
            let r = parse(&s);
            if let Err(e) = &r {
                assert!(s.contains(e.token.as_str()));
            }
            assert_eq!(cache.get(&s).map(|r| (*r).clone()), r);
        }
        let prefixes = ["gap-", "w-", "grow-", "focus:", "narrow:", "bg-", "border-"];
        for _ in 0..5_000 {
            let tail: String = (0..next() % 8)
                .map(|_| ALPHABET[next() % ALPHABET.len()])
                .collect();
            let _ = parse(&format!("{}{tail}", prefixes[next() % prefixes.len()]));
        }
    }
}
