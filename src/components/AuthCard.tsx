import type { ReactNode } from "react";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto mt-12 w-full max-w-md rounded-xl border border-ink-700 bg-ink-900/70 p-6 shadow-2xl">
      <h1 className="mb-1 text-2xl font-semibold">{title}</h1>
      {subtitle && <p className="mb-6 text-sm text-ink-400">{subtitle}</p>}
      {children}
      {footer && <div className="mt-6 text-sm text-ink-400">{footer}</div>}
    </div>
  );
}

export function FormField({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block mb-4">
      <span className="mb-1 block text-sm text-ink-300">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-500">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-ink-600 bg-ink-950 px-3 py-2 text-ink-100 outline-none transition focus:border-ink-300";
export const buttonPrimary =
  "w-full rounded-md bg-ink-50 px-4 py-2 font-semibold text-ink-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50";
