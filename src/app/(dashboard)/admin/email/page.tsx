import { PageHeader } from "@/components/shared/page-header";
import { EmailDashboard } from "@/components/admin/email-dashboard";

export default function AdminEmailPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Email Notifications"
        description="Monitor sent emails and test SMTP configuration"
      />
      <EmailDashboard />
    </div>
  );
}
