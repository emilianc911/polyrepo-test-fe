import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AuthCard,
  FormField,
  buttonPrimary,
  inputClass,
} from "../components/AuthCard";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../lib/toast";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { push } = useToast();

  const [email, setEmail] = useState("demo@polyrepo.local");
  const [password, setPassword] = useState("demo1234");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      const from = (location.state as { from?: string } | null)?.from ?? "/";
      navigate(from, { replace: true });
    } catch (err) {
      push((err as Error).message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to manage your demo projects."
      footer={
        <>
          No account?{" "}
          <Link to="/register" className="text-ink-200 underline hover:text-white">
            Create one
          </Link>
          .
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Email">
          <input
            className={inputClass}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Password" hint="Try the seeded demo account: demo / demo1234">
          <input
            className={inputClass}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </FormField>
        <button className={buttonPrimary} type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthCard>
  );
}
