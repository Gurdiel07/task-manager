export interface ChannelItem {
  id: string;
  type: string;
  name: string;
  config: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

export interface ChannelMessageItem {
  id: string;
  channelId: string;
  ticketId: string | null;
  direction: "INBOUND" | "OUTBOUND";
  senderIdentifier: string;
  content: string;
  metadata: Record<string, unknown> | null;
  processedAt: string | null;
  createdAt: string;
}

export interface ChannelMessageFilters {
  page?: number;
  limit?: number;
}

export interface PaginatedChannelMessagesResponse {
  messages: ChannelMessageItem[];
  total: number;
  page: number;
  totalPages: number;
}
