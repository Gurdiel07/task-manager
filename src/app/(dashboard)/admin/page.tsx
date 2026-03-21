'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Users, UserCheck, Shield, Pencil, MoreHorizontal, UserX, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatCard } from '@/components/shared/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchApi } from '@/hooks/api-client';
import { format } from 'date-fns';
import type { UserRole } from '@/generated/prisma/client';

interface AdminUserItem {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  teamNames: string[];
}

const adminUserKeys = {
  all: ['admin', 'users'] as const,
};

function useAdminUsers() {
  return useQuery({
    queryKey: adminUserKeys.all,
    queryFn: () => fetchApi<AdminUserItem[]>('/api/admin/users'),
  });
}

function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { role?: UserRole; isActive?: boolean; name?: string } }) =>
      fetchApi<AdminUserItem>(`/api/admin/users?id=${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
      toast.success('User updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; email: string; password: string; role: UserRole }) =>
      fetchApi<unknown>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
      toast.success('User invited successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900',
  MANAGER: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-900',
  AGENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900',
  CUSTOMER: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-700',
};

const roles: UserRole[] = ['ADMIN', 'MANAGER', 'AGENT', 'CUSTOMER'];

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

export default function AdminPage() {
  const usersQuery = useAdminUsers();
  const updateUser = useUpdateUser();
  const inviteUser = useInviteUser();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('AGENT');

  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUserItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('AGENT');

  if (usersQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive font-medium">Failed to load data</p>
        <p className="text-sm text-muted-foreground mt-1">
          {usersQuery.error?.message ?? 'An unexpected error occurred'}
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => usersQuery.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const users = usersQuery.data ?? [];
  const totalUsers = users.length;
  const activeAgents = users.filter((u) => u.isActive && (u.role === 'AGENT' || u.role === 'MANAGER')).length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const customerCount = users.filter((u) => u.role === 'CUSTOMER').length;

  function openEditDialog(user: AdminUserItem) {
    setEditUser(user);
    setEditName(user.name ?? '');
    setEditRole(user.role);
    setEditOpen(true);
  }

  function handleInviteSubmit() {
    if (!inviteName.trim() || !inviteEmail.trim() || !invitePassword.trim()) return;
    inviteUser.mutate(
      { name: inviteName, email: inviteEmail, password: invitePassword, role: inviteRole },
      {
        onSuccess: () => {
          setInviteOpen(false);
          setInviteName('');
          setInviteEmail('');
          setInvitePassword('');
          setInviteRole('AGENT');
        },
      }
    );
  }

  function handleEditSubmit() {
    if (!editUser) return;
    updateUser.mutate(
      { id: editUser.id, data: { name: editName, role: editRole } },
      {
        onSuccess: () => {
          setEditOpen(false);
          setEditUser(null);
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage users, roles, and system settings
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <Users className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {usersQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`stat-skeleton-${i}`} className="h-32 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              icon={Users}
              label="Total Users"
              value={totalUsers}
              iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            />
            <StatCard
              icon={UserCheck}
              label="Active Agents"
              value={activeAgents}
              iconClassName="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            />
            <StatCard
              icon={Shield}
              label="Admins"
              value={adminCount}
              iconClassName="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            />
            <StatCard
              icon={UserPlus}
              label="Customers"
              value={customerCount}
              iconClassName="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
            />
          </>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {usersQuery.isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={`user-skeleton-${i}`} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                            {getInitials(user.name, user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {user.name ?? user.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={user.role}
                        onValueChange={(v) =>
                          updateUser.mutate({ id: user.id, data: { role: v as UserRole } })
                        }
                        disabled={updateUser.isPending}
                      >
                        <SelectTrigger className="h-7 w-28 text-xs border-0 bg-transparent p-0 focus:ring-0">
                          <Badge
                            variant="outline"
                            className={`text-xs cursor-pointer ${roleColors[user.role] ?? ''}`}
                          >
                            <SelectValue />
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r} value={r} className="text-xs">
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.teamNames.length > 0
                        ? user.teamNames.join(', ')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.isActive
                            ? 'border-green-200 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                            : 'border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400'
                        }
                      >
                        {user.isActive ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 inline-block" />
                            Active
                          </>
                        ) : (
                          'Inactive'
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(user)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className={user.isActive ? 'text-destructive focus:text-destructive' : ''}
                            onClick={() =>
                              updateUser.mutate({
                                id: user.id,
                                data: { isActive: !user.isActive },
                              })
                            }
                          >
                            {user.isActive ? (
                              <>
                                <UserX className="mr-2 h-3.5 w-3.5" />
                                Deactivate User
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-3.5 w-3.5" />
                                Activate User
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={invitePassword} onChange={(e) => setInvitePassword(e.target.value)} placeholder="Min. 6 characters" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={handleInviteSubmit}
              disabled={inviteUser.isPending || !inviteName.trim() || !inviteEmail.trim() || !invitePassword.trim()}
            >
              {inviteUser.isPending ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={handleEditSubmit}
              disabled={updateUser.isPending || !editName.trim()}
            >
              {updateUser.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
