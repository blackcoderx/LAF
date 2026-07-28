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

## Running on Windows

`src/main.cpp` uses POSIX sockets (`arpa/inet.h`, `sys/socket.h`, `unistd.h`, ...), which is a Linux/macOS API. On Windows the easiest way to run this exact code, with no changes, is **WSL (Windows Subsystem for Linux)**:

1. Install WSL (one-time setup, needs a restart): open PowerShell **as Administrator** and run:
   ```powershell
   wsl --install
   ```
2. After it restarts, open the "Ubuntu" app from the Start menu and set up a Linux username/password.
3. Install a C++ compiler and `make` inside that Ubuntu shell:
   ```bash
   sudo apt update
   sudo apt install -y build-essential
   ```
4. Get the project into WSL. Either `git clone` it there directly, or, if the folder is already on your Windows drive, `cd` into it through the `/mnt/c/...` path, e.g.:
   ```bash
   cd /mnt/c/Users/<you>/path/to/LAF
   ```
5. Build and run exactly as in "Compile and run" above:
   ```bash
   make
   PORT=8080 ./laf-server
   ```
6. Open `http://localhost:8080` in your normal Windows browser - WSL forwards `localhost` automatically.

If you'd rather not install WSL, the alternative is compiling natively with **MSYS2/MinGW-w64**, but that requires rewriting the networking code in `src/main.cpp` to use Winsock (`winsock2.h`, `WSAStartup`, `closesocket`, linking `-lws2_32`) instead of POSIX sockets, since Windows doesn't provide the POSIX socket headers this file currently includes. WSL avoids all of that and is the recommended path for this project.

## Deploying to Render (with persistent storage)

This app can't run on a static host like Netlify - it's a long-running process that writes to local CSV files, and Netlify only runs static files and short-lived serverless functions. Render runs an actual persistent container, so it works.

The repo already includes what Render needs:

- **`Dockerfile`** - multi-stage build: compiles `laf-server` with `g++`, then copies just the binary + `public/` into a small `debian:bookworm-slim` runtime image. (The C++ runtime is statically linked via `-static-libgcc -static-libstdc++` in the `Makefile`, so the binary doesn't depend on whatever libstdc++ version happens to be in the runtime image.)
- **`render.yaml`** - a Render "Blueprint" that defines the web service *and* a **persistent disk** mounted at `/app/data`, which is exactly where `data/items.csv` and `data/users.csv` live (the server's working directory in the container is `/app`, and it reads/writes the relative path `data/...`). Without this disk, Render's filesystem is wiped on every redeploy/restart and every signup or report would vanish.

> **Cost note:** Render's **free** web services don't support persistent disks - only paid plans do (`render.yaml` here uses `plan: starter`). If you want this fully free, you'd need to drop the `disk:` block and accept that `data/*.csv` resets on every redeploy/restart. Check Render's current pricing before deploying.

### Steps

1. Push this repo to GitHub (Render deploys from a Git repo).
2. In the Render dashboard: **New +** -> **Blueprint**, pick this repo. Render reads `render.yaml` automatically and creates the web service plus the `lost-and-found-data` disk.
3. Wait for the first build to finish, then open the service's `*.onrender.com` URL.
4. Every subsequent deploy reuses the same disk, so accounts (`data/users.csv`) and reported items (`data/items.csv`) survive.

This was verified locally before writing these instructions: the Docker image was built and run with a mounted volume at `/app/data` (mirroring what Render's disk does), a signup + report were submitted, the container was fully stopped and restarted, and both the account and the reported item were still there afterward.

## Notes

- The server listens on `0.0.0.0` and uses the `PORT` environment variable - both required by Render (and satisfied already).
- The application is designed to be small, clear, and easy to explain for a beginner C++ project.
