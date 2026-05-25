export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  tokenTtlSeconds: number;
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  taskCount?: number;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  userId: string;
  filename: string;
  contentType: string;
  size: number;
  createdAt: string;
  downloadUrl?: string;
}

export type WsEvent =
  | { type: "hello"; userId: string }
  | { type: "subscribed"; projectId: string }
  | { type: "task.created"; projectId: string; payload: { task: Task } }
  | { type: "task.updated"; projectId: string; payload: { task: Task } }
  | { type: "task.deleted"; projectId: string; payload: { taskId: string } }
  | { type: "comment.created"; projectId: string; payload: { comment: Comment } }
  | { type: "attachment.created"; projectId: string; payload: { attachment: Attachment } }
  | { type: "attachment.deleted"; projectId: string; payload: { attachmentId: string; taskId: string } }
  | { type: "project.updated"; projectId: string; payload: { project: Project } };
