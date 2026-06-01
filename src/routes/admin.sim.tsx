import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getFridges } from "@/lib/admin/api/client";
import { QueryBoundary } from "@/components/admin/primitives/QueryBoundary";
import { StatusPill } from "@/components/admin/primitives/StatusPill";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/sim")({ component: Sim });
function Sim() {
  const q = useQuery({ queryKey: ["sim-fridges"], queryFn: getFridges, refetchInterval: 15000 });
  return (
    <div className="space-y-4">
      <header><h1 className="text-2xl font-semibold">Simulador</h1><p className="text-sm text-muted-foreground">Seleccioná una heladera para simular transacciones desde tu celu.</p></header>
      <QueryBoundary query={q} isEmpty={d => d.length === 0} emptyTitle="Sin heladeras">
        {(data) => (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.map(f => (
              <li key={f.id} className="rounded-2xl border bg-card p-4 flex flex-col gap-2">
                <div className="font-medium">{f.name}</div>
                <div className="text-xs text-muted-foreground">{f.location || "—"}</div>
                <StatusPill variant={f.status === "online" ? "fridge_online" : "fridge_offline"} />
                <Link to="/admin/sim/$fridgeId" params={{ fridgeId: f.id }}><Button size="sm" className="w-full mt-1">Iniciar sim</Button></Link>
              </li>
            ))}
          </ul>
        )}
      </QueryBoundary>
    </div>
  );
}
