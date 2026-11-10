//! Stub for S4 development; S3's `render.rs` replaces this on merge.

use std::collections::BTreeSet;

use crate::brand::Brand;

#[derive(Default)]
#[allow(clippy::type_complexity)] // exact shape fixed by the plan; S3 owns this file
pub struct Options {
    pub brand: Option<Brand>,
    pub brand_resolver: Option<&'static dyn Fn(&str) -> Result<String, String>>,
    pub minify_html: bool,
}

#[derive(Default)]
pub struct Cx {
    next_id: u32,
    pub used: BTreeSet<&'static str>,
    pub scripts: BTreeSet<&'static str>,
}

impl Cx {
    pub fn id(&mut self) -> String {
        self.next_id += 1;
        format!("cv-{}", self.next_id)
    }
}
