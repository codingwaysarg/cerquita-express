import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { getTransactions, bulkReview, getFridges, type TxQuery } from "@/lib/admin/api/client";
import { QueryBoundary } from "@/components/admin/primitives/QueryBoundary";
import { StatusPill, txVariant } from "@/components/admin/primitives/StatusPill";
import { ConfidenceBar } from "@/components/admin/primitives/ConfidenceBar";
import { fmtARS, relTime, shortId } from "@/lib/admin/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, Search, X, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TxSearch = z.object({
  status: z.array(z.string()).optional(),
  needs_review: z.boolean().optional(),
  fridge_id: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(["created_at", "amount", "status"]).optional(),
  dir: z.enum(["asc", "desc"]).optional(),
}).partial();

export const Route = createFileRoute("/admin/transactions")({
  component: TxList,
  validateSearch: (s) => TxSearch.parse(s),
});

const STATUS_OPTS = [
  { value: "completed", label: "Completadas" },
  { value: "processing", label: "Procesando" },
  { value: "failed", label: "Fallidas" },
  { value: "empty", label: "Vacías" },
  { value: "awaiting_upload", label: "Esperando upload" },
];

function TxList() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/transactions" });
  const qc = useQueryClient();
  const fridgesQ = useQuery({ queryKey: ["fridges-mini"], queryFn: getFridges });

  const apiQ: TxQuery = {
    status: search.status,
    needs_review: search.needs_review,
    fridge_id: search.fridge_id,
    sort: search.sort || "created_at",
    dir: search.dir || "desc",
    limit: 100,
  };
  const q = useQuery({
    queryKey: ["txs", apiQ],
    queryFn: () => getTransactions(apiQ),
    refetchInterval: 15000,
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const items = useMemo(() => {
    if (!q.data) return [];
    if (!search.q) return q.data.items;
    const needle = search.q.toLowerCase();
    return q.data.items.filter(t =>
      t.id.includes(needle) ||
      t.items.some(i => i.productName.toLowerCase().includes(needle)) ||
      (t.fridgeName || "").toLowerCase().includes(needle)
    );
  }, [q.data, search.q]);

  useEffect(() => { if (cursor >= items.length) setCursor(0); }, [items.length, cursor]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(items.length - 1, c + 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setCursor(c => Math.max(0, c - 1)); }
      else if (e.key === "Enter" && items[cursor]) { navigate({ to: "/admin/transactions/$id", params: { id: items[cursor].id } }); }
      else if (e.key === " " && items[cursor]) {
        e.preventDefault();
        setSelected(s => { const n = new Set(s); const id = items[cursor].id; n.has(id) ? n.delete(id) : n.add(id); return n; });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [items, cursor, navigate]);

  function toggle(k: keyof typeof search, value: any) {
    navigate({ search: ((prev: any) => ({ ...prev, [k]: value })) as any });
  }
  function toggleStatus(s: string) {
    const cur = new Set(search.status || []);
    cur.has(s) ? cur.delete(s) : cur.add(s);
    toggle("status", cur.size ? Array.from(cur) : undefined);
  }
  function clearFilters() { navigate({ search: {} as any }); }

  async function doBulkReview() {
    const ids = Array.from(selected);
    if (!ids.length) return;
    await bulkReview(ids);
    toast.success(`${ids.length} marcadas como revisadas`);
    setSelected(new Set());
    qc.invalidateQueries({ queryKey: ["txs"] });
  }

  const activeFilters = (search.status?.length || 0) + (search.needs_review ? 1 : 0) + (search.fridge_id ? 1 : 0);

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transacciones</h1>
          <p className="text-sm text-muted-foreground">Compras auto-resueltas + tickets en revisión.</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tx, producto, heladera…"
              defaultValue={search.q || ""}
              onChange={(e) => toggle("q", e.target.value || undefined)}
              className="pl-9 w-72 rounded-full"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setFiltersOpen(o => !o)} className="rounded-full">
            <Filter className="h-3.5 w-3.5" />
            Filtros {activeFilters > 0 && <span className="ml-1 rounded-full bg-primary text-primary-foreground px-1.5 text-[10px]">{activeFilters}</span>}
          </Button>
        </div>
      </header>

      {filtersOpen && (
        <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft space-y-3">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">Estado</div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTS.map(o => (
                <button
                  key={o.value}
                  onClick={() => toggleStatus(o.value)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs border transition",
                    search.status?.includes(o.value) ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
                  )}
                >{o.label}</button>
              ))}
              <button
                onClick={() => toggle("needs_review", search.needs_review ? undefined : true)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs border transition",
                  search.needs_review ? "bg-amber-500 text-white border-amber-500" : "bg-background hover:bg-muted"
                )}
              >Necesitan revisión</button>
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">Heladera</div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => toggle("fridge_id", undefined)}
                className={cn("px-3 py-1 rounded-full text-xs border", !search.fridge_id ? "bg-primary text-primary-foreground border-primary" : "bg-background")}
              >Todas</button>
              {fridgesQ.data?.map(f => (
                <button key={f.id} onClick={() => toggle("fridge_id", f.id)}
                  className={cn("px-3 py-1 rounded-full text-xs border", search.fridge_id === f.id ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted")}
                >{f.name}</button>
              ))}
            </div>
          </div>
          {activeFilters > 0 && <Button variant="ghost" size="sm" onClick={clearFilters}><X className="h-3 w-3 mr-1" /> Limpiar</Button>}
        </div>
      )}

      {selected.size > 0 && (
        <div className="sticky top-14 z-20 rounded-2xl border bg-gradient-card text-primary-foreground p-3 flex items-center justify-between shadow-soft">
          <span className="text-sm font-medium">{selected.size} seleccionadas</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={doBulkReview}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Marcar revisadas
            </Button>
            <Button size="sm" variant="ghost" className="text-primary-foreground hover:bg-white/10" onClick={() => setSelected(new Set())}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <QueryBoundary query={q} isEmpty={d => items.length === 0} emptyTitle="Sin transacciones para estos filtros">
        {() => (
          <div className="rounded-3xl border border-border/60 bg-card shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground text-xs uppercase">
                  <tr>
                    <th className="w-10 p-3"><Checkbox
                      checked={selected.size === items.length && items.length > 0}
                      onCheckedChange={(c) => setSelected(c ? new Set(items.map(i => i.id)) : new Set())}
                      aria-label="Seleccionar todo"
                    /></th>
                    <SortHeader k="status" search={search} navigate={navigate} label="Estado" />
                    <th className="text-left p-3 font-medium">ID</th>
                    <th className="text-left p-3 font-medium">Heladera</th>
                    <th className="text-left p-3 font-medium">Items</th>
                    <th className="text-left p-3 font-medium">Confianza</th>
                    <SortHeader k="amount" search={search} navigate={navigate} label="Total" align="right" />
                    <SortHeader k="created_at" search={search} navigate={navigate} label="Hora" align="right" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((t, i) => (
                    <tr
                      key={t.id}
                      onClick={() => navigate({ to: "/admin/transactions/$id", params: { id: t.id } })}
                      onMouseEnter={() => setCursor(i)}
                      className={cn(
                        "border-t cursor-pointer transition",
                        cursor === i ? "bg-accent/40" : "hover:bg-muted/30",
                        t.needsReview && "bg-amber-500/5"
                      )}
                    >
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected.has(t.id)}
                          onCheckedChange={(c) => setSelected(s => { const n = new Set(s); c ? n.add(t.id) : n.delete(t.id); return n; })}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <StatusPill variant={txVariant(t.status)} />
                          {t.needsReview && <StatusPill variant="needs_review" />}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-xs">{shortId(t.id)}</td>
                      <td className="p-3 truncate max-w-[180px]">{t.fridgeName}</td>
                      <td className="p-3">
                        <div className="text-xs">
                          {t.items.slice(0, 2).map(i => `${i.quantity}× ${i.productName}`).join(", ")}
                          {t.items.length > 2 && <span className="text-muted-foreground"> +{t.items.length - 2}</span>}
                        </div>
                      </td>
                      <td className="p-3 w-32"><ConfidenceBar value={t.confidence} /></td>
                      <td className="p-3 text-right tabular-nums font-medium">{fmtARS(t.total)}</td>
                      <td className="p-3 text-right text-xs text-muted-foreground">{relTime(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 text-xs text-muted-foreground flex items-center justify-between border-t bg-muted/20">
              <span>{items.length} de {q.data?.total} · Atajos: ↑↓ navegar · Enter abrir · Espacio seleccionar</span>
            </div>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}

function SortHeader({ k, search, navigate, label, align = "left" }: {
  k: "status" | "amount" | "created_at"; search: any; navigate: any; label: string; align?: "left" | "right";
}) {
  const active = (search.sort || "created_at") === k;
  const dir = search.dir || "desc";
  return (
    <th className={cn("p-3 font-medium select-none", align === "right" ? "text-right" : "text-left")}>
      <button
        onClick={() => navigate({ search: (p: any) => ({ ...p, sort: k, dir: active && dir === "desc" ? "asc" : "desc" }) })}
        className={cn("inline-flex items-center gap-1 hover:text-foreground", active && "text-foreground")}
      >
        {label}
        {active && (dir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)}
      </button>
    </th>
  );
}
