import { fileURLToPath } from "url";
import express, { type Express } from "express";
import fs from "fs";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function serveStatic(app: Express) {
  // When running the server in production we expect the client
  // build output to live directly in the top-level `dist` directory.
  // In development the server is executed from the `server` directory
  // while the compiled production build runs from `dist`. Resolving the
  // path using the project root ensures static files are found in both
  // scenarios.
  const distPath = path.resolve(__dirname, "..", "dist");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
