import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getFridges } from "@/lib/admin/api/client";
import { QueryBoundary } from "@/components/admin/primitives/QueryBoundary";
import { StatusPill } from "@/components/admin/primitives/StatusPill";

export const Route = createFileRoute("/admin/fridges")({ component: Fridges });
function Fridges() {
  const q = useQuery({ queryKey: ["fridges"], queryFn: getFridges });
  return (
    <div className="space-y-4">
      <header><h1 className="text-2xl font-semibold">Heladeras</h1><p className="text-sm text-muted-foreground">Estado del fleet + provisioning.</p></header>
      <QueryBoundary query={q} isEmpty={d => d.length === 0} emptyTitle="Aún no hay heladeras">
        {(data) => (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {data.map(f => (
              <Link key={f.id} to="/admin/fridges/$id" params={{ id: f.id }} className="rounded-2xl border bg-card overflow-hidden hover:shadow-soft transition">
                <div className="aspect-video bg-muted"><img src={f.lastSnapshotUrl} alt="" className="size-full object-cover" /></div>
                <div className="p-3 space-y-1">
                  <div className="flex items-center justify-between"><div className="font-medium">{f.name}</div><StatusPill variant={f.status === "online" ? "fridge_online" : "fridge_offline"} /></div>
                  <div className="text-xs font-mono text-muted-foreground">{f.id}</div>
                  <div className="text-xs text-muted-foreground">{f.location || "—"}</div>
                  <div className="text-xs">{f.txTodayCount} transacciones hoy · {f.needsReviewToday} para revisar</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
