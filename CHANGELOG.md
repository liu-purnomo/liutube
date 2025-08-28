# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

## [Unreleased]

### Planned
- User interface improvements
- Additional YouTube features
- Performance optimizations
- Error handling enhancements