// Lost & Found web server
// -------------------------
// A small, dependency-free HTTP server written directly on top of POSIX
// (Berkeley) sockets. There is no web framework here: this file opens a
// TCP socket, accepts one connection at a time, reads the raw HTTP request
// text, decides what to do based on the method + path, and writes a raw
// HTTP response back. Everything is stored in plain CSV files under data/.
//
// POSIX sockets (arpa/inet.h, sys/socket.h, netinet/in.h, unistd.h) are a
// Linux/macOS API, so this file compiles and runs as-is on Linux/macOS or
// inside WSL on Windows. See the "Running on Windows" section in README.md
// for how to run it there without changing any code.

#include <arpa/inet.h>   // sockaddr_in, htons, INADDR_ANY
#include <fcntl.h>
#include <netinet/in.h>  // AF_INET, SOCK_STREAM
#include <sys/socket.h>  // socket(), bind(), listen(), accept(), send(), recv()
#include <sys/stat.h>    // stat() - used to check whether items.csv already exists
#include <unistd.h>      // close()

#include <cstring>
#include <fstream>
#include <iostream>
#include <map>
#include <random>
#include <sstream>
#include <string>
#include <vector>

// Where the two "tables" of data live on disk. There's no real database -
// each file is just comma-separated rows, appended to as new rows arrive.
const std::string DATA_FILE = "data/items.csv";
const std::string USERS_FILE = "data/users.csv";

// One reported lost/found item. Mirrors one line of data/items.csv.
struct Item {
    int id;
    std::string name;
    std::string type;        // "Lost" or "Found"
    std::string category;
    std::string location;
    std::string date;
    std::string description;
    std::string email;       // contact email shown on the item's card
};

// One registered student account. Mirrors one line of data/users.csv.
// NOTE: password is stored as plain text, by design, to keep this beginner
// project simple - see README.md for the trade-off this implies.
struct User {
    int id;
    std::string name;
    std::string phone;
    std::string email;
    std::string password;
};

// Logged-in sessions, kept only in memory: token -> user id.
// This works because the server handles one request at a time (see the
// accept loop in main()), so there's no risk of two requests touching this
// map at once. Restarting the server forgets every session, which is fine
// for a small class project.
std::map<std::string, int> sessions;

// Decodes an application/x-www-form-urlencoded value, e.g. turns
// "black%20backpack" into "black backpack" and "+" into a space.
std::string urlDecode(const std::string& value) {
    std::string result;
    result.reserve(value.size());
    for (size_t i = 0; i < value.size(); ++i) {
        if (value[i] == '+') {
            result.push_back(' ');
        } else if (value[i] == '%' && i + 2 < value.size()) {
            std::string hex = value.substr(i + 1, 2);
            char decoded = static_cast<char>(std::strtol(hex.c_str(), nullptr, 16));
            result.push_back(decoded);
            i += 2;
        } else {
            result.push_back(value[i]);
        }
    }
    return result;
}

// Escapes '"' and '\' so a string can be safely dropped into a hand-built
// JSON response (see buildJsonItems / the /api/me handler below).
std::string jsonEscape(const std::string& value) {
    std::string out;
    out.reserve(value.size());
    for (char c : value) {
        if (c == '"' || c == '\\') out.push_back('\\');
        out.push_back(c);
    }
    return out;
}

// Creates a random hex string to use as a session token/cookie value.
std::string generateToken() {
    static std::mt19937_64 rng(std::random_device{}());
    std::ostringstream oss;
    oss << std::hex << rng() << rng();
    return oss.str();
}

// Reads every row out of data/items.csv into memory.
// CSV format per line: id,name,type,category,location,date,description,email
std::vector<Item> loadItems() {
    std::vector<Item> items;
    std::ifstream file(DATA_FILE);
    if (!file.is_open()) {
        return items;  // no file yet = no items yet
    }
    std::string line;
    while (std::getline(file, line)) {
        if (line.empty()) continue;
        std::istringstream row(line);
        Item item;
        std::string idStr;
        std::getline(row, idStr, ',');
        std::getline(row, item.name, ',');
        std::getline(row, item.type, ',');
        std::getline(row, item.category, ',');
        std::getline(row, item.location, ',');
        std::getline(row, item.date, ',');
        std::getline(row, item.description, ',');
        std::getline(row, item.email, ',');
        item.id = std::stoi(idStr);
        items.push_back(item);
    }
    return items;
}

// Appends one item as a new line at the end of data/items.csv.
void saveItem(const Item& item) {
    std::ofstream file(DATA_FILE, std::ios::app);
    if (!file.is_open()) {
        return;
    }
    file << item.id << ","
         << item.name << ","
         << item.type << ","
         << item.category << ","
         << item.location << ","
         << item.date << ","
         << item.description << ","
         << item.email << "\n";
}

// Reads every row out of data/users.csv into memory.
// CSV format per line: id,name,phone,email,password
// (Same append-only pattern as loadItems/saveItem above.)
std::vector<User> loadUsers() {
    std::vector<User> users;
    std::ifstream file(USERS_FILE);
    if (!file.is_open()) {
        return users;  // no signups yet
    }
    std::string line;
    while (std::getline(file, line)) {
        if (line.empty()) continue;
        std::istringstream row(line);
        User user;
        std::string idStr;
        std::getline(row, idStr, ',');
        std::getline(row, user.name, ',');
        std::getline(row, user.phone, ',');
        std::getline(row, user.email, ',');
        std::getline(row, user.password, ',');
        user.id = std::stoi(idStr);
        users.push_back(user);
    }
    return users;
}

// Appends one new account as a line at the end of data/users.csv.
// Note this also *creates* the file the first time someone signs up -
// ofstream with ios::app makes the file if it doesn't already exist.
void saveUser(const User& user) {
    std::ofstream file(USERS_FILE, std::ios::app);
    if (!file.is_open()) {
        return;
    }
    file << user.id << ","
         << user.name << ","
         << user.phone << ","
         << user.email << ","
         << user.password << "\n";
}

// Simple linear search for a user by email (there's no index/database -
// the user list is small enough that this is plenty fast).
User* findUserByEmail(std::vector<User>& users, const std::string& email) {
    for (auto& user : users) {
        if (user.email == email) return &user;
    }
    return nullptr;
}

// Reads a whole file (e.g. an HTML page) into a string. Returns "" if the
// file doesn't exist, which the caller treats as a 404.
std::string readFile(const std::string& path) {
    std::ifstream file(path);
    if (!file.is_open()) {
        return "";
    }
    std::ostringstream content;
    content << file.rdbuf();
    return content.str();
}

// Picks a Content-Type header based on the file extension, so the browser
// knows how to treat static files served out of public/.
std::string getContentType(const std::string& path) {
    if (path.find(".css") != std::string::npos) return "text/css";
    if (path.find(".js") != std::string::npos) return "application/javascript";
    if (path.find(".html") != std::string::npos) return "text/html";
    return "text/plain";
}

// Builds a complete raw HTTP response (status line + headers + body) as one
// string, ready to send() straight to the socket. `extraHeaders` lets a
// caller attach extra lines like "Set-Cookie: ...\r\n" (must include the
// trailing \r\n itself).
std::string buildHttpResponse(const std::string& body, const std::string& contentType, int status = 200, const std::string& extraHeaders = "") {
    std::ostringstream response;
    response << "HTTP/1.1 " << status << " OK\r\n";
    response << "Content-Type: " << contentType << "; charset=UTF-8\r\n";
    response << "Content-Length: " << body.size() << "\r\n";
    response << extraHeaders;
    response << "Connection: close\r\n";
    response << "\r\n";
    response << body;
    return response.str();
}

// Turns the list of items into a JSON array string for GET /api/items.
// (Hand-rolled JSON - fine here since item fields don't normally contain
// quote characters, but note this doesn't escape them the way jsonEscape
// does for the newer /api/me endpoint below.)
std::string buildJsonItems(const std::vector<Item>& items) {
    std::ostringstream json;
    json << "[";
    for (size_t i = 0; i < items.size(); ++i) {
        const Item& item = items[i];
        json << "{"
             << "\"id\":" << item.id << ","
             << "\"name\":\"" << item.name << "\","
             << "\"type\":\"" << item.type << "\","
             << "\"category\":\"" << item.category << "\","
             << "\"location\":\"" << item.location << "\","
             << "\"date\":\"" << item.date << "\","
             << "\"description\":\"" << item.description << "\","
             << "\"email\":\"" << item.email << "\"}"
             << (i + 1 < items.size() ? "," : "");
    }
    json << "]";
    return json.str();
}

// Pulls one field out of an "a=1&b=2&c=3" style POST body (the format
// the browser sends for application/x-www-form-urlencoded forms).
std::string parseBodyValue(const std::string& body, const std::string& key) {
    size_t pos = body.find(key + "=");
    if (pos == std::string::npos) return "";
    size_t start = pos + key.size() + 1;
    size_t end = body.find('&', start);
    std::string raw = body.substr(start, end - start);
    return urlDecode(raw);
}

// Pulls one cookie value out of the raw request text, e.g. given a
// "Cookie: session=abc123; other=x" header and key="session", returns
// "abc123". The request parsing in main() only reads the method/path
// (see requestStream >> method >> path below) and ignores headers
// otherwise, so this is the one place headers actually get read.
std::string getCookieValue(const std::string& request, const std::string& key) {
    size_t headerEnd = request.find("\r\n\r\n");
    std::string headers = headerEnd != std::string::npos ? request.substr(0, headerEnd) : request;
    size_t cookiePos = headers.find("Cookie:");
    if (cookiePos == std::string::npos) return "";
    size_t lineStart = cookiePos + 7;
    size_t lineEnd = headers.find("\r\n", lineStart);
    std::string cookieLine = headers.substr(lineStart, (lineEnd == std::string::npos ? headers.size() : lineEnd) - lineStart);

    size_t pos = cookieLine.find(key + "=");
    if (pos == std::string::npos) return "";
    size_t start = pos + key.size() + 1;
    size_t end = cookieLine.find(';', start);
    std::string value = cookieLine.substr(start, end - start);
    while (!value.empty() && value.front() == ' ') value.erase(value.begin());
    while (!value.empty() && (value.back() == ' ' || value.back() == '\r')) value.pop_back();
    return value;
}

// Looks at the request's "session" cookie and, if it matches a live
// session, returns a pointer to that logged-in user (else nullptr).
// This is what "being logged in" means throughout this file - there's no
// separate concept of an authenticated request beyond "has a valid
// session cookie that's in the `sessions` map".
User* getSessionUser(const std::string& request, std::vector<User>& users) {
    std::string token = getCookieValue(request, "session");
    if (token.empty()) return nullptr;
    auto it = sessions.find(token);
    if (it == sessions.end()) return nullptr;
    for (auto& user : users) {
        if (user.id == it->second) return &user;
    }
    return nullptr;
}

// On first run there's no data/items.csv yet, so seed it with a few
// example items to make the app worth looking at immediately.
void ensureSampleData() {
    struct stat buffer;
    if (stat(DATA_FILE.c_str(), &buffer) != 0) {
        std::ofstream out(DATA_FILE);
        out << "1,Black HP Laptop,Found,Electronics,Library,2026-07-25,Black laptop found near the library.,contact@example.com\n";
        out << "2,Blue Hydro Flask,Lost,Other,Gymnasium,2026-07-24,Blue water bottle with sticker.,contact@example.com\n";
        out << "3,AirPods Pro (White),Found,Electronics,Cafeteria,2026-07-26,White AirPods case found on table.,contact@example.com\n";
    }
}

int main() {
    ensureSampleData();

    // PORT lets you run several instances on different ports (the dev
    // container's app previews rely on this); defaults to 8080 otherwise.
    const char* portEnv = std::getenv("PORT");
    int port = portEnv ? std::atoi(portEnv) : 8080;

    // --- Set up one TCP listening socket -----------------------------
    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd == -1) {
        std::cerr << "Socket creation failed\n";
        return 1;
    }

    // Lets the server restart and rebind the same port immediately,
    // instead of the OS holding it in TIME_WAIT for a while.
    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    sockaddr_in address{};
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;  // listen on all network interfaces
    address.sin_port = htons(port);        // host-to-network byte order

    if (bind(server_fd, reinterpret_cast<sockaddr*>(&address), sizeof(address)) < 0) {
        std::cerr << "Bind failed\n";
        return 1;
    }

    if (listen(server_fd, 10) < 0) {  // 10 = max queued pending connections
        std::cerr << "Listen failed\n";
        return 1;
    }

    std::cout << "Server running on port " << port << "\n";

    // --- Main loop: accept one connection, handle it fully, repeat ----
    // This server is intentionally single-threaded and handles requests
    // one at a time (no worker threads, no async I/O). That keeps the
    // code simple and, as a side effect, is exactly why `sessions` above
    // doesn't need any locking.
    while (true) {
        sockaddr_in clientAddress{};
        socklen_t clientSize = sizeof(clientAddress);
        int clientSocket = accept(server_fd, reinterpret_cast<sockaddr*>(&clientAddress), &clientSize);
        if (clientSocket < 0) {
            continue;
        }

        // Read the request in one shot. 4096 bytes is enough for the
        // small forms this app has; a bigger upload would get truncated.
        char buffer[4096];
        ssize_t bytesRead = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);
        if (bytesRead <= 0) {
            close(clientSocket);
            continue;
        }
        buffer[bytesRead] = '\0';
        std::string request(buffer);

        // Only the first line of the request is actually parsed here -
        // e.g. "GET /report HTTP/1.1" becomes method="GET", path="/report".
        // Headers (Cookie, Content-Type, ...) are read separately, on
        // demand, by getCookieValue()/the body-extraction code below.
        std::istringstream requestStream(request);
        std::string method;
        std::string path;
        requestStream >> method >> path;

        std::string response;
        if (method == "GET") {
            // --- Pages -----------------------------------------------
            if (path == "/") {
                std::string body = readFile("public/index.html");
                response = buildHttpResponse(body, "text/html");
            } else if (path == "/report") {
                std::string body = readFile("public/report.html");
                response = buildHttpResponse(body, "text/html");
            } else if (path == "/login") {
                std::string body = readFile("public/login.html");
                response = buildHttpResponse(body, "text/html");
            // --- JSON APIs ---------------------------------------------
            } else if (path == "/api/items") {
                std::vector<Item> items = loadItems();
                std::string body = buildJsonItems(items);
                response = buildHttpResponse(body, "application/json");
            } else if (path == "/api/me") {
                // Tells the frontend whether the visitor is logged in, and
                // if so, who they are - used to show "Hi, <name>" in the
                // header and to unlock the report form.
                std::vector<User> users = loadUsers();
                User* user = getSessionUser(request, users);
                std::string body = user
                    ? "{\"loggedIn\":true,\"name\":\"" + jsonEscape(user->name) + "\",\"email\":\"" + jsonEscape(user->email) + "\"}"
                    : "{\"loggedIn\":false}";
                response = buildHttpResponse(body, "application/json");
            } else {
                // --- Static files (style.css, browse.js, images, ...) --
                std::string filePath = "public" + path;
                std::string body = readFile(filePath);
                if (body.empty()) {
                    response = buildHttpResponse("Not Found", "text/plain", 404);
                } else {
                    response = buildHttpResponse(body, getContentType(filePath));
                }
            }
        } else if (method == "POST") {
            // The request body sits right after the blank line that ends
            // the headers ("\r\n\r\n"); every POST route below needs it.
            std::string body;
            size_t headerEnd = request.find("\r\n\r\n");
            if (headerEnd != std::string::npos) {
                body = request.substr(headerEnd + 4);
            }

            if (path == "/api/items") {
                // Reporting an item requires being logged in. This is the
                // one place that actually enforces it - the frontend also
                // hides the report form when logged out, but that's just
                // UX; this check is what actually protects the data.
                std::vector<User> users = loadUsers();
                User* sessionUser = getSessionUser(request, users);
                if (!sessionUser) {
                    response = buildHttpResponse("{\"status\":\"error\",\"message\":\"Please log in to report an item.\"}", "application/json");
                } else {
                    Item item;
                    std::vector<Item> items = loadItems();
                    item.id = items.empty() ? 1 : items.back().id + 1;
                    item.name = parseBodyValue(body, "name");
                    item.type = parseBodyValue(body, "type");
                    item.category = parseBodyValue(body, "category");
                    item.location = parseBodyValue(body, "location");
                    item.description = parseBodyValue(body, "description");
                    item.email = parseBodyValue(body, "email");
                    item.date = parseBodyValue(body, "date");
                    if (item.date.empty()) {
                        item.date = "2026-07-27";
                    }
                    saveItem(item);
                    response = buildHttpResponse("{\"status\":\"saved\"}", "application/json");
                }
            } else if (path == "/api/signup") {
                // Create a new account, then immediately log the user in
                // (same as /api/login below: issue a token, remember it in
                // `sessions`, and hand it back as a cookie).
                std::string name = parseBodyValue(body, "name");
                std::string phone = parseBodyValue(body, "phone");
                std::string email = parseBodyValue(body, "email");
                std::string password = parseBodyValue(body, "password");
                std::vector<User> users = loadUsers();
                if (name.empty() || phone.empty() || email.empty() || password.empty()) {
                    response = buildHttpResponse("{\"status\":\"error\",\"message\":\"Please fill in all fields.\"}", "application/json");
                } else if (findUserByEmail(users, email) != nullptr) {
                    response = buildHttpResponse("{\"status\":\"error\",\"message\":\"Email already registered\"}", "application/json");
                } else {
                    User user;
                    user.id = users.empty() ? 1 : users.back().id + 1;
                    user.name = name;
                    user.phone = phone;
                    user.email = email;
                    user.password = password;
                    saveUser(user);
                    std::string token = generateToken();
                    sessions[token] = user.id;
                    std::string cookie = "Set-Cookie: session=" + token + "; Path=/; HttpOnly\r\n";
                    response = buildHttpResponse("{\"status\":\"saved\"}", "application/json", 200, cookie);
                }
            } else if (path == "/api/login") {
                // Plain-text password compare (see the User struct note
                // above about why passwords aren't hashed here).
                std::string email = parseBodyValue(body, "email");
                std::string password = parseBodyValue(body, "password");
                std::vector<User> users = loadUsers();
                User* user = findUserByEmail(users, email);
                if (user == nullptr || user->password != password) {
                    response = buildHttpResponse("{\"status\":\"error\",\"message\":\"Invalid email or password\"}", "application/json");
                } else {
                    std::string token = generateToken();
                    sessions[token] = user->id;
                    std::string cookie = "Set-Cookie: session=" + token + "; Path=/; HttpOnly\r\n";
                    response = buildHttpResponse("{\"status\":\"ok\"}", "application/json", 200, cookie);
                }
            } else if (path == "/api/logout") {
                // Forget the session server-side, and tell the browser to
                // drop the cookie too (Max-Age=0 expires it immediately).
                std::string token = getCookieValue(request, "session");
                if (!token.empty()) sessions.erase(token);
                std::string cookie = "Set-Cookie: session=; Path=/; Max-Age=0; HttpOnly\r\n";
                response = buildHttpResponse("{\"status\":\"ok\"}", "application/json", 200, cookie);
            } else {
                response = buildHttpResponse("Not Found", "text/plain", 404);
            }
        } else {
            response = buildHttpResponse("Not Found", "text/plain", 404);
        }

        send(clientSocket, response.c_str(), response.size(), 0);
        close(clientSocket);  // Connection: close above means one request per connection
    }

    close(server_fd);
    return 0;
}
