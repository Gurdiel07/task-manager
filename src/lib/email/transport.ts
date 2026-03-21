import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST ?? "localhost";
const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? "1025", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM ?? "Task Manager <noreply@taskmanager.local>";
const SMTP_SECURE = process.env.SMTP_SECURE === "true";

let _transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!SMTP_HOST) {
    return null;
  }
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: SMTP_USER && SMTP_PASS
        ? { user: SMTP_USER, pass: SMTP_PASS }
        : undefined,
    });
  }
  return _transporter;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (!SMTP_HOST) {
    console.warn("[email] SMTP_HOST is not configured — skipping email send");
    return;
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[email] Transporter could not be created — skipping email send");
    return;
  }

  await transporter.sendMail({
    from: SMTP_FROM,
    to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

export { getTransporter };
