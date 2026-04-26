// src/utils/imageStorage.js
const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');

const PRODUCTS_IMAGE_DIR = path.join(app.getPath('userData'), 'images', 'products');

async function ensureDirectory() {
  await fs.mkdir(PRODUCTS_IMAGE_DIR, { recursive: true });
}

/**
 * Save an image from a file path or base64 string.
 * @param {string|Buffer} source - File path or raw base64 string (no data: prefix)
 * @param {string} originalName - Original filename (for extension)
 * @returns {Promise<string>} - Relative path (e.g., "products/1234567890_filename.jpg")
 */
async function saveProductImage(source, originalName) {
  await ensureDirectory();
  const ext = path.extname(originalName) || '.jpg';
  const safeName = `${Date.now()}_${Math.random().toString(36).substr(2, 8)}${ext}`;
  const destPath = path.join(PRODUCTS_IMAGE_DIR, safeName);

  if (typeof source === 'string') {
    // Check if source is an existing file path
    let isFilePath = false;
    try {
      await fs.access(source);
      isFilePath = true;
    } catch {
      // Not a valid file path
    }

    if (isFilePath) {
      await fs.copyFile(source, destPath);
    } else {
      // Treat as raw base64 string
      const buffer = Buffer.from(source, 'base64');
      await fs.writeFile(destPath, buffer);
    }
  } else if (Buffer.isBuffer(source)) {
    await fs.writeFile(destPath, source);
  } else {
    throw new Error('Invalid image source');
  }

  return path.join('products', safeName);
}

/**
 * Delete an image by its stored relative or absolute path.
 * @param {string|null} imagePath - The path stored in database.
 */
async function deleteProductImage(imagePath) {
  if (!imagePath) return;
  let fullPath;
  if (path.isAbsolute(imagePath)) {
    fullPath = imagePath;
  } else {
    fullPath = path.join(app.getPath('userData'), 'images', imagePath);
  }
  try {
    await fs.unlink(fullPath);
  } catch (err) {
    console.warn(`Failed to delete image ${fullPath}:`, err.message);
  }
}

module.exports = { saveProductImage, deleteProductImage };