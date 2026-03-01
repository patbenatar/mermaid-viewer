# Mermaid Viewer

A cross-platform desktop app that watches `.mermaid-visuals/` in the current directory for `.mmd` files, renders them as diagrams in tabs, and auto-refreshes on changes.

Built with Tauri v2 (Rust) + React + TypeScript + Mermaid.

## Usage

```sh
cd ~/your-project
merview
```

This launches a viewer window watching `<cwd>/.mermaid-visuals/` for `.mmd` files. Each launch is independent — run it from multiple directories simultaneously.

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Alt+Shift+O` | Switch to previous tab |
| `Alt+Shift+P` | Switch to next tab |
| `Ctrl+W` | Close (delete) the active tab |

## Building

### Prerequisites

- Node.js & npm
- Rust (via rustup)
- Linux system libraries: `libwebkit2gtk-4.1-dev libgtk-3-dev libsoup-3.0-dev libjavascriptcoregtk-4.1-dev build-essential pkg-config libssl-dev`

### Build

```sh
npm install
npm run tauri build
```

The binary is output to `src-tauri/target/release/mermaid-viewer`.

### Install

Symlink or copy to your PATH:

```sh
ln -s "$(pwd)/src-tauri/target/release/mermaid-viewer" ~/.local/bin/merview
```

Or use the wrapper script for background launching (returns to prompt immediately):

```sh
cat > ~/.local/bin/merview << 'EOF'
#!/bin/sh
nohup /path/to/mermaid-viewer "$@" >/dev/null 2>&1 &
EOF
chmod +x ~/.local/bin/merview
```

### Development

```sh
npm run tauri dev
```
