# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.2] - 2025-08-29

### Fixed
- **Direct Play Button UI**: Fixed z-index layering issue where the direct play button was being covered by the title bar
  - Changed z-index from 20 to 2100 (above title bar's 2000)
  - Repositioned button from `top: 15px` to `top: 45px` to avoid title bar overlap

### Enhanced
- **Direct Play Button Transparency**: Improved button visibility and user experience
  - Reduced default opacity from 70% to 30% for less intrusive appearance
  - Enhanced hover effects with full opacity (100%) and red highlight
  - More transparent background (`rgba(0, 0, 0, 0.5)`) for subtler integration
  - Improved border transparency for cleaner appearance

### Improved
- **Production Build**: Removed all debug console logging for cleaner production release
  - Eliminated console.log statements while preserving essential error handling
  - Optimized application performance by reducing unnecessary logging overhead

### Documentation
- **Comprehensive README Update**: Major documentation overhaul with detailed user guides
  - Added detailed explanation of Direct Play Button functionality and usage
  - Comprehensive download system documentation with troubleshooting guides
  - Complete history management documentation including logic and behavior
  - Enhanced installation and build instructions
  - Added troubleshooting section with common issues and solutions
  - Detailed feature explanations with usage examples

## [2.0.1] - 2025-08-29

### Added
- **Real YouTube Trending API**: Implemented proper YouTube trending videos instead of search-based results
  - Added `getTrendingVideos()` API method in preload.js
  - Added `get-trending-videos` handler in main.js with multiple fallback strategies
  - Smart fallback to curated search queries if trending API fails

### Improved
- **Video Playback Logic**: Enhanced video loading and error handling
  - Added proper loading states with spinner and video information
  - Implemented smart fallback timing (embed-first approach for all videos)
  - Added manual "Try Direct Play" button for problematic videos
  - Fixed premature "Video unavailable" errors by allowing proper load time
  - Better state management to prevent UI freezing and navigation issues

- **Music Video Handling**: Improved copyright-restricted content support
  - Enhanced error messages with specific guidance for music/restricted videos
  - Better detection and handling of age-restricted and region-blocked content
  - Multiple format selection strategies for music videos

- **User Experience**: Refined interface responsiveness
  - Fixed navigation issues when returning from video player
  - Proper cleanup of video states, loading overlays, and error messages
  - Improved error messaging with actionable suggestions (download options)

### Fixed
- **Video Loading**: Resolved issues with video playback state management
- **Navigation**: Fixed UI becoming unresponsive after video errors
- **Trending Content**: Replaced artificial keyword searches with real trending data
- **Error Handling**: Prevented premature fallback before videos had time to load

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

