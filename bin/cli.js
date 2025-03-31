#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const { spawn } = require('child_process');
const whatsappMcp = require('../index');

const packageJson = require('../package.json');

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
    
    const bridge = whatsappMcp.startBridge();
    
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
    
    // Get UV path
    const { uvPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'uvPath',
        message: 'Path to UV executable (run "which uv" to find it):',
        default: '/usr/local/bin/uv'
      }
    ]);
    
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