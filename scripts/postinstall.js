#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const os = require('os');

// Display welcome message
console.log(chalk.blue('='.repeat(60)));
console.log(chalk.blue.bold('WhatsApp MCP - Installation Complete'));
console.log(chalk.blue('='.repeat(60)));

// Check for required dependencies
console.log(chalk.yellow('\nChecking required dependencies:'));

let hasGo = false;
let hasPython = false;
let hasUv = false;
let uvPath = '/usr/local/bin/uv'; // Default UV path

// Check for Go
try {
  const goVersion = execSync('go version', { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
  console.log(chalk.green('✅ Go is installed:'), goVersion);
  hasGo = true;
} catch (err) {
  console.log(chalk.red('❌ Go is not installed.'));
  console.log(chalk.yellow('   Please install Go from https://golang.org/'));
  console.log(chalk.yellow('   On macOS: brew install go'));
  console.log(chalk.yellow('   On Linux: sudo apt-get install golang-go'));
  console.log(chalk.yellow('   On Windows: Download from https://golang.org/dl/'));
}

// Check for Python
try {
  const pythonVersion = execSync('python3 --version', { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
  console.log(chalk.green('✅ Python is installed:'), pythonVersion);
  hasPython = true;
} catch (err) {
  console.log(chalk.red('❌ Python 3 is not installed.'));
  console.log(chalk.yellow('   Please install Python from https://www.python.org/'));
  console.log(chalk.yellow('   On macOS: brew install python'));
  console.log(chalk.yellow('   On Linux: sudo apt-get install python3'));
  console.log(chalk.yellow('   On Windows: Download from https://www.python.org/downloads/'));
}

// Check for UV and find its path
try {
  // First check if UV is in PATH
  const uvVersionCmd = spawnSync('uv', ['--version'], { encoding: 'utf8' });
  if (uvVersionCmd.status === 0) {
    uvPath = 'uv'; // UV is in PATH
    hasUv = true;
    console.log(chalk.green('✅ UV is installed:'), uvVersionCmd.stdout.trim());
  } else {
    // Check common installation directories
    const homeDir = os.homedir();
    const commonPaths = [
      '/usr/local/bin/uv',
      '/usr/bin/uv',
      path.join(homeDir, '.local', 'bin', 'uv'),
      path.join(homeDir, '.cargo', 'bin', 'uv')
    ];
    
    // Add Windows paths if on Windows
    if (process.platform === 'win32') {
      commonPaths.push(path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'uv', 'uv.exe'));
    }
    
    for (const testPath of commonPaths) {
      if (fs.existsSync(testPath)) {
        try {
          const result = spawnSync(testPath, ['--version'], { encoding: 'utf8' });
          if (result.status === 0) {
            uvPath = testPath;
            hasUv = true;
            console.log(chalk.green('✅ UV is installed at:'), uvPath);
            break;
          }
        } catch (e) {
          // Continue checking other paths
        }
      }
    }
    
    if (!hasUv) {
      console.log(chalk.red('❌ UV is not installed or not found in PATH.'));
      console.log(chalk.yellow('   Install with: curl -LsSf https://astral.sh/uv/install.sh | sh'));
      console.log(chalk.yellow('   After installing, run: npx whatsapp-mcp configure'));
    }
  }
} catch (err) {
  console.log(chalk.red('❌ UV is not installed or not found in PATH.'));
  console.log(chalk.yellow('   Install with: curl -LsSf https://astral.sh/uv/install.sh | sh'));
}

// Configure the MCP server with the detected UV path
if (hasUv) {
  // Create a default config that the user can customize later
  const configDir = path.resolve(__dirname, '..');
  const configFile = path.join(configDir, '.uvpath');
  try {
    fs.writeFileSync(configFile, uvPath);
    console.log(chalk.green('✅ Saved UV path configuration to:'), configFile);
  } catch (err) {
    console.log(chalk.yellow('ℹ️ Could not save UV path configuration, will use defaults during configure.'));
  }
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