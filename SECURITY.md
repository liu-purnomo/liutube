# Security Policy

## Supported Versions

We actively support the following versions of LiuTube with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of LiuTube seriously. If you believe you have found a security vulnerability in LiuTube, we encourage you to report it to us as quickly as possible.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please send an email to: **[hi@liupurnomo.com]** with the following information:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

### What to Expect

- **Initial Response**: You will receive an acknowledgment of your report within 48 hours.
- **Investigation**: We will investigate the issue and determine its validity and severity.
- **Updates**: We will keep you informed of our progress throughout the process.
- **Resolution**: Once we've resolved the issue, we'll notify you and coordinate the disclosure.

## Security Best Practices

### For Users

1. **Download from Official Sources**: Only download LiuTube from the official GitHub repository or verified distribution channels.
2. **Keep Updated**: Always use the latest version to ensure you have the most recent security patches.
3. **System Security**: Keep your operating system and other software up to date.
4. **Network Security**: Use trusted networks when using LiuTube.

### For Developers

1. **Code Review**: All code contributions undergo security review.
2. **Dependencies**: We regularly audit and update our dependencies for known vulnerabilities.
3. **Secure Coding**: Follow secure coding practices and OWASP guidelines.
4. **Input Validation**: Properly validate and sanitize all user inputs.

## Security Features

LiuTube implements several security measures:

- **Context Isolation**: Electron context isolation is enabled to prevent code injection.
- **Node Integration**: Node.js integration is properly controlled and isolated.
- **Content Security Policy**: Strict CSP headers to prevent XSS attacks.
- **Secure Communication**: All IPC communications are validated and sanitized.
- **No Remote Module**: Remote module is disabled for enhanced security.

## Known Security Considerations

- LiuTube accesses YouTube content through unofficial APIs, which may change without notice.
- The application runs with elevated privileges on desktop systems.
- Network communications occur with YouTube servers for content retrieval.

## Acknowledgments

We would like to thank all security researchers and users who responsibly disclose security vulnerabilities to help keep LiuTube safe for everyone.

## Contact

For security-related questions or concerns, please contact:
- Email: **[hi@liupurnomo.com]**
- GitHub: Create a private security advisory

---

*This security policy is subject to change. Please check this document regularly for updates.*