//! `img(...)`: resized, content-hashed copies of an image plus a ready `<img srcset>`.

use std::collections::HashMap;
use std::io::Cursor;
use std::path::Path;
use std::sync::{Arc, PoisonError};

use cascivo_html::html::esc;
use cascivo_html::path::is_safe_relative;
use image::codecs::jpeg::JpegEncoder;
use image::imageops::FilterType;
use image::{DynamicImage, ImageFormat};

use crate::assets::{hash8, split_name};
use crate::web::{Args, WebState};

pub const PARAMS: &[&str] = &[
    "src", "alt", "widths", "sizes", "class", "loading", "format", "priority",
];
const DEFAULT_WIDTHS: &[u32] = &[480, 960, 1440];
const JPEG_QUALITY: u8 = 82;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Out {
    Webp,
    Jpeg,
    Png,
}

impl Out {
    fn ext(self) -> &'static str {
        match self {
            Out::Webp => "webp",
            Out::Jpeg => "jpg",
            Out::Png => "png",
        }
    }
}

#[derive(PartialEq, Eq)]
enum Priority {
    No,
    All,
    Media(String),
}

struct Source {
    img: DynamicImage,
    format: ImageFormat,
    /// The file as read: written unchanged for `format="keep"` at the source width, because the
    /// encoder writes WebP lossless only and would grow a lossy source several times over.
    bytes: Vec<u8>,
}

/// A written variant: URL, width, height.
type Variant = (String, u32, u32);

/// Decoded sources and written variants, so repeated `img()` calls in one render are cheap.
#[derive(Default)]
pub struct Cache {
    sources: HashMap<String, Arc<Source>>,
    variants: HashMap<(String, u32, Out), Variant>,
}

fn decode(dir: &Path, rel: &str) -> Result<Source, String> {
    let full = dir.join(rel);
    let bytes = std::fs::read(&full)
        .map_err(|e| format!("img(): cannot read `{rel}` ({}): {e}", full.display()))?;
    let format = image::guess_format(&bytes).map_err(|e| format!("img(): `{rel}`: {e}"))?;
    let img = image::load_from_memory_with_format(&bytes, format)
        .map_err(|e| format!("img(): `{rel}`: {e}"))?;
    Ok(Source { img, format, bytes })
}

fn encode(img: &DynamicImage, out: Out) -> Result<Vec<u8>, String> {
    let mut buf = Cursor::new(Vec::new());
    let alpha = img.color().has_alpha() && out != Out::Jpeg;
    let img = if alpha {
        DynamicImage::ImageRgba8(img.to_rgba8())
    } else {
        DynamicImage::ImageRgb8(img.to_rgb8())
    };
    let r = match out {
        Out::Webp => img.write_to(&mut buf, ImageFormat::WebP),
        Out::Png => img.write_to(&mut buf, ImageFormat::Png),
        Out::Jpeg => img.write_with_encoder(JpegEncoder::new_with_quality(&mut buf, JPEG_QUALITY)),
    };
    r.map_err(|e| format!("img(): encode: {e}"))?;
    Ok(buf.into_inner())
}

fn target(src: &Source, format: &str) -> Result<Out, String> {
    match (format, src.format) {
        ("webp", _) | ("keep", ImageFormat::WebP) => Ok(Out::Webp),
        ("keep", ImageFormat::Jpeg) => Ok(Out::Jpeg),
        ("keep", ImageFormat::Png) => Ok(Out::Png),
        ("keep", f) => Err(format!("img(): format=\"keep\" cannot write {f:?}")),
        (f, _) => Err(format!(
            "img(): format must be \"webp\" or \"keep\", not `{f}`"
        )),
    }
}

/// Requested widths that fit the source (never upscaled), ascending; the source width if none do.
fn plan(widths: &[u32], src_w: u32) -> Vec<u32> {
    let mut w: Vec<u32> = widths.iter().copied().filter(|w| *w <= src_w).collect();
    w.sort_unstable();
    w.dedup();
    if w.is_empty() {
        w.push(src_w);
    }
    w
}

fn scaled_h(src_w: u32, src_h: u32, w: u32) -> u32 {
    let h = (u64::from(src_h) * u64::from(w) + u64::from(src_w) / 2) / u64::from(src_w);
    u32::try_from(h).unwrap_or(u32::MAX).max(1)
}

pub fn render(state: &WebState, a: &Args) -> Result<String, String> {
    let e = |m: minijinja::Error| m.to_string();
    let src_arg = a.req("src").map_err(e)?;
    let alt = a.req("alt").map_err(e)?;
    let widths = a
        .ints("widths")
        .map_err(e)?
        .unwrap_or_else(|| DEFAULT_WIDTHS.to_vec());
    if widths.is_empty() {
        return Err("img(): widths is empty".into());
    }
    // `priority=true`: the LCP image everywhere (eager, preloaded). `priority="<media query>"`:
    // the LCP image only where the query matches, e.g. a copy CSS hides on phones: the preload
    // carries the query and the <img> keeps its loading (lazy by default), so where it is
    // hidden nothing is fetched.
    let priority = match a.value("priority") {
        None => Priority::No,
        Some(v) if v.kind() == minijinja::value::ValueKind::Bool => {
            if v.is_true() {
                Priority::All
            } else {
                Priority::No
            }
        }
        Some(v) => match v.as_str() {
            Some(m) if !m.trim().is_empty() => Priority::Media(m.to_string()),
            _ => return Err("img(): priority must be true, false or a media query".into()),
        },
    };
    let loading = match (&priority, a.str("loading").map_err(e)?) {
        (Priority::All, Some(l)) if l != "eager" => {
            return Err(format!(
                "img(): priority=true loads eagerly; drop loading=\"{l}\""
            ));
        }
        (Priority::All, _) => "eager".to_string(),
        (_, l) => l.unwrap_or_else(|| "lazy".into()),
    };
    let format = a.or("format", "webp").map_err(e)?;
    let rel = src_arg.trim_start_matches('/');
    if !is_safe_relative(rel) {
        return Err(format!("img(): unsafe path `{src_arg}`"));
    }
    let dir = state.root.join(&state.cfg.images.dir);

    let mut cache = state.images.lock().unwrap_or_else(PoisonError::into_inner);
    let source = match cache.sources.get(rel) {
        Some(s) => Arc::clone(s),
        None => {
            let s = Arc::new(decode(&dir, rel)?);
            cache.sources.insert(rel.to_string(), Arc::clone(&s));
            s
        }
    };
    let out = target(&source, &format)?;
    let (sw, sh) = (source.img.width(), source.img.height());
    let (stem, _) = split_name(rel);
    let mut variants = Vec::new();
    for w in plan(&widths, sw) {
        let key = (rel.to_string(), w, out);
        if let Some(v) = cache.variants.get(&key) {
            variants.push(v.clone());
            continue;
        }
        let h = scaled_h(sw, sh, w);
        let same_format = matches!(
            (out, source.format),
            (Out::Webp, ImageFormat::WebP)
                | (Out::Jpeg, ImageFormat::Jpeg)
                | (Out::Png, ImageFormat::Png)
        );
        let bytes = if w == sw && format == "keep" && same_format {
            source.bytes.clone()
        } else if w == sw {
            encode(&source.img, out)?
        } else {
            encode(&source.img.resize_exact(w, h, FilterType::Lanczos3), out)?
        };
        let name = format!("_cw/img/{stem}-{w}.{}.{}", hash8(&bytes), out.ext());
        state.emit(name.clone(), bytes);
        let v = (format!("/{name}"), w, h);
        cache.variants.insert(key, v.clone());
        variants.push(v);
    }
    drop(cache);

    let Some((big_url, big_w, big_h)) = variants.last() else {
        return Err("img(): no variants".into());
    };
    let srcset = variants
        .iter()
        .map(|(u, w, _)| format!("{u} {w}w"))
        .collect::<Vec<_>>()
        .join(", ");
    let sizes = a.str("sizes").map_err(e)?;
    if priority != Priority::No {
        // The LCP image: preloaded from <head> (the page's finish step places it), so its
        // fetch starts with the stylesheet instead of after the parser reaches the <img>.
        let mut l = format!(
            "<link rel=\"preload\" as=\"image\" href=\"{big_url}\" imagesrcset=\"{srcset}\""
        );
        if let Some(z) = &sizes {
            l.push_str(" imagesizes=\"");
            esc(&mut l, z);
            l.push('"');
        }
        if let Priority::Media(m) = &priority {
            l.push_str(" media=\"");
            esc(&mut l, m);
            l.push('"');
        }
        l.push_str(" fetchpriority=\"high\">");
        state.preload(l);
    }
    let mut s = format!("<img src=\"{big_url}\" srcset=\"{srcset}\"");
    if let Some(z) = &sizes {
        s.push_str(" sizes=\"");
        esc(&mut s, z);
        s.push('"');
    }
    s.push_str(&format!(" width=\"{big_w}\" height=\"{big_h}\" alt=\""));
    esc(&mut s, &alt);
    s.push_str("\" loading=\"");
    esc(&mut s, &loading);
    s.push('"');
    if priority != Priority::No {
        s.push_str(" fetchpriority=\"high\"");
    }
    s.push_str(" decoding=\"async\"");
    if let Some(c) = a.str("class").map_err(e)? {
        s.push_str(" class=\"");
        esc(&mut s, &c);
        s.push('"');
    }
    s.push('>');
    Ok(s)
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use image::{ImageBuffer, Rgb};
    use minijinja::value::{Kwargs, Rest};
    use minijinja::{Environment, Value, context};

    use super::*;
    use crate::config::Config;
    use crate::vite::Vite;

    fn site_dir(tag: &str) -> PathBuf {
        let d = std::env::temp_dir().join(format!("cvweb-img-{tag}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        std::fs::create_dir_all(d.join("assets")).unwrap();
        let png: ImageBuffer<Rgb<u8>, _> =
            ImageBuffer::from_fn(40, 20, |x, y| Rgb([(x * 6) as u8, (y * 12) as u8, 90]));
        png.save(d.join("assets/pic.png")).unwrap();
        let jpg = DynamicImage::ImageRgb8(png);
        jpg.save(d.join("assets/pic.jpg")).unwrap();
        d
    }

    fn state(root: &Path) -> Arc<WebState> {
        let mut s = WebState::for_tests(Config::parse("title = \"x\"").unwrap(), Vite::default());
        s.root = root.to_path_buf();
        Arc::new(s)
    }

    fn run(st: &Arc<WebState>, call: &str) -> Result<String, String> {
        let s = Arc::clone(st);
        let mut env = Environment::new();
        env.add_function("img", move |rest: Rest<Value>, kw: Kwargs| {
            let a = Args::parse("img", PARAMS, &rest, Some(kw))?;
            render(&s, &a)
                .map(Value::from_safe_string)
                .map_err(crate::web::err)
        });
        env.render_str(call, context! {}).map_err(|e| e.to_string())
    }

    #[test]
    fn plan_never_upscales_and_keeps_one() {
        assert_eq!(plan(&[960, 480, 480, 100], 600), [100, 480]);
        assert_eq!(plan(&[960, 1440], 600), [600]);
        assert_eq!(scaled_h(40, 20, 10), 5);
        assert_eq!(scaled_h(3, 1, 1), 1);
    }

    #[test]
    fn webp_variants_srcset_and_dimensions() {
        let d = site_dir("webp");
        let st = state(&d);
        let h = run(
            &st,
            "{{ img('pic.png', 'A \"pic\"', widths=[10, 20, 80], sizes='50vw', class='c') }}",
        )
        .unwrap();
        let files = st.take_files();
        let names: Vec<&String> = files.keys().collect();
        assert_eq!(names.len(), 2, "{names:?}");
        for n in &names {
            assert!(n.starts_with("_cw/img/pic-") && n.ends_with(".webp"), "{n}");
        }
        let n10 = names
            .iter()
            .find(|n| n.starts_with("_cw/img/pic-10."))
            .unwrap();
        let n20 = names
            .iter()
            .find(|n| n.starts_with("_cw/img/pic-20."))
            .unwrap();
        let hash = n10
            .trim_start_matches("_cw/img/pic-10.")
            .trim_end_matches(".webp");
        assert_eq!(hash.len(), 8);
        assert_eq!(
            h,
            format!(
                "<img src=\"/{n20}\" srcset=\"/{n10} 10w, /{n20} 20w\" sizes=\"50vw\" width=\"20\" height=\"10\" alt=\"A &quot;pic&quot;\" loading=\"lazy\" decoding=\"async\" class=\"c\">"
            )
        );
        let big = image::load_from_memory(&files[n20.as_str()]).unwrap();
        assert_eq!((big.width(), big.height()), (20, 10));
        assert_eq!(
            image::guess_format(&files[n10.as_str()]).unwrap(),
            ImageFormat::WebP
        );
        let _ = std::fs::remove_dir_all(d);
    }

    #[test]
    fn small_source_emits_its_own_width_and_repeat_is_cached() {
        let d = site_dir("small");
        let st = state(&d);
        let a = run(&st, "{{ img('pic.png', 'x', loading='eager') }}").unwrap();
        assert!(
            a.contains("width=\"40\" height=\"20\"")
                && a.contains("loading=\"eager\"")
                && !a.contains("sizes="),
            "{a}"
        );
        assert_eq!(a.matches(" 40w").count(), 1, "{a}");
        let b = run(&st, "{{ img('/pic.png', 'x', loading='eager') }}").unwrap();
        assert_eq!(a, b);
        assert_eq!(st.take_files().len(), 1);
        let _ = std::fs::remove_dir_all(d);
    }

    #[test]
    fn keep_preserves_the_source_format() {
        let d = site_dir("keep");
        let st = state(&d);
        let a = run(&st, "{{ img('pic.jpg', 'x', widths=[20], format='keep') }}").unwrap();
        assert!(a.contains(".jpg 20w"), "{a}");
        let b = run(&st, "{{ img('pic.png', 'x', widths=[20], format='keep') }}").unwrap();
        assert!(b.contains(".png 20w"), "{b}");
        let files = st.take_files();
        let jpg = files.iter().find(|(k, _)| k.ends_with(".jpg")).unwrap().1;
        assert_eq!(image::guess_format(jpg).unwrap(), ImageFormat::Jpeg);
        let _ = std::fs::remove_dir_all(d);
    }

    #[test]
    fn priority_is_eager_high_and_queues_one_preload() {
        let d = site_dir("prio");
        let st = state(&d);
        let call = "{{ img('pic.png', 'x', widths=[10, 20], sizes='50vw', priority=true) }}";
        let h = run(&st, call).unwrap();
        assert!(
            h.contains(" loading=\"eager\" fetchpriority=\"high\" decoding=\"async\""),
            "{h}"
        );
        // the same image twice on a page is preloaded once
        run(&st, call).unwrap();
        let pre = st.take_preloads();
        assert_eq!(pre.len(), 1, "{pre:?}");
        let files = st.take_files();
        let n10 = files
            .keys()
            .find(|n| n.starts_with("_cw/img/pic-10."))
            .unwrap();
        let n20 = files
            .keys()
            .find(|n| n.starts_with("_cw/img/pic-20."))
            .unwrap();
        assert_eq!(
            pre[0],
            format!(
                "<link rel=\"preload\" as=\"image\" href=\"/{n20}\" imagesrcset=\"/{n10} 10w, /{n20} 20w\" imagesizes=\"50vw\" fetchpriority=\"high\">"
            )
        );
        // without priority: nothing queued, no fetchpriority
        let l = run(&st, "{{ img('pic.png', 'x') }}").unwrap();
        assert!(
            !l.contains("fetchpriority") && st.take_preloads().is_empty(),
            "{l}"
        );
        assert!(
            run(
                &st,
                "{{ img('pic.png', 'x', priority=true, loading='lazy') }}"
            )
            .unwrap_err()
            .contains("priority")
        );
        assert!(
            run(&st, "{{ img('pic.png', 'x', priority=1) }}")
                .unwrap_err()
                .contains("priority")
        );
        // a media query: preload only where it matches, the <img> stays lazy
        let m = run(
            &st,
            "{{ img('pic.png', 'x', widths=[20], priority='(min-width: 40rem)') }}",
        )
        .unwrap();
        assert!(
            m.contains(" loading=\"lazy\" fetchpriority=\"high\""),
            "{m}"
        );
        let pre = st.take_preloads();
        assert!(
            pre.len() == 1
                && pre[0].ends_with(" media=\"(min-width: 40rem)\" fetchpriority=\"high\">"),
            "{pre:?}"
        );
        let _ = std::fs::remove_dir_all(d);
    }

    #[test]
    fn keep_at_the_source_width_copies_the_file() {
        let d = site_dir("copy");
        let st = state(&d);
        run(&st, "{{ img('pic.jpg', 'x', widths=[40], format='keep') }}").unwrap();
        let files = st.take_files();
        let (_, bytes) = files.iter().next().unwrap();
        assert_eq!(bytes, &std::fs::read(d.join("assets/pic.jpg")).unwrap());
        let _ = std::fs::remove_dir_all(d);
    }

    #[test]
    fn errors() {
        let d = site_dir("err");
        let st = state(&d);
        assert!(
            run(&st, "{{ img('nope.png', 'x') }}")
                .unwrap_err()
                .contains("cannot read")
        );
        assert!(
            run(&st, "{{ img('../x.png', 'x') }}")
                .unwrap_err()
                .contains("unsafe path")
        );
        assert!(
            run(&st, "{{ img('pic.png', 'x', format='gif') }}")
                .unwrap_err()
                .contains("format must be")
        );
        assert!(
            run(&st, "{{ img('pic.png') }}")
                .unwrap_err()
                .contains("alt")
        );
        let _ = std::fs::remove_dir_all(d);
    }
}
