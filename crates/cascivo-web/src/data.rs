//! `[data]`: named JSON or TOML files exposed as the template global `data.<name>`.

use std::collections::BTreeMap;
use std::path::Path;

use minijinja::Value;

pub fn load(
    root: &Path,
    entries: &BTreeMap<String, String>,
    toml_value: fn(&toml::Value) -> Value,
) -> Result<Value, String> {
    let mut m = BTreeMap::new();
    for (name, rel) in entries {
        let path = root.join(rel);
        let src = std::fs::read_to_string(&path)
            .map_err(|e| format!("data.{name}: cannot read `{rel}`: {e}"))?;
        let v = match rel.rsplit('.').next() {
            Some("json") => {
                let j: serde_json::Value =
                    serde_json::from_str(&src).map_err(|e| format!("data.{name}: `{rel}`: {e}"))?;
                Value::from(minijinja::value::Serde(&j))
            }
            Some("toml") => {
                let t: toml::Value = toml::from_str(&src)
                    .map_err(|e| format!("data.{name}: `{rel}`: {}", e.message()))?;
                toml_value(&t)
            }
            _ => return Err(format!("data.{name}: `{rel}` must end in .json or .toml")),
        };
        m.insert(name.clone(), v);
    }
    Ok(Value::from(m))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn dir(tag: &str) -> std::path::PathBuf {
        let d = std::env::temp_dir().join(format!("cvweb-data-{tag}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        std::fs::create_dir_all(&d).unwrap();
        d
    }

    fn tv(v: &toml::Value) -> Value {
        Value::from(minijinja::value::Serde(v))
    }

    #[test]
    fn json_and_toml_by_extension() {
        let d = dir("ok");
        std::fs::write(d.join("a.json"), r#"{"n": 3, "l": [1, "x"]}"#).unwrap();
        std::fs::write(d.join("b.toml"), "k = \"v\"").unwrap();
        let e = BTreeMap::from([
            ("a".to_string(), "a.json".to_string()),
            ("b".to_string(), "b.toml".to_string()),
        ]);
        let v = load(&d, &e, tv).unwrap();
        assert_eq!(
            v.get_attr("a").unwrap().get_attr("n").unwrap().as_i64(),
            Some(3)
        );
        assert_eq!(
            v.get_attr("b").unwrap().get_attr("k").unwrap().to_string(),
            "v"
        );
        let _ = std::fs::remove_dir_all(d);
    }

    #[test]
    fn errors_name_the_entry() {
        let d = dir("err");
        std::fs::write(d.join("bad.json"), "{").unwrap();
        std::fs::write(d.join("x.txt"), "").unwrap();
        let one = |n: &str, p: &str| BTreeMap::from([(n.to_string(), p.to_string())]);
        assert!(
            load(&d, &one("w", "none.json"), tv)
                .unwrap_err()
                .starts_with("data.w: cannot read")
        );
        assert!(
            load(&d, &one("w", "bad.json"), tv)
                .unwrap_err()
                .starts_with("data.w: `bad.json`")
        );
        assert!(
            load(&d, &one("w", "x.txt"), tv)
                .unwrap_err()
                .contains("must end in")
        );
        let _ = std::fs::remove_dir_all(d);
    }
}
