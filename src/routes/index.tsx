import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cerquita — Abrí, agarrá, listo" },
      { name: "description", content: "Autocheckout para heladeras inteligentes. Sin filas, sin cajero." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <PhoneShell>
      <main className="flex-1 flex flex-col px-6 pt-10">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-2xl bg-gradient-card shadow-soft" />
          <span className="text-lg font-semibold tracking-tight">Cerquita</span>
        </div>

        <div className="flex-1 flex flex-col justify-center py-12">
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-accent text-accent-foreground px-3 py-1 text-xs font-medium mb-6">
            <Sparkles className="size-3.5" /> Heladeras inteligentes
          </div>
          <h1 className="text-[2.6rem] leading-[1.05] font-semibold tracking-tight">
            Abrí, agarrá, <span className="text-primary">listo.</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Sin filas, sin cajero. Pagá automáticamente con tu tarjeta vinculada.
          </p>

          <div className="mt-10 relative">
            <div className="aspect-[4/3] rounded-3xl bg-gradient-card shadow-soft relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_50%)]" />
              <div className="absolute bottom-6 left-6 right-6 text-primary-foreground">
                <div className="text-xs opacity-80">Próxima heladera</div>
                <div className="text-xl font-semibold mt-1">Palermo · a 120 m</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="sticky bottom-0 px-6 pt-4 safe-bottom bg-gradient-to-t from-background via-background to-transparent space-y-3">
        <Button asChild size="lg" className="w-full h-14 text-base rounded-2xl">
          <Link to="/register">Empezar</Link>
        </Button>
        <Button asChild variant="ghost" size="lg" className="w-full h-12 rounded-2xl">
          <Link to="/login">Ya tengo cuenta</Link>
        </Button>
      </div>
    </PhoneShell>
  );
}
