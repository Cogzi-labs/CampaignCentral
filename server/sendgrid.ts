import { log } from './vite';
import * as sendgrid from '@sendgrid/mail';

// Configure SendGrid API key if available
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_SENDER = process.env.SENDGRID_SENDER || 'noreply@campaignhub.com';

// Initialize SendGrid if API key is available
if (SENDGRID_API_KEY) {
  sendgrid.setApiKey(SENDGRID_API_KEY);
  log('SendGrid configured with API key', 'email');
} else {
  log('SendGrid API key not found. SendGrid email functionality is disabled.', 'email');
}

export interface SendGridEmailParams {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
}

// SendGrid Mail.SendData interface for TypeScript compatibility
type SendGridMailData = {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Sends an email using SendGrid
 * @param params Email parameters (to, from, subject, text/html)
 * @returns Promise resolving to boolean indicating success
 */
export async function sendGridEmail(params: SendGridEmailParams): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    log('Cannot send email: SendGrid API key not configured', 'email');
    return false;
  }

  try {
    const sender = params.from || SENDGRID_SENDER || 'noreply@campaignhub.com';
    log(`Attempting to send email from ${sender} to ${params.to} using SendGrid`, 'email');
    
    // Create mailData object with required fields
    const mailData: SendGridMailData = {
      to: params.to,
      from: sender,
      subject: params.subject,
      text: params.text || '',
      html: params.html || ''
    };
    
    await sendgrid.send(mailData);
    
    log(`Email sent successfully to ${params.to} using SendGrid`, 'email');
    return true;
  } catch (error) {
    log(`SendGrid email error: ${error}`, 'email');
    console.error('Full SendGrid error object:', error);
    return false;
  }
}

/**
 * Sends a password reset email with a reset link using SendGrid
 * @param to Recipient email address
 * @param username Username of the user
 * @param resetToken Reset token to include in the link
 * @param baseUrl Base URL of the application
 * @returns Promise resolving to boolean indicating success
 */
export async function sendGridPasswordResetEmail(
  to: string,
  username: string,
  resetToken: string,
  baseUrl: string
): Promise<boolean> {
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
  
  const subject = 'Reset Your CampaignHub Password';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; text-align: center;">Reset Your Password</h2>
      <p>Hello ${username},</p>
      <p>We received a request to reset your password for your CampaignHub account. Click the button below to set a new password:</p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
      </div>
      <p>If you didn't request this password reset, you can ignore this email. The link will expire in 1 hour for security reasons.</p>
      <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
      <p style="word-break: break-all; color: #666;">${resetLink}</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
      <p style="color: #888; font-size: 12px; text-align: center;">CampaignHub - Marketing Campaign Management</p>
    </div>
  `;
  
  const text = `
    Reset Your Password
    
    Hello ${username},
    
    We received a request to reset your password for your CampaignHub account. Visit the link below to set a new password:
    
    ${resetLink}
    
    If you didn't request this password reset, you can ignore this email. The link will expire in 1 hour for security reasons.
    
    CampaignHub - Marketing Campaign Management
  `;
  
  return sendGridEmail({
    to,
    from: SENDGRID_SENDER,
    subject,
    html,
    text,
  });
}