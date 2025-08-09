// Import config first to ensure environment variables and path polyfills are loaded
import "./config";

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./vite";
import { log } from "./logger";
import cors from "cors";
import { SERVER_CONFIG } from "./config";

const app = express();

// IMPORTANT: Set trust proxy to handle cookies behind proxies
app.set('trust proxy', 1);

// Enable CORS for all routes with proper settings for authentication
app.use(cors({
  origin: true, // Allow requests from any origin in development
  credentials: true, // Critical for cookies/authentication
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 600 // Cache preflight requests for 10 minutes
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add headers that ensure proper cookie handling
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Server configuration
  server.listen({
    port: SERVER_CONFIG.port,
    host: SERVER_CONFIG.host,
    reusePort: true,
  }, () => {
    log(`serving on port ${SERVER_CONFIG.port}`);
  });
})();
