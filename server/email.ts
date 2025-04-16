import AWS from 'aws-sdk';
import { log } from './vite';

// Get the environment variables directly from the process
const SES_USERNAME = process.env.SES_USERNAME || '';
const SES_PASSWORD = process.env.SES_PASSWORD || '';
const SES_SENDER = process.env.SES_SENDER || '';

// Initialize AWS SES service
const sesConfig = {
  accessKeyId: SES_USERNAME,
  secretAccessKey: SES_PASSWORD,
  region: 'ap-south-1', // Extracted from the host endpoint
};

// Log loaded credentials (without sensitive information)
log(`SES configuration loaded: username=${SES_USERNAME ? 'provided' : 'missing'}, password=${SES_PASSWORD ? 'provided' : 'missing'}, sender=${SES_SENDER}`, 'email');

// Initialize the SES object
const ses = new AWS.SES(sesConfig);

// Check if SES credentials are configured
if (SES_USERNAME && SES_PASSWORD) {
  log('AWS SES credentials configured', 'email');
  log(`Using SES username: ${SES_USERNAME}`, 'email');
  log(`Using SES region: ap-south-1`, 'email');
} else {
  log('AWS SES credentials not found. Email functionality is disabled.', 'email');
  log(`SES_USERNAME exists: ${!!SES_USERNAME}`, 'email');
  log(`SES_PASSWORD exists: ${!!SES_PASSWORD}`, 'email');
}

export interface EmailParams {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Sends an email using AWS SES
 * @param params Email parameters (to, from, subject, text/html)
 * @returns Promise resolving to boolean indicating success
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!SES_USERNAME || !SES_PASSWORD) {
    log('Cannot send email: AWS SES credentials not configured', 'email');
    return false;
  }

  try {
    const sender = params.from || SES_SENDER || 'noreply@campaignhub.com';
    
    const sesParams: AWS.SES.SendEmailRequest = {
      Source: sender,
      Destination: {
        ToAddresses: [params.to]
      },
      Message: {
        Subject: {
          Data: params.subject
        },
        Body: {
          Html: params.html ? { Data: params.html } : undefined,
          Text: params.text ? { Data: params.text } : undefined
        }
      }
    };
    
    await ses.sendEmail(sesParams).promise();
    log(`Email sent to ${params.to}`, 'email');
    return true;
  } catch (error) {
    log(`AWS SES email error: ${error}`, 'email');
    return false;
  }
}

/**
 * Sends a password reset email with a reset link
 * @param to Recipient email address
 * @param username Username of the user
 * @param resetToken Reset token to include in the link
 * @param baseUrl Base URL of the application
 * @returns Promise resolving to boolean indicating success
 */
export async function sendPasswordResetEmail(
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
  
  return sendEmail({
    to,
    from: SES_SENDER || 'noreply@campaignhub.com',
    subject,
    html,
    text,
  });
}