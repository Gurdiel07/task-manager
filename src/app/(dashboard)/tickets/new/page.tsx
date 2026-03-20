'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateTicket } from '@/hooks/use-tickets';
import { useTeams } from '@/hooks/use-teams';
import { useUsers } from '@/hooks/use-users';
import { createTicketSchema } from '@/lib/validators/ticket';

type NewTicketFormValues = z.input<typeof createTicketSchema>;

export default function NewTicketPage() {
  const router = useRouter();
  const createTicket = useCreateTicket();
  const usersQuery = useUsers();
  const teamsQuery = useTeams();

  const form = useForm<NewTicketFormValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      category: '',
      channel: undefined,
      assignedToId: undefined,
      teamId: undefined,
    },
  });

  async function onSubmit(values: NewTicketFormValues) {
    try {
      const ticket = await createTicket.mutateAsync({
        ...values,
        assignedToId:
          values.assignedToId && values.assignedToId !== 'unassigned'
            ? values.assignedToId
            : undefined,
        teamId: values.teamId && values.teamId !== 'none' ? values.teamId : undefined,
        dueDate: values.dueDate || undefined,
      });

      toast.success('Ticket created successfully');
      router.push(`/tickets/${ticket.id}`);
    } catch {
      // Mutation error toasts are handled in the hook.
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
          <Link href="/tickets" className="hover:text-foreground">
            Tickets
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">New Ticket</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Create New Ticket</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fill in the details below to create a new support ticket
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ticket Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Brief summary of the issue..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the issue in detail. Include steps to reproduce, expected behavior, and actual behavior..."
                        className="min-h-32 resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CRITICAL">Critical</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="LOW">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bug">Bug</SelectItem>
                          <SelectItem value="feature">Feature Request</SelectItem>
                          <SelectItem value="incident">Incident</SelectItem>
                          <SelectItem value="question">Question</SelectItem>
                          <SelectItem value="performance">Performance</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="channel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Channel</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select channel" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EMAIL">Email</SelectItem>
                          <SelectItem value="CHAT">Chat</SelectItem>
                          <SelectItem value="PHONE">Phone</SelectItem>
                          <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                          <SelectItem value="SOCIAL">Social</SelectItem>
                          <SelectItem value="WEB">Customer Portal</SelectItem>
                          <SelectItem value="API">API</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignedToId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign To</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select assignee" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {(usersQuery.data ?? []).map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name ?? user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="teamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No team</SelectItem>
                          {(teamsQuery.data ?? []).map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={
                            typeof field.value === 'string'
                              ? field.value
                              : field.value instanceof Date
                                ? field.value.toISOString().slice(0, 10)
                                : ''
                          }
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={createTicket.isPending}>
                  {createTicket.isPending ? 'Creating...' : 'Create Ticket'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/tickets')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
