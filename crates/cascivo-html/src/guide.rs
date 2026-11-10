//! Agent-facing usage guide. `GUIDE` is generated (see `scripts/html-kit/gen-guide.ts`);
//! `guide_for` renders one component's full detail from the catalog at call time.

use std::fmt::Write;

use crate::catalog::{ArgKind, CompSpec, PropKind, lookup};

pub use crate::guide_gen::GUIDE;

fn sample(kind: ArgKind, name: &str) -> String {
    match kind {
        ArgKind::Str => format!("\"{name}\""),
        ArgKind::Num => "3".into(),
        ArgKind::Pairs => "A:3 B:5".into(),
        ArgKind::Nums => "3 5 8".into(),
        ArgKind::Rows => "Name,Age | Ann,31".into(),
    }
}

/// A minimal valid `.cv` line for `spec`: required args only.
pub(crate) fn example(spec: &CompSpec) -> String {
    let mut s = spec.name.to_string();
    for a in spec.args.iter().filter(|a| a.required) {
        s.push(' ');
        s.push_str(&sample(a.kind, a.name));
    }
    s
}

/// Full detail for one component (name or alias): signature, every prop with enum values and
/// defaults, and an example. `None` when the name is unknown.
pub fn guide_for(name: &str) -> Option<String> {
    let spec = lookup(name)?;
    let mut sig = spec.name.to_string();
    for a in spec.args {
        let (open, close) = if a.required { ('<', '>') } else { ('[', ']') };
        let _ = write!(sig, " {open}{}{close}", a.name);
    }
    let mut out = format!("{sig}\n{}\n", spec.summary);
    if !spec.aliases.is_empty() {
        let _ = writeln!(out, "aliases: {}", spec.aliases.join(", "));
    }
    match spec.children {
        crate::catalog::Children::None => out.push_str("children: none\n"),
        crate::catalog::Children::Text => out.push_str("children: a trailing \"text\"\n"),
        crate::catalog::Children::Nodes => out.push_str("children: indented nodes\n"),
    }
    if !spec.props.is_empty() {
        out.push_str("props:\n");
    }
    for p in spec.props {
        let ty = match p.kind {
            PropKind::Str => "text".to_string(),
            PropKind::Num => "number".to_string(),
            PropKind::Bool => "flag".to_string(),
            PropKind::Enum(v) => v.join("|"),
        };
        let _ = write!(out, "  {} <{ty}>", p.name);
        if let Some(d) = p.default {
            let _ = write!(out, " (default {d})");
        }
        let _ = writeln!(out, " – {}", p.summary);
    }
    let _ = writeln!(out, "example: {}", example(spec));
    Some(out)
}
