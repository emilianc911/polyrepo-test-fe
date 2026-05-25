import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-ink-700 bg-ink-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-semibold text-ink-50">
            Polyrepo<span className="text-ink-400">/demo</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? "text-ink-50" : "text-ink-300 hover:text-ink-100"
              }
            >
              Projects
            </NavLink>
            {user ? (
              <>
                <span className="text-ink-400">{user.displayName}</span>
                <button
                  className="rounded-md border border-ink-600 px-3 py-1 text-ink-200 hover:bg-ink-800"
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-md border border-ink-600 px-3 py-1 text-ink-200 hover:bg-ink-800"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-ink-800 py-4 text-center text-xs text-ink-500">
        polyrepo-test-fe · React + Vite + Tailwind · talks to polyrepo-test-be
      </footer>
    </div>
  );
}
