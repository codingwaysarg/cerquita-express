import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getFridge, patchFridge, calibrateFridge, addShelf, removeShelf,
  addPlanogram, removePlanogram, getProducts,
} from "@/lib/admin/api/client";
import { QueryBoundary } from "@/components/admin/primitives/QueryBoundary";
import { StatusPill } from "@/components/admin/primitives/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Camera, RefreshCw, Plus, Trash2, MapPin, Activity, Layers } from "lucide-react";
import { fmtDateTime, relTime } from "@/lib/admin/format";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem, CommandGroup, CommandEmpty } from "@/components/ui/command";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/fridges/$id")({ component: FridgeDetail });

function FridgeDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["fridge", id], queryFn: () => getFridge(id), refetchInterval: 8000 });
  const productsQ = useQuery({ queryKey: ["products-all"], queryFn: () => getProducts() });

  return (
    <div className="space-y-5">
      <button onClick={() => navigate({ to: "/admin/fridges" })} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-3.5 w-3.5" /> Flota
      </button>
      <QueryBoundary query={q}>
        {(f) => (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 space-y-5">
              <header className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight">{f.name}</h1>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {f.location || "Sin ubicación"}</div>
                  </div>
                  <StatusPill variant={f.status === "online" ? "fridge_online" : "fridge_offline"} />
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><div className="text-xs text-muted-foreground">Último visto</div><div className="font-medium">{relTime(f.lastSeenAt)}</div></div>
                  <div><div className="text-xs text-muted-foreground">Cámaras</div><div className="font-medium">{f.cameras}</div></div>
                  <div><div className="text-xs text-muted-foreground">Tx hoy</div><div className="font-medium">{f.txTodayCount}</div></div>
                  <div><div className="text-xs text-muted-foreground">Revisión hoy</div><div className="font-medium">{f.needsReviewToday}</div></div>
                </div>
              </header>

              <section className="rounded-3xl border border-border/60 bg-card overflow-hidden shadow-soft">
                <div className="p-4 border-b flex items-center justify-between">
                  <h2 className="font-semibold flex items-center gap-2"><Camera className="h-4 w-4" /> Snapshot en vivo</h2>
                  <Button size="sm" variant="outline" onClick={() => qc.invalidateQueries({ queryKey: ["fridge", id] })}>
                    <RefreshCw className="h-3.5 w-3.5" /> Refrescar
                  </Button>
                </div>
                <div className="bg-muted aspect-[3/2] grid place-items-center">
                  {f.lastSnapshotUrl ? <img src={f.lastSnapshotUrl} alt="snapshot" className="w-full h-full object-cover" /> : <span className="text-muted-foreground text-sm">Sin snapshot</span>}
                </div>
              </section>

              <ShelvesPanel fridge={f} products={productsQ.data || []} />
            </div>

            <aside className="space-y-4">
              <SettingsPanel fridge={f} />
            </aside>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}

function SettingsPanel({ fridge }: { fridge: any }) {
  const qc = useQueryClient();
  const [thr, setThr] = useState(fridge.confidenceThreshold);
  async function save() { await patchFridge(fridge.id, { confidenceThreshold: thr }); toast.success("Umbral guardado"); qc.invalidateQueries({ queryKey: ["fridge", fridge.id] }); }
  async function calibrate() { try { await calibrateFridge(fridge.id); toast.success("Re-tare enviado"); } catch { toast.error("Edge no responde"); } }
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft space-y-4 sticky top-20">
      <div>
        <h2 className="font-semibold flex items-center gap-2"><Activity className="h-4 w-4" /> Configuración</h2>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Umbral de confianza ({Math.round(thr * 100)}%)</label>
        <Slider value={[thr * 100]} onValueChange={([v]) => setThr(v / 100)} min={50} max={99} step={1} className="mt-2" />
        <Button size="sm" onClick={save} className="mt-3 w-full">Guardar umbral</Button>
      </div>
      <div className="border-t pt-4">
        <Button variant="outline" className="w-full" onClick={calibrate} disabled={fridge.status === "offline"}>
          <RefreshCw className="h-3.5 w-3.5" /> Re-calibrar balanza
        </Button>
      </div>
    </div>
  );
}

function ShelvesPanel({ fridge, products }: { fridge: any; products: any[] }) {
  const qc = useQueryClient();
  async function add() { const idx = (fridge.shelves.at(-1)?.index || 0) + 1; await addShelf(fridge.id, idx); qc.invalidateQueries({ queryKey: ["fridge", fridge.id] }); }
  async function del(sid: string) { await removeShelf(sid); qc.invalidateQueries({ queryKey: ["fridge", fridge.id] }); }
  async function addPg(sid: string, pid: string, qty: number) { await addPlanogram(sid, pid, qty); qc.invalidateQueries({ queryKey: ["fridge", fridge.id] }); }
  async function delPg(eid: string) { await removePlanogram(eid); qc.invalidateQueries({ queryKey: ["fridge", fridge.id] }); }

  return (
    <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold flex items-center gap-2"><Layers className="h-4 w-4" /> Estantes & Planograma</h2>
        <Button size="sm" variant="outline" onClick={add}><Plus className="h-3.5 w-3.5" /> Agregar estante</Button>
      </div>
      <div className="space-y-3">
        {fridge.shelves.map((s: any) => (
          <div key={s.id} className="rounded-2xl border bg-background p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">Estante {s.index} {s.label && <span className="text-muted-foreground">· {s.label}</span>}</span>
              <button onClick={() => del(s.id)} className="text-destructive hover:bg-destructive/10 p-1 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            <ul className="space-y-1">
              {s.planogram.map((pg: any) => (
                <li key={pg.id} className="flex items-center justify-between text-sm py-1">
                  <span>{pg.productName} <span className="text-muted-foreground text-xs">· {pg.expectedQty} esperados · {pg.weightG}g</span></span>
                  <button onClick={() => delPg(pg.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                </li>
              ))}
            </ul>
            <PlanogramAdder products={products} onAdd={(pid, qty) => addPg(s.id, pid, qty)} />
          </div>
        ))}
      </div>
    </section>
  );
}

function PlanogramAdder({ products, onAdd }: { products: any[]; onAdd: (pid: string, qty: number) => void }) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost" className="mt-2 w-full justify-start text-muted-foreground"><Plus className="h-3.5 w-3.5" /> Agregar producto al planograma</Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 rounded-2xl pointer-events-auto">
        <div className="p-2 flex gap-1 items-center border-b">
          <span className="text-xs text-muted-foreground px-1">Cant:</span>
          <Input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value))} className="h-7 w-16" />
        </div>
        <Command>
          <CommandInput placeholder="Buscar…" />
          <CommandList>
            <CommandEmpty>Sin resultados</CommandEmpty>
            <CommandGroup>
              {products.map(p => (
                <CommandItem key={p.id} value={p.name} onSelect={() => { onAdd(p.id, qty); setOpen(false); setQty(1); }}>
                  <img src={p.imageUrl} alt="" className="size-7 rounded mr-2" />
                  <span className="text-sm">{p.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
