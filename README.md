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
git clone <repository-url>
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