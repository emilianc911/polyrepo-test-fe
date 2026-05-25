import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AuthCard,
  FormField,
  buttonPrimary,
  inputClass,
} from "../components/AuthCard";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../lib/toast";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { push } = useToast();

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register(email, password, displayName);
      push("Account created", "success");
      navigate("/", { replace: true });
    } catch (err) {
      push((err as Error).message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Each user owns their own projects in this demo."
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" className="text-ink-200 underline hover:text-white">
            Sign in
          </Link>
          .
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Display name">
          <input
            className={inputClass}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            minLength={1}
            maxLength={80}
          />
        </FormField>
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
        <FormField label="Password" hint="Minimum 8 characters">
          <input
            className={inputClass}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </FormField>
        <button className={buttonPrimary} type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create account"}
        </button>
      </form>
    </AuthCard>
  );
}
