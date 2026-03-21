'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SubmittedTicket {
  number: number;
  title: string;
}

export default function NewRequestPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState<SubmittedTicket | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/public/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, email, priority }),
      });

      const json = await res.json();

      if (json.success && json.data) {
        setSubmitted({ number: json.data.number, title: json.data.title });
      } else {
        setError(json.message ?? 'Failed to submit request');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Request Submitted</h1>
          <p className="text-muted-foreground">
            Your request &ldquo;{submitted.title}&rdquo; has been created.
          </p>
          <p className="text-sm text-muted-foreground">
            Ticket number: <span className="font-semibold">#{submitted.number}</span>.
            You can use this number to check the status on our help center.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/portal">Back to Help Center</Link>
          </Button>
          <Button
            onClick={() => {
              setSubmitted(null);
              setTitle('');
              setDescription('');
              setEmail('');
              setPriority('MEDIUM');
            }}
          >
            Submit Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link href="/portal">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Help Center
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Submit a Request</CardTitle>
          <p className="text-sm text-muted-foreground">
            Describe your issue and we&apos;ll get back to you as soon as possible.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Subject</Label>
              <Input
                id="title"
                placeholder="Brief summary of your issue"
                required
                minLength={3}
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Please provide as much detail as possible..."
                required
                minLength={10}
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
