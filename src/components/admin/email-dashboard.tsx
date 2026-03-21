'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Mail, Send, RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { EmailLog } from '@/lib/email/tracker';

function formatDate(date: string | Date) {
  return new Date(date).toLocaleString();
}

export function EmailDashboard() {
  const [testTo, setTestTo] = useState('');
  const [testSubject, setTestSubject] = useState('');
  const [testMessage, setTestMessage] = useState('');

  const {
    data: logs,
    isLoading,
    refetch,
    isFetching,
  } = useQuery<EmailLog[]>({
    queryKey: ['admin', 'email-logs'],
    queryFn: async () => {
      const res = await fetch('/api/admin/email/logs');
      if (!res.ok) throw new Error('Failed to fetch email logs');
      const json = await res.json();
      return json.data ?? [];
    },
    refetchInterval: 15_000,
  });

  const sendTest = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testTo,
          subject: testSubject || undefined,
          message: testMessage || undefined,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Failed to send test email');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Test email queued successfully');
      setTestTo('');
      setTestSubject('');
      setTestMessage('');
      refetch();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleSendTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTo) {
      toast.error('Please enter a recipient email address');
      return;
    }
    sendTest.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Send Test Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="h-4 w-4" />
            Send Test Email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendTest} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="test-to">Recipient *</Label>
                <Input
                  id="test-to"
                  type="email"
                  placeholder="user@example.com"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test-subject">Subject (optional)</Label>
                <Input
                  id="test-subject"
                  type="text"
                  placeholder="Test Email from Task Manager"
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-message">Message (optional)</Label>
              <Input
                id="test-message"
                type="text"
                placeholder="This is a test email."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={sendTest.isPending} className="w-full sm:w-auto">
              {sendTest.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test Email
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Email Logs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            Recent Email Logs
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="ml-1 sr-only sm:not-sr-only">Refresh</span>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 rounded bg-muted animate-pulse" />
              ))}
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Mail className="mx-auto mb-3 h-8 w-8 opacity-40" />
              <p className="text-sm">No emails sent yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Status</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">To</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Subject</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Sent At</th>
                    <th className="pb-2 font-medium text-muted-foreground">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        {log.status === 'sent' ? (
                          <Badge variant="outline" className="gap-1 text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
                            <CheckCircle2 className="h-3 w-3" />
                            Sent
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-red-600 border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
                            <XCircle className="h-3 w-3" />
                            Failed
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-muted-foreground max-w-[160px] truncate">
                        {Array.isArray(log.to) ? log.to.join(', ') : log.to}
                      </td>
                      <td className="py-3 pr-4 max-w-[220px] truncate">{log.subject}</td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(log.sentAt)}
                      </td>
                      <td className="py-3 text-xs text-red-500 max-w-[200px] truncate">
                        {log.error ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
