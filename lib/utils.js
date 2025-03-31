/**
 * WhatsApp MCP utility functions
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Gets the home directory path
 * @returns {string} Home directory path
 */
function getHomeDir() {
  return os.homedir();
}

/**
 * Expands path variables like ~ and %APPDATA%
 * @param {string} pathString Path string to expand
 * @returns {string} Expanded path
 */
function expandPath(pathString) {
  return pathString
    .replace(/^~/, process.env.HOME || process.env.USERPROFILE)
    .replace(/%APPDATA%/g, process.env.APPDATA);
}

/**
 * Ensures a directory exists, creating it if necessary
 * @param {string} dirPath Directory path
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Checks if a file exists
 * @param {string} filePath File path
 * @returns {boolean} True if file exists
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

module.exports = {
  getHomeDir,
  expandPath,
  ensureDirectoryExists,
  fileExists
};