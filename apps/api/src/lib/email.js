import nodemailer from 'nodemailer';

let transporter;

export const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

export const sendWorkspaceInviteEmail = async (toEmail, workspaceName, inviterName) => {
  if (!process.env.SMTP_USER) return; // Skip if email not configured

  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"TeamHub" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `You've been invited to join ${workspaceName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Welcome to TeamHub!</h2>
        <p><strong>${inviterName}</strong> has invited you to join the workspace <strong>${workspaceName}</strong>.</p>
        <p>Log in to your TeamHub account to accept the invitation and start collaborating.</p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login" 
           style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Go to TeamHub
        </a>
      </div>
    `,
  });
};

export const sendMentionEmail = async (toEmail, mentionedByName, message, workspaceName) => {
  if (!process.env.SMTP_USER) return;

  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"TeamHub" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `${mentionedByName} mentioned you in ${workspaceName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">You've been mentioned</h2>
        <p><strong>${mentionedByName}</strong> mentioned you in <strong>${workspaceName}</strong>:</p>
        <blockquote style="border-left: 3px solid #3b82f6; padding-left: 16px; margin: 16px 0; color: #475569;">
          ${message}
        </blockquote>
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login" 
           style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          View in TeamHub
        </a>
      </div>
    `,
  });
};
