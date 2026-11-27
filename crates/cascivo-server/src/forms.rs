//! Forms (Phase 3, workstream B2): the [`Form`] extractor parses an urlencoded body into `T`,
//! checks the [`Rule`]s the browser checks too, then [`Validate::validate`]. An invalid
//! submission comes back as a [`FormState`] the template re-renders with `form.field(…)`
//! (see `form_view.rs`): the same values, the errors through the `field` contract emitter.
//!
//! Messages are i18n keys resolved at render time with the request's locale. The built-in
//! keys are `cascade.form.<ValidityState flag>` (`valueMissing`, `tooShort`, …), so the
//! client (`<cv-form>`) shows the same text for the same failure.

use std::borrow::Cow;
use std::collections::BTreeMap;

use axum::extract::{FromRequest, Request};
use axum::http::{StatusCode, header};
use serde::de::DeserializeOwned;

use crate::AppError;
pub use crate::form_view::FormState;

/// One message: an i18n key and its `{name}` arguments.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Msg {
    pub key: Cow<'static, str>,
    pub args: Vec<(&'static str, String)>,
}

impl Msg {
    pub fn new(key: impl Into<Cow<'static, str>>) -> Self {
        Self {
            key: key.into(),
            args: Vec::new(),
        }
    }

    pub fn arg(mut self, name: &'static str, value: impl ToString) -> Self {
        self.args.push((name, value.to_string()));
        self
    }
}

/// The built-in message keys: `cascade.form.<flag>`, named after the browser's
/// `ValidityState` flags so client and server agree on which message a failure gets.
pub const MSG_PREFIX: &str = "cascade.form.";

/// English defaults for the built-in keys, used when the app's i18n has no translation.
/// `<cv-form>` gets the resolved text from the markup, so this is the only copy.
pub const DEFAULT_MESSAGES: &[(&str, &str)] = &[
    ("valueMissing", "This field is required."),
    ("typeMismatch", "Enter a valid value."),
    ("tooShort", "Use at least {min} characters."),
    ("tooLong", "Use at most {max} characters."),
    ("rangeUnderflow", "Enter {min} or more."),
    ("rangeOverflow", "Enter {max} or less."),
    ("badInput", "Enter a valid value."),
];

fn builtin(flag: &'static str) -> Msg {
    Msg::new(format!("{MSG_PREFIX}{flag}"))
}

/// Errors per field (in the order they were added) and for the whole form.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct FormErrors {
    fields: BTreeMap<String, Vec<Msg>>,
    form: Vec<Msg>,
}

impl FormErrors {
    /// An error on `field`; the template shows the first one.
    pub fn add(&mut self, field: &str, msg: Msg) {
        self.fields.entry(field.to_owned()).or_default().push(msg);
    }

    /// An error about the whole form (`form.errors()` in the template).
    pub fn add_form(&mut self, msg: Msg) {
        self.form.push(msg);
    }

    pub fn field(&self, name: &str) -> &[Msg] {
        self.fields.get(name).map_or(&[], Vec::as_slice)
    }

    pub fn form(&self) -> &[Msg] {
        &self.form
    }

    pub fn fields(&self) -> impl Iterator<Item = (&str, &[Msg])> {
        self.fields.iter().map(|(k, v)| (k.as_str(), v.as_slice()))
    }

    pub fn is_empty(&self) -> bool {
        self.form.is_empty() && self.fields.values().all(Vec::is_empty)
    }
}

/// What the browser and the server both check: the input `type` and the `required`,
/// `minlength`/`maxlength` (UTF-16 units, as the browser counts) and `min`/`max` constraints.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Rule {
    pub kind: Kind,
    pub required: bool,
    pub min_len: Option<usize>,
    pub max_len: Option<usize>,
    pub min: Option<f64>,
    pub max: Option<f64>,
}

/// The value type a [`Rule`] checks; it sets the control (`input type`, or a checkbox).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Kind {
    Text,
    Email,
    Url,
    Number,
    Checkbox,
}

impl Kind {
    /// The `<input type>`, `None` for text and checkbox.
    pub fn input_type(self) -> Option<&'static str> {
        match self {
            Self::Email => Some("email"),
            Self::Url => Some("url"),
            Self::Number => Some("number"),
            Self::Text | Self::Checkbox => None,
        }
    }
}

impl Rule {
    const fn of(kind: Kind) -> Self {
        Self {
            kind,
            required: false,
            min_len: None,
            max_len: None,
            min: None,
            max: None,
        }
    }
    pub const fn text() -> Self {
        Self::of(Kind::Text)
    }
    pub const fn email() -> Self {
        Self::of(Kind::Email)
    }
    pub const fn url() -> Self {
        Self::of(Kind::Url)
    }
    pub const fn number() -> Self {
        Self::of(Kind::Number)
    }
    pub const fn checkbox() -> Self {
        Self::of(Kind::Checkbox)
    }
    pub const fn required(mut self) -> Self {
        self.required = true;
        self
    }
    pub const fn min_len(mut self, n: usize) -> Self {
        self.min_len = Some(n);
        self
    }
    pub const fn max_len(mut self, n: usize) -> Self {
        self.max_len = Some(n);
        self
    }
    pub const fn min(mut self, n: f64) -> Self {
        self.min = Some(n);
        self
    }
    pub const fn max(mut self, n: f64) -> Self {
        self.max = Some(n);
        self
    }

    /// The first failure for a raw submitted value (`None`: absent), in the browser's order.
    /// Empty values only fail `required`, as in the browser.
    pub fn check(&self, raw: Option<&str>) -> Option<Msg> {
        let v = raw.unwrap_or("");
        if v.is_empty() {
            return self.required.then(|| builtin("valueMissing"));
        }
        let bad = match self.kind {
            Kind::Email => !is_email(v),
            Kind::Url => !is_url(v),
            _ => false,
        };
        if bad {
            return Some(builtin("typeMismatch"));
        }
        let len = v.encode_utf16().count();
        if let Some(n) = self.min_len.filter(|n| len < *n) {
            return Some(builtin("tooShort").arg("min", n));
        }
        if let Some(n) = self.max_len.filter(|n| len > *n) {
            return Some(builtin("tooLong").arg("max", n));
        }
        if self.kind == Kind::Number {
            let Some(n) = parse_number(v) else {
                return Some(builtin("badInput"));
            };
            if let Some(m) = self.min.filter(|m| n < *m) {
                return Some(builtin("rangeUnderflow").arg("min", num(m)));
            }
            if let Some(m) = self.max.filter(|m| n > *m) {
                return Some(builtin("rangeOverflow").arg("max", num(m)));
            }
        }
        None
    }
}

/// A number as HTML writes it: `3`, not `3.0`.
pub(crate) fn num(n: f64) -> String {
    format!("{n}")
}

/// The HTML "valid floating-point number" grammar (`-1.5e3`; no `+`, no leading `.`, no
/// `inf`), which is what a number input submits.
fn parse_number(v: &str) -> Option<f64> {
    let b = v.strip_prefix('-').unwrap_or(v).as_bytes();
    let ok = b.first().is_some_and(u8::is_ascii_digit)
        && b.iter()
            .all(|c| c.is_ascii_digit() || matches!(c, b'.' | b'e' | b'E' | b'-' | b'+'));
    ok.then(|| v.parse::<f64>().ok())
        .flatten()
        .filter(|n| n.is_finite())
}

/// The WHATWG `<input type=email>` grammar.
fn is_email(v: &str) -> bool {
    let Some((local, domain)) = v.split_once('@') else {
        return false;
    };
    let local_ok = !local.is_empty()
        && local
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || ".!#$%&'*+/=?^_`{|}~-".contains(c));
    local_ok
        && domain.split('.').all(|l| {
            !l.is_empty()
                && l.len() <= 63
                && !l.starts_with('-')
                && !l.ends_with('-')
                && l.chars().all(|c| c.is_ascii_alphanumeric() || c == '-')
        })
}

/// An absolute URL as `<input type=url>` accepts it: a scheme, `:`, and no whitespace.
fn is_url(v: &str) -> bool {
    let Some((scheme, rest)) = v.split_once(':') else {
        return false;
    };
    scheme
        .chars()
        .next()
        .is_some_and(|c| c.is_ascii_alphabetic())
        && scheme
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '+' | '-' | '.'))
        && !rest.is_empty()
        && !v.chars().any(char::is_whitespace)
}

/// A form's rules and server-only checks. `RULES` render as constraint attributes too
/// (`form.field`), so the browser and `<cv-form>` check the same thing first.
pub trait Validate {
    const RULES: &'static [(&'static str, Rule)] = &[];
    /// Checks beyond [`Rule`] (uniqueness, cross-field); runs only when the rules pass.
    fn validate(&self, _errors: &mut FormErrors) {}
}

/// The submitted name → values (in order; checkbox groups repeat a name).
pub type Values = BTreeMap<String, Vec<String>>;

/// The outcome of a [`Form`]: the parsed value, or the state to re-render (with 422).
#[derive(Debug, Clone)]
pub enum Submission<T> {
    Valid(T),
    Invalid(FormState),
}

/// The largest urlencoded body [`Form`] reads (413 beyond it).
pub const FORM_LIMIT: usize = 64 * 1024;

/// Extracts an `application/x-www-form-urlencoded` body into `T`: [`Validate::RULES`] on
/// the raw values, then serde, then [`Validate::validate`]. Failures are field errors
/// (a serde error becomes `badInput` on its field), never a 400, so the user sees the form
/// again. Other content types are 415, a body over [`FORM_LIMIT`] is 413.
///
/// Empty values are dropped before serde: an empty optional field is `None`, an empty
/// required one is a missing field (`valueMissing`).
#[derive(Debug, Clone)]
pub struct Form<T>(pub Submission<T>);

impl<T, S> FromRequest<S> for Form<T>
where
    T: DeserializeOwned + Validate,
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request(req: Request, _: &S) -> Result<Self, AppError> {
        let urlencoded = req
            .headers()
            .get(header::CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .and_then(|v| v.split(';').next())
            .is_some_and(|v| {
                v.trim()
                    .eq_ignore_ascii_case("application/x-www-form-urlencoded")
            });
        if !urlencoded {
            return Err(AppError::new(
                StatusCode::UNSUPPORTED_MEDIA_TYPE,
                "form: expected application/x-www-form-urlencoded",
            ));
        }
        let bytes = axum::body::to_bytes(req.into_body(), FORM_LIMIT)
            .await
            .map_err(|_| AppError::new(StatusCode::PAYLOAD_TOO_LARGE, "form: body too large"))?;
        Ok(Self(parse::<T>(&bytes)))
    }
}

/// [`Form`] without the request: the body bytes to a [`Submission`].
pub fn parse<T: DeserializeOwned + Validate>(body: &[u8]) -> Submission<T> {
    let mut values = Values::new();
    for (k, v) in form_urlencoded::parse(body) {
        values
            .entry(k.into_owned())
            .or_default()
            .push(v.into_owned());
    }
    let mut errors = FormErrors::default();
    for (name, rule) in T::RULES {
        let raw = values
            .get(*name)
            .and_then(|v| v.first())
            .map(String::as_str);
        if let Some(m) = rule.check(raw) {
            errors.add(name, m);
        }
    }
    let non_empty = form_urlencoded::Serializer::new(String::new())
        .extend_pairs(form_urlencoded::parse(body).filter(|(_, v)| !v.is_empty()))
        .finish();
    let de = serde_html_form::Deserializer::new(form_urlencoded::parse(non_empty.as_bytes()));
    match serde_path_to_error::deserialize::<_, T>(de) {
        Ok(t) if errors.is_empty() => {
            t.validate(&mut errors);
            if errors.is_empty() {
                return Submission::Valid(t);
            }
        }
        Ok(_) => {}
        Err(e) => {
            let path = e.path().to_string();
            let text = e.inner().to_string();
            let (field, flag) = match missing_field(&text) {
                Some(f) => (f.to_owned(), "valueMissing"),
                None => (path, "badInput"),
            };
            if field == "." || field.is_empty() {
                errors.add_form(builtin(flag));
            } else if errors.field(&field).is_empty() {
                errors.add(&field, builtin(flag));
            }
        }
    }
    Submission::Invalid(
        FormState::with_rules(T::RULES)
            .values_raw(values)
            .errors(errors),
    )
}

/// serde's "missing field `name`" message (serde_html_form reports no path for it).
fn missing_field(e: &str) -> Option<&str> {
    e.strip_prefix("missing field `")?.strip_suffix('`')
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rules_follow_the_browser() {
        let r = Rule::text().required().min_len(2).max_len(3);
        let key = |v| r.check(v).map(|m| m.key.into_owned());
        assert_eq!(key(None).as_deref(), Some("cascade.form.valueMissing"));
        assert_eq!(key(Some("")).as_deref(), Some("cascade.form.valueMissing"));
        assert_eq!(key(Some("a")).as_deref(), Some("cascade.form.tooShort"));
        assert_eq!(key(Some("abcd")).as_deref(), Some("cascade.form.tooLong"));
        // Length is UTF-16 units: one emoji is two.
        assert_eq!(key(Some("😀")), None);
        assert_eq!(Rule::text().min_len(3).check(Some("")), None);
        let n = Rule::number().min(1.0).max(10.0);
        assert_eq!(n.check(Some("1e1")), None);
        assert_eq!(
            n.check(Some("0.5")),
            Some(builtin("rangeUnderflow").arg("min", 1))
        );
        assert_eq!(
            n.check(Some("11")).unwrap().args,
            vec![("max", "10".into())]
        );
        for bad in ["x", "+1", ".5", "inf", "NaN", "1e999"] {
            assert_eq!(n.check(Some(bad)), Some(builtin("badInput")), "{bad}");
        }
    }

    #[test]
    fn email_and_url_grammar() {
        for ok in ["a@b", "a.b+c@x-y.example", "x@localhost"] {
            assert!(is_email(ok), "{ok}");
        }
        for bad in ["a", "@b", "a@", "a@b..c", "a b@c", "a@-b.c", "a@b@c"] {
            assert!(!is_email(bad), "{bad}");
        }
        assert!(is_url("https://x.y/p?q") && is_url("mailto:a@b"));
        for bad in ["x", "//x", "1a:b", "https:", "https://a b"] {
            assert!(!is_url(bad), "{bad}");
        }
    }
}
