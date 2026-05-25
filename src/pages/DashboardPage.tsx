import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useToast } from "../lib/toast";
import type { Project } from "../types/api";

export function DashboardPage() {
  const qc = useQueryClient();
  const { push } = useToast();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await api.listProjects()).projects,
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: async () =>
      (await api.createProject({ name, description })).project,
    onSuccess: () => {
      setName("");
      setDescription("");
      qc.invalidateQueries({ queryKey: ["projects"] });
      push("Project created", "success");
    },
    onError: (err: Error) => push(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.deleteProject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      push("Project deleted", "success");
    },
    onError: (err: Error) => push(err.message, "error"),
  });

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-1 text-2xl font-semibold">Projects</h1>
        <p className="text-sm text-ink-400">
          Each project has its own task board, comments, and attachments.
        </p>
      </section>

      <section className="rounded-xl border border-ink-700 bg-ink-900/60 p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-300">
          New project
        </h2>
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            createMutation.mutate();
          }}
        >
          <input
            className="flex-1 rounded-md border border-ink-600 bg-ink-950 px-3 py-2 text-ink-100 outline-none focus:border-ink-300"
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="flex-1 rounded-md border border-ink-600 bg-ink-950 px-3 py-2 text-ink-100 outline-none focus:border-ink-300"
            placeholder="Short description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button
            type="submit"
            disabled={!name.trim() || createMutation.isPending}
            className="rounded-md bg-ink-50 px-4 py-2 font-medium text-ink-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createMutation.isPending ? "Creating…" : "Create"}
          </button>
        </form>
      </section>

      <section>
        {isLoading ? (
          <p className="text-ink-400">Loading projects…</p>
        ) : isError ? (
          <p className="text-red-300">Failed to load projects: {(error as Error).message}</p>
        ) : data && data.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((p: Project) => (
              <li
                key={p.id}
                className="group rounded-xl border border-ink-700 bg-ink-900/60 p-5 transition hover:border-ink-500"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <Link
                    to={`/projects/${p.id}`}
                    className="text-lg font-semibold text-ink-50 hover:underline"
                  >
                    {p.name}
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm(`Delete project "${p.name}"?`)) {
                        deleteMutation.mutate(p.id);
                      }
                    }}
                    className="text-xs text-ink-500 opacity-0 transition group-hover:opacity-100 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
                {p.description && (
                  <p className="mb-3 text-sm text-ink-400 line-clamp-2">{p.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-ink-500">
                  <span>
                    {p.taskCount ?? 0} task{(p.taskCount ?? 0) === 1 ? "" : "s"}
                  </span>
                  <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-400">No projects yet — create your first one above.</p>
        )}
      </section>
    </div>
  );
}
