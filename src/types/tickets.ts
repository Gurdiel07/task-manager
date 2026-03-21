import type {
  Priority,
  RelationType,
  TicketChannel,
  TicketStatus,
  UserRole,
} from "@/generated/prisma/client";

export interface UserSummary {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export interface UserListItem extends UserSummary {
  role: UserRole;
}

export interface TeamSummary {
  id: string;
  name: string;
}

export interface TicketTagSummary {
  id: string;
  name: string;
  color: string;
}

export interface TicketTagRelationItem {
  ticketId: string;
  tagId: string;
  tag: TicketTagSummary;
}

export interface TicketListItem {
  id: string;
  number: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  category: string | null;
  subcategory: string | null;
  channel: TicketChannel;
  createdById: string;
  assignedToId: string | null;
  teamId: string | null;
  dueDate: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  firstResponseAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: UserSummary;
  assignedTo: UserSummary | null;
  team: TeamSummary | null;
  tags: TicketTagRelationItem[];
}

export interface TicketDetail extends TicketListItem {
  _count: {
    comments: number;
    watchers: number;
  };
}

export interface TicketCommentItem {
  id: string;
  ticketId: string;
  userId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  user: UserSummary;
}

export interface TicketHistoryItem {
  id: string;
  ticketId: string;
  userId: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: UserSummary;
}

export interface TicketWatcherItem {
  id: string;
  ticketId: string;
  userId: string;
  addedAt: string;
  user: UserSummary;
}

export interface RelatedTicketSummary {
  id: string;
  number: number;
  title: string;
  status: TicketStatus;
  priority: Priority;
}

export interface TicketRelationItem {
  id: string;
  type: RelationType;
  direction: "incoming" | "outgoing";
  relatedTicket: RelatedTicketSummary;
  createdAt: string;
}

export interface TicketAttachmentItem {
  id: string;
  ticketId: string;
  uploadedById: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  uploadedBy: UserSummary;
}

export interface PaginatedTicketsResponse {
  tickets: TicketListItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: Priority;
  assignedToId?: string;
  teamId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: "createdAt" | "updatedAt" | "number" | "priority" | "status" | "title";
  order?: "asc" | "desc";
}

export interface UserFilters {
  role?: UserRole;
  search?: string;
}
