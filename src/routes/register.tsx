import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/mock/store";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Ingresá un email válido.");
    if (pwd.length < 6) return setErr("La contraseña debe tener al menos 6 caracteres.");
    setLoading(true);
    try {
      await api.register(email, pwd);
      toast.success("Cuenta creada");
      navigate({ to: "/heladeras" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <PhoneShell>
      <AppHeader back />
      <form onSubmit={onSubmit} className="flex-1 flex flex-col px-6 pt-4">
        <h1 className="text-3xl font-semibold tracking-tight">Creá tu cuenta</h1>
        <p className="mt-2 text-muted-foreground">Te toma menos de un minuto.</p>

        <div className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" inputMode="email"
              className="h-12 rounded-2xl" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pwd">Contraseña</Label>
            <Input id="pwd" type="password" autoComplete="new-password"
              className="h-12 rounded-2xl" value={pwd} onChange={(e) => setPwd(e.target.value)} required />
          </div>
          {err && <p className="text-sm text-destructive" role="alert">{err}</p>}
        </div>

        <div className="flex-1" />
        <div className="sticky bottom-0 -mx-6 px-6 pt-4 safe-bottom bg-gradient-to-t from-background via-background to-transparent space-y-3">
          <Button type="submit" size="lg" disabled={loading} className="w-full h-14 text-base rounded-2xl">
            {loading ? "Creando…" : "Crear cuenta"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tenés cuenta? <Link to="/login" className="text-primary font-medium">Iniciá sesión</Link>
          </p>
        </div>
      </form>
    </PhoneShell>
  );
}
