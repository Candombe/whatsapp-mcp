/**
 * WhatsApp MCP - Multi-Channel Platform for WhatsApp
 * 
 * This package provides a Model Context Protocol (MCP) server for WhatsApp.
 * It allows you to search your WhatsApp messages, search contacts, and send
 * messages to individuals or groups using AI assistants like Claude.
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

/**
 * Configuration paths for different platforms
 */
const CONFIG_PATHS = {
  claude: {
    darwin: '~/Library/Application Support/Claude/claude_desktop_config.json',
    linux: '~/.config/Claude/claude_desktop_config.json',
    win32: '%APPDATA%\\Claude\\claude_desktop_config.json'
  },
  cursor: {
    darwin: '~/.cursor/mcp.json',
    linux: '~/.cursor/mcp.json',
    win32: '%APPDATA%\\.cursor\\mcp.json'
  }
};

/**
 * Generates the configuration for MCP integration
 * @param {Object} options Configuration options
 * @returns {Object} MCP configuration object
 */
function generateMcpConfig(options = {}) {
  const uvPath = options.uvPath || 'uv';
  const serverPath = options.serverPath || path.resolve(__dirname, 'whatsapp-mcp-server');
  
  return {
    mcpServers: {
      whatsapp: {
        command: uvPath,
        args: [
          "--directory",
          serverPath,
          "run",
          "main.py"
        ]
      }
    }
  };
}

/**
 * Starts the WhatsApp bridge service
 * @param {Object} options Configuration options
 * @returns {ChildProcess} The bridge process
 */
function startBridge(options = {}) {
  const bridgePath = options.bridgePath || path.resolve(__dirname, 'whatsapp-bridge');
  
  const process = spawn('go', ['run', 'main.go'], {
    cwd: bridgePath,
    stdio: 'inherit'
  });
  
  return process;
}

module.exports = {
  version: '0.1.3',
  CONFIG_PATHS,
  generateMcpConfig,
  startBridge
};