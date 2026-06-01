import { createFileRoute } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/admin/layout/ThemeToggle";

export const Route = createFileRoute("/admin/settings")({ component: Settings });

function Settings() {
  return (
    <div className="space-y-6 max-w-3xl">
      <header><h1 className="text-2xl font-semibold">Configuración</h1><p className="text-sm text-muted-foreground">Preferencias del operador y placeholders del backend.</p></header>

      <section className="rounded-2xl border bg-card p-4">
        <h2 className="font-semibold">Apariencia</h2>
        <div className="mt-3 flex items-center justify-between"><span className="text-sm">Tema</span><ThemeToggle /></div>
      </section>

      {[
        { title: "API keys", desc: "Tokens para integraciones externas." },
        { title: "Credenciales de pago", desc: "MercadoPago, Stripe, etc." },
        { title: "Feature flags", desc: "Activar/desactivar funcionalidades en pruebas." },
      ].map(s => (
        <section key={s.title} className="rounded-2xl border bg-card p-4 opacity-70">
          <div className="flex items-center justify-between"><h2 className="font-semibold">{s.title}</h2><span className="text-xs rounded-full bg-muted px-2 py-0.5">Próximamente</span></div>
          <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
          <div className="mt-3 grid gap-2"><input disabled placeholder="—" className="rounded-md border bg-background px-3 py-2 text-sm" /><input disabled placeholder="—" className="rounded-md border bg-background px-3 py-2 text-sm" /></div>
        </section>
      ))}
    </div>
  );
}
