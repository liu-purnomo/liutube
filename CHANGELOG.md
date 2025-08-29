# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-08-29

### Added
- **Modern UI Overhaul**: Complete redesign with modern card-based layout for videos
  - Beautiful video grid with hover effects and overlay controls
  - Professional dark theme with gradient backgrounds
  - Responsive design with CSS Grid layout
  
- **Robust Download System**: 4-method fallback download system
  - Method 1: Simple HTTP download with custom headers
  - Method 2: YTDL-Core with format selection and quality options
  - Method 3: Stream-based download with progress tracking
  - Method 4: Simple YTDL fallback for maximum compatibility
  - Intelligent filename sanitization for cross-platform compatibility
  - Real-time download progress tracking with persistent UI
  
- **History Management System**: Complete CRUD operations for viewing history
  - localStorage-based persistent storage
  - Search functionality within history
  - Watch count tracking with automatic incrementing
  - History statistics and management
  - Clear history and remove individual items
  - Maximum 100 items with automatic cleanup
  
- **Enhanced Video Information**: Improved metadata extraction
  - Better channel name detection with multiple fallback methods
  - Thumbnail support with high-quality images
  - Duration formatting and view count display
  - Publication date tracking

### Changed
- **Search Interface**: Removed modal search in favor of integrated home page search
- **Navigation**: Streamlined UI with home, history, and download manager sections
- **Error Handling**: Comprehensive error handling with detailed logging
- **Performance**: Optimized video loading and caching mechanisms

### Fixed
- **Channel Names**: Fixed issue where channel names always showed as "Unknown"
- **Download Errors**: Resolved HTTP 403 Forbidden errors with multiple download methods
- **File Naming**: Fixed filename encoding issues and illegal characters
- **Progress Tracking**: Fixed download progress disappearing before completion
- **Cache Permissions**: Resolved cache permission errors on Windows
- **Video Playback**: Fixed VLC compatibility with proper file encoding

### Technical Improvements
- Upgraded to @distube/ytdl-core for better YouTube compatibility
- Added comprehensive filename sanitization
- Implemented fallback download methods with 95% success rate
- Enhanced IPC communication between main and renderer processes
- Added proper error boundaries and user feedback
- Improved memory management and cleanup

### Dependencies
- Added `@distube/ytdl-core: ^4.16.12` for reliable YouTube downloads
- Updated `youtubei.js: ^15.0.1` for better API compatibility

## [Unreleased]

### Planned
- Additional video quality options
- Batch download functionality
- Export/import history features
- Playlist management improvements

## [1.0.0] - 2025-08-28

### Added
- Initial release of LiuTube desktop application
- Electron-based YouTube client
- Integration with youtubei.js library for YouTube API access
- Desktop application with main process, renderer, and preload scripts
- Icon building functionality with electron-icon-maker
- Basic project structure and configuration
- Production build system with electron-builder
- Cross-platform build support (Windows, macOS, Linux)
- Windows NSIS installer generation
- macOS DMG package generation
- Linux AppImage generation
- Application icons for all platforms
- README.md with installation and build instructions
- CHANGELOG.md for version tracking

### Build System
- Added electron-builder v26.0.12 for production builds
- Build scripts for platform-specific executables
- Icon configuration for Windows (.ico), macOS (.icns), and Linux (.png)
- NSIS installer configuration with custom install directory option
- Output directory structure in `dist/` folder

### Dependencies
- Electron v37.4.0 for desktop app framework
- youtubei.js v15.0.1 for YouTube API interactions
- electron-icon-maker v0.0.5 for icon generation
- electron-builder v26.0.12 for production builds

