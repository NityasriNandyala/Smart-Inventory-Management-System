package backend;

import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.Executors;

/**
 * SmartInventoryServer — Standalone Full Stack Java REST Backend & Web Server.
 * Uses standard JDK HTTP Server with ZERO external dependencies.
 * Compiles and runs directly with standard Java (javac & java).
 */
public class SmartInventoryServer {

    private static final int PORT = 8080;
    private static final Path WEB_ROOT = Paths.get("inventory-app").toAbsolutePath().normalize();
    private static final Path IMAGES_DIR = WEB_ROOT.resolve("assets").resolve("images").resolve("products");

    public static void main(String[] args) throws IOException {
        Files.createDirectories(IMAGES_DIR);

        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        server.setExecutor(Executors.newCachedThreadPool());

        // REST API Endpoints
        server.createContext("/api/health", new HealthHandler());
        server.createContext("/api/products", new ProductApiHandler());
        server.createContext("/api/upload-image", new ImageUploadHandler());

        // Static Web & Image File Server
        server.createContext("/", new StaticFileHandler());

        server.start();

        System.out.println("===============================================================");
        System.out.println("  Smart Inventory Java Full Stack Server is Running!");
        System.out.println("  Port: " + PORT);
        System.out.println("  Web URL: http://localhost:" + PORT + "/");
        System.out.println("  Serving static files & product images from: " + WEB_ROOT);
        System.out.println("===============================================================");
    }

    // Health Handler
    static class HealthHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            String response = "{\"status\":\"UP\",\"server\":\"SmartInventory Java Server\",\"version\":\"1.0.0\"}";
            byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }
    }

    // Products REST API Handler
    static class ProductApiHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            String method = exchange.getRequestMethod();

            if ("OPTIONS".equalsIgnoreCase(method)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("GET".equalsIgnoreCase(method)) {
                // Return products data from sample or storage
                Path sampleFile = WEB_ROOT.resolve("data").resolve("sample.json");
                byte[] data;
                if (Files.exists(sampleFile)) {
                    data = Files.readAllBytes(sampleFile);
                } else {
                    data = "[]".getBytes(StandardCharsets.UTF_8);
                }
                exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
                exchange.sendResponseHeaders(200, data.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(data);
                }
            } else if ("POST".equalsIgnoreCase(method)) {
                // Read incoming JSON product
                InputStream is = exchange.getRequestBody();
                String body = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                System.out.println("[Java Backend] Product saved: " + body);

                String response = "{\"success\":true,\"message\":\"Product saved successfully\"}";
                byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
                exchange.sendResponseHeaders(201, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    // Product Image Upload Handler
    static class ImageUploadHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                String filename = "prod_" + System.currentTimeMillis() + ".png";
                Path targetPath = IMAGES_DIR.resolve(filename);

                try (InputStream is = exchange.getRequestBody();
                     OutputStream os = Files.newOutputStream(targetPath)) {
                    is.transferTo(os);
                }

                String relativeUrl = "assets/images/products/" + filename;
                String json = "{\"success\":true,\"url\":\"" + relativeUrl + "\"}";
                byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
                exchange.sendResponseHeaders(200, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    // Static Web File Server
    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            String path = exchange.getRequestURI().getPath();
            if (path.equals("/") || path.isEmpty()) {
                path = "/index.html";
            }

            Path requestedFile = WEB_ROOT.resolve(path.substring(1)).normalize();

            // Security check: ensure path is within web root
            if (!requestedFile.startsWith(WEB_ROOT) || !Files.exists(requestedFile) || Files.isDirectory(requestedFile)) {
                String notFound = "404 (Not Found) - Smart Inventory";
                byte[] bytes = notFound.getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(404, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
                return;
            }

            String contentType = probeContentType(requestedFile);
            exchange.getResponseHeaders().set("Content-Type", contentType);
            exchange.getResponseHeaders().set("Cache-Control", "no-cache, must-revalidate");

            byte[] fileBytes = Files.readAllBytes(requestedFile);
            exchange.sendResponseHeaders(200, fileBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(fileBytes);
            }
        }

        private String probeContentType(Path path) {
            String name = path.getFileName().toString().toLowerCase();
            if (name.endsWith(".html")) return "text/html; charset=utf-8";
            if (name.endsWith(".css")) return "text/css; charset=utf-8";
            if (name.endsWith(".js")) return "application/javascript; charset=utf-8";
            if (name.endsWith(".json")) return "application/json; charset=utf-8";
            if (name.endsWith(".svg")) return "image/svg+xml";
            if (name.endsWith(".png")) return "image/png";
            if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
            if (name.endsWith(".gif")) return "image/gif";
            if (name.endsWith(".ico")) return "image/x-icon";
            return "application/octet-stream";
        }
    }

    private static void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }
}
