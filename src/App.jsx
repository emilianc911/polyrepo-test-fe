import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";

export default function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState(null);
  const [healthy, setHealthy] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const list = await api.list();
      setTodos(list);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api
      .health()
      .then(() => setHealthy(true))
      .catch(() => setHealthy(false));
    refresh();
  }, [refresh]);

  async function handleAdd(event) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    try {
      await api.create(trimmed);
      setTitle("");
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggle(todo) {
    try {
      await api.toggle(todo.id, !todo.done);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(todo) {
    try {
      await api.remove(todo.id);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="page">
      <header className="page__header">
        <h1>Polyrepo Todos</h1>
        <p className="page__subtitle">
          React + Vite (this repo) talking to Express + Postgres (the other repo) over <code>/api</code>.
        </p>
        <p className={`status status--${healthy === null ? "unknown" : healthy ? "ok" : "down"}`}>
          backend: {healthy === null ? "checking…" : healthy ? "reachable" : "unreachable"}
        </p>
      </header>

      <form className="composer" onSubmit={handleAdd}>
        <input
          className="composer__input"
          type="text"
          placeholder="What needs doing?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="composer__btn" type="submit" disabled={!title.trim()}>
          Add
        </button>
      </form>

      {error && <div className="error">⚠ {error}</div>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : todos.length === 0 ? (
        <p className="muted">No todos yet — add one above.</p>
      ) : (
        <ul className="todos">
          {todos.map((todo) => (
            <li key={todo.id} className={`todo${todo.done ? " todo--done" : ""}`}>
              <label className="todo__label">
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => handleToggle(todo)}
                />
                <span className="todo__title">{todo.title}</span>
              </label>
              <button
                className="todo__delete"
                onClick={() => handleDelete(todo)}
                aria-label={`Delete ${todo.title}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
