import Link from 'next/link';
import { Search, ChevronDown, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const faqs = [
  {
    question: 'How do I reset my password?',
    answer:
      'To reset your password, click "Forgot password" on the login page. Enter your email address and we\'ll send you a reset link within a few minutes. The link expires after 24 hours.',
  },
  {
    question: 'How can I track the status of my submitted ticket?',
    answer:
      'You can check your ticket status by entering your ticket number in the "Check Ticket Status" section below. You\'ll also receive email notifications whenever your ticket is updated.',
  },
  {
    question: 'What are the support hours?',
    answer:
      'Our support team is available Monday through Friday, 9 AM to 6 PM UTC. For critical issues, we have on-call support available 24/7 for enterprise customers.',
  },
  {
    question: 'How long does it take to get a response?',
    answer:
      'Response times depend on ticket priority. Critical issues are addressed within 1 hour, High priority within 4 hours, and standard requests within 24 hours during business days.',
  },
];

export default function PortalPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-16">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          How can we help you?
        </h1>
        <p className="text-lg text-muted-foreground">
          Search our knowledge base or submit a new request
        </p>
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for articles, guides, or topics..."
            className="pl-12 h-12 text-base shadow-sm"
          />
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/portal/new">Submit a Request</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/login">Agent Login</Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group border rounded-lg overflow-hidden"
            >
              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors list-none">
                <span className="font-medium text-sm pr-4">{faq.question}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-4 pb-4 pt-2">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </details>
          ))}
        </div>
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground mb-3">
            Can&apos;t find what you&apos;re looking for?
          </p>
          <Button asChild>
            <Link href="/portal/new">
              <MessageSquare className="mr-2 h-4 w-4" />
              Submit a Request
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Check Ticket Status</h2>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-3">
              Enter your ticket number to check the current status and updates
            </p>
            <div className="flex gap-3">
              <Input
                placeholder="e.g. 1234"
                className="max-w-xs"
              />
              <Button variant="outline">Check Status</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
