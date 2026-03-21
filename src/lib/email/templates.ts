export interface EmailTemplate {
  subject: string;
  html: string;
}

function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Task Manager Notification</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;">
          <!-- Header -->
          <tr>
            <td style="background-color:#18181b;border-radius:8px 8px 0 0;padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Task Manager</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:32px;border-left:1px solid #e4e4e7;border-right:1px solid #e4e4e7;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9f9fb;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 8px 8px;padding:16px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#71717a;">This is an automated notification from Task Manager. Please do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:24px;">
  <tr>
    <td style="border-radius:6px;background-color:#18181b;">
      <a href="${href}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">${label}</a>
    </td>
  </tr>
</table>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#18181b;line-height:1.3;">${text}</h1>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 12px;font-size:15px;color:#3f3f46;line-height:1.6;">${text}</p>`;
}

function badge(text: string, color: string): string {
  return `<span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:600;background-color:${color};color:#fff;">${text}</span>`;
}

// ─── Templates ───────────────────────────────────────────────────────────────

export function ticketCreated(params: {
  ticketNumber: string;
  ticketTitle: string;
  ticketUrl: string;
}): EmailTemplate {
  const { ticketNumber, ticketTitle, ticketUrl } = params;
  const subject = `[Task Manager] Ticket #${ticketNumber}: ${ticketTitle}`;
  const html = emailLayout(`
    ${heading(`New Ticket #${ticketNumber} Created`)}
    ${paragraph(`A new support ticket has been created and is awaiting attention.`)}
    <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;margin:16px 0;border:1px solid #e4e4e7;border-radius:6px;overflow:hidden;">
      <tr>
        <td style="padding:12px 16px;background-color:#f9f9fb;border-bottom:1px solid #e4e4e7;">
          <span style="font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">Ticket</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;">
          <span style="font-size:15px;font-weight:600;color:#18181b;">#${ticketNumber}</span>
          <span style="font-size:15px;color:#3f3f46;margin-left:8px;">${ticketTitle}</span>
        </td>
      </tr>
    </table>
    ${button(ticketUrl, "View Ticket")}
  `);
  return { subject, html };
}

export function ticketAssigned(params: {
  ticketNumber: string;
  ticketTitle: string;
  ticketUrl: string;
  assigneeName: string;
}): EmailTemplate {
  const { ticketNumber, ticketTitle, ticketUrl, assigneeName } = params;
  const subject = `[Task Manager] You've been assigned to #${ticketNumber}: ${ticketTitle}`;
  const html = emailLayout(`
    ${heading(`You've Been Assigned to a Ticket`)}
    ${paragraph(`Hi ${assigneeName}, you have been assigned to the following ticket:`)}
    <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;margin:16px 0;border:1px solid #e4e4e7;border-radius:6px;overflow:hidden;">
      <tr>
        <td style="padding:12px 16px;background-color:#f9f9fb;border-bottom:1px solid #e4e4e7;">
          <span style="font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">Ticket</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;">
          <span style="font-size:15px;font-weight:600;color:#18181b;">#${ticketNumber}</span>
          <span style="font-size:15px;color:#3f3f46;margin-left:8px;">${ticketTitle}</span>
        </td>
      </tr>
    </table>
    ${paragraph(`Please review the ticket and take appropriate action.`)}
    ${button(ticketUrl, "View Ticket")}
  `);
  return { subject, html };
}

export function ticketStatusChanged(params: {
  ticketNumber: string;
  ticketTitle: string;
  ticketUrl: string;
  oldStatus: string;
  newStatus: string;
}): EmailTemplate {
  const { ticketNumber, ticketTitle, ticketUrl, oldStatus, newStatus } = params;
  const subject = `[Task Manager] Ticket #${ticketNumber} status: ${oldStatus} → ${newStatus}`;
  const html = emailLayout(`
    ${heading(`Ticket Status Updated`)}
    ${paragraph(`The status of ticket <strong>#${ticketNumber}: ${ticketTitle}</strong> has changed.`)}
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:16px 0;">
      <tr>
        <td style="vertical-align:middle;">
          ${badge(oldStatus, "#71717a")}
        </td>
        <td style="vertical-align:middle;padding:0 12px;color:#71717a;font-size:18px;">→</td>
        <td style="vertical-align:middle;">
          ${badge(newStatus, "#16a34a")}
        </td>
      </tr>
    </table>
    ${button(ticketUrl, "View Ticket")}
  `);
  return { subject, html };
}

export function ticketCommented(params: {
  ticketNumber: string;
  ticketTitle: string;
  ticketUrl: string;
  commenterName: string;
  commentPreview: string;
}): EmailTemplate {
  const { ticketNumber, ticketTitle, ticketUrl, commenterName, commentPreview } = params;
  const subject = `[Task Manager] New comment on #${ticketNumber}: ${ticketTitle}`;
  const html = emailLayout(`
    ${heading(`New Comment on Ticket #${ticketNumber}`)}
    ${paragraph(`<strong>${commenterName}</strong> added a comment on <strong>${ticketTitle}</strong>:`)}
    <blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #e4e4e7;background-color:#f9f9fb;border-radius:0 6px 6px 0;">
      <p style="margin:0;font-size:14px;color:#3f3f46;line-height:1.6;font-style:italic;">${commentPreview}</p>
    </blockquote>
    ${button(ticketUrl, "View Comment")}
  `);
  return { subject, html };
}

export function slaBreach(params: {
  ticketNumber: string;
  ticketTitle: string;
  ticketUrl: string;
  breachType: string;
  policyName: string;
}): EmailTemplate {
  const { ticketNumber, ticketTitle, ticketUrl, breachType, policyName } = params;
  const subject = `[Task Manager] ⚠ SLA Breach on #${ticketNumber}: ${ticketTitle}`;
  const breachLabel = breachType === "FIRST_RESPONSE" ? "First Response" : "Resolution";
  const html = emailLayout(`
    <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;margin-bottom:20px;background-color:#fef2f2;border:1px solid #fecaca;border-radius:6px;">
      <tr>
        <td style="padding:12px 16px;">
          <span style="font-size:14px;font-weight:600;color:#dc2626;">⚠ SLA Breach Detected</span>
        </td>
      </tr>
    </table>
    ${heading(`SLA ${breachLabel} Breach`)}
    ${paragraph(`Ticket <strong>#${ticketNumber}: ${ticketTitle}</strong> has breached its SLA policy.`)}
    <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;margin:16px 0;border:1px solid #fecaca;border-radius:6px;overflow:hidden;">
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #fecaca;background-color:#fef2f2;">
          <span style="font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">Breach Details</span>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #fecaca;">
          <span style="font-size:13px;font-weight:600;color:#71717a;">Type:</span>
          <span style="font-size:13px;color:#18181b;margin-left:8px;">${breachLabel}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 16px;">
          <span style="font-size:13px;font-weight:600;color:#71717a;">Policy:</span>
          <span style="font-size:13px;color:#18181b;margin-left:8px;">${policyName}</span>
        </td>
      </tr>
    </table>
    ${paragraph(`Please take immediate action to resolve this ticket.`)}
    ${button(ticketUrl, "View Ticket")}
  `);
  return { subject, html };
}

export function passwordReset(params: {
  resetUrl: string;
  userName: string;
}): EmailTemplate {
  const { resetUrl, userName } = params;
  const subject = `[Task Manager] Password Reset Request`;
  const html = emailLayout(`
    ${heading(`Password Reset Request`)}
    ${paragraph(`Hi ${userName}, we received a request to reset your password.`)}
    ${paragraph(`Click the button below to reset your password. This link will expire in 1 hour.`)}
    ${button(resetUrl, "Reset Password")}
    ${paragraph(`If you did not request a password reset, you can safely ignore this email. Your password will not be changed.`)}
  `);
  return { subject, html };
}
