# syntax=docker/dockerfile:1
FROM rust:1-bookworm AS build
WORKDIR /app
COPY Cargo.toml ./
COPY src ./src
COPY templates ./templates
COPY site.toml ./
RUN cargo build --release && cp target/release/__NAME__ /app/server

# distroless/cc: glibc + libgcc only, runs as nonroot, no shell.
FROM gcr.io/distroless/cc-debian12:nonroot
COPY --from=build /app/server /app/server
# The Worker serves web/dist at the edge; the container only renders HTML.
# APP_SECRET: pass it in the Worker (`envVars` on the Container class) from a secret.
ENV ADDR=0.0.0.0:8080
EXPOSE 8080
ENTRYPOINT ["/app/server"]
