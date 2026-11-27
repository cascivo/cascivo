//! The template side of forms: [`FormState`] is a minijinja object, `form` in the context.
//!
//! ```jinja
//! <cv-form><form method="post" action="/todos" hx-post="/todos" hx-target="closest cv-form" hx-swap="outerHTML">
//!   {{ form.csrf() }}
//!   {% for e in form.errors() %}<p role="alert">{{ e }}</p>{% endfor %}
//!   {{ form.field("title", label=t("todo.title"), hint=t("todo.title_hint")) }}
//!   {{ form.field("notes", label=t("todo.notes"), kind="textarea", rows=3) }}
//!   {{ form.field("prio", label=t("todo.prio"), kind="select", options=[["1", "Low"], ["2", "High"]]) }}
//!   {{ form.field("done", label=t("todo.done")) }}  {# a Rule::checkbox() #}
//! </form></cv-form>
//! ```
//!
//! `field` renders through the `field` + control contract emitters of cascivo-html, so the
//! markup is the React components' markup: `aria-invalid`, `aria-describedby` → the
//! `role="alert"` error, the submitted value kept. The [`Rule`] adds the constraint
//! attributes and one `data-cv-msg-<flag>` attribute per constraint, the translated text
//! `<cv-form>` shows when the browser finds the same failure.

use std::fmt;
use std::sync::Arc;

use cascivo_html::ast::{Node, Value as HValue};
use cascivo_html::contract::{field as cfield, label as clabel};
use cascivo_html::html::attr;
use cascivo_html::{Cx, lookup};
use minijinja::value::{Kwargs, Object, ObjectRepr, from_args};
use minijinja::{Error, ErrorKind, State, Value};
use serde::{Serialize, Serializer};

use crate::forms::{DEFAULT_MESSAGES, FormErrors, Kind, MSG_PREFIX, Msg, Rule, Values, num};

/// A form's values, errors and rules, for a template. Put it in the context as `form`
/// (`View::ctx(context! { form })`); it renders `form.field(name, …)`, `form.csrf()`,
/// `form.errors()` (form-level messages) and `form.value(name)`, and has `form.valid`.
#[derive(Debug, Clone)]
pub struct FormState {
    values: Values,
    errors: FormErrors,
    rules: &'static [(&'static str, Rule)],
    id_prefix: &'static str,
}

impl FormState {
    /// An empty form for `T`'s [`Validate::RULES`](crate::Validate::RULES).
    pub fn new<T: crate::Validate>() -> Self {
        Self::with_rules(T::RULES)
    }

    pub fn with_rules(rules: &'static [(&'static str, Rule)]) -> Self {
        Self {
            values: Values::new(),
            errors: FormErrors::default(),
            rules,
            id_prefix: "f-",
        }
    }

    /// Prefill from a struct (an edit form): scalars become strings, `true` checks a
    /// checkbox (`"on"`), `false` and `null` leave the field empty.
    pub fn values(mut self, v: impl Serialize) -> Self {
        if let Ok(serde_json::Value::Object(m)) = serde_json::to_value(v) {
            for (k, v) in m {
                let list = match v {
                    serde_json::Value::Array(a) => a.into_iter().filter_map(scalar).collect(),
                    v => scalar(v).into_iter().collect(),
                };
                self.values.insert(k, list);
            }
        }
        self
    }

    pub(crate) fn values_raw(mut self, v: Values) -> Self {
        self.values = v;
        self
    }

    /// Replace the errors (e.g. a server-only failure after a valid parse).
    pub fn errors(mut self, e: FormErrors) -> Self {
        self.errors = e;
        self
    }

    /// The id prefix of the controls (`f-` by default): two forms on one page need two.
    pub fn id_prefix(mut self, p: &'static str) -> Self {
        self.id_prefix = p;
        self
    }

    pub fn submitted(&self) -> &Values {
        &self.values
    }

    pub fn error_list(&self) -> &FormErrors {
        &self.errors
    }

    pub fn is_valid(&self) -> bool {
        self.errors.is_empty()
    }

    fn first(&self, name: &str) -> Option<&str> {
        self.values
            .get(name)
            .and_then(|v| v.first())
            .map(String::as_str)
    }
}

fn scalar(v: serde_json::Value) -> Option<String> {
    match v {
        serde_json::Value::String(s) => Some(s),
        serde_json::Value::Number(n) => Some(n.to_string()),
        serde_json::Value::Bool(true) => Some("on".into()),
        _ => None,
    }
}

impl Serialize for FormState {
    /// As a minijinja object when the context is built with minijinja (`View::ctx`), so the
    /// template gets the methods; elsewhere it serializes as its plain attributes.
    fn serialize<S: Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        Value::from_object(self.clone()).serialize(s)
    }
}

impl From<FormState> for Value {
    fn from(f: FormState) -> Self {
        Value::from_object(f)
    }
}

impl Object for FormState {
    fn repr(self: &Arc<Self>) -> ObjectRepr {
        ObjectRepr::Plain
    }

    fn get_value(self: &Arc<Self>, key: &Value) -> Option<Value> {
        match key.as_str()? {
            "valid" => Some(Value::from(self.is_valid())),
            _ => None,
        }
    }

    fn call_method(
        self: &Arc<Self>,
        state: &mut State<'_, '_>,
        method: &str,
        args: &[Value],
    ) -> Result<Value, Error> {
        match method {
            "field" => {
                let (name, kw): (&str, Kwargs) = from_args(args)?;
                let html = self.field(state, name, &kw)?;
                kw.assert_all_used()?;
                Ok(Value::from_safe_string(html))
            }
            "csrf" => {
                let (kw,): (Kwargs,) = from_args(args)?;
                let name: Option<String> = kw.get("name")?;
                kw.assert_all_used()?;
                let token = state
                    .lookup("request")
                    .and_then(|r| r.get_attr("csrf").ok())
                    .filter(|t| !t.is_undefined() && !t.is_none());
                let mut out = String::new();
                if let Some(t) = token {
                    out.push_str("<input type=\"hidden\"");
                    attr(&mut out, "name", name.as_deref().unwrap_or("csrf"));
                    attr(&mut out, "value", &t.to_string());
                    out.push('>');
                }
                Ok(Value::from_safe_string(out))
            }
            "errors" => {
                from_args::<()>(args)?;
                let list = self
                    .errors
                    .form()
                    .iter()
                    .map(|m| translate(state, m))
                    .collect::<Result<Vec<_>, _>>()?;
                Ok(Value::from(list))
            }
            "value" => {
                let (name,): (&str,) = from_args(args)?;
                Ok(self.first(name).map(Value::from).unwrap_or_default())
            }
            _ => Err(Error::from(ErrorKind::UnknownMethod)),
        }
    }

    fn render(self: &Arc<Self>, f: &mut fmt::Formatter<'_>) -> fmt::Result
    where
        Self: Sized + 'static,
    {
        f.write_str("[form]")
    }
}

fn bad(m: impl Into<std::borrow::Cow<'static, str>>) -> Error {
    Error::new(ErrorKind::InvalidOperation, m)
}

/// `t(key, **args)` with the request's locale; a built-in key the app does not translate
/// falls back to its English default.
pub(crate) fn translate(state: &mut State<'_, '_>, m: &Msg) -> Result<String, Error> {
    let mut failed = None;
    if let Some(t) = state.lookup("t") {
        let kw: Kwargs = m
            .args
            .iter()
            .map(|(k, v)| (*k, Value::from(v.as_str())))
            .collect();
        match t.call(state, &[Value::from(m.key.as_ref()), Value::from(kw)]) {
            Ok(v) => return Ok(v.to_string()),
            Err(e) => failed = Some(e),
        }
    }
    let default = m
        .key
        .strip_prefix(MSG_PREFIX)
        .and_then(|flag| DEFAULT_MESSAGES.iter().find(|(k, _)| *k == flag));
    match (default, failed) {
        (Some((_, text)), _) => {
            let mut s = (*text).to_owned();
            for (k, v) in &m.args {
                s = s.replace(&format!("{{{k}}}"), v);
            }
            Ok(s)
        }
        (None, Some(e)) => Err(e),
        (None, None) => Err(bad(format!("no message `{}` and no t()", m.key))),
    }
}

/// A field name safe in an id and a CSS selector without escaping.
fn safe_name(s: &str) -> bool {
    !s.is_empty()
        && s.bytes()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, b'_' | b'-' | b'.'))
}

fn node(
    unit: &str,
    args: Vec<HValue>,
    props: Vec<(&str, HValue)>,
    children: Vec<Node>,
) -> Result<Node, Error> {
    let spec = lookup(unit).ok_or_else(|| bad(format!("no `{unit}` emitter")))?;
    let mut ps = Vec::with_capacity(props.len());
    for (k, v) in props {
        let i = spec
            .props
            .iter()
            .position(|p| p.name == k)
            .ok_or_else(|| bad(format!("`{unit}` has no prop `{k}`")))?;
        ps.push((i, spec.props[i].name, v));
    }
    // The emitters expect catalog order (the parser's invariant).
    ps.sort_by_key(|(i, ..)| *i);
    Ok(Node {
        spec,
        args,
        props: ps.into_iter().map(|(_, k, v)| (k, v)).collect(),
        text: None,
        children,
        line: 0,
        col: 0,
    })
}

fn s(v: impl Into<String>) -> HValue {
    HValue::Str(v.into())
}

impl FormState {
    fn field(&self, state: &mut State<'_, '_>, name: &str, kw: &Kwargs) -> Result<String, Error> {
        if !safe_name(name) {
            return Err(bad(format!("field name `{name}`: use [A-Za-z0-9_.-]")));
        }
        let rule = self
            .rules
            .iter()
            .find(|(n, _)| *n == name)
            .map_or(Rule::text(), |(_, r)| *r);
        let label: Option<String> = kw.get("label")?;
        let hint: Option<String> = kw.get("hint")?;
        let placeholder: Option<String> = kw.get("placeholder")?;
        let ty: Option<String> = kw.get("type")?;
        let rows: Option<f64> = kw.get("rows")?;
        let given_value: Option<String> = kw.get("value")?;
        let options: Option<Value> = kw.get("options")?;
        let kind: Option<String> = kw.get("kind")?;
        if let Some(k @ ("radio-group" | "checkbox-group")) = kind.as_deref() {
            return self.group(state, name, k == "radio-group", &kw_group(kw)?);
        }
        let unit = match kind.as_deref() {
            Some(k @ ("input" | "textarea" | "select" | "checkbox")) => k,
            Some(k) => return Err(bad(format!("field kind `{k}`"))),
            None if rule.kind == Kind::Checkbox => "checkbox",
            None => "input",
        };
        let id = format!("{}{name}", self.id_prefix);
        let error = match self.errors.field(name).first() {
            Some(m) => Some(translate(state, m)?),
            None => None,
        };

        let mut fprops = vec![("id", s(&id))];
        if let Some(e) = error {
            fprops.push(("error", s(e)));
        }
        if let Some(h) = hint {
            fprops.push(("description", s(h)));
        }
        let mut cprops = vec![("name", s(name))];
        if rule.required {
            cprops.push(("required", HValue::Bool(true)));
        }
        let (fargs, cargs) = if unit == "checkbox" {
            let submit = given_value.unwrap_or_else(|| "on".into());
            if self.values.get(name).is_some_and(|v| v.contains(&submit)) {
                cprops.push(("checked", HValue::Bool(true)));
            }
            if submit != "on" {
                cprops.push(("value", s(submit)));
            }
            (vec![], label.map(s).into_iter().collect())
        } else {
            if rule.required {
                fprops.push(("required", HValue::Bool(true)));
            }
            if let Some(v) = given_value.or_else(|| self.first(name).map(str::to_owned)) {
                cprops.push(("value", s(v)));
            }
            if let Some(p) = placeholder {
                cprops.push(("placeholder", s(p)));
            }
            match unit {
                "input" => {
                    if let Some(t) = ty.or_else(|| rule.kind.input_type().map(str::to_owned)) {
                        cprops.push(("type", s(t)));
                    }
                }
                "textarea" => cprops.push(("rows", HValue::Num(rows.unwrap_or(4.0)))),
                _ => {}
            }
            let cargs = if unit == "select" {
                vec![HValue::Rows(rows_of(options.as_ref())?)]
            } else {
                vec![]
            };
            (label.map(s).into_iter().collect(), cargs)
        };
        let control = node(unit, cargs, cprops, vec![])?;
        let field = node("field", fargs, fprops, vec![control])?;
        let mut out = String::new();
        cascivo_html::emit::emit(&field, &mut Cx::default(), &mut out);

        let extra = self.constraints(state, &rule, unit)?;
        let marker = format!(" id=\"{id}\"");
        let at = out
            .find(&marker)
            .ok_or_else(|| bad(format!("field `{name}`: no control with{marker}")))?;
        out.insert_str(at + marker.len(), &extra);
        Ok(out)
    }

    /// `kind="radio-group"` / `"checkbox-group"`: one field around several native inputs that
    /// share `name`. The group carries `aria-invalid` and `aria-describedby` → the
    /// `role="alert"` error (a single `aria-describedby` on one input would miss the rest).
    fn group(
        &self,
        state: &mut State<'_, '_>,
        name: &str,
        radio: bool,
        g: &Group,
    ) -> Result<String, Error> {
        let rule = self
            .rules
            .iter()
            .find(|(n, _)| *n == name)
            .map_or(Rule::text(), |(_, r)| *r);
        let id = format!("{}{name}", self.id_prefix);
        let error = match self.errors.field(name).first() {
            Some(m) => Some(translate(state, m)?),
            None => None,
        };
        let chosen = self.values.get(name).map(Vec::as_slice).unwrap_or_default();
        let (ty, role) = if radio {
            ("radio", "radiogroup")
        } else {
            ("checkbox", "group")
        };
        let mut out = String::new();
        out.push_str("<div");
        attr(&mut out, "class", cfield::ROOT);
        attr(
            &mut out,
            "data-state",
            if error.is_some() {
                "invalid"
            } else {
                "default"
            },
        );
        out.push('>');
        if let Some(l) = &g.label {
            out.push_str("<span");
            attr(&mut out, "id", &format!("{id}-label"));
            attr(&mut out, "class", clabel::ROOT);
            out.push('>');
            cascivo_html::html::esc(&mut out, l);
            if rule.required {
                out.push_str("<span aria-hidden=\"true\" class=\"");
                out.push_str(clabel::MARKER);
                out.push_str("\">*</span>");
            }
            out.push_str("</span>");
        }
        out.push_str("<div");
        attr(&mut out, "id", &id);
        attr(&mut out, "role", role);
        if g.label.is_some() {
            attr(&mut out, "aria-labelledby", &format!("{id}-label"));
        }
        if error.is_some() {
            attr(&mut out, "aria-invalid", "true");
        }
        let described: Vec<String> = [
            g.hint.as_ref().map(|_| format!("{id}-description")),
            error.as_ref().map(|_| format!("{id}-error")),
        ]
        .into_iter()
        .flatten()
        .collect();
        if !described.is_empty() {
            attr(&mut out, "aria-describedby", &described.join(" "));
        }
        out.push('>');
        for (i, row) in g.options.iter().enumerate() {
            let value = row.first().map_or("", String::as_str);
            let text = row.get(1).map_or(value, String::as_str);
            let cid = format!("{id}-{i}");
            out.push_str("<label for=\"");
            cascivo_html::html::esc(&mut out, &cid);
            out.push_str("\"><input");
            attr(&mut out, "type", ty);
            attr(&mut out, "id", &cid);
            attr(&mut out, "name", name);
            attr(&mut out, "value", value);
            if chosen.iter().any(|c| c == value) {
                cascivo_html::html::flag(&mut out, "checked");
            }
            // One required radio makes the browser require a pick; a required checkbox
            // would demand every box, so the server's rule covers checkbox groups.
            if radio && rule.required {
                cascivo_html::html::flag(&mut out, "required");
            }
            out.push_str("> ");
            cascivo_html::html::esc(&mut out, text);
            out.push_str("</label>");
        }
        out.push_str("</div>");
        if let Some(h) = &g.hint {
            out.push_str("<p");
            attr(&mut out, "id", &format!("{id}-description"));
            attr(&mut out, "class", cfield::DESCRIPTION);
            out.push('>');
            cascivo_html::html::esc(&mut out, h);
            out.push_str("</p>");
        }
        if let Some(e) = &error {
            out.push_str("<p");
            attr(&mut out, "id", &format!("{id}-error"));
            attr(&mut out, "role", "alert");
            attr(&mut out, "class", cfield::ERROR);
            out.push('>');
            cascivo_html::html::esc(&mut out, e);
            out.push_str("</p>");
        }
        out.push_str("</div>");
        let msg = translate(state, &Msg::new(format!("{MSG_PREFIX}valueMissing")))?;
        if rule.required && radio {
            // The text `<cv-form>` shows when the browser blocks submit on the group.
            let marker = format!(" id=\"{id}\"");
            if let Some(at) = out.find(&marker) {
                out.insert_str(
                    at + marker.len(),
                    &format!(
                        " data-cv-msg-value-missing=\"{}\"",
                        msg.replace('"', "&quot;")
                    ),
                );
            }
        }
        Ok(out)
    }

    /// Constraint attributes of `rule` plus the translated `data-cv-msg-<flag>` of each.
    fn constraints(
        &self,
        state: &mut State<'_, '_>,
        rule: &Rule,
        unit: &str,
    ) -> Result<String, Error> {
        let mut out = String::new();
        let mut msgs: Vec<(&str, Msg)> = Vec::new();
        let builtin = |flag: &str| Msg::new(format!("{MSG_PREFIX}{flag}"));
        if rule.required {
            msgs.push(("value-missing", builtin("valueMissing")));
        }
        if matches!(rule.kind, Kind::Email | Kind::Url) {
            msgs.push(("type-mismatch", builtin("typeMismatch")));
        }
        if matches!(unit, "input" | "textarea") {
            if let Some(n) = rule.min_len {
                attr(&mut out, "minlength", &n.to_string());
                msgs.push(("too-short", builtin("tooShort").arg("min", n)));
            }
            if let Some(n) = rule.max_len {
                attr(&mut out, "maxlength", &n.to_string());
                msgs.push(("too-long", builtin("tooLong").arg("max", n)));
            }
        }
        if rule.kind == Kind::Number && unit == "input" {
            if let Some(n) = rule.min {
                attr(&mut out, "min", &num(n));
                msgs.push((
                    "range-underflow",
                    builtin("rangeUnderflow").arg("min", num(n)),
                ));
            }
            if let Some(n) = rule.max {
                attr(&mut out, "max", &num(n));
                msgs.push((
                    "range-overflow",
                    builtin("rangeOverflow").arg("max", num(n)),
                ));
            }
            // The server checks no step; without this the browser rejects 1.5 (step 1).
            attr(&mut out, "step", "any");
            msgs.push(("bad-input", builtin("badInput")));
        }
        for (flag, m) in msgs {
            let text = translate(state, &m)?;
            attr(&mut out, &format!("data-cv-msg-{flag}"), &text);
        }
        Ok(out)
    }
}

struct Group {
    label: Option<String>,
    hint: Option<String>,
    options: Vec<Vec<String>>,
}

fn kw_group(kw: &Kwargs) -> Result<Group, Error> {
    let options: Option<Value> = kw.get("options")?;
    Ok(Group {
        label: kw.get("label")?,
        hint: kw.get("hint")?,
        options: rows_of(options.as_ref())?,
    })
}

/// `options=[["v", "Text"], "plain", …]` as select rows.
fn rows_of(v: Option<&Value>) -> Result<Vec<Vec<String>>, Error> {
    let Some(v) = v else {
        return Ok(Vec::new());
    };
    let mut rows = Vec::new();
    for item in v.try_iter()? {
        if let Some(s) = item.as_str() {
            rows.push(vec![s.to_owned()]);
        } else {
            let row = item.try_iter()?.map(|c| c.to_string()).collect::<Vec<_>>();
            rows.push(row);
        }
    }
    Ok(rows)
}
