import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Receipt, AlertTriangle, Refrigerator, Activity } from "lucide-react";
import { KpiCard } from "@/components/admin/primitives/KpiCard";
import { QueryBoundary } from "@/components/admin/primitives/QueryBoundary";
import { StatusPill } from "@/components/admin/primitives/StatusPill";
import { getDashboardTimeline, getDashboardFridgesStatus, getTopProducts } from "@/lib/admin/api/client";
import { fmtARS, relTime } from "@/lib/admin/format";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen general de la operación.</p>
      </header>
      <KpiStrip />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2"><TimelinePanel /></div>
        <TopProductsPanel />
      </div>
      <FleetStatusPanel />
    </div>
  );
}

function KpiStrip() {
  const tl = useQuery({ queryKey: ["dash-tl"], queryFn: getDashboardTimeline, refetchInterval: 30000 });
  const fr = useQuery({ queryKey: ["dash-fr"], queryFn: getDashboardFridgesStatus, refetchInterval: 30000 });
  return (
    <QueryBoundary query={{ data: tl.data && fr.data ? { tl: tl.data, fr: fr.data } : undefined, isLoading: tl.isLoading || fr.isLoading, isError: tl.isError || fr.isError, refetch: () => { tl.refetch(); fr.refetch(); } }}>
      {({ tl, fr }) => {
        const total = tl.reduce((s, b) => s + b.completed + b.review + b.failed + b.empty, 0);
        const review = tl.reduce((s, b) => s + b.review, 0);
        const online = fr.filter(f => f.status === "online").length;
        const reviewable = tl.reduce((s, b) => s + b.completed + b.review, 0);
        const lowPct = reviewable ? Math.round((review / reviewable) * 100) : 0;
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard icon={<Receipt className="h-4 w-4" />} label="Transacciones hoy" value={total} />
            <KpiCard icon={<AlertTriangle className="h-4 w-4" />} label="Necesitan revisión" value={review} accent={review > 0 ? "amber" : "default"} />
            <KpiCard icon={<Refrigerator className="h-4 w-4" />} label="Heladeras en línea" value={online} sub={`de ${fr.length} total`} />
            <KpiCard icon={<Activity className="h-4 w-4" />} label="Baja confianza" value={`${lowPct}%`} sub={`${review} de ${reviewable} tx`} accent={lowPct > 20 ? "red" : lowPct > 10 ? "amber" : "default"} />
          </div>
        );
      }}
    </QueryBoundary>
  );
}

function TimelinePanel() {
  const q = useQuery({ queryKey: ["dash-tl-panel"], queryFn: getDashboardTimeline });
  return (
    <section className="rounded-2xl border bg-card p-4">
      <h2 className="font-semibold">Transacciones por hora · últimas 24 h</h2>
      <div className="mt-3 h-64">
        <QueryBoundary query={q} isEmpty={(d) => d.every(b => b.completed + b.review + b.failed + b.empty === 0)} emptyTitle="Sin transacciones en las últimas 24 h.">
          {(data) => (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="hour" tickFormatter={(v) => new Date(v).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip labelFormatter={(v) => new Date(v).toLocaleTimeString("es-AR")} />
                <Legend />
                <Bar dataKey="completed" stackId="a" fill="#10b981" name="Completadas" />
                <Bar dataKey="review" stackId="a" fill="#f59e0b" name="Revisión" />
                <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Fallidas" />
                <Bar dataKey="empty" stackId="a" fill="#a1a1aa" name="Vacías" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </QueryBoundary>
      </div>
    </section>
  );
}

function TopProductsPanel() {
  const [w, setW] = useState<"24h" | "7d" | "30d">("24h");
  const q = useQuery({ queryKey: ["dash-top", w], queryFn: () => getTopProducts(w) });
  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Top productos</h2>
        <div className="flex gap-1 rounded-md border p-0.5">
          {(["24h","7d","30d"] as const).map(k => (
            <button key={k} aria-pressed={w===k} onClick={() => setW(k)} className={`px-2 py-1 text-xs rounded ${w===k?"bg-primary text-primary-foreground":"text-muted-foreground"}`}>{k}</button>
          ))}
        </div>
      </div>
      <div className="mt-3">
        <QueryBoundary query={q} isEmpty={d => d.length === 0} emptyTitle="Sin ventas en este período.">
          {(data) => {
            const max = Math.max(...data.map(p => p.units), 1);
            return (
              <ul className="space-y-2">
                {data.map((p, i) => (
                  <li key={p.productId} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground tabular-nums w-5">#{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{p.productName}{p.sku && <span className="text-xs text-muted-foreground ml-1">· {p.sku}</span>}</div>
                      <div className="text-xs text-muted-foreground">{p.units} ud · {fmtARS(p.revenue)}</div>
                      <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${(p.units / max) * 100}%` }} /></div>
                    </div>
                  </li>
                ))}
              </ul>
            );
          }}
        </QueryBoundary>
      </div>
    </section>
  );
}

function FleetStatusPanel() {
  const q = useQuery({ queryKey: ["dash-fleet"], queryFn: getDashboardFridgesStatus });
  return (
    <section className="rounded-2xl border bg-card p-4">
      <h2 className="font-semibold">Estado de la flota</h2>
      <div className="mt-3">
        <QueryBoundary query={q} isEmpty={d => d.length === 0} emptyTitle="Sin heladeras registradas.">
          {(data) => (
            <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
              {data.map(f => (
                <div key={f.id} className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs bg-background">
                  {f.status === "online"
                    ? <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                    : <span className="h-2 w-2 border border-zinc-400 rounded-sm" aria-hidden />}
                  <span className="font-medium">{f.name}</span>
                  <span className="text-muted-foreground">· {relTime(f.lastSeenAt)}</span>
                </div>
              ))}
            </div>
          )}
        </QueryBoundary>
      </div>
    </section>
  );
}
