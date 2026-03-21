'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronRight, Plus, Settings, Trash2, UserPlus, UserMinus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  useTeams,
  useTeamDetail,
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
  useAddTeamMember,
  useRemoveTeamMember,
} from '@/hooks/use-teams';
import { useUsers } from '@/hooks/use-users';
import { createTeamSchema, updateTeamSchema } from '@/lib/validators/team';
import type { TeamDetailItem } from '@/types/teams';

type CreateFormValues = z.infer<typeof createTeamSchema>;
type UpdateFormValues = z.infer<typeof updateTeamSchema>;

function getInitials(name: string | null, email: string) {
  if (name) {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

function TeamMembersPanel({ team }: { team: TeamDetailItem }) {
  const { data: users } = useUsers();
  const addMember = useAddTeamMember(team.id);
  const removeMember = useRemoveTeamMember(team.id);
  const [selectedUserId, setSelectedUserId] = useState('');

  const memberUserIds = new Set(team.members.map((m) => m.userId));
  const availableUsers = users?.filter((u) => !memberUserIds.has(u.id)) ?? [];

  function handleAdd() {
    if (!selectedUserId) return;
    addMember.mutate(
      { userId: selectedUserId },
      { onSuccess: () => setSelectedUserId('') }
    );
  }

  return (
    <div className="space-y-3 mt-3">
      <div className="flex items-center gap-2">
        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
          <SelectTrigger className="flex-1 h-8 text-xs">
            <SelectValue placeholder="Add a member..." />
          </SelectTrigger>
          <SelectContent>
            {availableUsers.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name ?? u.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="h-8 text-xs"
          disabled={!selectedUserId || addMember.isPending}
          onClick={handleAdd}
        >
          <UserPlus className="mr-1.5 h-3 w-3" />
          Add
        </Button>
      </div>
      <div className="space-y-2">
        {team.members.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">No members yet.</p>
        ) : (
          team.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-[10px] bg-muted text-muted-foreground font-semibold">
                    {getInitials(member.user.name, member.user.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-medium">{member.user.name ?? member.user.email}</p>
                  <p className="text-[10px] text-muted-foreground">{member.user.role}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                disabled={removeMember.isPending}
                onClick={() => removeMember.mutate(member.userId)}
              >
                <UserMinus className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TeamCard({ teamId }: { teamId: string }) {
  const { data: team, isLoading } = useTeamDetail(teamId);
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const updateMutation = useUpdateTeam();
  const deleteMutation = useDeleteTeam();

  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(updateTeamSchema),
    defaultValues: {
      name: team?.name ?? '',
      description: team?.description ?? '',
    },
  });

  if (isLoading || !team) {
    return (
      <Card>
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  function onEditSubmit(values: UpdateFormValues) {
    updateMutation.mutate(
      { id: team!.id, data: values },
      { onSuccess: () => setEditOpen(false) }
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">{team.name}</h3>
              {team.description && (
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                  {team.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  form.reset({ name: team.name, description: team.description ?? '' });
                  setEditOpen(true);
                }}
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-xs">
              {team._count.members} member{team._count.members !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {team._count.tickets} ticket{team._count.tickets !== 1 ? 's' : ''}
            </Badge>
          </div>

          <Separator />

          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs justify-between"
            onClick={() => setExpanded(!expanded)}
          >
            Manage Members
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>

          {expanded && <TeamMembersPanel team={team} />}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
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
                      <Textarea rows={2} {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{team.name}&rdquo;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                deleteMutation.mutate(team.id, { onSuccess: () => setDeleteOpen(false) });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CreateTeamDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createMutation = useCreateTeam();
  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { name: '', description: '' },
  });

  function onSubmit(values: CreateFormValues) {
    createMutation.mutate(values, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Create Team</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Engineering" {...field} />
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
                      placeholder="Optional description..."
                      rows={2}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Team'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function TeamsSettingsPage() {
  const teamsQuery = useTeams();
  const { data: teams, isLoading } = teamsQuery;
  const [createOpen, setCreateOpen] = useState(false);

  if (teamsQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive font-medium">Failed to load data</p>
        <p className="text-sm text-muted-foreground mt-1">
          {teamsQuery.error?.message ?? 'An unexpected error occurred'}
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => teamsQuery.refetch()}>
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
          <span className="text-foreground">Teams</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage teams and their members
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Team
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-8 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : teams?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No teams yet. Create your first team.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams?.map((team) => (
            <TeamCard key={team.id} teamId={team.id} />
          ))}
        </div>
      )}

      <CreateTeamDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
