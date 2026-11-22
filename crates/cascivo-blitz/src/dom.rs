//! Node-level helpers over a Blitz [`BaseDocument`]: read attributes and text, set attributes,
//! toggle classes, replace text. Every write goes through [`DocumentMutator`], so styles and layout
//! update and a redraw is requested.

use blitz_dom::{Attribute, BaseDocument, LocalName, NodeId, QualName, ns};

/// A mutable view of a document.
pub struct Dom<'a>(pub(crate) &'a mut BaseDocument);

fn qn(name: &str) -> QualName {
    QualName::new(None, ns!(), LocalName::from(name))
}

impl<'a> Dom<'a> {
    pub fn new(doc: &'a mut BaseDocument) -> Self {
        Dom(doc)
    }

    /// The wrapped document.
    pub fn base(&mut self) -> &mut BaseDocument {
        self.0
    }

    /// First node matching a CSS selector.
    pub fn query(&self, selector: &str) -> Option<NodeId> {
        self.0.query_selector(selector).ok().flatten()
    }

    pub fn query_all(&self, selector: &str) -> Vec<NodeId> {
        self.0
            .query_selector_all(selector)
            .map(|v| v.to_vec())
            .unwrap_or_default()
    }

    /// First descendant of `scope` matching `selector`.
    pub fn query_in(&self, scope: NodeId, selector: &str) -> Option<NodeId> {
        self.0.query_selector_in(scope, selector).ok().flatten()
    }

    pub fn query_all_in(&self, scope: NodeId, selector: &str) -> Vec<NodeId> {
        self.0
            .query_selector_all_in(scope, selector)
            .map(|v| v.to_vec())
            .unwrap_or_default()
    }

    /// The nearest ancestor-or-self of `node` matching `selector`.
    pub fn closest(&self, node: NodeId, selector: &str) -> Option<NodeId> {
        let hits = self.query_all(selector);
        self.0
            .node_chain(node)
            .into_iter()
            .find(|n| hits.contains(n))
    }

    pub fn parent(&self, node: NodeId) -> Option<NodeId> {
        self.0.get_node(node)?.parent
    }

    /// Child nodes that are elements.
    pub fn element_children(&self, node: NodeId) -> Vec<NodeId> {
        let Some(n) = self.0.get_node(node) else {
            return Vec::new();
        };
        n.children
            .iter()
            .copied()
            .filter(|c| self.0.get_node(*c).is_some_and(|c| c.is_element()))
            .collect()
    }

    /// Lowercase tag name, if `node` is an element.
    pub fn tag(&self, node: NodeId) -> Option<String> {
        let el = self.0.get_node(node)?.element_data()?;
        Some(el.name.local.to_string())
    }

    pub fn attr(&self, node: NodeId, name: &str) -> Option<String> {
        self.0
            .get_node(node)?
            .attr(LocalName::from(name))
            .map(str::to_owned)
    }

    pub fn has_attr(&self, node: NodeId, name: &str) -> bool {
        self.0
            .get_node(node)
            .is_some_and(|n| n.attr(LocalName::from(name)).is_some())
    }

    pub fn set_attr(&mut self, node: NodeId, name: &str, value: &str) {
        if self.attr(node, name).as_deref() == Some(value) {
            return;
        }
        self.0.mutate().set_attribute(node, qn(name), value);
    }

    pub fn remove_attr(&mut self, node: NodeId, name: &str) {
        if self.has_attr(node, name) {
            self.0.mutate().clear_attribute(node, qn(name));
        }
    }

    /// Add or remove a boolean attribute (`hidden`, `open`).
    pub fn set_flag(&mut self, node: NodeId, name: &str, on: bool) {
        if on {
            if !self.has_attr(node, name) {
                self.set_attr(node, name, "");
            }
        } else {
            self.remove_attr(node, name);
        }
    }

    pub fn has_class(&self, node: NodeId, class: &str) -> bool {
        self.attr(node, "class")
            .is_some_and(|c| c.split_whitespace().any(|x| x == class))
    }

    pub fn set_class(&mut self, node: NodeId, class: &str, on: bool) {
        let cur = self.attr(node, "class").unwrap_or_default();
        let mut parts: Vec<&str> = cur.split_whitespace().filter(|c| *c != class).collect();
        if on {
            parts.push(class);
        }
        let next = parts.join(" ");
        if next != cur.split_whitespace().collect::<Vec<_>>().join(" ") {
            self.set_attr(node, "class", &next);
        }
    }

    /// Flip a class and return whether it is now set.
    pub fn toggle_class(&mut self, node: NodeId, class: &str) -> bool {
        let on = !self.has_class(node, class);
        self.set_class(node, class, on);
        on
    }

    /// Concatenated text of `node` and its descendants.
    pub fn text(&self, node: NodeId) -> String {
        self.0
            .get_node(node)
            .map(|n| n.text_content())
            .unwrap_or_default()
    }

    /// Replace the children of `node` with one text node.
    pub fn set_text(&mut self, node: NodeId, text: &str) {
        if self.text(node) == text {
            return;
        }
        let mut m = self.0.mutate();
        m.remove_and_drop_all_children(node);
        let t = m.create_text_node(text);
        m.append_children(node, &[t]);
    }

    /// Move `children` to the end of `parent`, in the given order.
    pub fn reorder(&mut self, parent: NodeId, children: &[NodeId]) {
        self.0.mutate().append_children(parent, children);
    }

    /// Parse `html` as the children of a new `<tag class=…>` and put it after `anchor`.
    pub fn insert_after(&mut self, anchor: NodeId, tag: &str, class: &str, html: &str) -> NodeId {
        let mut m = self.0.mutate();
        let node = m.create_element(
            qn(tag),
            vec![Attribute {
                name: qn("class"),
                value: class.to_owned(),
            }],
        );
        m.insert_nodes_after(anchor, &[node]);
        m.set_inner_html(node, html);
        node
    }

    pub fn focus(&mut self, node: NodeId) {
        self.0.set_focus_to(node);
    }

    /// The focused node. The root element when nothing has focus.
    pub fn focused(&self) -> Option<NodeId> {
        self.0.get_focussed_node_id()
    }

    pub fn prev_sibling(&self, node: NodeId) -> Option<NodeId> {
        let parent = self.0.get_node(self.parent(node)?)?;
        let i = parent.children.iter().position(|c| *c == node)?;
        parent.children.get(i.checked_sub(1)?).copied()
    }

    pub fn is_focusable(&self, node: NodeId) -> bool {
        self.0.get_node(node).is_some_and(|n| n.is_focussable())
    }
}
