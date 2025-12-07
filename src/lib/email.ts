import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send verification email
export async function sendVerificationEmail(to: string, verificationToken: string) {
  const transporter = createTransporter();

  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: `"PrintScrap.ai" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Verify Your Email - PrintScrap.ai',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to PrintScrap.ai!</h1>
            </div>
            <div class="content">
              <h2>Verify Your Email Address</h2>
              <p>Thank you for registering with PrintScrap.ai. Please verify your email address to activate your account.</p>
              <p>Click the button below to verify your email:</p>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create an account with us, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 PrintScrap.ai. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent to:', to);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

// Send plan request notification to super admin
export async function sendPlanRequestNotification(
  adminEmail: string,
  clientName: string,
  clientEmail: string,
  planName: string,
  requestMessage?: string
) {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"PrintScrap.ai" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: `New Plan Activation Request - ${clientName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background: white; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 New Plan Request</h1>
            </div>
            <div class="content">
              <h2>Plan Activation Request</h2>
              <p>A client has requested plan activation. Please review the details below:</p>

              <div class="info-box">
                <p><strong>Client Name:</strong> ${clientName}</p>
                <p><strong>Client Email:</strong> ${clientEmail}</p>
                <p><strong>Requested Plan:</strong> ${planName}</p>
                ${requestMessage ? `<p><strong>Message:</strong> ${requestMessage}</p>` : ''}
              </div>

              <p>Please login to your admin panel to approve or reject this request.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/super-admin/plan-requests" class="button">View Plan Requests</a>
            </div>
            <div class="footer">
              <p>&copy; 2025 PrintScrap.ai. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Plan request notification sent to admin:', adminEmail);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error sending plan request notification:', error);
    throw new Error('Failed to send notification email');
  }
}

// Send plan activation confirmation to client
export async function sendPlanActivationEmail(
  to: string,
  clientName: string,
  planName: string,
  startDate: string,
  endDate: string
) {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"PrintScrap.ai" <${process.env.SMTP_USER}>`,
    to,
    subject: `Plan Activated - ${planName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background: white; padding: 15px; border-left: 4px solid #059669; margin: 20px 0; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Plan Activated!</h1>
            </div>
            <div class="content">
              <h2>Hello ${clientName},</h2>
              <p>Great news! Your subscription plan has been activated.</p>

              <div class="info-box">
                <p><strong>Plan:</strong> ${planName}</p>
                <p><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</p>
                <p><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString()}</p>
              </div>

              <p>You now have full access to all features. Login to your account to get started!</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/client/dashboard" class="button">Go to Dashboard</a>
            </div>
            <div class="footer">
              <p>&copy; 2025 PrintScrap.ai. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Plan activation email sent to:', to);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error sending plan activation email:', error);
    throw new Error('Failed to send activation email');
  }
}
