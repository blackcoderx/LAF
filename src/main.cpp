#include <arpa/inet.h>
#include <fcntl.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <unistd.h>

#include <cstring>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

const std::string DATA_FILE = "data/items.csv";

struct Item {
    int id;
    std::string name;
    std::string type;
    std::string category;
    std::string location;
    std::string date;
    std::string description;
    std::string email;
};

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

std::vector<Item> loadItems() {
    std::vector<Item> items;
    std::ifstream file(DATA_FILE);
    if (!file.is_open()) {
        return items;
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

std::string readFile(const std::string& path) {
    std::ifstream file(path);
    if (!file.is_open()) {
        return "";
    }
    std::ostringstream content;
    content << file.rdbuf();
    return content.str();
}

std::string getContentType(const std::string& path) {
    if (path.find(".css") != std::string::npos) return "text/css";
    if (path.find(".js") != std::string::npos) return "application/javascript";
    if (path.find(".html") != std::string::npos) return "text/html";
    return "text/plain";
}

std::string buildHttpResponse(const std::string& body, const std::string& contentType, int status = 200) {
    std::ostringstream response;
    response << "HTTP/1.1 " << status << " OK\r\n";
    response << "Content-Type: " << contentType << "; charset=UTF-8\r\n";
    response << "Content-Length: " << body.size() << "\r\n";
    response << "Connection: close\r\n";
    response << "\r\n";
    response << body;
    return response.str();
}

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

std::string parseBodyValue(const std::string& body, const std::string& key) {
    size_t pos = body.find(key + "=");
    if (pos == std::string::npos) return "";
    size_t start = pos + key.size() + 1;
    size_t end = body.find('&', start);
    std::string raw = body.substr(start, end - start);
    return urlDecode(raw);
}

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

    const char* portEnv = std::getenv("PORT");
    int port = portEnv ? std::atoi(portEnv) : 8080;

    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd == -1) {
        std::cerr << "Socket creation failed\n";
        return 1;
    }

    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    sockaddr_in address{};
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(port);

    if (bind(server_fd, reinterpret_cast<sockaddr*>(&address), sizeof(address)) < 0) {
        std::cerr << "Bind failed\n";
        return 1;
    }

    if (listen(server_fd, 10) < 0) {
        std::cerr << "Listen failed\n";
        return 1;
    }

    std::cout << "Server running on port " << port << "\n";

    while (true) {
        sockaddr_in clientAddress{};
        socklen_t clientSize = sizeof(clientAddress);
        int clientSocket = accept(server_fd, reinterpret_cast<sockaddr*>(&clientAddress), &clientSize);
        if (clientSocket < 0) {
            continue;
        }

        char buffer[4096];
        ssize_t bytesRead = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);
        if (bytesRead <= 0) {
            close(clientSocket);
            continue;
        }
        buffer[bytesRead] = '\0';
        std::string request(buffer);

        std::istringstream requestStream(request);
        std::string method;
        std::string path;
        requestStream >> method >> path;

        std::string response;
        if (method == "GET") {
            if (path == "/") {
                std::string body = readFile("public/index.html");
                response = buildHttpResponse(body, "text/html");
            } else if (path == "/report") {
                std::string body = readFile("public/report.html");
                response = buildHttpResponse(body, "text/html");
            } else if (path == "/api/items") {
                std::vector<Item> items = loadItems();
                std::string body = buildJsonItems(items);
                response = buildHttpResponse(body, "application/json");
            } else {
                std::string filePath = "public" + path;
                std::string body = readFile(filePath);
                if (body.empty()) {
                    response = buildHttpResponse("Not Found", "text/plain", 404);
                } else {
                    response = buildHttpResponse(body, getContentType(filePath));
                }
            }
        } else if (method == "POST" && path == "/api/items") {
            std::string body;
            size_t headerEnd = request.find("\r\n\r\n");
            if (headerEnd != std::string::npos) {
                body = request.substr(headerEnd + 4);
            }
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
        } else {
            response = buildHttpResponse("Not Found", "text/plain", 404);
        }

        send(clientSocket, response.c_str(), response.size(), 0);
        close(clientSocket);
    }

    close(server_fd);
    return 0;
}
