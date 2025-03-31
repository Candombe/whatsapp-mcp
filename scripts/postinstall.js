#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Display welcome message
console.log(chalk.blue('='.repeat(60)));
console.log(chalk.blue.bold('WhatsApp MCP - Installation Complete'));
console.log(chalk.blue('='.repeat(60)));

// Check for required dependencies
console.log(chalk.yellow('\nChecking required dependencies:'));

let hasGo = false;
let hasPython = false;
let hasUv = false;

// Check for Go
try {
  const goVersion = execSync('go version', { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
  console.log(chalk.green('✅ Go is installed:'), goVersion);
  hasGo = true;
} catch (err) {
  console.log(chalk.red('❌ Go is not installed. Please install it from https://golang.org/'));
}

// Check for Python
try {
  const pythonVersion = execSync('python3 --version', { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
  console.log(chalk.green('✅ Python is installed:'), pythonVersion);
  hasPython = true;
} catch (err) {
  console.log(chalk.red('❌ Python 3 is not installed. Please install it from https://www.python.org/'));
}

// Check for UV
try {
  const uvVersion = execSync('uv --version', { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
  console.log(chalk.green('✅ UV is installed:'), uvVersion);
  hasUv = true;
} catch (err) {
  console.log(chalk.red('❌ UV is not installed. Install with: curl -LsSf https://astral.sh/uv/install.sh | sh'));
}

// Display next steps
console.log(chalk.blue('\nTo use WhatsApp MCP:'));

if (!hasGo || !hasPython || !hasUv) {
  console.log(chalk.yellow('1. Install missing dependencies listed above'));
}

console.log(chalk.white('1. Start the WhatsApp bridge:'));
console.log(chalk.gray('   $ npx whatsapp-mcp start'));
console.log(chalk.gray('   When first running, scan the QR code with your WhatsApp mobile app'));

console.log(chalk.white('2. Configure for your AI assistant application:'));
console.log(chalk.gray('   $ npx whatsapp-mcp configure --target claude'));
console.log(chalk.gray('   or'));
console.log(chalk.gray('   $ npx whatsapp-mcp configure --target cursor'));

console.log(chalk.white('3. Restart Claude Desktop or Cursor to apply the changes'));

console.log(chalk.blue('\nFor more information, see the documentation:'));
console.log(chalk.gray('https://github.com/lharries/whatsapp-mcp'));

console.log(chalk.blue('\nEnjoy using WhatsApp MCP!'));