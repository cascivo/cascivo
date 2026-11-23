//! SSE framing (htmx and Datastar) and the `Hub` fan-out.

use axum::http::header;
use cascivo_server::{Fragment, sse};
use futures_util::stream;

async fn body(frags: Vec<Fragment>) -> (String, String) {
    let res = sse(stream::iter(frags));
    let ct = res.headers()[header::CONTENT_TYPE]
        .to_str()
        .unwrap()
        .to_owned();
    let b = axum::body::to_bytes(res.into_body(), 1 << 20)
        .await
        .unwrap();
    (ct, String::from_utf8(b.to_vec()).unwrap())
}

#[tokio::test]
async fn htmx_framing() {
    let (ct, b) = body(vec![
        Fragment::new("count", "<b>1</b>"),
        Fragment::new("list", "<li>a</li>\n<li>b</li>\r\n<li>c</li>\r"),
        // Would inject a field: dropped.
        Fragment::new("x\ndata: evil", "<p>"),
        Fragment::new("", "<p>"),
    ])
    .await;
    assert_eq!(ct, "text/event-stream");
    assert_eq!(
        b,
        "event: count\ndata: <b>1</b>\n\n\
         event: list\ndata: <li>a</li>\ndata: <li>b</li>\ndata: <li>c</li>\ndata: \n\n"
    );
}

#[cfg(feature = "datastar")]
#[tokio::test]
async fn datastar_framing() {
    use cascivo_server::{PatchMode, patch_elements, patch_signals};
    let (_, b) = body(vec![
        patch_elements("<div id=\"a\">1</div>", None, PatchMode::Outer),
        patch_elements(
            "<li>x</li>\n<li>y</li>",
            Some("#list\nmode remove"),
            PatchMode::Append,
        ),
        patch_signals(&serde_json::json!({ "n": "a\nb" })).unwrap(),
    ])
    .await;
    assert_eq!(
        b,
        "event: datastar-patch-elements\ndata: elements <div id=\"a\">1</div>\n\n\
         event: datastar-patch-elements\ndata: selector #list\ndata: mode append\n\
         data: elements <li>x</li>\ndata: elements <li>y</li>\n\n\
         event: datastar-patch-signals\ndata: signals {\"n\":\"a\\nb\"}\n\n"
    );
}

#[cfg(feature = "native")]
mod hub {
    use cascivo_server::{Fragment, Hub, HubError};
    use futures_util::StreamExt;

    #[tokio::test]
    async fn publish_subscribe() {
        let hub: Hub<Fragment> = Hub::new(&["feed", "room:*"]);
        assert_eq!(hub.publish("feed", Fragment::new("e", "0")), Ok(0));
        let mut a = hub.subscribe("feed", "s1").unwrap();
        let mut b = hub.subscribe("room:42", "s2").unwrap();
        assert_eq!(hub.publish("feed", Fragment::new("e", "1")), Ok(1));
        assert_eq!(hub.publish("room:42", Fragment::new("e", "2")), Ok(1));
        assert_eq!(a.next().await.unwrap().html, "1");
        assert_eq!(b.next().await.unwrap().html, "2");
    }

    #[test]
    fn topics_are_allowlisted() {
        let hub: Hub<u8> = Hub::new(&["feed", "room:*"]);
        for bad in [
            "other",
            "room:",
            "room:a/b",
            "room:a\nb",
            "feed2",
            &format!("room:{}", "x".repeat(65)),
        ] {
            assert_eq!(
                hub.subscribe(bad, "k").err(),
                Some(HubError::UnknownTopic),
                "{bad:?}"
            );
            assert_eq!(hub.publish(bad, 1), Err(HubError::UnknownTopic));
        }
        assert!(hub.allows("room:a-B_9"));
    }

    #[test]
    fn cap_per_key_released_on_drop() {
        let hub: Hub<u8> = Hub::new(&["feed"]).max_per_key(2);
        let a = hub.subscribe("feed", "s1").unwrap();
        let _b = hub.subscribe("feed", "s1").unwrap();
        assert_eq!(
            hub.subscribe("feed", "s1").err(),
            Some(HubError::TooManySubscriptions)
        );
        assert!(hub.subscribe("feed", "s2").is_ok(), "other keys unaffected");
        assert_eq!(hub.subscriptions("s1"), 2);
        drop(a);
        assert_eq!(hub.subscriptions("s1"), 1);
        assert!(hub.subscribe("feed", "s1").is_ok());
    }

    #[tokio::test]
    async fn lagging_subscriber_skips() {
        let hub: Hub<u32> = Hub::new(&["feed"]).capacity(2);
        let mut s = hub.subscribe("feed", "k").unwrap();
        for i in 0..5 {
            hub.publish("feed", i).unwrap();
        }
        assert_eq!(s.next().await, Some(3));
        assert_eq!(s.next().await, Some(4));
    }

    #[tokio::test]
    async fn hub_into_sse() {
        let hub: Hub<Fragment> = Hub::new(&["feed"]);
        let sub = hub.subscribe("feed", "k").unwrap();
        hub.publish("feed", Fragment::new("e", "<p>x</p>")).unwrap();
        drop(hub);
        // Ends when every sender is gone.
        let res = cascivo_server::sse(sub.take(1));
        let b = axum::body::to_bytes(res.into_body(), 1 << 20)
            .await
            .unwrap();
        assert!(
            String::from_utf8(b.to_vec())
                .unwrap()
                .contains("event: e\ndata: <p>x</p>\n\n")
        );
    }
}
