'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ChevronRight,
  Plus,
  Mail,
  MessageSquare,
  Phone,
  Globe,
  Twitter,
  Webhook,
  Settings,
  Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  useChannels,
  useCreateChannel,
  useUpdateChannel,
  useDeleteChannel,
} from '@/hooks/use-channels';
import { createChannelSchema, ticketChannelValues } from '@/lib/validators/channel';
import type { ChannelItem } from '@/types/channels';

type FormValues = z.input<typeof createChannelSchema>;

const channelIcons: Record<string, LucideIcon> = {
  EMAIL: Mail,
  CHAT: MessageSquare,
  PHONE: Phone,
  WHATSAPP: Phone,
  SOCIAL: Twitter,
  WEB: Globe,
  API: Webhook,
};

function ChannelIcon({ type }: { type: string }) {
  const Icon = channelIcons[type] ?? Globe;
  return <Icon className="h-5 w-5" />;
}

function ChannelFormDialog({
  open,
  onOpenChange,
  channel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel?: ChannelItem;
}) {
  const createMutation = useCreateChannel();
  const updateMutation = useUpdateChannel();
  const isEditing = Boolean(channel);

  const form = useForm<FormValues>({
    resolver: zodResolver(createChannelSchema),
    defaultValues: {
      type: (channel?.type as FormValues['type']) ?? 'EMAIL',
      name: channel?.name ?? '',
      config: channel?.config ?? undefined,
      isActive: channel?.isActive ?? true,
    },
  });

  const [configText, setConfigText] = useState(
    () => JSON.stringify(channel?.config ?? {}, null, 2)
  );
  const [configError, setConfigError] = useState('');

  function onSubmit(values: FormValues) {
    try {
      const config = JSON.parse(configText) as Record<string, unknown>;
      const payload = { ...values, config };
      if (isEditing && channel) {
        updateMutation.mutate(
          { id: channel.id, data: payload },
          {
            onSuccess: () => {
              onOpenChange(false);
              form.reset();
            },
          }
        );
      } else {
        createMutation.mutate(payload, {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
          },
        });
      }
    } catch {
      setConfigError('Invalid JSON configuration');
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Configure Channel' : 'Add Channel'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Channel Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isEditing}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ticketChannelValues.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Support Email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-1.5">
              <FormLabel>Configuration (JSON)</FormLabel>
              <Textarea
                rows={4}
                className="font-mono text-xs"
                value={configText}
                onChange={(e) => {
                  setConfigText(e.target.value);
                  setConfigError('');
                }}
              />
              {configError && (
                <p className="text-xs text-destructive">{configError}</p>
              )}
            </div>
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="mb-0 cursor-pointer">Active</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Channel'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function ChannelsSettingsPage() {
  const channelsQuery = useChannels();
  const { data: channels, isLoading } = channelsQuery;
  const deleteMutation = useDeleteChannel();

  const [addOpen, setAddOpen] = useState(false);
  const [editChannel, setEditChannel] = useState<ChannelItem | null>(null);
  const [deleteChannel, setDeleteChannel] = useState<ChannelItem | null>(null);

  if (channelsQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive font-medium">Failed to load data</p>
        <p className="text-sm text-muted-foreground mt-1">
          {channelsQuery.error?.message ?? 'An unexpected error occurred'}
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => channelsQuery.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
          <Link href="/settings" className="hover:text-foreground">Settings</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">Channels</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Channels</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure incoming and outgoing support channels
            </p>
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Channel
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : channels?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No channels configured yet. Add your first channel.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels?.map((channel) => (
            <Card key={channel.id}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <ChannelIcon type={channel.type} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{channel.name}</p>
                      <p className="text-xs text-muted-foreground">{channel.type}</p>
                    </div>
                  </div>
                  <Badge
                    variant={channel.isActive ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {channel.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {channel._count.messages} message{channel._count.messages !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-7"
                    onClick={() => setEditChannel(channel)}
                  >
                    <Settings className="mr-1.5 h-3 w-3" />
                    Configure
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => setDeleteChannel(channel)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ChannelFormDialog open={addOpen} onOpenChange={setAddOpen} />

      {editChannel && (
        <ChannelFormDialog
          open={Boolean(editChannel)}
          onOpenChange={(open) => !open && setEditChannel(null)}
          channel={editChannel}
        />
      )}

      <AlertDialog
        open={Boolean(deleteChannel)}
        onOpenChange={(open) => !open && setDeleteChannel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Channel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteChannel?.name}&rdquo;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteChannel) {
                  deleteMutation.mutate(deleteChannel.id, {
                    onSuccess: () => setDeleteChannel(null),
                  });
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
