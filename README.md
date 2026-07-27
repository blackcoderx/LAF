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

## Notes

- The server listens on `0.0.0.0` and uses the `PORT` environment variable.
- The application is designed to be small, clear, and easy to explain for a beginner C++ project.
