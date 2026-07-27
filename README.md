# Lost & Found Web Application

This is a simple Lost & Found web application built with a C++ backend and static frontend files.

## What it does

- Shows reported lost and found items on a Browse page.
- Lets users submit a new lost or found item on a Report page.
- Saves items to a local CSV file at `data/items.csv`.
- Uses a small HTTP server in `src/main.cpp` with basic socket handling.

## Project files

- `src/main.cpp` - simple C++ HTTP server and CSV storage logic.
- `public/index.html` - Browse page layout.
- `public/report.html` - Report page layout.
- `public/style.css` - styles for both pages.
- `public/browse.js` - fetches items and applies filters.
- `public/report.js` - sends new item form data to the backend.
- `data/items.csv` - stored items data.
- `Makefile` - build instructions.

## How the frontend sends data to C++

- `public/browse.js` fetches `/api/items` with `GET` to load all items.
- `public/report.js` sends form data to `/api/items` with `POST`.
- The browser uses `application/x-www-form-urlencoded` for the POST body.

## How items are saved

- The server reads `data/items.csv` on each request.
- New items are appended to `data/items.csv` in CSV format.
- If the CSV file is missing, the server creates it with sample items.

## Compile and run

1. Build the server:

```bash
make
```

2. Run the server:

```bash
PORT=8080 ./laf-server
```

3. Open a browser at `http://localhost:8080`

## Notes

- The server listens on `0.0.0.0` and uses the `PORT` environment variable.
- The application is designed to be small, clear, and easy to explain for a beginner C++ project.
