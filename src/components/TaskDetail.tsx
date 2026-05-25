import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../lib/api";
import { useToast } from "../lib/toast";
import type { Attachment, Comment, Task } from "../types/api";

export function TaskDetail({
  task,
  onClose,
  onChanged,
}: {
  task: Task;
  onClose: () => void;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const { push } = useToast();
  const [body, setBody] = useState("");

  const commentsQuery = useQuery<Comment[]>({
    queryKey: ["comments", task.id],
    queryFn: async () => (await api.listComments(task.id)).comments,
  });
  const attachmentsQuery = useQuery<Attachment[]>({
    queryKey: ["attachments", task.id],
    queryFn: async () => (await api.listAttachments(task.id)).attachments,
  });

  const addComment = useMutation({
    mutationFn: async () => api.createComment(task.id, body.trim()),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["comments", task.id] });
    },
    onError: (err: Error) => push(err.message, "error"),
  });

  const deleteTask = useMutation({
    mutationFn: async () => api.deleteTask(task.id),
    onSuccess: () => {
      onChanged();
      onClose();
      push("Task deleted", "success");
    },
    onError: (err: Error) => push(err.message, "error"),
  });

  async function handleFileUpload(file: File) {
    try {
      const { uploadUrl, key } = await api.presignAttachment(task.id, {
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
      });
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!putRes.ok) {
        throw new Error(`upload failed: ${putRes.status} ${putRes.statusText}`);
      }
      await api.confirmAttachment(task.id, {
        key,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
      });
      qc.invalidateQueries({ queryKey: ["attachments", task.id] });
      push(`Uploaded ${file.name}`, "success");
    } catch (err) {
      push((err as Error).message, "error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-ink-700 bg-ink-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-ink-50">{task.title}</h2>
            <p className="mt-1 text-xs text-ink-500">
              Created {new Date(task.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-ink-700 px-2 py-1 text-sm text-ink-300 hover:bg-ink-800"
          >
            Close
          </button>
        </header>

        {task.description && (
          <p className="mb-6 whitespace-pre-wrap text-sm text-ink-300">
            {task.description}
          </p>
        )}

        <section className="mb-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-ink-400">
            Attachments
          </h3>
          <input
            type="file"
            className="block w-full text-sm text-ink-300 file:mr-3 file:rounded-md file:border-0 file:bg-ink-700 file:px-3 file:py-1.5 file:text-ink-50 hover:file:bg-ink-600"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileUpload(f);
              e.target.value = "";
            }}
          />
          <ul className="mt-3 space-y-1 text-sm">
            {attachmentsQuery.data?.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-md border border-ink-700 bg-ink-950 px-3 py-2"
              >
                <a
                  href={a.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink-100 hover:underline"
                >
                  {a.filename}
                </a>
                <span className="text-xs text-ink-500">
                  {(a.size / 1024).toFixed(1)} KB
                </span>
              </li>
            ))}
            {attachmentsQuery.data && attachmentsQuery.data.length === 0 && (
              <li className="text-xs text-ink-500">No attachments yet.</li>
            )}
          </ul>
        </section>

        <section className="mb-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-ink-400">
            Comments
          </h3>
          <ul className="mb-3 space-y-2">
            {commentsQuery.data?.map((c) => (
              <li
                key={c.id}
                className="rounded-md border border-ink-800 bg-ink-950/60 p-3 text-sm"
              >
                <div className="mb-1 flex items-center justify-between text-xs text-ink-500">
                  <span>{c.authorName}</span>
                  <span>{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <p className="whitespace-pre-wrap text-ink-200">{c.body}</p>
              </li>
            ))}
            {commentsQuery.data && commentsQuery.data.length === 0 && (
              <li className="text-xs text-ink-500">No comments yet.</li>
            )}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (body.trim()) addComment.mutate();
            }}
            className="flex flex-col gap-2"
          >
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={2}
              className="rounded-md border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-ink-100 outline-none focus:border-ink-400"
              placeholder="Write a comment…"
            />
            <button
              type="submit"
              disabled={!body.trim() || addComment.isPending}
              className="self-end rounded-md bg-ink-50 px-3 py-1.5 text-sm font-medium text-ink-950 transition hover:bg-white disabled:opacity-50"
            >
              {addComment.isPending ? "Posting…" : "Post comment"}
            </button>
          </form>
        </section>

        <footer className="flex justify-end border-t border-ink-800 pt-4">
          <button
            onClick={() => {
              if (confirm("Delete this task?")) deleteTask.mutate();
            }}
            className="text-sm text-red-400 hover:text-red-300"
          >
            Delete task
          </button>
        </footer>
      </div>
    </div>
  );
}
