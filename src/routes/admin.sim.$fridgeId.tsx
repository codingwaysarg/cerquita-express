import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  simUnlock, getSimSession, simWeightDelta, simForceClose, simSnapshot,
  simAssignSnapshot, getFridge, getProducts,
} from "@/lib/admin/api/client";
import { QueryBoundary } from "@/components/admin/primitives/QueryBoundary";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Unlock, Camera, Minus, Plus, Power, Zap } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem, CommandGroup, CommandEmpty } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { relTime } from "@/lib/admin/format";

export const Route = createFileRoute("/admin/sim/$fridgeId")({ component: SimPlay });

function SimPlay() {
  const { fridgeId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fridge = useQuery({ queryKey: ["fridge", fridgeId], queryFn: () => getFridge(fridgeId) });
  const session = useQuery({ queryKey: ["sim-session", fridgeId], queryFn: () => getSimSession(fridgeId), refetchInterval: 1500 });
  const products = useQuery({ queryKey: ["products-all"], queryFn: () => getProducts() });

  async function unlock() {
    await simUnlock(fridgeId);
    toast.success("Sesión iniciada");
    qc.invalidateQueries({ queryKey: ["sim-session", fridgeId] });
  }
  async function close() {
    if (!session.data?.id) return;
    await simForceClose(session.data.id);
    toast.info("Cerrando puerta…");
  }
  async function delta(shelf: number, g: number) {
    if (!session.data?.id) return;
    await simWeightDelta(session.data.id, shelf, g);
    qc.invalidateQueries({ queryKey: ["sim-session", fridgeId] });
  }
  async function snap() {
    await simSnapshot(fridgeId);
    toast.success("Snapshot capturado");
  }

  const s = session.data;
  const stateColor: Record<string, string> = {
    idle: "bg-zinc-400", connecting: "bg-amber-500", warming: "bg-amber-500",
    ready: "bg-emerald-500", open: "bg-cyan-500", closing: "bg-amber-500",
    inferring: "bg-primary", done: "bg-emerald-500",
  };

  return (
    <div className="space-y-5">
      <button onClick={() => navigate({ to: "/admin/sim" })} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-3.5 w-3.5" /> Simulador
      </button>
      <QueryBoundary query={fridge}>
        {(f) => (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 space-y-5">
              <header className="rounded-3xl border border-border/60 bg-gradient-card text-primary-foreground p-5 shadow-soft">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="text-xs opacity-80">Simulando</div>
                    <h1 className="text-2xl font-semibold">{f.name}</h1>
                    <div className="text-xs opacity-80 mt-1">{f.location}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!s || s.state === "done" ? (
                      <Button variant="secondary" onClick={unlock}><Unlock className="h-4 w-4" /> Iniciar sesión</Button>
                    ) : (
                      <Button variant="secondary" onClick={close} disabled={s.state === "closing" || s.state === "inferring"}><Power className="h-4 w-4" /> Cerrar puerta</Button>
                    )}
                  </div>
                </div>
                {s && (
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <span className={cn("h-2.5 w-2.5 rounded-full", stateColor[s.state], (s.state === "inferring" || s.state === "open") && "pulse-dot")} />
                    Estado: <span className="font-semibold">{s.state}</span>
                    <span className="opacity-70">· iniciada {relTime(s.startedAt)}</span>
                  </div>
                )}
              </header>

              <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
                <h2 className="font-semibold mb-3 flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /> Δ peso por estante</h2>
                <div className="space-y-2">
                  {f.shelves.map((sh: any) => (
                    <div key={sh.id} className="rounded-2xl border bg-background p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Shelf {sh.index} {sh.label && <span className="text-muted-foreground text-xs">· {sh.label}</span>}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[-1000, -500, -200, -50, +50, +200].map(g => (
                          <button key={g} disabled={!s || s.state === "done"} onClick={() => delta(sh.index, g)}
                            className={cn("rounded-full border px-3 py-1 text-xs font-mono transition disabled:opacity-30",
                              g < 0 ? "hover:border-destructive hover:text-destructive" : "hover:border-emerald-500 hover:text-emerald-600")}>
                            {g > 0 ? "+" : ""}{g}g
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <SnapshotsPanel fridgeId={fridgeId} onSnap={snap} products={products.data || []} />
            </div>

            <aside>
              <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft sticky top-20">
                <h2 className="font-semibold mb-3">Muestras de la sesión</h2>
                {s?.samples.length ? (
                  <ul className="space-y-1 max-h-96 overflow-y-auto font-mono text-xs">
                    {s.samples.slice().reverse().map((sm, i) => (
                      <li key={i} className="flex justify-between border-b border-dashed pb-1">
                        <span>shelf {sm.shelfIndex} · t={sm.tSec}s</span>
                        <span className={sm.deltaG < 0 ? "text-destructive" : "text-emerald-600"}>{sm.deltaG > 0 ? "+" : ""}{sm.deltaG}g</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Iniciá una sesión y aplicá deltas para ver muestras.</p>
                )}
              </div>
            </aside>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}

function SnapshotsPanel({ fridgeId, onSnap, products }: { fridgeId: string; onSnap: () => void; products: any[] }) {
  const qc = useQueryClient();
  const [train, setTrain] = useState(true);
  // Fetch snapshots from store via a poll — using a tiny re-fetch trick
  const snapshotsQ = useQuery({
    queryKey: ["sim-snapshots", fridgeId],
    queryFn: async () => {
      const { getDB } = await import("@/lib/admin/mock/db");
      return [...getDB().snapshots].reverse().slice(0, 12);
    },
    refetchInterval: 2000,
  });

  async function assign(snapId: string, pid: string) {
    await simAssignSnapshot(snapId, pid, train);
    toast.success(train ? "Asignado y enviado a entrenar" : "Snapshot asignado");
    qc.invalidateQueries({ queryKey: ["sim-snapshots", fridgeId] });
  }

  return (
    <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold flex items-center gap-2"><Camera className="h-4 w-4" /> Snapshots</h2>
        <div className="flex items-center gap-3">
          <label className="text-xs inline-flex items-center gap-2"><Checkbox checked={train} onCheckedChange={(c) => setTrain(!!c)} /> Entrenar al asignar</label>
          <Button size="sm" variant="outline" onClick={onSnap}><Camera className="h-3.5 w-3.5" /> Capturar</Button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {snapshotsQ.data?.map(s => (
          <div key={s.id} className={cn("rounded-2xl border overflow-hidden", s.isNew && "border-primary border-2")}>
            <div className="bg-black aspect-square"><img src={s.top} alt="" className="w-full h-full object-cover" /></div>
            <div className="p-2">
              <PickerBtn products={products} onPick={(pid) => assign(s.id, pid)} current={s.productId} />
            </div>
          </div>
        ))}
        {(!snapshotsQ.data || snapshotsQ.data.length === 0) && (
          <div className="col-span-full text-sm text-muted-foreground text-center py-6">Sin snapshots. Capturá uno para empezar.</div>
        )}
      </div>
    </section>
  );
}

function PickerBtn({ products, onPick, current }: { products: any[]; onPick: (pid: string) => void; current?: string }) {
  const [open, setOpen] = useState(false);
  const cur = products.find(p => p.id === current);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-full text-left text-xs rounded-lg border px-2 py-1 hover:bg-muted truncate">{cur?.name || "Asignar producto…"}</button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 rounded-2xl pointer-events-auto">
        <Command>
          <CommandInput placeholder="Buscar…" />
          <CommandList>
            <CommandEmpty>Sin resultados</CommandEmpty>
            <CommandGroup>
              {products.map(p => (
                <CommandItem key={p.id} value={p.name} onSelect={() => { onPick(p.id); setOpen(false); }}>
                  <img src={p.imageUrl} alt="" className="size-6 rounded mr-2" />
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
