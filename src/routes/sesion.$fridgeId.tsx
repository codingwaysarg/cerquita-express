import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/mock/store";
import { startSession, useSession, resetSession } from "@/lib/mock/session";
import { Check, Loader2, DoorOpen, AlertCircle, ShoppingBag } from "lucide-react";
import type { SessionState } from "@/lib/mock/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sesion/$fridgeId")({
  component: SessionPage,
});

const steps: { key: SessionState; label: string }[] = [
  { key: "unlocking", label: "Desbloqueando" },
  { key: "open", label: "Puerta abierta" },
  { key: "processing", label: "Procesando" },
  { key: "done", label: "Listo" },
];

const messages: Record<SessionState, { title: string; sub?: string }> = {
  idle: { title: "Preparando…" },
  unlocking: { title: "Desbloqueando…", sub: "Conectando con la heladera" },
  open: {
    title: "Puerta abierta",
    sub: "Agarrá lo que quieras y cerrá la puerta",
  },
  processing: { title: "Procesando tu compra…", sub: "Estamos detectando lo que sacaste" },
  done: {
    title: "¡Listo!",
    sub: "Estamos revisando tu sesión. No se te cobra durante la prueba.",
  },
  error: { title: "Hubo un problema", sub: "No se te cobró. Probá de nuevo." },
};

function SessionPage() {
  const { fridgeId } = Route.useParams();
  const fridge = useStore((s) => s.fridges.find((f) => f.id === fridgeId));
  const { state } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    startSession(fridgeId);
    return () => resetSession();
  }, [fridgeId]);

  const stepIdx = steps.findIndex((s) => s.key === state);

  return (
    <PhoneShell>
      <div className="flex-1 flex flex-col px-6 pt-6 pb-8">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Sesión activa</div>
        <div className="font-semibold mt-1">{fridge?.name ?? "Heladera"}</div>

        <Stepper currentIdx={stepIdx} state={state} />

        <div className="flex-1 flex flex-col items-center justify-center text-center px-2" aria-live="polite" aria-atomic="true">
          <StateIcon state={state} />
          <h1 className="mt-8 text-3xl font-semibold tracking-tight leading-tight">
            {messages[state].title}
          </h1>
          {messages[state].sub && (
            <p className="mt-3 text-lg text-muted-foreground max-w-[20rem]">{messages[state].sub}</p>
          )}
        </div>

        <div className="sticky bottom-0 -mx-6 px-6 pt-4 safe-bottom bg-gradient-to-t from-background via-background to-transparent">
          {(state === "done" || state === "error") && (
            <Button
              size="lg"
              variant={state === "error" ? "default" : "secondary"}
              className="w-full h-14 rounded-2xl text-base"
              onClick={() => navigate({ to: "/heladeras" })}
            >
              Volver
            </Button>
          )}
        </div>
      </div>
    </PhoneShell>
  );
}

function Stepper({ currentIdx, state }: { currentIdx: number; state: SessionState }) {
  return (
    <ol className="mt-6 flex items-center gap-2">
      {steps.map((s, i) => {
        const done = currentIdx > i || state === "done";
        const active = currentIdx === i && state !== "done" && state !== "error";
        const isError = state === "error" && i === currentIdx;
        return (
          <li key={s.key} className="flex-1">
            <div
              className={cn(
                "h-1.5 rounded-full transition-all",
                isError ? "bg-destructive" : done ? "bg-primary" : active ? "bg-primary/60" : "bg-muted",
              )}
            />
          </li>
        );
      })}
    </ol>
  );
}

function StateIcon({ state }: { state: SessionState }) {
  if (state === "unlocking" || state === "idle")
    return (
      <div className="size-28 rounded-full bg-primary/10 text-primary grid place-items-center">
        <Loader2 className="size-12 animate-spin" />
      </div>
    );
  if (state === "open")
    return (
      <div className="relative size-28 rounded-full bg-success/10 text-success grid place-items-center">
        <DoorOpen className="size-14" />
        <span className="absolute top-1 right-1 size-3 rounded-full bg-success pulse-dot" />
      </div>
    );
  if (state === "processing")
    return (
      <div className="size-28 rounded-full bg-primary/10 text-primary grid place-items-center">
        <ShoppingBag className="size-12" />
      </div>
    );
  if (state === "done")
    return (
      <div className="size-28 rounded-full bg-success/15 text-success grid place-items-center">
        <Check className="size-14" strokeWidth={3} />
      </div>
    );
  return (
    <div className="size-28 rounded-full bg-destructive/10 text-destructive grid place-items-center">
      <AlertCircle className="size-14" />
    </div>
  );
}
