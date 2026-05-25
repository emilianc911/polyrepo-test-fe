import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { TaskCard } from "../components/TaskCard";
import { TaskDetail } from "../components/TaskDetail";
import { api } from "../lib/api";
import { useToast } from "../lib/toast";
import { useProjectSocket } from "../lib/ws";
import type { Task, TaskPriority, TaskStatus, WsEvent } from "../types/api";

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "done", label: "Done" },
];

export function ProjectPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { push } = useToast();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [wsAlive, setWsAlive] = useState(false);

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => (await api.getProject(projectId!)).project,
    enabled: !!projectId,
  });

  const tasksQuery = useQuery<Task[]>({
    queryKey: ["tasks", projectId],
    queryFn: async () => (await api.listTasks(projectId!)).tasks,
    enabled: !!projectId,
  });

  // Form state for the new-task composer.
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("todo");

  const createMutation = useMutation({
    mutationFn: async () =>
      (
        await api.createTask(projectId!, {
          title,
          priority,
          status,
        })
      ).task,
    onSuccess: () => {
      setTitle("");
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
    onError: (err: Error) => push(err.message, "error"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (args: { taskId: string; status: TaskStatus }) =>
      api.updateTask(args.taskId, { status: args.status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", projectId] }),
    onError: (err: Error) => push(err.message, "error"),
  });

  const handleWsEvent = useCallback(
    (event: WsEvent) => {
      if (event.type === "hello") return;
      if (event.type === "subscribed") {
        setWsAlive(true);
        return;
      }
      if (
        event.type === "task.created" ||
        event.type === "task.updated" ||
        event.type === "task.deleted"
      ) {
        qc.invalidateQueries({ queryKey: ["tasks", projectId] });
      }
      if (event.type === "comment.created") {
        qc.invalidateQueries({
          queryKey: ["comments", event.payload.comment.taskId],
        });
      }
      if (
        event.type === "attachment.created" ||
        event.type === "attachment.deleted"
      ) {
        const taskId =
          event.type === "attachment.created"
            ? event.payload.attachment.taskId
            : event.payload.taskId;
        qc.invalidateQueries({ queryKey: ["attachments", taskId] });
      }
    },
    [qc, projectId],
  );
  useProjectSocket(projectId ?? null, handleWsEvent);

  const grouped = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
    for (const t of tasksQuery.data ?? []) map[t.status].push(t);
    return map;
  }, [tasksQuery.data]);

  const selectedTask =
    tasksQuery.data?.find((t) => t.id === selectedTaskId) ?? null;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Link to="/" className="text-xs text-ink-400 hover:text-ink-200">
            ← All projects
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">
            {projectQuery.data?.name ?? "Loading…"}
          </h1>
          {projectQuery.data?.description && (
            <p className="mt-1 max-w-2xl text-sm text-ink-400">
              {projectQuery.data.description}
            </p>
          )}
        </div>
        <span
          className={
            "rounded-full border px-2 py-1 text-[11px] " +
            (wsAlive
              ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-200"
              : "border-ink-700 bg-ink-900 text-ink-400")
          }
          title="Live updates over WebSocket"
        >
          {wsAlive ? "● live" : "○ offline"}
        </span>
      </header>

      <section className="rounded-xl border border-ink-700 bg-ink-900/60 p-4">
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim()) createMutation.mutate();
          }}
        >
          <input
            className="flex-1 rounded-md border border-ink-600 bg-ink-950 px-3 py-2 text-sm text-ink-100 outline-none focus:border-ink-300"
            placeholder="New task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="rounded-md border border-ink-600 bg-ink-950 px-2 py-2 text-sm text-ink-200"
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="rounded-md border border-ink-600 bg-ink-950 px-2 py-2 text-sm text-ink-200"
          >
            <option value="todo">to do</option>
            <option value="in_progress">in progress</option>
            <option value="done">done</option>
          </select>
          <button
            type="submit"
            disabled={!title.trim() || createMutation.isPending}
            className="rounded-md bg-ink-50 px-3 py-2 text-sm font-medium text-ink-950 transition hover:bg-white disabled:opacity-50"
          >
            {createMutation.isPending ? "Adding…" : "Add task"}
          </button>
        </form>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className="rounded-xl border border-ink-700 bg-ink-900/40 p-3"
          >
            <h3 className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-ink-400">
              {col.label}
              <span className="rounded-full bg-ink-800 px-2 py-0.5 text-[10px] text-ink-300">
                {grouped[col.id].length}
              </span>
            </h3>
            <div className="space-y-2">
              {grouped[col.id].map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onClick={() => setSelectedTaskId(t.id)}
                  onStatusChange={(next) =>
                    updateStatusMutation.mutate({ taskId: t.id, status: next })
                  }
                />
              ))}
              {grouped[col.id].length === 0 && (
                <p className="rounded-md border border-dashed border-ink-700 px-3 py-6 text-center text-xs text-ink-500">
                  No tasks
                </p>
              )}
            </div>
          </div>
        ))}
      </section>

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onChanged={() =>
            qc.invalidateQueries({ queryKey: ["tasks", projectId] })
          }
        />
      )}
    </div>
  );
}
