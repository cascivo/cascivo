//! AI disclosure components: ai-badge, ai-status, chain-of-thought, reasoning, sources, tool-call, prompt-suggestions. One emitter per component, matching the React markup (packages/components/src/<unit>);
//! parity cases in packages/components/test/html-conformance prove it. Handlers (revert, stop,
//! select) and the toggletip need JS, so only the static, server-rendered state is emitted.

use super::{NodeExt, emit_children};
use crate::ast::Node;
use crate::contract::{
    ai_badge, ai_status, badge, chain_of_thought, prompt_suggestions, reasoning, shimmer_text,
    sources, tool_call, visually_hidden,
};
use crate::html::{attr, esc, flag, num};
use crate::render::Cx;

pub fn emit(node: &Node, cx: &mut Cx, out: &mut String) {
    match node.spec.name {
        "ai-badge" => ai_badge_node(node, out),
        "ai-status" => ai_status_node(node, out),
        "chain-of-thought" => chain_node(node, out),
        "reasoning" => reasoning_node(node, cx, out),
        "sources" => sources_node(node, out),
        "tool-call" => tool_call_node(node, out),
        "prompt-suggestions" => suggestions_node(node, out),
        _ => {}
    }
}

fn el(out: &mut String, tag: &str, class: &str, s: &str) {
    out.push('<');
    out.push_str(tag);
    attr(out, "class", class);
    out.push('>');
    esc(out, s);
    out.push_str("</");
    out.push_str(tag);
    out.push('>');
}

fn rows(node: &Node) -> &[Vec<String>] {
    node.arg_rows(0).unwrap_or(&[])
}

fn cell(row: &[String], i: usize) -> &str {
    row.get(i).map_or("", String::as_str)
}

/// English plural of the `{count}` messages (`one` only for exactly 1).
fn counted(one: &str, other: &str, n: f64) -> String {
    let m = if (n - 1.0).abs() < f64::EPSILON {
        one
    } else {
        other
    };
    m.replace("{count}", &num(n))
}

fn shimmer(out: &mut String, s: &str) {
    el(out, "span", shimmer_text::ROOT, s);
}

const SPARKLE: &str = r#"<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 1c.6 3.9 3.1 6.4 7 7-3.9.6-6.4 3.1-7 7-.6-3.9-3.1-6.4-7-7 3.9-.6 6.4-3.1 7-7Z"></path></svg>"#;
const CHECK: &str = r#"<svg viewBox="0 0 16 16" width="16" height="16" fill="none"><path d="M3.5 8.5l3 3 6-7" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"></path></svg>"#;

/// The same glyph with `aria-hidden` on the svg itself (AiStatus hides the svg, not just its wrapper).
fn hidden_svg(svg: &str) -> String {
    svg.replacen("<svg ", r#"<svg aria-hidden="true" "#, 1)
}

// ------------------------------------------------------------------- ai-badge

/// The static marker. An `edited` badge is a revert button in React, which needs a handler;
/// without one it renders nothing, so that is all `.cv` can say.
fn ai_badge_node(node: &Node, out: &mut String) {
    if node.prop_bool("edited") {
        return;
    }
    out.push_str("<span");
    attr(out, "class", ai_badge::BADGE);
    out.push_str("><span");
    attr(out, "aria-hidden", "true");
    out.push_str(">AI</span>");
    el(out, "span", visually_hidden::ROOT, "AI-generated");
    out.push_str("</span>");
}

// ------------------------------------------------------------------ ai-status

fn ai_status_node(node: &Node, out: &mut String) {
    let status = node
        .arg_str(0)
        .or_else(|| node.prop_str("status"))
        .unwrap_or_default();
    let active = status == "thinking" || status == "generating";
    let text = node.arg_str(1).unwrap_or_else(|| {
        match status.as_str() {
            "thinking" => "Thinking…",
            "generating" => "Generating a response…",
            "complete" => "Done",
            "error" => "Something went wrong",
            _ => "Stopped",
        }
        .to_string()
    });
    out.push_str("<div");
    attr(out, "data-status", &status);
    attr(out, "class", ai_status::ROOT);
    out.push('>');
    out.push_str("<span");
    attr(out, "class", ai_status::GLYPH);
    attr(out, "aria-hidden", "true");
    out.push('>');
    out.push_str(&hidden_svg(&status_glyph(&status)));
    out.push_str("</span><span");
    attr(out, "role", "status");
    attr(out, "class", ai_status::LABEL);
    out.push('>');
    if active {
        shimmer(out, &text);
    } else {
        esc(out, &text);
    }
    out.push_str("</span></div>");
}

fn status_glyph(status: &str) -> String {
    match status {
        "thinking" | "generating" => SPARKLE.to_string(),
        "complete" => CHECK.to_string(),
        "error" => r#"<svg viewBox="0 0 16 16" width="16" height="16" fill="none"><path d="M8 4.5v4M8 11h.01" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"></path><circle cx="8" cy="8" r="6.25" stroke="currentColor" stroke-width="1.5"></circle></svg>"#.to_string(),
        _ => r#"<svg viewBox="0 0 16 16" width="16" height="16" fill="none"><circle cx="8" cy="8" r="6.25" stroke="currentColor" stroke-width="1.5"></circle><rect x="5.5" y="5.5" width="5" height="5" rx="1" fill="currentColor"></rect></svg>"#.to_string(),
    }
}

// ------------------------------------------------------------ chain-of-thought

/// `current`/`upcoming` are aliases of the catalog's progress vocabulary.
fn progress(raw: &str) -> &'static str {
    match raw {
        "active" | "current" => "active",
        "complete" => "complete",
        "error" => "error",
        _ => "pending",
    }
}

fn step_glyph(progress: &str) -> &'static str {
    match progress {
        "active" => SPARKLE,
        "complete" => CHECK,
        "error" => {
            r#"<svg viewBox="0 0 16 16" width="16" height="16" fill="none"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"></path></svg>"#
        }
        _ => {
            r#"<svg viewBox="0 0 16 16" width="16" height="16" fill="none"><circle cx="8" cy="8" r="4.5" stroke="currentColor" stroke-width="1.5"></circle></svg>"#
        }
    }
}

/// One row is `title, status, description, detail`.
fn chain_node(node: &Node, out: &mut String) {
    let items = rows(node);
    out.push_str("<ol");
    if items.iter().any(|r| progress(cell(r, 1)) == "active") {
        attr(out, "aria-busy", "true");
    }
    attr(out, "class", chain_of_thought::ROOT);
    out.push('>');
    for row in items {
        step(out, row);
    }
    out.push_str("</ol>");
}

fn step(out: &mut String, row: &[String]) {
    let p = progress(cell(row, 1));
    let (title, description, detail) = (cell(row, 0), cell(row, 2), cell(row, 3));
    out.push_str("<li");
    attr(out, "data-status", p);
    if p == "active" {
        attr(out, "aria-current", "step");
    }
    attr(out, "class", chain_of_thought::STEP);
    out.push_str("><span");
    attr(out, "class", chain_of_thought::MARKER);
    attr(out, "aria-hidden", "true");
    out.push('>');
    out.push_str(step_glyph(p));
    out.push_str("</span><div");
    attr(out, "class", chain_of_thought::BODY);
    out.push('>');
    let heading = |out: &mut String| {
        out.push_str("<span");
        attr(out, "class", chain_of_thought::TITLE);
        out.push('>');
        if p == "active" {
            shimmer(out, title);
        } else {
            esc(out, title);
        }
        out.push_str("</span>");
        let label = match p {
            "pending" => "Pending",
            "active" => "In progress",
            "complete" => "Done",
            _ => "Failed",
        };
        el(out, "span", visually_hidden::ROOT, &format!(", {label}"));
    };
    if detail.is_empty() {
        out.push_str("<div");
        attr(out, "class", chain_of_thought::HEADING);
        out.push('>');
        heading(out);
        out.push_str("</div>");
        if !description.is_empty() {
            el(out, "div", chain_of_thought::DESCRIPTION, description);
        }
    } else {
        out.push_str("<details");
        attr(out, "class", chain_of_thought::DISCLOSURE);
        out.push_str("><summary");
        attr(out, "class", chain_of_thought::SUMMARY);
        out.push('>');
        heading(out);
        out.push_str("<span");
        attr(out, "class", chain_of_thought::INDICATOR);
        attr(out, "aria-hidden", "true");
        out.push_str("></span></summary>");
        if !description.is_empty() {
            el(out, "div", chain_of_thought::DESCRIPTION, description);
        }
        el(out, "div", chain_of_thought::DETAIL, detail);
        out.push_str("</details>");
    }
    out.push_str("</div></li>");
}

// ------------------------------------------------------------------ reasoning

fn reasoning_node(node: &Node, cx: &mut Cx, out: &mut String) {
    let streaming = node.prop_bool("streaming");
    out.push_str("<details");
    if streaming {
        flag(out, "open");
        attr(out, "data-streaming", "");
    }
    attr(out, "class", reasoning::ROOT);
    out.push_str("><summary");
    attr(out, "class", reasoning::TRIGGER);
    out.push_str("><span");
    attr(out, "class", reasoning::GLYPH);
    attr(out, "aria-hidden", "true");
    out.push('>');
    out.push_str(SPARKLE);
    // The label has no stylesheet class (React's `styles.label` is undefined), so no attribute.
    out.push_str("</span><span>");
    let custom = node
        .prop_set("label")
        .then(|| node.prop_str("label"))
        .flatten();
    match custom {
        Some(l) => esc(out, &l),
        None if streaming => shimmer(out, "Thinking…"),
        None => match node.prop_num("duration") {
            None => esc(out, "Reasoning"),
            Some(n) => esc(
                out,
                &counted(
                    "Thought for {count} second",
                    "Thought for {count} seconds",
                    n,
                ),
            ),
        },
    }
    out.push_str("</span><span");
    attr(out, "class", reasoning::INDICATOR);
    attr(out, "aria-hidden", "true");
    out.push_str("></span></summary><div");
    if streaming {
        attr(out, "aria-busy", "true");
    }
    attr(out, "class", reasoning::CONTENT);
    out.push('>');
    emit_children(node, cx, out);
    out.push_str("</div></details>");
}

// -------------------------------------------------------------------- sources

/// The URL a source links to, normalised as `new URL(..).href` does for the common shapes:
/// only absolute http(s) URLs with a host become links (source URLs are untrusted model output).
fn source_href(raw: &str) -> Option<(String, String)> {
    let raw = raw.trim();
    let (scheme, rest) = raw.split_once("://")?;
    let scheme = scheme.to_ascii_lowercase();
    if scheme != "http" && scheme != "https" {
        return None;
    }
    let end = rest.find(['/', '?', '#']).unwrap_or(rest.len());
    let (authority, tail) = rest.split_at(end);
    if authority.is_empty() || authority.contains(|c: char| c.is_whitespace() || c == '\\') {
        return None;
    }
    let authority = authority.to_ascii_lowercase();
    let host_port = authority.rsplit('@').next().unwrap_or("").to_string();
    let (host, port) = match host_port.rsplit_once(':') {
        Some((h, p)) if p.chars().all(|c| c.is_ascii_digit()) => (h.to_string(), p.to_string()),
        _ => (host_port.clone(), String::new()),
    };
    if host.is_empty() {
        return None;
    }
    let default_port = (scheme == "http" && port == "80") || (scheme == "https" && port == "443");
    let authority = if default_port {
        authority
            .strip_suffix(&format!(":{port}"))
            .unwrap_or(&authority)
            .to_string()
    } else {
        authority
    };
    let tail = if tail.is_empty() || !tail.starts_with('/') {
        format!("/{tail}")
    } else {
        tail.to_string()
    };
    let hostname = host.strip_prefix("www.").unwrap_or(&host).to_string();
    Some((format!("{scheme}://{authority}{tail}"), hostname))
}

/// One row is `title, url, description`.
fn sources_node(node: &Node, out: &mut String) {
    let items = rows(node);
    let summary = counted(
        "Used {count} source",
        "Used {count} sources",
        items.len() as f64,
    );
    out.push_str("<details");
    attr(out, "class", sources::ROOT);
    out.push_str("><summary");
    attr(out, "class", sources::SUMMARY);
    out.push('>');
    esc(out, &summary);
    out.push_str("<span");
    attr(out, "class", sources::INDICATOR);
    attr(out, "aria-hidden", "true");
    out.push_str("></span></summary><ol");
    attr(out, "class", sources::LIST);
    out.push('>');
    for row in items {
        let link = source_href(cell(row, 1));
        out.push_str("<li");
        attr(out, "class", sources::ITEM);
        out.push('>');
        match &link {
            Some((href, _)) => {
                out.push_str("<a");
                attr(out, "class", sources::TITLE);
                attr(out, "href", href);
                out.push('>');
                esc(out, cell(row, 0));
                out.push_str("</a>");
            }
            None => el(out, "span", sources::TITLE, cell(row, 0)),
        }
        if let Some((_, host)) = &link {
            el(out, "span", sources::HOST, host);
        }
        if !cell(row, 2).is_empty() {
            el(out, "div", sources::DESCRIPTION, cell(row, 2));
        }
        out.push_str("</li>");
    }
    out.push_str("</ol></details>");
}

// ------------------------------------------------------------------ tool-call

fn payload(out: &mut String, s: &str) {
    out.push_str("<pre");
    attr(out, "class", tool_call::CODE);
    out.push_str("><code>");
    esc(out, s);
    out.push_str("</code></pre>");
}

fn section(out: &mut String, kind: Option<&str>, label: &str, value: &str) {
    out.push_str("<div");
    if let Some(k) = kind {
        attr(out, "data-kind", k);
    }
    attr(out, "class", tool_call::SECTION);
    out.push('>');
    el(out, "div", tool_call::SECTION_LABEL, label);
    payload(out, value);
    out.push_str("</div>");
}

fn tool_call_node(node: &Node, out: &mut String) {
    let name = node.arg_str(0).unwrap_or_default();
    let status = node
        .arg_str(1)
        .or_else(|| node.prop_str("status"))
        .unwrap_or_default();
    let (variant, label) = match status.as_str() {
        "running" => ("info", "Running"),
        "awaiting-approval" => ("warning", "Awaiting approval"),
        "complete" => ("success", "Completed"),
        "error" => ("destructive", "Error"),
        "denied" => ("secondary", "Denied"),
        _ => ("secondary", "Pending"),
    };
    let given = |k: &str| node.prop_set(k).then(|| node.prop_str(k)).flatten();
    let (input, output, error) = (given("input"), given("output"), given("error"));
    let has_body = input.is_some() || output.is_some() || error.is_some();

    let header = |out: &mut String| {
        out.push_str("<span");
        attr(out, "class", tool_call::GLYPH);
        attr(out, "aria-hidden", "true");
        out.push_str(r#"><svg viewBox="0 0 16 16" width="16" height="16" fill="none"><path d="M10.2 2.3a3.2 3.2 0 0 0-3.9 4.1L2.6 10.1a1.4 1.4 0 0 0 2 2l3.7-3.7a3.2 3.2 0 0 0 4.1-3.9l-2 2-1.8-.4-.4-1.8 2-2Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"></path></svg></span>"#);
        el(out, "code", tool_call::NAME, &name);
        out.push_str("<span");
        attr(out, "data-variant", variant);
        attr(out, "data-size", "md");
        attr(
            out,
            "class",
            &format!("{} {}", badge::ROOT, tool_call::BADGE),
        );
        out.push('>');
        esc(out, label);
        out.push_str("</span>");
    };

    out.push_str("<div");
    attr(out, "data-status", &status);
    attr(out, "class", tool_call::ROOT);
    out.push('>');
    if has_body {
        out.push_str("<details");
        attr(out, "class", tool_call::DISCLOSURE);
        if status == "error" {
            flag(out, "open");
        }
        out.push_str("><summary");
        attr(out, "class", tool_call::SUMMARY);
        out.push('>');
        header(out);
        out.push_str("<span");
        attr(out, "class", tool_call::INDICATOR);
        attr(out, "aria-hidden", "true");
        out.push_str("></span></summary><div");
        attr(out, "class", tool_call::BODY);
        out.push('>');
        if let Some(v) = &input {
            section(out, None, "Input", v);
        }
        if let Some(v) = &output {
            section(out, None, "Output", v);
        }
        if let Some(v) = &error {
            section(out, Some("error"), "Error", v);
        }
        out.push_str("</div></details>");
    } else {
        out.push_str("<div");
        attr(out, "class", tool_call::SUMMARY);
        out.push('>');
        header(out);
        out.push_str("</div>");
    }
    if let Some(a) = given("actions").filter(|a| !a.is_empty()) {
        el(out, "div", tool_call::ACTIONS, &a);
    }
    out.push_str("</div>");
}

// ---------------------------------------------------------- prompt-suggestions

fn suggestions_node(node: &Node, out: &mut String) {
    out.push_str("<div");
    attr(out, "role", "group");
    attr(out, "aria-label", "Suggested prompts");
    attr(out, "class", prompt_suggestions::ROOT);
    out.push('>');
    for row in rows(node) {
        // A comma inside a prompt splits the row into cells; put the prompt back together.
        let prompt = row.join(", ");
        out.push_str("<button");
        attr(out, "type", "button");
        attr(out, "class", prompt_suggestions::CHIP);
        out.push('>');
        esc(out, &prompt);
        out.push_str("</button>");
    }
    out.push_str("</div>");
}
