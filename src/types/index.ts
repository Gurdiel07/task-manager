export type {
  User,
  Team,
  TeamMember,
  Ticket,
  TicketComment,
  TicketAttachment,
  TicketHistory,
  TicketTag,
  TicketWatcher,
  TicketRelation,
  WorkflowTemplate,
  WorkflowStep,
  WorkflowTransition,
  WorkflowInstance,
  WorkflowInstanceStep,
  WorkflowSnapshot,
  Task,
  TaskChecklist,
  TaskDependency,
  SLAPolicy,
  SLABreach,
  AIProviderConfig,
  AIPredictionLog,
  Channel,
  ChannelMessage,
  KBCategory,
  KBArticle,
  CanvasData,
  Notification,
  Badge,
  UserBadge,
  AutomationRule,
  AutomationExecution,
} from "@/generated/prisma/client";

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};
