#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const { spawn, spawnSync } = require('child_process');
const whatsappMcp = require('../index');
const os = require('os');

const packageJson = require('../package.json');

// Helper to detect Go
function checkGoInstallation() {
  try {
    const goVersionCmd = spawnSync('go', ['version'], { encoding: 'utf8' });
    if (goVersionCmd.status === 0) {
      return true;
    }
  } catch (err) {
    // Go not found
  }
  return false;
}

// Helper to detect UV and get its path
function getUvPath() {
  // First check if we have a stored UV path
  const packageDir = path.resolve(__dirname, '..');
  const uvPathFile = path.join(packageDir, '.uvpath');
  
  if (fs.existsSync(uvPathFile)) {
    try {
      const storedPath = fs.readFileSync(uvPathFile, 'utf8').trim();
      // Verify the path still works
      const result = spawnSync(storedPath, ['--version'], { encoding: 'utf8' });
      if (result.status === 0) {
        return storedPath;
      }
    } catch (err) {
      // Fallback to searching
    }
  }
  
  // Try finding UV in PATH
  try {
    const uvVersionCmd = spawnSync('uv', ['--version'], { encoding: 'utf8' });
    if (uvVersionCmd.status === 0) {
      return 'uv';
    }
  } catch (err) {
    // UV not in PATH
  }
  
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
          return testPath;
        }
      } catch (e) {
        // Continue checking other paths
      }
    }
  }
  
  // Default value as fallback
  return '/usr/local/bin/uv';
}

// Setup CLI
program
  .name('whatsapp-mcp')
  .description('WhatsApp Multi-Channel Platform CLI')
  .version(packageJson.version);

// Start command
program
  .command('start')
  .description('Start the WhatsApp MCP bridge')
  .action(() => {
    console.log(chalk.blue('Starting WhatsApp MCP bridge...'));
    
    // Check for Go before starting
    if (!checkGoInstallation()) {
      console.log(chalk.red('Error: Go is not installed or not in your PATH.'));
      console.log(chalk.yellow('Please install Go from https://golang.org/'));
      console.log(chalk.yellow('On macOS: brew install go'));
      console.log(chalk.yellow('On Linux: sudo apt-get install golang-go'));
      console.log(chalk.yellow('On Windows: Download from https://golang.org/dl/'));
      process.exit(1);
    }
    
    const bridge = whatsappMcp.startBridge();
    
    bridge.on('error', (err) => {
      if (err.code === 'ENOENT') {
        console.log(chalk.red('Error: Go executable not found. Make sure Go is installed and in your PATH.'));
        process.exit(1);
      } else {
        console.log(chalk.red(`Error: ${err.message}`));
      }
    });
    
    bridge.on('close', (code) => {
      if (code !== 0) {
        console.log(chalk.red(`WhatsApp bridge exited with code ${code}`));
      }
    });
    
    // Handle process termination
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\nGracefully shutting down...'));
      bridge.kill();
      process.exit(0);
    });
  });

// Configure command
program
  .command('configure')
  .description('Configure WhatsApp MCP for Claude Desktop or Cursor')
  .option('-t, --target <target>', 'Target application (claude or cursor)', 'claude')
  .action(async (options) => {
    // Validate target
    if (!['claude', 'cursor'].includes(options.target)) {
      console.error(chalk.red('Target must be either "claude" or "cursor"'));
      process.exit(1);
    }
    
    // Get default UV path
    const defaultUvPath = getUvPath();
    
    // Get UV path
    const { uvPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'uvPath',
        message: 'Path to UV executable (run "which uv" to find it):',
        default: defaultUvPath
      }
    ]);
    
    // Verify the UV path
    try {
      const result = spawnSync(uvPath, ['--version'], { encoding: 'utf8' });
      if (result.status !== 0) {
        console.log(chalk.yellow(`Warning: Could not verify UV at ${uvPath}. Configuration may not work.`));
      } else {
        console.log(chalk.green(`✅ UV found at ${uvPath}: ${result.stdout.trim()}`));
        
        // Save the verified UV path
        try {
          const packageDir = path.resolve(__dirname, '..');
          fs.writeFileSync(path.join(packageDir, '.uvpath'), uvPath);
        } catch (err) {
          // Non-critical error, can continue
        }
      }
    } catch (err) {
      console.log(chalk.yellow(`Warning: Could not verify UV at ${uvPath}. Configuration may not work.`));
    }
    
    // Package directory
    const packageDir = path.resolve(__dirname, '..');
    const serverPath = path.join(packageDir, 'whatsapp-mcp-server');
    
    // Generate config
    const config = whatsappMcp.generateMcpConfig({
      uvPath,
      serverPath
    });
    
    // Determine config file path based on platform
    const platform = process.platform;
    const configPath = whatsappMcp.CONFIG_PATHS[options.target][platform];
    
    if (!configPath) {
      console.error(chalk.red(`Unsupported platform: ${platform}`));
      process.exit(1);
    }
    
    // Expand path
    const expandedPath = configPath
      .replace(/^~/, process.env.HOME || process.env.USERPROFILE)
      .replace(/%APPDATA%/g, process.env.APPDATA);
    
    // Ensure directory exists
    const configDir = path.dirname(expandedPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Write config
    fs.writeFileSync(expandedPath, JSON.stringify(config, null, 2));
    
    console.log(chalk.green(`Configuration written to ${expandedPath}`));
    console.log(chalk.blue(`Please restart ${options.target} to apply the changes`));
  });

// Parse arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}