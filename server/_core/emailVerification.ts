import { generateToken, getTokenExpiry } from "./passwordAuth";

// Email verification token expiry (24 hours)
export const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;

/**
 * Generate a verification token and expiry date
 */
export function generateVerificationToken(): { token: string; expiry: Date } {
  const token = generateToken();
  const expiry = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);
  return { token, expiry };
}

/**
 * Check if verification token is expired
 */
export function isVerificationTokenExpired(expiry: Date | null): boolean {
  if (!expiry) return true;
  return new Date() > expiry;
}

/**
 * Generate verification email HTML
 */
export function generateVerificationEmailHtml(
  userName: string,
  verificationUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify your email - Chofesh.ai</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 40px 20px; margin: 0;">
      <div style="max-width: 560px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; padding: 40px; border: 1px solid #2a2a2a;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #60a5fa; margin: 0; font-size: 28px;">Chofesh.ai</h1>
          <p style="color: #888; margin-top: 8px;">AI Without Limits</p>
        </div>
        
        <h2 style="margin: 0 0 16px 0; font-size: 24px;">Verify your email address</h2>
        
        <p style="color: #ccc; line-height: 1.6; margin-bottom: 24px;">
          Hi ${userName || "there"},<br><br>
          Thanks for signing up for Chofesh.ai! Please verify your email address by clicking the button below.
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verificationUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Verify Email Address
          </a>
        </div>
        
        <p style="color: #888; font-size: 14px; line-height: 1.6;">
          This link will expire in 24 hours. If you didn't create an account with Chofesh.ai, you can safely ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #2a2a2a; margin: 32px 0;">
        
        <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${verificationUrl}" style="color: #60a5fa; word-break: break-all;">${verificationUrl}</a>
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate verification email plain text
 */
export function generateVerificationEmailText(
  userName: string,
  verificationUrl: string
): string {
  return `
Verify your email address - Chofesh.ai

Hi ${userName || "there"},

Thanks for signing up for Chofesh.ai! Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours. If you didn't create an account with Chofesh.ai, you can safely ignore this email.

---
Chofesh.ai - AI Without Limits
  `.trim();
}
