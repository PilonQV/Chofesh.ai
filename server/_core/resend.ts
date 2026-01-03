import { Resend } from "resend";

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Chofesh.ai <noreply@chofesh.ai>";
const SUPPORT_EMAIL = "support@chofesh.ai";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error("[Resend] Error sending email:", error);
      return { success: false, error: error.message };
    }

    console.log(`[Resend] Email sent successfully to ${options.to}, id: ${data?.id}`);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error("[Resend] Exception sending email:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Send verification email to new user
 */
export async function sendVerificationEmail(
  to: string,
  userName: string,
  verificationUrl: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Chofesh.ai</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <img src="https://chofesh.ai/logo.webp" alt="Chofesh.ai" width="48" height="48" style="display: block;">
              <h1 style="color: #ffffff; font-size: 24px; margin: 16px 0 0 0;">Chofesh.ai</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px;">
              <h2 style="color: #ffffff; font-size: 28px; margin: 0 0 16px 0; text-align: center;">
                Verify Your Email
              </h2>
              <p style="color: #a0a0b0; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                Hi ${userName || "there"},
              </p>
              <p style="color: #a0a0b0; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0; text-align: center;">
                Thanks for signing up for Chofesh.ai! Please verify your email address by clicking the button below.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #707080; font-size: 14px; line-height: 1.6; margin: 32px 0 0 0; text-align: center;">
                This link will expire in 24 hours. If you didn't create an account with Chofesh.ai, you can safely ignore this email.
              </p>
              
              <!-- Fallback Link -->
              <p style="color: #505060; font-size: 12px; line-height: 1.6; margin: 24px 0 0 0; text-align: center; word-break: break-all;">
                If the button doesn't work, copy and paste this link:<br>
                <a href="${verificationUrl}" style="color: #6366f1;">${verificationUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 30px; text-align: center;">
              <p style="color: #505060; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Chofesh.ai - AI Without Limits
              </p>
              <p style="color: #404050; font-size: 11px; margin: 8px 0 0 0;">
                This email was sent to ${to}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
Verify Your Email - Chofesh.ai

Hi ${userName || "there"},

Thanks for signing up for Chofesh.ai! Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours. If you didn't create an account with Chofesh.ai, you can safely ignore this email.

© ${new Date().getFullYear()} Chofesh.ai - AI Without Limits
`;

  return sendEmail({
    to,
    subject: "Verify Your Email - Chofesh.ai",
    html,
    text,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  userName: string,
  resetUrl: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Chofesh.ai</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <img src="https://chofesh.ai/logo.webp" alt="Chofesh.ai" width="48" height="48" style="display: block;">
              <h1 style="color: #ffffff; font-size: 24px; margin: 16px 0 0 0;">Chofesh.ai</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px;">
              <h2 style="color: #ffffff; font-size: 28px; margin: 0 0 16px 0; text-align: center;">
                Reset Your Password
              </h2>
              <p style="color: #a0a0b0; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                Hi ${userName || "there"},
              </p>
              <p style="color: #a0a0b0; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0; text-align: center;">
                We received a request to reset your password. Click the button below to create a new password.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #707080; font-size: 14px; line-height: 1.6; margin: 32px 0 0 0; text-align: center;">
                This link will expire in 24 hours. If you didn't request a password reset, you can safely ignore this email.
              </p>
              
              <!-- Fallback Link -->
              <p style="color: #505060; font-size: 12px; line-height: 1.6; margin: 24px 0 0 0; text-align: center; word-break: break-all;">
                If the button doesn't work, copy and paste this link:<br>
                <a href="${resetUrl}" style="color: #ef4444;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 30px; text-align: center;">
              <p style="color: #505060; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Chofesh.ai - AI Without Limits
              </p>
              <p style="color: #404050; font-size: 11px; margin: 8px 0 0 0;">
                This email was sent to ${to}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
Reset Your Password - Chofesh.ai

Hi ${userName || "there"},

We received a request to reset your password. Click the link below to create a new password:

${resetUrl}

This link will expire in 24 hours. If you didn't request a password reset, you can safely ignore this email.

© ${new Date().getFullYear()} Chofesh.ai - AI Without Limits
`;

  return sendEmail({
    to,
    subject: "Reset Your Password - Chofesh.ai",
    html,
    text,
  });
}

/**
 * Send welcome email after verification
 */
export async function sendWelcomeEmail(
  to: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Chofesh.ai</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <img src="https://chofesh.ai/logo.webp" alt="Chofesh.ai" width="48" height="48" style="display: block;">
              <h1 style="color: #ffffff; font-size: 24px; margin: 16px 0 0 0;">Chofesh.ai</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px;">
              <h2 style="color: #ffffff; font-size: 28px; margin: 0 0 16px 0; text-align: center;">
                Welcome to Chofesh.ai! 🎉
              </h2>
              <p style="color: #a0a0b0; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                Hi ${userName || "there"},
              </p>
              <p style="color: #a0a0b0; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0; text-align: center;">
                Your email has been verified and your account is ready. Experience AI without limits - private, uncensored, and completely under your control.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="https://chofesh.ai/chat" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
                      Start Chatting
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #707080; font-size: 14px; line-height: 1.6; margin: 32px 0 0 0; text-align: center;">
                Need help? Reply to this email or visit our support page.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 30px; text-align: center;">
              <p style="color: #505060; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Chofesh.ai - AI Without Limits
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
Welcome to Chofesh.ai! 🎉

Hi ${userName || "there"},

Your email has been verified and your account is ready. Experience AI without limits - private, uncensored, and completely under your control.

Start chatting: https://chofesh.ai/chat

Need help? Reply to this email or visit our support page.

© ${new Date().getFullYear()} Chofesh.ai - AI Without Limits
`;

  return sendEmail({
    to,
    subject: "Welcome to Chofesh.ai! 🎉",
    html,
    text,
  });
}

/**
 * Validate Resend API key by checking domains
 */
export async function validateResendApiKey(): Promise<{ valid: boolean; error?: string }> {
  try {
    const { data, error } = await resend.domains.list();
    
    if (error) {
      return { valid: false, error: error.message };
    }
    
    return { valid: true };
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
