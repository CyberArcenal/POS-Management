// src/main/protocols/imageProtocol.js
const { protocol } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const { app } = require("electron");

const IMAGES_BASE_DIR = path.join(app.getPath("userData"), "images");

/**
 * Register custom protocol 'app-image' to serve images from userData/images
 */
function registerImageProtocol() {
  protocol.handle("app-image", async (request) => {
    let relativePath = request.url.slice("app-image://".length);
    // Also normalize any incoming backslashes
    relativePath = relativePath.replace(/\\/g, "/");
    const fullPath = path.join(app.getPath("userData"), "images", relativePath);
    try {
      const data = await fs.readFile(fullPath);
      const ext = path.extname(fullPath).toLowerCase();
      const mimeMap = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
      };
      const mimeType = mimeMap[ext] || "application/octet-stream";
      return new Response(data, { headers: { "Content-Type": mimeType } });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  });
}

module.exports = { registerImageProtocol };
