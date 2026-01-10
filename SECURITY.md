# VidTube Security Documentation

## Security Overview

VidTube implements multiple layers of security following industry best practices and OWASP Top 10 guidelines.

## Authentication & Authorization

### JWT Authentication
- **Access Tokens**: Short-lived (15 minutes recommended)
- **Refresh Tokens**: Long-lived, stored securely in database
- **Token Storage**: HTTP-only cookies (prevents XSS)
- **Token Revocation**: Refresh token blacklist on logout

### Password Security
- **Hashing**: bcrypt with salt rounds (10+)
- **Requirements**: Minimum 8 characters
- **Validation**: Zod schema validation on both frontend and backend

### Session Management
- Stateless authentication (JWT)
- Automatic token refresh mechanism
- Secure cookie configuration:
  ```javascript
  {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  }
  ```

## Input Validation & Sanitization

### Backend Validation
- **Zod Schemas**: Type-safe validation on all endpoints
- **Middleware**: Automatic validation before controllers
- **Sanitization**: Automatic stripping of unknown fields
- **Error Messages**: Specific field-level errors

### Frontend Validation
- **Zod Schemas**: Client-side validation matching backend
- **React Hook Form**: Real-time validation
- **User Feedback**: Clear error messages

### Common Validations
- Email format validation
- Username format (alphanumeric + underscore)
- File type validation (video/image)
- File size limits (500MB videos, 10MB images)
- String length limits

## Rate Limiting

### Implementation
- `express-rate-limit` middleware
- IP-based limiting
- Different limits per endpoint type

### Limits
- **General API**: 100 requests / 15 minutes
- **Authentication**: 5 requests / hour
- **Video Upload**: 2 uploads / hour

### Headers
- `RateLimit-*` headers in responses
- 429 status code when exceeded
- Clear error messages

## Security Headers

Implemented via Helmet.js:

```javascript
{
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "https://api.cloudinary.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  frameguard: { action: 'deny' }
}
```

### Headers Set
- `Strict-Transport-Security`: Force HTTPS
- `X-Content-Type-Options`: Prevent MIME sniffing
- `X-Frame-Options`: Prevent clickjacking
- `X-XSS-Protection`: XSS protection
- `Content-Security-Policy`: Control resource loading

## CORS Configuration

```javascript
{
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Request-Id']
}
```

## Database Security

### MongoDB Security
- Connection string secured in environment variables
- NoSQL injection prevention via Mongoose
- Input validation before database operations
- Indexes for performance and query safety

### Data Protection
- Passwords never stored in plain text
- Sensitive fields excluded from API responses
- `.select()` used to limit returned fields

## File Upload Security

### Validation
- File type checking (MIME type + extension)
- File size limits enforced
- Virus scanning (recommended for production)
- Secure file storage (Cloudinary)

### Cloudinary Configuration
- Signed uploads
- Transformation presets
- Access control policies

## Error Handling

### Security Best Practices
- Generic error messages for users
- Detailed errors only in development
- No stack traces in production responses
- Request ID for tracking (not exposing internals)

### Logging
- Security events logged (failed logins, etc.)
- No sensitive data in logs
- Structured logging with Winston

## Environment Variables

### Required Variables
- `JWT_SECRET`: Strong random string (min 32 chars)
- `JWT_REFRESH_SECRET`: Different from JWT_SECRET
- `MONGODB_URI`: Database connection string
- `CLOUDINARY_API_SECRET`: Cloudinary secret

### Best Practices
- Never commit `.env` files
- Use different secrets per environment
- Rotate secrets regularly
- Use secret management service in production

## API Security

### Endpoint Protection
- Protected routes require valid JWT
- Ownership verification for resource modification
- Role-based access (future: admin, moderator)

### Request Validation
- All requests validated before processing
- Content-Type checking
- Body size limits

## Frontend Security

### XSS Prevention
- React's built-in XSS protection
- No `dangerouslySetInnerHTML` (unless sanitized)
- Content Security Policy headers

### CSRF Protection
- SameSite cookies
- CORS configuration
- Token-based authentication

### Secure Storage
- Tokens in HTTP-only cookies (not localStorage)
- Sensitive data not stored in client
- Clear sensitive data on logout

## Dependency Security

### Regular Updates
- Keep dependencies up to date
- Use `npm audit` regularly
- Use `npm audit fix` for vulnerabilities
- Monitor security advisories

### Known Vulnerabilities
```bash
npm audit
npm audit fix
```

## Security Monitoring

### Logging
- Failed authentication attempts
- Rate limit violations
- Unusual request patterns
- Error occurrences

### Recommendations for Production
- Implement WAF (Web Application Firewall)
- Set up intrusion detection
- Monitor for suspicious activity
- Regular security audits
- Penetration testing

## OWASP Top 10 Compliance

### ✅ Addressed

1. **Injection**: Parameterized queries, input validation
2. **Broken Authentication**: Secure JWT, password hashing
3. **Sensitive Data Exposure**: Encrypted transmission, secure storage
4. **XXE**: Not applicable (JSON API)
5. **Broken Access Control**: Authorization checks, ownership verification
6. **Security Misconfiguration**: Security headers, secure defaults
7. **XSS**: React protection, CSP headers
8. **Insecure Deserialization**: JSON parsing with validation
9. **Using Components with Known Vulnerabilities**: Regular updates
10. **Insufficient Logging**: Winston logging, request tracking

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email security concerns to: **hamdanahmadkhan101@gmail.com**
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect
- **Acknowledgment**: Within 48 hours
- **Updates**: Regular progress updates
- **Resolution**: Critical issues within 7 days
- **Credit**: With permission, credit in release notes

## Security Checklist for Deployment

- [ ] Environment variables set correctly
- [ ] HTTPS enabled in production
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] Database credentials secure
- [ ] JWT secrets strong and unique
- [ ] CORS configured for production domain
- [ ] File upload limits enforced
- [ ] Error messages don't expose internals
- [ ] Logging configured (no sensitive data)
- [ ] Dependencies up to date
- [ ] Security monitoring enabled

---

**Last Updated**: 2024
**Security Version**: 1.0
