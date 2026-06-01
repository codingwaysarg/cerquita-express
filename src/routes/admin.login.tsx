import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminLogin } from "@/lib/admin/api/client";
import { setSession } from "@/lib/admin/auth";

export const Route = createFileRoute("/admin/login")({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const r = await adminLogin(email, pwd);
      setSession(r.token, email);
      navigate({ to: "/admin" });
    } catch (e) {
      if (e instanceof Response && e.status === 401) setErr("Credenciales inválidas.");
      else setErr("No pudimos iniciar sesión.");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-soft">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">SmartFridge — Backoffice</h1>
          <p className="text-sm text-muted-foreground mt-1">Ingresá con tu cuenta de operador.</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pwd">Contraseña</Label>
            <Input id="pwd" type="password" required value={pwd} onChange={e => setPwd(e.target.value)} autoComplete="current-password" />
          </div>
          {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Ingresando…" : "Ingresar"}</Button>
        </form>
        <p className="mt-4 text-xs text-muted-foreground text-center">
          ¿Sos cliente? <Link to="/" className="underline">Ir a la app</Link>
        </p>
      </div>
    </div>
  );
}
