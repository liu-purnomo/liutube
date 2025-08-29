# LiuTube

A modern desktop YouTube client built with Electron that provides seamless video streaming, downloading capabilities, and watch history management.

## Features

### 🎬 Video Playback
- **Dual Playback Modes**: Embedded YouTube player and direct video streaming
- **Smart Fallback System**: Automatic fallback between playback methods
- **Direct Play Button**: Transparent floating button for direct video access when embedded playback fails

### 📱 User Interface
- **Modern Dark UI**: Clean, YouTube-inspired interface
- **Always on Top**: Pin window to stay above other applications
- **Trending Videos**: Curated trending content on homepage
- **Search Functionality**: Real-time search with auto-suggestions

### 📥 Download Manager
- **Multi-Format Downloads**: Support for various video qualities and formats
- **Progress Tracking**: Real-time download progress with speed indicators
- **Multiple Download Methods**: Automatic fallback through different download engines
- **Download Queue**: Manage multiple downloads simultaneously

### 📚 History Management
- **Automatic History Tracking**: Records all watched videos with metadata
- **Search History**: Find previously watched content quickly
- **Watch Statistics**: Track view counts and watch patterns
- **History Control**: Clear individual entries or entire history

## Video Playback Logic

### Playback Modes

1. **Embedded YouTube Player** (Default)
   - Uses official YouTube embed
   - Supports all YouTube features
   - Best compatibility with most content

2. **Direct Video Streaming** (Fallback/Manual)
   - Direct video URL streaming
   - Used when embedded player fails
   - Accessible via floating "Direct" button

### When Videos Show "Unavailable"

If you encounter "Video Unavailable" messages:

1. **Click the "Direct" Button**: Look for the semi-transparent "Direct" button in the top-left corner of the video player
2. **Try Download Instead**: Use the download feature as an alternative
3. **Common Causes**:
   - Age-restricted content
   - Music videos with copyright restrictions
   - Region-blocked content
   - Premium/paid content

### Direct Play Button
- **Location**: Top-left corner of video player
- **Transparency**: 30% opacity by default, becomes fully visible on hover
- **Function**: Attempts direct video streaming when embedded player fails
- **Appearance**: Red highlight on hover with 🎬 icon

## Download System

### Download Process
1. **Multiple Fallback Methods**: 
   - Simple fetch download
   - ytdl-core extraction  
   - Direct URL download
   - Stream-based download

2. **Download Locations**: Files are saved to your system's Downloads folder

3. **Supported Content**: 
   - Regular videos
   - Music videos (often downloads work even when streaming doesn't)
   - Most YouTube content types

### Download Manager
- **Real-time Progress**: Shows download speed, progress percentage, and file size
- **Auto-cleanup**: Completed downloads auto-remove after 10 seconds
- **Error Handling**: Failed downloads auto-remove after 5 seconds
- **Cancellation**: Stop downloads in progress (where supported)

## History Management

### What Gets Recorded
- **Video Information**: Title, channel name, thumbnail, duration
- **Timestamps**: When the video was accessed
- **Watch Count**: How many times you've watched each video
- **Metadata**: Additional video details for future reference

### When History is Created
- **On Video Play**: History entry created when you click play on any video
- **Update on Re-watch**: Existing entries get updated timestamp and incremented watch count
- **Automatic**: No manual action required

### When History is Removed
- **Manual Removal**: Click "Remove" button on individual history items
- **Clear All**: Use "Clear All" button to wipe entire history
- **Auto-cleanup**: History is limited to 100 most recent items (older entries auto-removed)
- **Search Filtering**: Use search bar to filter history by title or channel name

### History Statistics
- **Total Videos**: Count of unique videos in your history
- **Total Channels**: Number of different channels you've watched
- **Watch Patterns**: Most watched channels and recent activity

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Development Setup

1. Clone the repository:
```bash
git clone git@github.com:liu-purnomo/liutube.git
cd liutube
```

2. Install dependencies:
```bash
npm install
```

3. Start the application:
```bash
npm start
```

## Building for Production

### Build Commands

```bash
# Build for current platform
npm run build

# Platform-specific builds
npm run build-win    # Windows (.exe installer)
npm run build-mac    # macOS (.dmg)
npm run build-linux  # Linux (AppImage)
npm run dist         # Build all platforms
```

### Build Outputs
- **Windows**: `dist/LiuTube Setup 2.0.2.exe` - NSIS Installer
- **Windows**: `dist/win-unpacked/LiuTube.exe` - Portable executable
- **macOS**: `dist/LiuTube-2.0.2.dmg` - DMG installer
- **Linux**: `dist/LiuTube-2.0.2.AppImage` - AppImage executable

### Installation Instructions
1. **Windows**: Run the `.exe` installer or use the portable version
2. **macOS**: Open the `.dmg` file and drag to Applications folder
3. **Linux**: Make the `.AppImage` executable (`chmod +x LiuTube-2.0.2.AppImage`) and run

## Troubleshooting

### Video Won't Play
1. Try the **Direct** button (floating button in video player)
2. Check your internet connection
3. Try downloading the video instead
4. Some content may be region-restricted or require age verification

### Downloads Failing
- Downloads use multiple fallback methods automatically
- Some premium/restricted content may not be downloadable
- Check your Downloads folder for completed files

### History Not Saving
- History is stored locally in your browser's localStorage
- Clearing application data will remove history
- History has a 100-item limit (oldest items auto-removed)

## Keyboard Shortcuts

- **Escape**: Return to home page from video player
- **Home**: Navigate to trending videos page
- **History**: Access watch history

## Technologies

- **Electron**: Desktop application framework
- **youtubei.js**: YouTube API interactions  
- **@distube/ytdl-core**: Video download capabilities
- **HTML/CSS/JavaScript**: Frontend technologies

## Project Structure

```
liutube/
├── main.js           # Main Electron process
├── renderer.js       # Frontend application logic
├── preload.js        # Secure context bridge
├── index.html        # Application UI
├── assets/           # Application resources
├── build/            # Build configuration and icons
└── dist/             # Build output directory
```

## Version History

### 2.0.2 (Current)
- Enhanced direct play button with improved transparency and positioning
- Fixed z-index issues with floating UI elements
- Improved video playback fallback logic
- Removed debug logging for production
- Enhanced user documentation

### 2.0.1
- Enhanced video playback with real trending API
- Robust download manager with multiple fallback methods
- Comprehensive history management system
- Modern UI improvements

### 2.0.0
- Major UI overhaul with modern dark theme
- Download functionality with progress tracking
- History management system
- Improved video playback reliability

## License

ISC License - See LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues, feature requests, or questions:
1. Check existing issues on GitHub
2. Create a new issue with detailed description
3. Include system information and steps to reproduce

---

**Current Version**: 2.0.2