import type {
  Attachment,
  AuthResponse,
  Comment,
  Project,
  Task,
  TaskPriority,
  TaskStatus,
  User,
} from "../types/api";
import { tokenStore } from "./token";

const BASE = "/api";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string, public readonly details?: unknown) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const headers = new Headers(options.headers ?? {});
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    let details: unknown;
    try {
      const body = await res.json();
      message = body.error ?? message;
      details = body.details;
    } catch {
      try {
        message = (await res.text()) || message;
      } catch {
        // ignore
      }
    }
    throw new ApiError(res.status, message, details);
  }
  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}

export const api = {
  // auth
  register: (data: { email: string; password: string; displayName: string }) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: () => request<{ user: User }>("/auth/me"),

  // projects
  listProjects: () => request<{ projects: Project[] }>("/projects"),
  getProject: (id: string) => request<{ project: Project }>(`/projects/${id}`),
  createProject: (data: { name: string; description?: string }) =>
    request<{ project: Project }>("/projects", { method: "POST", body: JSON.stringify(data) }),
  updateProject: (id: string, data: { name?: string; description?: string }) =>
    request<{ project: Project }>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteProject: (id: string) => request<null>(`/projects/${id}`, { method: "DELETE" }),

  // tasks
  listTasks: (projectId: string) =>
    request<{ tasks: Task[] }>(`/projects/${projectId}/tasks`),
  createTask: (
    projectId: string,
    data: {
      title: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      dueDate?: string | null;
    },
  ) =>
    request<{ task: Task }>(`/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateTask: (
    id: string,
    data: Partial<{
      title: string;
      description: string;
      status: TaskStatus;
      priority: TaskPriority;
      dueDate: string | null;
    }>,
  ) => request<{ task: Task }>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTask: (id: string) => request<null>(`/tasks/${id}`, { method: "DELETE" }),

  // comments
  listComments: (taskId: string) =>
    request<{ comments: Comment[] }>(`/tasks/${taskId}/comments`),
  createComment: (taskId: string, body: string) =>
    request<{ comment: Comment }>(`/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),

  // attachments
  listAttachments: (taskId: string) =>
    request<{ attachments: Attachment[] }>(`/tasks/${taskId}/attachments`),
  presignAttachment: (
    taskId: string,
    data: { filename: string; contentType: string; size: number },
  ) =>
    request<{ uploadUrl: string; key: string }>(
      `/tasks/${taskId}/attachments/presign`,
      { method: "POST", body: JSON.stringify(data) },
    ),
  confirmAttachment: (
    taskId: string,
    data: { key: string; filename: string; contentType: string; size: number },
  ) =>
    request<{ attachment: Attachment }>(`/tasks/${taskId}/attachments/confirm`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteAttachment: (id: string) =>
    request<null>(`/attachments/${id}`, { method: "DELETE" }),
};
