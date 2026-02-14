# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### 1. **DO NOT** disclose the vulnerability publicly

Please do not create a public GitHub issue for security vulnerabilities.

### 2. Report privately

Send an email to: **security@example.com** (replace with your security contact)

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### 3. Response timeline

- **Initial response**: Within 48 hours
- **Status update**: Within 7 days
- **Fix timeline**: Depends on severity (critical issues within 7 days)

## Security Best Practices

### For Deployment

1. **Environment Variables**
   - Never commit `.env` files
   - Use strong, unique values for `JWT_SECRET`
   - Rotate API keys regularly
   - Use environment-specific configurations

2. **Database Security**
   - Use strong database passwords
   - Enable SSL/TLS for database connections
   - Restrict database access by IP
   - Regular backups

3. **API Keys**
   - Store API keys securely (use secrets management)
   - Never hardcode API keys in source code
   - Use BYOK (Bring Your Own Key) model
   - Implement rate limiting

4. **Authentication**
   - Enable 2FA for admin accounts
   - Use secure session management
   - Implement proper password policies
   - Regular security audits

### For Development

1. **Dependencies**
   - Keep dependencies updated
   - Run `npm audit` regularly
   - Review security advisories
   - Use lock files (`pnpm-lock.yaml`)

2. **Code Review**
   - Review all PRs for security issues
   - Use static analysis tools
   - Follow secure coding practices
   - Validate all user inputs

3. **Testing**
   - Write security tests
   - Test authentication flows
   - Validate authorization checks
   - Test rate limiting

## Privacy & Data Protection

This project is designed with privacy-first principles:

### Data Collection

- **Audit Logs**: Disabled by default (set `ENABLE_AUDIT_LOGS=true` to enable)
- **Analytics**: Disabled by default (set `ENABLE_ANALYTICS=true` to enable)
- **User Data**: Stored locally in browser when possible
- **API Keys**: Encrypted before storage

### BYOK (Bring Your Own Key)

Users can provide their own API keys for:
- OpenAI
- Anthropic
- Google AI
- Groq
- And other providers

This ensures:
- Users control their data
- No middleman access to conversations
- Direct billing relationship with providers
- Full transparency

### Data Retention

- Conversations: Stored locally in browser (optional server backup)
- Images: Stored locally or in user-controlled storage
- Audit logs: Configurable retention period (default: disabled)
- User accounts: Deletable by user at any time

## Security Features

### Built-in Security

1. **Rate Limiting**
   - Per-user request limits
   - Configurable thresholds
   - Protection against abuse

2. **Input Validation**
   - All user inputs sanitized
   - SQL injection prevention
   - XSS protection

3. **Authentication**
   - JWT-based sessions
   - Secure password hashing (bcrypt)
   - OAuth 2.0 support

4. **Encryption**
   - API keys encrypted at rest
   - HTTPS enforced in production
   - Secure cookie settings

### Optional Security Features

1. **Webhook Security**
   - Signature verification
   - IP whitelisting
   - Rate limiting

2. **Admin Features**
   - Audit logging (opt-in)
   - User management
   - Usage monitoring

## Compliance

### GDPR Compliance

- Right to access data
- Right to deletion
- Data portability
- Privacy by design

### Security Standards

- OWASP Top 10 protection
- Secure development lifecycle
- Regular security updates
- Vulnerability disclosure program

## Security Updates

We publish security updates through:
- GitHub Security Advisories
- Release notes
- Email notifications (for critical issues)

## Contact

For security concerns:
- Email: security@example.com
- GitHub: Create a private security advisory

## Acknowledgments

We appreciate security researchers who responsibly disclose vulnerabilities. Contributors will be acknowledged (with permission) in our security hall of fame.

---

**Last Updated**: 2026-02-14
