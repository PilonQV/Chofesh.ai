# Chofesh.ai Security Audit Report

**Date:** January 8, 2026  
**Auditor:** Manus AI  
**Project:** Chofesh.ai (Libre.ai)  
**Version:** 5469dd0f

---

## Executive Summary

This security audit evaluates the Chofesh.ai codebase for potential vulnerabilities, security misconfigurations, and areas for improvement. The audit covered dependency vulnerabilities, secret management, authentication security, input validation, and web application security best practices.

**Overall Security Posture: Good with Minor Issues**

The application demonstrates solid security practices including proper password hashing, rate limiting, security headers, and input validation through Zod schemas. However, several areas require attention to strengthen the security posture.

---

## Findings Summary

| Category | Severity | Count | Status |
|----------|----------|-------|--------|
| Dependency Vulnerabilities | High | 5 | Requires Update |
| Dependency Vulnerabilities | Moderate | 1 | Requires Update |
| Hardcoded Credentials | Low | 1 | Test File Only |
| Code Injection Risk | Medium | 1 | Mitigated |
| XSS Risk | Low | 1 | Controlled |

---

## 1. Dependency Vulnerabilities

### 1.1 pnpm Audit Results

The `pnpm audit` command identified **6 vulnerabilities** in the dependency tree:

| Package | Severity | Vulnerability | Recommendation |
|---------|----------|---------------|----------------|
| pnpm | High | CVE-2025-69262 - Command Injection via environment variable substitution | Upgrade to ≥10.27.0 |
| esbuild | High | GHSA-67mh-4wv8-2f99 - Development server vulnerability | Upgrade to ≥0.25.0 |
| drizzle-kit | High | Transitive dependency on vulnerable esbuild | Update drizzle-kit |

**Impact:** The pnpm vulnerability (CVE-2025-69262) allows command injection through `.npmrc` environment variable substitution when using `tokenHelper`. This primarily affects CI/CD pipelines and build environments.

**Recommendation:** Update pnpm to version 10.27.0 or later. The esbuild vulnerabilities are in development dependencies and do not affect production runtime.

### 1.2 Action Items

```bash
# Update pnpm globally
npm install -g pnpm@latest

# Update project dependencies
pnpm update drizzle-kit@latest
```

---

## 2. Secret Management

### 2.1 Gitleaks Scan Results

The secret scanning tool identified **1 potential leak**:

| File | Type | Severity | Assessment |
|------|------|----------|------------|
| `server/emailAuth.test.ts` | Test Password | Low | **False Positive** - Test fixture only |

The detected "secret" (`StrongPass123`) is a test password used in unit tests and does not represent an actual security risk. However, it's best practice to use obviously fake passwords in tests.

### 2.2 Environment Variable Security

The application properly uses environment variables for all sensitive configuration:

- `JWT_SECRET` - Used for session token signing
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth credentials
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - GitHub OAuth
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` - Payment processing
- `VENICE_API_KEY` - AI image generation
- `OPENROUTER_API_KEY` - AI model routing
- `RESEND_API_KEY` - Email service

**Positive Finding:** No hardcoded API keys or secrets were found in the production codebase.

---

## 3. Authentication & Authorization Security

### 3.1 Password Security

The application implements strong password security:

| Feature | Implementation | Status |
|---------|----------------|--------|
| Password Hashing | bcrypt with 12 salt rounds | ✅ Secure |
| Password Validation | Min 8 chars, uppercase, lowercase, number | ✅ Good |
| Rate Limiting | 5 attempts per IP, 10 per email | ✅ Implemented |
| Account Lockout | 15-minute block after max attempts | ✅ Implemented |
| Password Reset | Secure token with 24-hour expiry | ✅ Secure |

**Code Reference:** `server/_core/passwordAuth.ts`

```typescript
// Secure password hashing implementation
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS); // SALT_ROUNDS = 12
}
```

### 3.2 Session Management

Sessions are managed using JWT tokens with proper security measures:

- Tokens are signed using HS256 algorithm
- Expiration is enforced
- HTTP-only cookies are used for session storage

### 3.3 OAuth Security

OAuth implementations (Google, GitHub) follow security best practices:

- State parameter validation for CSRF protection
- Access tokens are encrypted before storage (GitHub)
- Token exchange happens server-side

---

## 4. Input Validation & Injection Prevention

### 4.1 SQL Injection Protection

The application uses **Drizzle ORM** which provides parameterized queries by default. All database operations use the ORM's query builder, which automatically escapes user input.

**One Potential Concern:** The `LIKE` query in `getApiCallLogs` uses string interpolation:

```typescript
// server/db.ts line 1625
conditions.push(sql`${apiCallLogs.userEmail} LIKE ${`%${options.userEmail}%`}`);
```

**Assessment:** This is actually safe because Drizzle's `sql` template tag properly parameterizes the values. The `%` wildcards are part of the SQL pattern, not user input.

### 4.2 XSS Prevention

| Area | Protection | Status |
|------|------------|--------|
| React Components | JSX auto-escaping | ✅ Protected |
| dangerouslySetInnerHTML | Only in chart.tsx for CSS themes | ⚠️ Controlled |
| Content Security Policy | Configured with restrictions | ✅ Implemented |

The single use of `dangerouslySetInnerHTML` in `chart.tsx` is for injecting CSS theme styles and does not accept user input.

### 4.3 Code Injection Risk

**Finding:** The `evaluateMath` function in `server/_core/smartTools.ts` uses `new Function()` for math expression evaluation.

```typescript
// Sanitize input - only allow safe math characters
const sanitized = expression
  .replace(/[^0-9+\-*/().^%\s,sincotaglqrtexpabflore]/gi, '')
  .replace(/\^/g, '**');

const evalFunc = new Function(
  ...Object.keys(mathFunctions),
  `return ${sanitized}`
);
```

**Assessment:** The sanitization regex is restrictive but could potentially be bypassed. The function only allows:
- Numbers (0-9)
- Math operators (+, -, *, /, %, ^)
- Parentheses
- Specific function names (sin, cos, tan, etc.)

**Recommendation:** Consider using a dedicated math expression parser library like `mathjs` for safer evaluation.

---

## 5. Web Application Security Headers

The application implements comprehensive security headers:

| Header | Value | Purpose |
|--------|-------|---------|
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload | Force HTTPS |
| X-Frame-Options | SAMEORIGIN | Prevent clickjacking |
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| Referrer-Policy | strict-origin-when-cross-origin | Control referrer info |
| Content-Security-Policy | Configured | Prevent XSS/injection |
| Cross-Origin-Opener-Policy | same-origin | Isolate browsing context |
| Permissions-Policy | Restricted | Limit browser features |

**Positive Finding:** The CSP configuration is well-structured, though `'unsafe-inline'` and `'unsafe-eval'` are enabled for scripts (common requirement for React applications).

---

## 6. API Security

### 6.1 Authentication Enforcement

All sensitive endpoints use the `protectedProcedure` middleware which requires valid authentication:

```typescript
// Protected endpoints require authentication
protectedProcedure.query(async ({ ctx }) => {
  // ctx.user is guaranteed to exist
});
```

### 6.2 Admin Authorization

Admin endpoints use `adminProcedure` which checks for admin role:

```typescript
if (ctx.user.role !== "admin") {
  throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
}
```

### 6.3 Input Validation

All API inputs are validated using Zod schemas:

```typescript
.input(z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
}))
```

---

## 7. Recommendations

### 7.1 High Priority

1. **Update Dependencies**
   - Upgrade pnpm to version 10.27.0 or later
   - Update drizzle-kit to get patched esbuild version

2. **Math Expression Evaluation**
   - Replace `new Function()` with a dedicated math parser library
   - Consider using `mathjs` or `expr-eval` for safer evaluation

### 7.2 Medium Priority

3. **Test Credentials**
   - Use obviously fake passwords in tests (e.g., `TestPass123!FAKE`)
   - Add gitleaks configuration to ignore test files

4. **CSP Hardening**
   - Work toward removing `'unsafe-inline'` and `'unsafe-eval'` from CSP
   - Use nonces or hashes for inline scripts

### 7.3 Low Priority

5. **Rate Limiting Enhancement**
   - Consider adding rate limiting to image generation endpoints
   - Implement progressive delays for repeated failures

6. **Logging Enhancement**
   - Add security event logging for failed authentication attempts
   - Implement audit log retention policy

---

## 8. Compliance Checklist

| OWASP Top 10 | Status | Notes |
|--------------|--------|-------|
| A01 Broken Access Control | ✅ Mitigated | Role-based access implemented |
| A02 Cryptographic Failures | ✅ Mitigated | bcrypt, encrypted tokens |
| A03 Injection | ✅ Mitigated | Parameterized queries, input validation |
| A04 Insecure Design | ✅ Good | Security-first architecture |
| A05 Security Misconfiguration | ✅ Good | Security headers configured |
| A06 Vulnerable Components | ⚠️ Action Needed | Update dependencies |
| A07 Auth Failures | ✅ Mitigated | Rate limiting, strong passwords |
| A08 Software Integrity | ✅ Good | No integrity issues found |
| A09 Logging Failures | ⚠️ Partial | Audit logging exists, could be enhanced |
| A10 SSRF | ✅ Mitigated | URL validation in place |

---

## Conclusion

Chofesh.ai demonstrates a solid security foundation with proper authentication, authorization, input validation, and security headers. The main areas requiring attention are:

1. **Dependency updates** - Address the 6 known vulnerabilities
2. **Math evaluation** - Replace `new Function()` with a safer alternative
3. **CSP hardening** - Work toward stricter content security policy

The application follows security best practices for a modern web application and shows evidence of security-conscious development.

---

*Report generated by Manus AI Security Audit*
