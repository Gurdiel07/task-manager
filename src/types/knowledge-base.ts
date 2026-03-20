export interface KBCategoryItem {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  order: number;
  _count: { articles: number };
  children?: KBCategoryItem[];
}

export interface KBArticleListItem {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  categoryId: string | null;
  category: { id: string; name: string } | null;
  author: { id: string; name: string | null; email: string };
  viewCount: number;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface KBArticleDetail extends KBArticleListItem {
  content: string;
}

export interface KBArticleFilters {
  status?: string;
  categoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedKBArticlesResponse {
  articles: KBArticleListItem[];
  total: number;
  page: number;
  totalPages: number;
}
