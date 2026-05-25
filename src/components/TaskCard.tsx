import type { Task } from "../types/api";

const PRIORITY_BADGE: Record<Task["priority"], string> = {
  high: "border-red-500/40 bg-red-950/40 text-red-200",
  medium: "border-amber-500/40 bg-amber-950/40 text-amber-200",
  low: "border-emerald-500/40 bg-emerald-950/40 text-emerald-200",
};

export function TaskCard({
  task,
  onClick,
  onStatusChange,
}: {
  task: Task;
  onClick: () => void;
  onStatusChange: (next: Task["status"]) => void;
}) {
  return (
    <article
      className="cursor-pointer rounded-md border border-ink-700 bg-ink-900/80 p-3 shadow-sm transition hover:border-ink-500 hover:bg-ink-900"
      onClick={onClick}
    >
      <header className="mb-2 flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-ink-50">{task.title}</h4>
        <span
          className={
            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider " +
            PRIORITY_BADGE[task.priority]
          }
        >
          {task.priority}
        </span>
      </header>
      {task.description && (
        <p className="mb-2 line-clamp-2 text-xs text-ink-400">{task.description}</p>
      )}
      <footer className="flex items-center justify-between text-[11px] text-ink-500">
        <span>{new Date(task.createdAt).toLocaleDateString()}</span>
        <select
          value={task.status}
          onChange={(e) => {
            e.stopPropagation();
            onStatusChange(e.target.value as Task["status"]);
          }}
          onClick={(e) => e.stopPropagation()}
          className="rounded border border-ink-700 bg-ink-950 px-1.5 py-0.5 text-[11px] text-ink-200"
        >
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
        </select>
      </footer>
    </article>
  );
}
