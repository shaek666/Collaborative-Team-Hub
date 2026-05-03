import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendWorkspaceInviteEmail = async (toEmail, workspaceName, inviterName) => {
  if (!process.env.RESEND_API_KEY) return;

  await resend.emails.send({
    from: 'TeamHub <onboarding@resend.dev>',
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
  if (!process.env.RESEND_API_KEY) return;

  await resend.emails.send({
    from: 'TeamHub <onboarding@resend.dev>',
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
