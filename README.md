# LiuTube

A desktop YouTube client built with Electron and the unofficial YouTube.js library.

## Features

- Desktop YouTube client experience
- Built with Electron for cross-platform compatibility
- Uses youtubei.js for YouTube API interactions

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone git@github.com:liu-purnomo/liutube.git
cd liutube
```

2. Install dependencies:
```bash
npm install
```

## Usage

Start the application:
```bash
npm start
```

## Development

### Building Icons
```bash
npm run build-icons
```

## Building for Production

Build the application into executable files:

### Build for Current Platform
```bash
npm run build
```

### Build for Specific Platforms
```bash
npm run build-win    # Windows (.exe installer)
npm run build-mac    # macOS (.dmg)
npm run build-linux  # Linux (AppImage)
npm run dist         # Build all platforms
```

### Output
- **Windows**: `dist/LiuTube Setup 1.0.0.exe` - Installer
- **Windows**: `dist/win-unpacked/LiuTube.exe` - Portable executable
- **macOS**: `dist/LiuTube-1.0.0.dmg` - DMG installer
- **Linux**: `dist/LiuTube-1.0.0.AppImage` - AppImage executable

### Installation
1. **Windows**: Run the `.exe` installer or use the portable version
2. **macOS**: Open the `.dmg` file and drag to Applications
3. **Linux**: Make the `.AppImage` executable and run it

## Technologies Used

- **Electron** - Desktop app framework
- **youtubei.js** - Unofficial YouTube API library
- **JavaScript** - Primary development language

## Project Structure

- `main.js` - Main Electron process
- `renderer.js` - Renderer process logic
- `preload.js` - Preload script for secure context bridging
- `index.html` - Main application UI
- `assets/` - Application assets and resources
- `build/` - Build output directory
- `icons/` - Application icons

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Version

Current version: 1.0.0