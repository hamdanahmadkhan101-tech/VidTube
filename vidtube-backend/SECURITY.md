# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of VidTube seriously. If you discover a security vulnerability, please follow responsible disclosure practices.

### How to Report

1. **DO NOT** create a public GitHub issue for security vulnerabilities
2. Email your findings to: **hamdanahmadkhan101@gmail.com**
3. Include the following information:
   - Description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact
   - Any suggested fixes (optional)

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Updates**: We will provide updates on the progress of fixing the vulnerability
- **Resolution**: We aim to resolve critical vulnerabilities within 7 days
- **Credit**: With your permission, we will credit you in our release notes

## Security Measures

This application implements the following security measures:

### Authentication & Authorization

- JWT-based authentication with access and refresh tokens
- Bcrypt password hashing with salt rounds
- HTTP-only cookies for refresh tokens
- Token expiration and rotation

### API Security

- CORS restricted to allowed origins only
- Input validation and sanitization
- Rate limiting (recommended for production)
- Request size limits

### Data Protection

- Passwords are never stored in plain text
- Sensitive data excluded from API responses
- Environment variables for secrets (never committed to repo)

## Best Practices for Contributors

1. Never commit secrets, API keys, or credentials
2. Use environment variables for all sensitive configuration
3. Keep dependencies updated to patch known vulnerabilities
4. Follow the principle of least privilege
5. Validate and sanitize all user inputs

## Dependencies

We regularly monitor and update dependencies to address security vulnerabilities. Run `npm audit` to check for known vulnerabilities in dependencies.

```bash
npm audit
npm audit fix
```

## Contact

For security concerns, please contact: **hamdanahmadkhan101@gmail.com**

---

Thank you for helping keep VidTube and its users safe!
