# syntax=docker/dockerfile:1
FROM rust:1-bookworm AS build
WORKDIR /app
COPY Cargo.toml ./
COPY src ./src
RUN cargo build --release && cp target/release/__NAME__ /app/server

# distroless/cc: glibc + libgcc only, runs as nonroot, no shell.
FROM gcr.io/distroless/cc-debian12:nonroot
WORKDIR /app
COPY --from=build /app/server /app/server
COPY site.toml ./site/site.toml
COPY layouts ./site/layouts
COPY templates ./site/templates
ENV SITE_DIR=/app/site PORT=8080
EXPOSE 8080
ENTRYPOINT ["/app/server"]
