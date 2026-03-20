export interface TeamDetailItem {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  members: TeamMemberItem[];
  _count: { members: number; tickets: number };
}

export interface TeamMemberItem {
  id: string;
  userId: string;
  role: string | null;
  joinedAt: string;
  user: { id: string; name: string | null; email: string; role: string };
}
