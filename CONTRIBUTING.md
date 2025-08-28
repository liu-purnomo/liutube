# Contributing to LiuTube

Thank you for your interest in contributing to LiuTube! We welcome contributions from developers of all skill levels. This guide will help you get started with contributing to our open-source desktop YouTube client.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contribution Process](#contribution-process)
- [Style Guidelines](#style-guidelines)
- [Testing](#testing)
- [Issue and PR Guidelines](#issue-and-pr-guidelines)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, please include:

- **Clear description** of the issue
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **Environment details** (OS, version, etc.)
- **Console logs** if available

### 💡 Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:

- **Clear description** of the enhancement
- **Use case** and why it would be beneficial
- **Possible implementation** approach (if you have ideas)

### 🔧 Code Contributions

We love receiving pull requests! Areas where you can help:

- **Bug fixes**
- **Feature implementations**
- **Performance improvements**
- **UI/UX enhancements**
- **Documentation improvements**
- **Tests and test coverage**

## Getting Started

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **Git**

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/liutube.git
   cd liutube
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/liu-purnomo/liutube.git
   ```

## Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development:**
   ```bash
   npm start
   ```

3. **Build application:**
   ```bash
   npm run build
   ```

4. **Build for specific platforms:**
   ```bash
   npm run build-win    # Windows
   npm run build-mac    # macOS  
   npm run build-linux  # Linux
   ```

## Contribution Process

### 1. Create a Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

### 2. Make Your Changes

- Write clean, maintainable code
- Follow the existing code style
- Add comments for complex logic
- Update documentation if needed

### 3. Test Your Changes

- Test the application thoroughly
- Ensure all existing functionality still works
- Test on multiple platforms if possible
- Check console for errors

### 4. Commit Your Changes

Use clear and meaningful commit messages:

```bash
git add .
git commit -m "feat: add dark mode toggle functionality"
# or
git commit -m "fix: resolve video playback issue on Linux"
```

**Commit Message Convention:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code formatting, semicolons, etc.
- `refactor:` Code restructuring without changing functionality
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Style Guidelines

### JavaScript

- Use **ES6+** features when appropriate
- Use **semicolons**
- Use **2 spaces** for indentation
- Use **camelCase** for variables and functions
- Use **PascalCase** for classes
- Add **JSDoc comments** for functions
- Keep lines under **100 characters**

### CSS

- Use **BEM methodology** when possible
- Organize properties alphabetically
- Use **rem/em** for scalable units
- Maintain **consistent spacing**

### File Naming

- Use **kebab-case** for files: `video-player.js`
- Use **PascalCase** for components: `VideoPlayer.js`

## Testing

Currently, we're building out our test suite. When contributing:

- **Manual testing** is currently required
- Test on **Windows, macOS, and Linux** if possible
- Ensure **no console errors**
- Verify **all features work** as expected

Future testing framework: We plan to implement automated testing with Jest and Electron testing utilities.

## Issue and PR Guidelines

### Issues

- Use the **issue templates** when available
- Be **specific and clear** in descriptions
- Include **relevant labels**
- Reference related issues/PRs when applicable

### Pull Requests

- **Link to related issues** using "Closes #123"
- Provide **clear description** of changes
- Include **screenshots** for UI changes
- Ensure **no merge conflicts**
- Wait for **code review** before merging

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** by reviewer
4. **Approval and merge**

## Recognition

Contributors will be:
- **Listed in CONTRIBUTORS.md**
- **Mentioned in release notes**
- **Credited in project documentation**

## Questions?

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Email**: [your-email@domain.com] for private matters

## Development Resources

### Useful Documentation

- [Electron Documentation](https://www.electronjs.org/docs)
- [YouTube.js Documentation](https://github.com/LuanRT/YouTube.js)
- [Node.js Documentation](https://nodejs.org/en/docs/)

### Project Architecture

```
liutube/
├── main.js           # Main Electron process
├── renderer.js       # Renderer process logic  
├── preload.js        # Preload script for IPC
├── index.html        # Main application UI
├── assets/           # Static assets
├── build/            # Build configuration
├── icons/            # Application icons
└── dist/             # Built application files
```

## Getting Help

If you're stuck or need help:

1. Check existing **documentation**
2. Search **closed issues** for similar problems
3. Ask in **GitHub Discussions**
4. Tag maintainers in your issue/PR

---

**Thank you for contributing to LiuTube!** 🚀

Your contributions make this project better for everyone. We appreciate your time and effort in helping build an amazing desktop YouTube experience.