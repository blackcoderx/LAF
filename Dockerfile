# --- Build stage: compile the C++ server ---------------------------------
FROM gcc:13 AS builder
WORKDIR /app
COPY Makefile ./
COPY src ./src
RUN make

# --- Runtime stage: just the compiled binary + the static frontend -------
FROM debian:bookworm-slim
WORKDIR /app
COPY --from=builder /app/laf-server ./laf-server
COPY public ./public
# data/ is where items.csv and users.csv live. On Fly.io this directory is
# where the persistent volume gets mounted (see fly.toml); creating it here
# means the app still works even without a volume attached (e.g. local
# `docker run`), since ensureSampleData()/saveUser() expect it to exist.
RUN mkdir -p data

EXPOSE 8080
CMD ["./laf-server"]
