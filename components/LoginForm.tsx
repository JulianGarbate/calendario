"use client";

import { useState } from "react";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (res.ok) { window.location.href = "/"; return; }
    setError((await res.json().catch(() => ({}))).error ?? "Error");
    setBusy(false);
  }

  return (
    <div className="mx-auto mt-[12vh] max-w-sm">
      <form onSubmit={submit} className="space-y-4 rounded-3xl bg-card p-6 ring-1 ring-line">
        <h1 className="text-2xl font-bold tracking-tight">Tracker</h1>
        <label className="block text-sm text-muted">
          Contraseña
          <input
            type="password" autoFocus autoComplete="current-password" required
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="field mt-1 w-full text-fg"
          />
        </label>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <button type="submit" disabled={busy || !password} className="btn btn-primary w-full disabled:opacity-60">{busy ? "Ingresando…" : "Ingresar"}</button>
      </form>
    </div>
  );
}
