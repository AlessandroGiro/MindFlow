
export const TASK_STATUSES = ["Backlog", "To Do", "In Progress", "In Review", "Done"] as const;
export type TaskStatus = typeof TASK_STATUSES[number];

export const SUB_STATUSES = ['Pending', 'In Progress', 'Completed'] as const;
export type SubStatus = typeof SUB_STATUSES[number];

export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;
export type Priority = typeof PRIORITIES[number];

export type LogVisibility = 'Public' | 'Private';

export interface TeamMember {
  name: string;
  email: string;
}

export interface Project {
  projectId: string;
  projectName: string;
  projectLead: string;
  status: string;
  description: string;
  members: string[];
}

export interface Task {
  taskId: string;
  taskName: string;
  project: string; // Project Name, not ID
  assignee: string;
  status: TaskStatus;
  subStatus: SubStatus;
  priority: Priority;
  startDate: string | null;
  dueDate: string | null;
  completionDate: string | null;
  description: string;
  parentId: string | null;
  createdAt: string | null;
}

export interface ProjectComment {
  commentId: string;
  projectId: string;
  author: string; // author's name
  content: string;
  createdAt: string;
  updatedAt?: string | null;
  visibility: LogVisibility;
  taggedUsers: string[]; // array of user names
  parentId: string | null; // ID of the parent comment, if it's a reply
  taskId?: string | null; // ID of the task, if it's a task-specific comment
}

export type NotificationType = 'mention' | 'reply' | 'digest';

export interface AppNotification {
  id: string;
  type: NotificationType;
  author: string; // Name of the user who triggered the notification, or 'System'
  message: string;
  commentId?: string; // Link to the specific comment
  taskId?: string | null; // Link to the specific task
  isRead: boolean;
  createdAt: string;
}

// --- AI Summary Settings ---
export const AI_SUMMARY_TONES = ['Professional', 'Casual', 'Direct'] as const;
export type AISummaryTone = typeof AI_SUMMARY_TONES[number];

export const AI_SUMMARY_FORMATS = ['Narrative', 'Bulleted List'] as const;
export type AISummaryFormat = typeof AI_SUMMARY_FORMATS[number];

export interface AISummarySettings {
    tone: AISummaryTone;
    format: AISummaryFormat;
    includeKeyDevelopments: boolean;
    includeNextSteps: boolean;
}

// --- Mind Map Types ---
export type MindMapNodeType = 'START' | 'PROCESS' | 'DECISION' | 'END' | 'GROUP' | 'COMMENT';

export interface MindMapNode {
    id: string;
    type: MindMapNodeType;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    parentId?: string; // For grouping
    collapsed?: boolean;
}

export interface MindMapEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
    direction?: 'forward' | 'reverse' | 'bidirectional' | 'none';
}
