import { PageHeader } from "@/components/shared/page-header";
import { QueueDashboard } from "@/components/admin/queue-dashboard";

export default function QueuesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Background Jobs"
        description="Monitor and manage background queue workers"
      />
      <QueueDashboard />
    </div>
  );
}
