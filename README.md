# WhatsApp MCP

This is a Model Context Protocol (MCP) server for WhatsApp.

With this you can search your personal WhatsApp messages, search your contacts and send messages to either individuals or groups.

It connects to your **personal WhatsApp account** directly via the WhatsApp web multidevice API (using the [whatsmeow](https://github.com/tulir/whatsmeow) library). All your messages are stored locally in a SQLite database and only sent to an LLM (such as Claude) when the agent accesses them through tools (which you control).

## Installation

### Prerequisites

- Go
- Python 3.6+
- Anthropic Claude Desktop app (or Cursor)
- UV (Python package manager), install with `curl -LsSf https://astral.sh/uv/install.sh | sh`

### Installation via npm

```bash
npm install -g whatsapp-mcp
```

## Usage

### Starting the WhatsApp Bridge

```bash
npx whatsapp-mcp start
```

The first time you run it, you will be prompted to scan a QR code. Scan the QR code with your WhatsApp mobile app to authenticate.

### Configuring for Claude or Cursor

```bash
# Configure for Claude Desktop
npx whatsapp-mcp configure --target claude

# Configure for Cursor
npx whatsapp-mcp configure --target cursor
```

### Restart Claude Desktop or Cursor

After configuring, restart your AI assistant application to apply the changes.

## Architecture Overview

This application consists of two main components:

1. **Go WhatsApp Bridge**: A Go application that connects to WhatsApp's web API, handles authentication via QR code, and stores message history in SQLite. It serves as the bridge between WhatsApp and the MCP server.

2. **Python MCP Server**: A Python server implementing the Model Context Protocol (MCP), which provides standardized tools for Claude to interact with WhatsApp data and send/receive messages.

### Data Storage

- All message history is stored in a SQLite database within the `whatsapp-bridge/store/` directory
- The database maintains tables for chats and messages
- Messages are indexed for efficient searching and retrieval

## MCP Tools

Claude can access the following tools to interact with WhatsApp:

- **search_contacts**: Search for contacts by name or phone number
- **list_messages**: Retrieve messages with optional filters and context
- **list_chats**: List available chats with metadata
- **get_chat**: Get information about a specific chat
- **get_direct_chat_by_contact**: Find a direct chat with a specific contact
- **get_contact_chats**: List all chats involving a specific contact
- **get_last_interaction**: Get the most recent message with a contact
- **get_message_context**: Retrieve context around a specific message
- **send_message**: Send a WhatsApp message to a specified phone number

## Troubleshooting

### Complete Setup Guide & Common Issues

Follow these steps in order to ensure a proper setup:

1. **Install Go** (required for the WhatsApp bridge):
   ```bash
   # On macOS with Homebrew
   brew install go
   
   # On Linux
   sudo apt-get install golang-go
   
   # Verify installation
   go version
   ```

2. **Install UV** (Python package manager):
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   source $HOME/.local/bin/env  # Add UV to your PATH
   
   # Verify installation
   uv --version
   ```

3. **Install WhatsApp MCP**: 
   ```bash
   npm install -g whatsapp-mcp
   ```

4. **Fix Permissions**:
   ```bash
   # Fix permissions for the Python server directory
   sudo chmod -R 777 /usr/local/lib/node_modules/whatsapp-mcp/whatsapp-mcp-server
   
   # If you get store directory permission errors when running the bridge
   mkdir -p ~/whatsapp-bridge-store
   sudo chmod 777 ~/whatsapp-bridge-store
   ```

5. **Configure for Claude or Cursor**:
   ```bash
   npx whatsapp-mcp configure --target claude
   ```
   When prompted for the UV path, enter the correct path from step 2 (typically `/Users/YOUR_USERNAME/.local/bin/uv` or just `uv` if it's in your PATH)

6. **Start the WhatsApp Bridge** (in a separate terminal that stays open):
   ```bash
   sudo npx whatsapp-mcp start
   ```

7. **Restart Claude** and test the WhatsApp integration

### Common Errors and Solutions

#### "spawn go ENOENT" Error
This means Go is not installed or not in your PATH. Install Go as described in step 1 above.

#### "spawn /usr/local/bin/uv ENOENT" Error
UV is not found at the expected location. Install UV as described in step 2, then reconfigure with the correct path:
```bash
npx whatsapp-mcp configure --target claude
```

#### "Failed to create directory .venv: Permission denied" Error
This happens when the MCP server doesn't have permission to create a virtual environment. Fix it with:
```bash
sudo chmod -R 777 /usr/local/lib/node_modules/whatsapp-mcp/whatsapp-mcp-server
```

#### "Failed to create store directory: mkdir store: permission denied" Error
The WhatsApp bridge doesn't have permission to create its data directory. Either run it with `sudo` or create a directory with proper permissions:
```bash
mkdir -p ~/whatsapp-bridge-store
chmod 777 ~/whatsapp-bridge-store
cd ~/whatsapp-bridge-store
sudo npx whatsapp-mcp start
```

### Authentication Issues

- **QR Code Not Displaying**: If the QR code doesn't appear, try restarting the authentication script.
- **WhatsApp Already Logged In**: If your session is already active, the Go bridge will automatically reconnect without showing a QR code.
- **Device Limit Reached**: WhatsApp limits the number of linked devices. If you reach this limit, you'll need to remove an existing device from WhatsApp on your phone (Settings > Linked Devices).
- **No Messages Loading**: After initial authentication, it can take several minutes for your message history to load, especially if you have many chats.
- **WhatsApp Out of Sync**: If your WhatsApp messages get out of sync with the bridge, delete both database files (`whatsapp-bridge/store/messages.db` and `whatsapp-bridge/store/whatsapp.db`) and restart the bridge to re-authenticate.

### Alternative Setup Using Home Directory

If you're having permission issues, you can install everything in your home directory:

```bash
# Install npm packages locally
npm install whatsapp-mcp --prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH

# Create local copy of the server
mkdir -p ~/whatsapp-mcp-server
cp -R /usr/local/lib/node_modules/whatsapp-mcp/whatsapp-mcp-server/* ~/whatsapp-mcp-server/

# Configure Claude to use your local copy
# After running configure, edit the config file:
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Update the args array to:
# "args": ["--directory", "/Users/YOUR_USERNAME/whatsapp-mcp-server", "run", "main.py"]
```

## License

MIT