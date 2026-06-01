import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { useStore, api } from "@/lib/mock/store";
import { MapPin, Wifi, WifiOff, RefreshCw, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_main/heladeras")({
  component: HeladerasPage,
});

type Perm = "unknown" | "asking" | "granted" | "denied";

function formatDistance(m: number) {
  if (m < 1000) return `a ${m} m`;
  return `a ${(m / 1000).toFixed(1)} km`;
}

function HeladerasPage() {
  const fridges = useStore((s) => s.fridges);
  const granted = useStore((s) => s.locationGranted);
  const cards = useStore((s) => s.cards);
  const hasCard = cards.length > 0;
  const navigate = useNavigate();

  const [perm, setPerm] = useState<Perm>(granted ? "granted" : "unknown");

  async function requestPermission(simulateDenied = false) {
    setPerm("asking");
    await new Promise((r) => setTimeout(r, 700));
    if (simulateDenied) {
      setPerm("denied");
      return;
    }
    await api.requestLocation();
    setPerm("granted");
  }

  return (
    <>
      <AppHeader title="Heladeras" />
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6">
        {perm === "unknown" && (
          <PermissionCard onAccept={() => requestPermission(false)} onDeny={() => setPerm("denied")} />
        )}

        {perm === "asking" && (
          <div className="space-y-3">
            <Skeleton className="h-28 rounded-3xl" />
            <Skeleton className="h-28 rounded-3xl" />
            <Skeleton className="h-28 rounded-3xl" />
          </div>
        )}

        {perm === "denied" && (
          <div className="rounded-3xl border border-dashed border-border bg-card p-6 text-center">
            <div className="mx-auto size-14 rounded-2xl bg-destructive/10 text-destructive grid place-items-center">
              <AlertCircle className="size-7" />
            </div>
            <h2 className="mt-4 font-semibold text-lg">Permiso denegado</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Necesitamos tu ubicación para mostrarte heladeras cerca tuyo.
            </p>
            <Button onClick={() => requestPermission(false)} className="mt-5 h-12 rounded-2xl">
              <RefreshCw className="size-4 mr-2" /> Reintentar
            </Button>
          </div>
        )}

        {perm === "granted" && fridges.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border bg-card p-6 text-center">
            <h2 className="font-semibold">No hay heladeras cerca</h2>
            <p className="mt-1 text-sm text-muted-foreground">Probá moverte unos metros y volvé a intentarlo.</p>
          </div>
        )}

        {perm === "granted" && fridges.length > 0 && (
          <>
            {!hasCard && (
              <Link
                to="/tarjetas"
                className="block mb-4 rounded-2xl bg-accent text-accent-foreground p-4 text-sm font-medium hover:bg-accent/80 transition-colors"
              >
                Vinculá una tarjeta para desbloquear →
              </Link>
            )}
            <ul className="space-y-3">
              {fridges.map((f) => (
                <li key={f.id} className="rounded-3xl bg-card border border-border/60 p-5 shadow-soft">
                  <div className="flex items-start gap-3">
                    <div className="size-12 rounded-2xl bg-accent text-accent-foreground grid place-items-center shrink-0">
                      <MapPin className="size-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{f.name}</h3>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${
                            f.online
                              ? "bg-success/10 text-success"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {f.online ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
                          {f.online ? "Online" : "Offline"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{f.address}</p>
                      <p className="text-sm font-medium mt-1 tabular-nums">{formatDistance(f.distanceM)}</p>
                    </div>
                  </div>
                  <Button
                    disabled={!f.online || !hasCard}
                    onClick={() => navigate({ to: "/sesion/$fridgeId", params: { fridgeId: f.id } })}
                    className="w-full mt-4 h-12 rounded-2xl text-base"
                  >
                    {f.online ? "Desbloquear" : "No disponible"}
                  </Button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}

function PermissionCard({ onAccept, onDeny }: { onAccept: () => void; onDeny: () => void }) {
  return (
    <div className="rounded-3xl bg-card border border-border/60 p-6 shadow-soft text-center">
      <div className="mx-auto size-14 rounded-2xl bg-primary/10 text-primary grid place-items-center">
        <MapPin className="size-7" />
      </div>
      <h2 className="mt-4 font-semibold text-lg">Activá tu ubicación</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        La usamos para mostrarte las heladeras Cerquita más cercanas. No la compartimos.
      </p>
      <Button onClick={onAccept} className="w-full mt-5 h-12 rounded-2xl">
        Activar ubicación
      </Button>
      <button
        onClick={onDeny}
        className="mt-2 text-xs text-muted-foreground hover:text-foreground"
      >
        Ahora no
      </button>
    </div>
  );
}
