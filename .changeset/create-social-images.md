---
'cascivo': minor
---

`--example social` attaches images. The composer uploads up to 4 (JPEG or PNG, 1 MB each,
each with a description) through the Worker into an R2 bucket, `SOCIAL_MEDIA`, with each user
under their own prefix. A post may use only images that user uploaded. Bluesky, LinkedIn and
Mastodon get the bytes. Threads and Buffer, which fetch images by URL, get a link to
`/api/social/media/…` signed with `AUTH_SECRET`; it is valid until a day after the post is due.
The `files` and `social` examples now share one `r2_buckets` list, and the rate-limit comment
says what it covers for `social`.
