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



/**
 * Generate unsubscribe URL for email preferences
 */
export function getUnsubscribeUrl(email: string, token: string): string {
  return `https://chofesh.ai/email-preferences?email=${encodeURIComponent(email)}&token=${token}`;
}

/**
 * Parse user agent string to get device info
 */
function parseUserAgent(userAgent: string): string {
  if (!userAgent) return "Unknown device";
  
  let os = "Unknown OS";
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac OS")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";
  
  let browser = "Unknown browser";
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) browser = "Chrome";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";
  else if (userAgent.includes("Edg")) browser = "Edge";
  else if (userAgent.includes("Opera") || userAgent.includes("OPR")) browser = "Opera";
  
  return `${browser} on ${os}`;
}

/**
 * Send login notification email when user logs in from new device/location
 */
export async function sendLoginNotificationEmail(
  to: string,
  userName: string,
  loginDetails: {
    ipAddress: string;
    userAgent: string;
    location?: string;
    timestamp: Date;
  }
): Promise<{ success: boolean; error?: string }> {
  const formattedTime = loginDetails.timestamp.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const deviceInfo = parseUserAgent(loginDetails.userAgent);
  const locationRow = loginDetails.location 
    ? `<tr><td style="color: #707080; font-size: 14px; padding: 8px 0;">Location:</td><td style="color: #ffffff; font-size: 14px; padding: 8px 0; text-align: right;">${loginDetails.location}</td></tr>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Login Detected - Chofesh.ai</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <img src="https://chofesh.ai/logo.webp" alt="Chofesh.ai" width="48" height="48" style="display: block;">
              <h1 style="color: #ffffff; font-size: 24px; margin: 16px 0 0 0;">Chofesh.ai</h1>
            </td>
          </tr>
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 32px;">🔐</span>
              </div>
              <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 16px 0; text-align: center;">New Login Detected</h2>
              <p style="color: #a0a0b0; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                Hi ${userName || "there"}, we noticed a new login to your Chofesh.ai account.
              </p>
              <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 24px; margin: 24px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="color: #707080; font-size: 14px; padding: 8px 0;">Time:</td>
                    <td style="color: #ffffff; font-size: 14px; padding: 8px 0; text-align: right;">${formattedTime}</td>
                  </tr>
                  <tr>
                    <td style="color: #707080; font-size: 14px; padding: 8px 0;">Device:</td>
                    <td style="color: #ffffff; font-size: 14px; padding: 8px 0; text-align: right;">${deviceInfo}</td>
                  </tr>
                  <tr>
                    <td style="color: #707080; font-size: 14px; padding: 8px 0;">IP Address:</td>
                    <td style="color: #ffffff; font-size: 14px; padding: 8px 0; text-align: right;">${loginDetails.ipAddress}</td>
                  </tr>
                  ${locationRow}
                </table>
              </div>
              <p style="color: #f97316; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
                If this wasn't you, please <a href="https://chofesh.ai/settings" style="color: #f97316; text-decoration: underline;">change your password</a> immediately.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 30px; text-align: center;">
              <p style="color: #505060; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Chofesh.ai - AI Without Limits</p>
              <p style="color: #404050; font-size: 11px; margin: 8px 0 0 0;">
                <a href="https://chofesh.ai/settings" style="color: #6366f1; text-decoration: underline;">Manage email preferences</a>
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

  const text = `New Login Detected - Chofesh.ai

Hi ${userName || "there"},

We noticed a new login to your Chofesh.ai account.

Login Details:
- Time: ${formattedTime}
- Device: ${deviceInfo}
- IP Address: ${loginDetails.ipAddress}
${loginDetails.location ? `- Location: ${loginDetails.location}` : ""}

If this was you, no action is needed.
If this wasn't you, please change your password immediately at https://chofesh.ai/settings

© ${new Date().getFullYear()} Chofesh.ai - AI Without Limits
`;

  return sendEmail({
    to,
    subject: "New Login to Your Chofesh.ai Account",
    html,
    text,
  });
}

/**
 * Send subscription confirmation email
 */
export async function sendSubscriptionConfirmationEmail(
  to: string,
  userName: string,
  subscriptionDetails: {
    planName: string;
    price: string;
    billingPeriod: "monthly" | "yearly";
    action: "upgrade" | "downgrade" | "new" | "cancel";
    effectiveDate?: Date;
    features?: string[];
  }
): Promise<{ success: boolean; error?: string }> {
  const actionText: Record<string, string> = {
    upgrade: "Subscription Upgraded",
    downgrade: "Subscription Changed",
    new: "Welcome to Your New Plan",
    cancel: "Subscription Cancelled",
  };

  const actionEmoji: Record<string, string> = {
    upgrade: "🚀",
    downgrade: "📉",
    new: "🎉",
    cancel: "👋",
  };

  const actionColor: Record<string, string> = {
    upgrade: "#22c55e",
    downgrade: "#f97316",
    new: "#6366f1",
    cancel: "#ef4444",
  };

  const effectiveDate = subscriptionDetails.effectiveDate || new Date();
  const formattedDate = effectiveDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const featuresHtml = subscriptionDetails.features?.length
    ? `<div style="margin-top: 24px;"><p style="color: #a0a0b0; font-size: 14px; margin: 0 0 12px 0;">Your plan includes:</p><ul style="color: #ffffff; font-size: 14px; margin: 0; padding-left: 20px;">${subscriptionDetails.features.map(f => `<li style="margin: 8px 0;">${f}</li>`).join("")}</ul></div>`
    : "";

  const priceSection = subscriptionDetails.action !== "cancel" 
    ? `<p style="color: #a0a0b0; font-size: 18px; margin: 0;">${subscriptionDetails.price}/${subscriptionDetails.billingPeriod === "yearly" ? "year" : "month"}</p>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${actionText[subscriptionDetails.action]} - Chofesh.ai</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <img src="https://chofesh.ai/logo.webp" alt="Chofesh.ai" width="48" height="48" style="display: block;">
              <h1 style="color: #ffffff; font-size: 24px; margin: 16px 0 0 0;">Chofesh.ai</h1>
            </td>
          </tr>
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 48px;">${actionEmoji[subscriptionDetails.action]}</span>
              </div>
              <h2 style="color: #ffffff; font-size: 28px; margin: 0 0 16px 0; text-align: center;">${actionText[subscriptionDetails.action]}</h2>
              <p style="color: #a0a0b0; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">Hi ${userName || "there"},</p>
              <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid ${actionColor[subscriptionDetails.action]}40; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <div style="text-align: center;">
                  <p style="color: ${actionColor[subscriptionDetails.action]}; font-size: 14px; font-weight: 600; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">
                    ${subscriptionDetails.action === "cancel" ? "Cancelled Plan" : "Your Plan"}
                  </p>
                  <h3 style="color: #ffffff; font-size: 32px; margin: 0 0 8px 0;">${subscriptionDetails.planName}</h3>
                  ${priceSection}
                </div>
                ${featuresHtml}
              </div>
              <p style="color: #707080; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
                ${subscriptionDetails.action === "cancel" 
                  ? `Your subscription will remain active until ${formattedDate}.`
                  : `Effective: ${formattedDate}`
                }
              </p>
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="https://chofesh.ai/subscription" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px;">Manage Subscription</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 30px; text-align: center;">
              <p style="color: #505060; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Chofesh.ai - AI Without Limits</p>
              <p style="color: #404050; font-size: 11px; margin: 8px 0 0 0;">
                <a href="https://chofesh.ai/settings" style="color: #6366f1; text-decoration: underline;">Manage email preferences</a>
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

  const featuresText = subscriptionDetails.features?.length 
    ? `\nYour plan includes:\n${subscriptionDetails.features.map(f => `- ${f}`).join("\n")}`
    : "";

  const text = `${actionText[subscriptionDetails.action]} - Chofesh.ai

Hi ${userName || "there"},

${subscriptionDetails.action === "cancel" 
  ? `Your ${subscriptionDetails.planName} subscription has been cancelled. It will remain active until ${formattedDate}.`
  : `Your subscription has been ${subscriptionDetails.action === "new" ? "activated" : subscriptionDetails.action + "d"} to ${subscriptionDetails.planName} at ${subscriptionDetails.price}/${subscriptionDetails.billingPeriod === "yearly" ? "year" : "month"}.`
}
${featuresText}

Manage your subscription at: https://chofesh.ai/subscription

© ${new Date().getFullYear()} Chofesh.ai - AI Without Limits
`;

  return sendEmail({
    to,
    subject: `${actionText[subscriptionDetails.action]} - Chofesh.ai`,
    html,
    text,
  });
}
