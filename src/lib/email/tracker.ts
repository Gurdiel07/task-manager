export interface EmailLog {
  id: string;
  to: string | string[];
  subject: string;
  status: "sent" | "failed";
  sentAt: Date;
  error?: string;
}

const BUFFER_SIZE = 100;
const emailLogs: EmailLog[] = [];

export function addEmailLog(log: EmailLog): void {
  emailLogs.push(log);
  if (emailLogs.length > BUFFER_SIZE) {
    emailLogs.shift();
  }
}

export function getRecentEmailLogs(): EmailLog[] {
  return [...emailLogs].reverse();
}
