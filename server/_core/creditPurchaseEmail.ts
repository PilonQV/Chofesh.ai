import { sendEmail } from "./resend";

/**
 * Send credit purchase confirmation email
 */
export async function sendCreditPurchaseEmail(
  to: string,
  userName: string,
  purchaseDetails: {
    creditsAmount: number;
    price: string;
    transactionId?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const formattedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Credits Purchase Confirmation - Chofesh.ai</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #0a0a0f;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background: #12121a; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <img src="https://chofesh.ai/logo.webp" alt="Chofesh.ai" width="48" height="48" style="display: block;">
              <h1 style="color: #ffffff; font-size: 24px; margin: 16px 0 0 0;">Chofesh.ai</h1>
            </td>
          </tr>
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 48px;">💳</span>
              </div>
              <h2 style="color: #ffffff; font-size: 28px; margin: 0 0 16px 0; text-align: center;">Credits Purchased!</h2>
              <p style="color: #a0a0b0; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">Hi ${userName || "there"},</p>
              <p style="color: #a0a0b0; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">Thank you for your purchase! Your credits have been added to your account.</p>
              
              <div style="background: rgba(99, 102, 241, 0.1); border: 2px solid #6366f1; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <div style="text-align: center;">
                  <p style="color: #6366f1; font-size: 14px; font-weight: 600; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">
                    Credits Added
                  </p>
                  <h3 style="color: #ffffff; font-size: 48px; margin: 0 0 8px 0;">${purchaseDetails.creditsAmount.toLocaleString()}</h3>
                  <p style="color: #a0a0b0; font-size: 18px; margin: 0;">credits</p>
                </div>
              </div>

              <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px; margin: 24px 0;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="color: #a0a0b0; font-size: 14px; padding: 8px 0;">Amount Paid:</td>
                    <td align="right" style="color: #ffffff; font-size: 16px; font-weight: 600; padding: 8px 0;">${purchaseDetails.price}</td>
                  </tr>
                  <tr>
                    <td style="color: #a0a0b0; font-size: 14px; padding: 8px 0;">Purchase Date:</td>
                    <td align="right" style="color: #ffffff; font-size: 14px; padding: 8px 0;">${formattedDate}</td>
                  </tr>
                  ${purchaseDetails.transactionId ? `
                  <tr>
                    <td style="color: #a0a0b0; font-size: 14px; padding: 8px 0;">Transaction ID:</td>
                    <td align="right" style="color: #ffffff; font-size: 12px; padding: 8px 0; font-family: monospace;">${purchaseDetails.transactionId}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <div style="background: rgba(34, 197, 94, 0.1); border-left: 4px solid #22c55e; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="color: #22c55e; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">✓ Credits Active</p>
                <p style="color: #a0a0b0; font-size: 14px; line-height: 1.6; margin: 0;">Your credits are now available and ready to use for:</p>
                <ul style="color: #a0a0b0; font-size: 14px; margin: 12px 0 0 0; padding-left: 20px;">
                  <li style="margin: 6px 0;">AI Chat & Conversations</li>
                  <li style="margin: 6px 0;">Image Generation (1 credit per image)</li>
                  <li style="margin: 6px 0;">Document Analysis</li>
                  <li style="margin: 6px 0;">Code Generation & Review</li>
                </ul>
              </div>

              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="https://chofesh.ai/chat" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px; margin-right: 8px;">Start Creating</a>
                    <a href="https://chofesh.ai/credits" style="display: inline-block; background: rgba(255, 255, 255, 0.1); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.2);">View Balance</a>
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

  const text = `Credits Purchased - Chofesh.ai

Hi ${userName || "there"},

Thank you for your purchase! Your credits have been added to your account.

Credits Added: ${purchaseDetails.creditsAmount.toLocaleString()} credits
Amount Paid: ${purchaseDetails.price}
Purchase Date: ${formattedDate}
${purchaseDetails.transactionId ? `Transaction ID: ${purchaseDetails.transactionId}` : ''}

Your credits are now available and ready to use for:
- AI Chat & Conversations
- Image Generation (1 credit per image)
- Document Analysis
- Code Generation & Review

Start creating: https://chofesh.ai/chat
View balance: https://chofesh.ai/credits

© ${new Date().getFullYear()} Chofesh.ai - AI Without Limits
`;

  return sendEmail({
    to,
    subject: `Credits Purchase Confirmation - Chofesh.ai`,
    html,
    text,
  });
}
