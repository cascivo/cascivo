//! Overlay emitters. `dialog` is `<cv-dialog>` around the native `<dialog>` markup of
//! `packages/components/src/modal/modal.tsx`; `toaster`/`toast` are the `<cv-toaster>` region and
//! the toast row `packages/elements/src/toaster.ts` also builds. Without the scripts (`cv-dialog.js`,
//! `cv-toaster.js`) a dialog stays closed unless `open` (then a non-modal `<dialog open>`) and
//! toasts stay on the page, which is the no-JS flash fallback.

use super::{NodeExt, emit_children};
use crate::ast::Node;
use crate::contract::{button, modal, toast};
use crate::html::{attr, esc, flag};
use crate::render::{CV_DIALOG, CV_TOASTER, Cx, DIALOG_CLOSE, DIALOG_OPEN};

pub fn emit(node: &Node, cx: &mut Cx, out: &mut String) {
    match node.spec.name {
        "dialog" => dialog(node, cx, out),
        "dialog-trigger" => trigger(node, out),
        "toaster" => toaster(node, cx, out),
        "toast" => toast_row(node, out),
        _ => emit_children(node, cx, out),
    }
}

fn non_empty(s: Option<String>) -> Option<String> {
    s.filter(|s| !s.is_empty())
}

fn dialog(node: &Node, cx: &mut Cx, out: &mut String) {
    let id = non_empty(node.prop_str("id")).unwrap_or_else(|| cx.id());
    let open = node.prop_bool("open");
    let description = non_empty(node.prop_str("description"));
    cx.scripts.insert(CV_DIALOG);
    out.push('<');
    out.push_str(CV_DIALOG);
    attr(out, "id", &id);
    if open {
        flag(out, "open");
    }
    out.push_str("><dialog");
    attr(out, "class", modal::DIALOG);
    attr(
        out,
        "data-size",
        &node.prop_str("size").unwrap_or_else(|| "md".into()),
    );
    attr(out, "aria-labelledby", &format!("{id}-title"));
    if description.is_some() {
        attr(out, "aria-describedby", &format!("{id}-desc"));
    }
    if open {
        flag(out, "open");
    }
    out.push_str("><div");
    attr(out, "class", modal::PANEL);
    out.push_str("><div");
    attr(out, "class", modal::HEADER);
    out.push_str("><h2");
    attr(out, "class", modal::TITLE);
    attr(out, "id", &format!("{id}-title"));
    out.push('>');
    esc(out, &node.arg_str(0).unwrap_or_default());
    out.push_str("</h2><button");
    attr(out, "type", "button");
    attr(out, "class", modal::CLOSE);
    flag(out, DIALOG_CLOSE);
    attr(out, "aria-label", "Close modal");
    out.push_str(">\u{d7}</button></div>");
    if let Some(d) = description {
        out.push_str("<p");
        attr(out, "class", modal::DESCRIPTION);
        attr(out, "id", &format!("{id}-desc"));
        out.push('>');
        esc(out, &d);
        out.push_str("</p>");
    }
    out.push_str("<div");
    attr(out, "class", modal::BODY);
    out.push('>');
    emit_children(node, cx, out);
    out.push_str("</div></div></dialog></");
    out.push_str(CV_DIALOG);
    out.push('>');
}

/// A button the dialog script wires: it needs no handler of its own, the document listener
/// finds `data-cv-dialog-open`.
fn trigger(node: &Node, out: &mut String) {
    out.push_str("<button");
    attr(
        out,
        "data-variant",
        &node.prop_str("variant").unwrap_or_else(|| "primary".into()),
    );
    attr(out, "data-size", "md");
    attr(out, "data-state", "idle");
    attr(out, "class", button::ROOT);
    attr(out, "type", "button");
    attr(out, DIALOG_OPEN, &node.arg_str(0).unwrap_or_default());
    out.push_str("><span");
    attr(out, "class", button::LABEL);
    out.push('>');
    esc(out, node.text.as_deref().unwrap_or(""));
    out.push_str("</span></button>");
}

fn toaster(node: &Node, cx: &mut Cx, out: &mut String) {
    cx.scripts.insert(CV_TOASTER);
    out.push('<');
    out.push_str(CV_TOASTER);
    // The server toast helper appends to `#cv-toaster`.
    attr(out, "id", CV_TOASTER);
    attr(out, "class", toast::VIEWPORT);
    attr(out, "role", "region");
    attr(out, "aria-label", "Notifications");
    out.push('>');
    emit_children(node, cx, out);
    out.push_str("</");
    out.push_str(CV_TOASTER);
    out.push('>');
}

fn toast_row(node: &Node, out: &mut String) {
    let (variant, icon) = match node.prop_str("kind").as_deref() {
        Some("success") => ("success", Some("\u{2713}")),
        Some("warning") => ("warning", Some("!")),
        Some("danger") => ("destructive", Some("\u{2715}")),
        _ => ("default", None),
    };
    let message = node.text.as_deref().unwrap_or("");
    out.push_str("<div");
    attr(out, "class", toast::TOAST);
    attr(
        out,
        "role",
        if variant == "destructive" {
            "alert"
        } else {
            "status"
        },
    );
    attr(out, "data-variant", variant);
    attr(out, "data-state", "visible");
    out.push('>');
    if let Some(i) = icon {
        out.push_str("<span");
        attr(out, "class", toast::ICON);
        attr(out, "aria-hidden", "true");
        out.push('>');
        out.push_str(i);
        out.push_str("</span>");
    }
    out.push_str("<div");
    attr(out, "class", toast::BODY);
    out.push_str("><div");
    attr(out, "class", toast::TITLE);
    out.push('>');
    match non_empty(node.prop_str("title")) {
        Some(t) => {
            esc(out, &t);
            out.push_str("</div><div");
            attr(out, "class", toast::DESCRIPTION);
            out.push('>');
            esc(out, message);
        }
        None => esc(out, message),
    }
    out.push_str("</div></div><button");
    attr(out, "type", "button");
    attr(out, "class", toast::CLOSE);
    attr(out, "aria-label", "Dismiss");
    out.push_str(">\u{d7}</button></div>");
}
