import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  getTransaction, getProducts, correctItem, waiveItem, addItem, approveItem,
  bulkReview, resolveDispute, resolveReturn, getVideoUrl,
} from "@/lib/admin/api/client";
import type { TxItem, Product } from "@/lib/admin/types";
import { QueryBoundary } from "@/components/admin/primitives/QueryBoundary";
import { StatusPill, txVariant } from "@/components/admin/primitives/StatusPill";
import { ConfidenceBar } from "@/components/admin/primitives/ConfidenceBar";
import { Button } from "@/components/ui/button";
import { fmtARS, fmtDateTime, shortId } from "@/lib/admin/format";
import {
  ArrowLeft, Play, Pause, ChevronsUpDown, Check, Plus, Minus, Trash2,
  AlertTriangle, RotateCcw, ImageIcon, Video as VideoIcon, X,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/transactions/$id")({ component: TxDetail });

type Change =
  | { kind: "correct"; itemId: string; productId: string; quantity?: number; productName: string }
  | { kind: "qty"; itemId: string; quantity: number }
  | { kind: "waive"; itemId: string }
  | { kind: "add"; productId: string; quantity: number; productName: string };

function TxDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["tx", id], queryFn: () => getTransaction(id) });
  const productsQ = useQuery({ queryKey: ["products-all"], queryFn: () => getProducts() });
  const [queue, setQueue] = useState<Change[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);

  async function commitAll() {
    if (!queue.length) return;
    setCommitting(true);
    try {
      for (const c of queue) {
        if (c.kind === "correct") await correctItem(id, c.itemId, c.productId, c.quantity);
        else if (c.kind === "qty") {
          const it = q.data?.items.find(i => i.id === c.itemId);
          if (it) await correctItem(id, c.itemId, it.productId, c.quantity);
        }
        else if (c.kind === "waive") await waiveItem(id, c.itemId);
        else if (c.kind === "add") await addItem(id, c.productId, c.quantity);
      }
      toast.success(`${queue.length} cambios aplicados`);
      setQueue([]);
      qc.invalidateQueries({ queryKey: ["tx", id] });
    } catch (e: any) {
      toast.error(e?.message || "Error al aplicar");
    } finally {
      setCommitting(false);
    }
  }

  async function markReviewed() {
    await bulkReview([id]);
    toast.success("Marcada como revisada");
    qc.invalidateQueries({ queryKey: ["tx", id] });
  }

  return (
    <div className="space-y-5">
      <button onClick={() => navigate({ to: "/admin/transactions" })} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-3.5 w-3.5" /> Transacciones
      </button>

      <QueryBoundary query={q}>
        {(t) => (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {/* LEFT: video + crops */}
            <div className="xl:col-span-2 space-y-5">
              <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-xs text-muted-foreground">{fmtDateTime(t.createdAt)}</div>
                    <h1 className="text-xl font-semibold font-mono">{shortId(t.id, 16)}</h1>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <StatusPill variant={txVariant(t.status)} />
                      {t.needsReview && <StatusPill variant="needs_review" />}
                      <span className="text-xs text-muted-foreground">· {t.fridgeName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="text-2xl font-semibold tabular-nums">{fmtARS(t.total)}</div>
                    {t.confidence != null && <div className="w-32 mt-1"><ConfidenceBar value={t.confidence} /></div>}
                  </div>
                </div>
              </div>

              <VideoPlayer txId={t.id} hasTop={!!t.videoTop} hasSide={!!t.videoSide} />

              <CropsGrid crops={t.crops || []} onOpen={(url) => setLightbox(url)} />

              {t.events && t.events.length > 0 && (
                <EventsPanel txId={t.id} events={t.events} products={productsQ.data || []} />
              )}

              <PipelinePanel tx={t} />
            </div>

            {/* RIGHT: items + commit queue */}
            <div className="space-y-4">
              <div className="rounded-3xl border border-border/60 bg-card shadow-soft sticky top-20">
                <div className="p-4 border-b flex items-center justify-between">
                  <h2 className="font-semibold">Items detectados</h2>
                  {!t.needsReview ? null : (
                    <Button size="sm" variant="ghost" onClick={markReviewed}><Check className="h-3.5 w-3.5" /> Aprobar todo</Button>
                  )}
                </div>
                <ul className="divide-y max-h-[40vh] overflow-y-auto">
                  {t.items.map(it => (
                    <ItemRow
                      key={it.id}
                      item={it}
                      products={productsQ.data || []}
                      queue={queue}
                      onCorrect={(pid, name) => setQueue(q => [...q, { kind: "correct", itemId: it.id, productId: pid, productName: name }])}
                      onQty={(quantity) => setQueue(q => [...q, { kind: "qty", itemId: it.id, quantity }])}
                      onWaive={() => setQueue(q => [...q, { kind: "waive", itemId: it.id }])}
                      onApprove={async () => { await approveItem(t.id, it.id); qc.invalidateQueries({ queryKey: ["tx", id] }); }}
                    />
                  ))}
                </ul>
                <div className="p-3 border-t">
                  <AddItemControl products={productsQ.data || []} onAdd={(pid, name, qty) => setQueue(q => [...q, { kind: "add", productId: pid, quantity: qty, productName: name }])} />
                </div>
              </div>

              {queue.length > 0 && (
                <div className="rounded-3xl border-2 border-primary/40 bg-gradient-card text-primary-foreground p-4 shadow-soft sticky bottom-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{queue.length} cambios pendientes</span>
                    <button onClick={() => setQueue([])} className="text-xs underline opacity-80 hover:opacity-100">Descartar</button>
                  </div>
                  <ul className="mt-2 text-xs space-y-1 max-h-32 overflow-y-auto opacity-90">
                    {queue.map((c, i) => (
                      <li key={i} className="truncate">
                        {c.kind === "correct" && `→ Reemplazar por ${c.productName}`}
                        {c.kind === "qty" && `→ Cantidad: ${c.quantity}`}
                        {c.kind === "waive" && `→ Quitar item`}
                        {c.kind === "add" && `+ Agregar ${c.quantity}× ${c.productName}`}
                      </li>
                    ))}
                  </ul>
                  <Button onClick={commitAll} disabled={committing} variant="secondary" className="w-full mt-3">
                    {committing ? "Aplicando…" : `Aplicar ${queue.length} cambios`}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </QueryBoundary>

      {lightbox && (
        <button onClick={() => setLightbox(null)} className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-8">
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-2xl" />
          <X className="absolute top-4 right-4 h-6 w-6 text-white" />
        </button>
      )}
    </div>
  );
}

function VideoPlayer({ txId, hasTop, hasSide }: { txId: string; hasTop: boolean; hasSide: boolean }) {
  const [view, setView] = useState<"combined" | "top" | "side" | "dual">("combined");
  const q = useQuery({
    queryKey: ["tx-video", txId, view === "dual" ? "top" : view],
    queryFn: () => getVideoUrl(txId, view === "dual" ? "top" : view as any),
  });
  const sideQ = useQuery({ queryKey: ["tx-video", txId, "side"], queryFn: () => getVideoUrl(txId, "side"), enabled: view === "dual" });

  return (
    <div className="rounded-3xl border border-border/60 bg-card shadow-soft overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-primary/10 text-primary grid place-items-center"><VideoIcon className="size-4" /></div>
          <h2 className="font-semibold">Sesión de cámara</h2>
        </div>
        <div className="flex gap-0.5 rounded-full border p-0.5 text-xs">
          {(["combined","top","side","dual"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} disabled={(v==="top"||v==="dual")&&!hasTop || v==="side"&&!hasSide}
              className={cn("px-3 py-1 rounded-full transition", view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground disabled:opacity-30")}>
              {v === "combined" ? "Combinado" : v === "top" ? "Top" : v === "side" ? "Side" : "Dual"}
            </button>
          ))}
        </div>
      </div>
      <div className={cn("bg-black aspect-video", view === "dual" && "grid grid-cols-2 gap-px")}>
        {q.data?.url ? (
          <video src={q.data.url} controls playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="grid place-items-center text-muted-foreground text-sm h-full">Video no disponible aún</div>
        )}
        {view === "dual" && sideQ.data?.url && (
          <video src={sideQ.data.url} controls playsInline className="w-full h-full object-cover" />
        )}
      </div>
    </div>
  );
}

function CropsGrid({ crops, onOpen }: { crops: any[]; onOpen: (url: string) => void }) {
  if (!crops.length) return null;
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
      <h2 className="font-semibold mb-3 flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Crops detectados ({crops.length})</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {crops.map(c => (
          <button key={c.id} onClick={() => onOpen(c.url)} className="group relative rounded-2xl overflow-hidden border border-border/60 hover:border-primary transition">
            <img src={c.url} alt={c.productName} className="aspect-square object-cover w-full" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
              <div className="text-[10px] text-white truncate font-medium">{c.productName}</div>
              <div className="text-[9px] text-white/70">{Math.round((c.confidence || 0) * 100)}% · {c.source}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function EventsPanel({ txId, events, products }: { txId: string; events: any[]; products: Product[] }) {
  const qc = useQueryClient();
  return (
    <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-soft">
      <h2 className="font-semibold mb-3 flex items-center gap-2 text-amber-700 dark:text-amber-300">
        <AlertTriangle className="h-4 w-4" /> Eventos del pipeline ({events.length})
      </h2>
      <ul className="space-y-2">
        {events.map(ev => (
          <li key={ev.id} className="rounded-2xl bg-card border p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium capitalize">{ev.type} · {ev.source}</span>
              <span className="text-xs text-muted-foreground">{ev.windowFromSec.toFixed(1)}s → {ev.windowToSec.toFixed(1)}s</span>
            </div>
            {ev.type === "dispute" && ev.candidates && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {ev.candidates.map((c: any) => (
                  <button key={c.productId} disabled={ev.resolved}
                    onClick={async () => { await resolveDispute(txId, ev.id, "confirm", c.productId); toast.success("Confirmado"); qc.invalidateQueries({ queryKey: ["tx", txId] }); }}
                    className="text-xs px-2 py-1 rounded-full border bg-background hover:bg-primary hover:text-primary-foreground transition disabled:opacity-50">
                    {c.productName} · {Math.round(c.cameraConfidence * 100)}%
                  </button>
                ))}
                <button disabled={ev.resolved} onClick={async () => { await resolveDispute(txId, ev.id, "reject"); qc.invalidateQueries({ queryKey: ["tx", txId] }); }}
                  className="text-xs px-2 py-1 rounded-full border bg-background hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50">Descartar</button>
              </div>
            )}
            {ev.type === "return" && (
              <Button size="sm" variant="outline" disabled={ev.resolved} onClick={async () => { await resolveReturn(txId, ev.id); qc.invalidateQueries({ queryKey: ["tx", txId] }); }}>
                Confirmar devolución
              </Button>
            )}
            {ev.resolved && <span className="text-xs text-emerald-600 ml-2">✓ Resuelto</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PipelinePanel({ tx }: { tx: any }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
      <h2 className="font-semibold mb-3">Pipeline & metadata</h2>
      <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Field label="Inferencia" value={tx.inference} />
        <Field label="FPS" value={tx.frameFps} />
        <Field label="Procesado en" value={tx.processedInSec ? `${tx.processedInSec.toFixed(1)}s` : "—"} />
        <Field label="Tier de cobro" value={`T${tx.chargeTier}`} />
        <Field label="Detector" value={`v${tx.modelVersions?.detector}`} />
        <Field label="Embedder" value={`v${tx.modelVersions?.embedder}`} />
        <Field label="Head" value={`v${tx.modelVersions?.head}`} />
        <Field label="Cliente" value={tx.customer?.phone || "—"} />
      </dl>
      {tx.scaleDeltas && (
        <div className="mt-4">
          <div className="text-xs text-muted-foreground mb-1">Δ peso por shelf</div>
          <div className="flex flex-wrap gap-2">
            {tx.scaleDeltas.map((d: any, i: number) => (
              <span key={i} className="text-xs rounded-full bg-muted px-2.5 py-1 font-mono">shelf {d.shelfIndex}: {d.deltaG > 0 ? "+" : ""}{d.deltaG}g</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value ?? "—"}</dd>
    </div>
  );
}

function ItemRow({ item, products, queue, onCorrect, onQty, onWaive, onApprove }: {
  item: TxItem; products: Product[]; queue: Change[];
  onCorrect: (pid: string, name: string) => void; onQty: (q: number) => void; onWaive: () => void; onApprove: () => void;
}) {
  const isQueued = queue.some(c => "itemId" in c && c.itemId === item.id);
  const needs = item.confidence < 0.78 && !item.reviewed;
  return (
    <li className={cn("p-3 transition", isQueued && "bg-primary/5", needs && !isQueued && "bg-amber-500/5")}>
      <div className="flex items-start gap-3">
        <img src={item.productImageUrl} alt="" className="size-12 rounded-xl object-cover shrink-0 border" />
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate text-sm">{item.productName}</div>
          <div className="text-xs text-muted-foreground">{item.quantity} × {fmtARS(item.unitPrice)} · {Math.round(item.confidence * 100)}%</div>
          <div className="mt-1.5"><ConfidenceBar value={item.confidence} /></div>
        </div>
        <div className="text-sm font-semibold tabular-nums shrink-0">{fmtARS(item.quantity * item.unitPrice)}</div>
      </div>
      <div className="flex items-center gap-1 mt-2 flex-wrap">
        <ProductPicker products={products} onPick={(p) => onCorrect(p.id, p.name)} trigger={<Button size="sm" variant="outline" className="h-7 text-xs rounded-full"><RotateCcw className="h-3 w-3" /> Reemplazar</Button>} />
        <div className="inline-flex items-center rounded-full border h-7">
          <button onClick={() => onQty(Math.max(1, item.quantity - 1))} className="h-7 w-7 grid place-items-center hover:bg-muted rounded-l-full"><Minus className="h-3 w-3" /></button>
          <span className="px-2 text-xs tabular-nums">{item.quantity}</span>
          <button onClick={() => onQty(item.quantity + 1)} className="h-7 w-7 grid place-items-center hover:bg-muted rounded-r-full"><Plus className="h-3 w-3" /></button>
        </div>
        <Button size="sm" variant="ghost" className="h-7 text-xs rounded-full text-destructive hover:text-destructive" onClick={onWaive}><Trash2 className="h-3 w-3" /></Button>
        {needs && <Button size="sm" variant="ghost" className="h-7 text-xs rounded-full text-emerald-600 ml-auto" onClick={onApprove}><Check className="h-3 w-3" /> OK</Button>}
      </div>
    </li>
  );
}

function ProductPicker({ products, onPick, trigger }: { products: Product[]; onPick: (p: Product) => void; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-72 p-0 rounded-2xl pointer-events-auto" align="start">
        <Command>
          <CommandInput placeholder="Buscar producto…" />
          <CommandList>
            <CommandEmpty>Sin resultados</CommandEmpty>
            <CommandGroup>
              {products.map(p => (
                <CommandItem key={p.id} value={`${p.name} ${p.sku || ""}`} onSelect={() => { onPick(p); setOpen(false); }}>
                  <img src={p.imageUrl} alt="" className="size-8 rounded-lg object-cover mr-2" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground">{p.sku} · {fmtARS(p.price)}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function AddItemControl({ products, onAdd }: { products: Product[]; onAdd: (pid: string, name: string, qty: number) => void }) {
  return (
    <ProductPicker products={products} onPick={(p) => onAdd(p.id, p.name, 1)} trigger={
      <Button variant="outline" className="w-full rounded-2xl border-dashed">
        <Plus className="h-4 w-4" /> Agregar item
      </Button>
    } />
  );
}
