import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getTransaction, getProducts, submitLabel } from "@/lib/admin/api/client";
import { QueryBoundary } from "@/components/admin/primitives/QueryBoundary";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, X, HelpCircle, Crop } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem, CommandGroup, CommandEmpty } from "@/components/ui/command";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/review/label/$transactionId")({ component: LabelTx });

function LabelTx() {
  const { transactionId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["tx", transactionId], queryFn: () => getTransaction(transactionId) });
  const productsQ = useQuery({ queryKey: ["products-all"], queryFn: () => getProducts() });
  const [labeled, setLabeled] = useState<Record<string, string>>({}); // crop id → decision/product

  async function decide(cropId: string, decision: "label" | "not_product" | "unclear" | "bbox_wrong", productId?: string) {
    await submitLabel({ transaction_crop_id: cropId, decision, product_id: productId });
    setLabeled(prev => ({ ...prev, [cropId]: productId || decision }));
  }
  async function finish() {
    await submitLabel({ transaction_crop_id: "_", decision: "label", mark_transaction_reviewed: true, transactionId });
    toast.success("Tx marcada como revisada");
    qc.invalidateQueries({ queryKey: ["review-labeling"] });
    navigate({ to: "/admin/review/labeling" });
  }

  return (
    <div className="space-y-5">
      <button onClick={() => navigate({ to: "/admin/review/labeling" })} className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Cola de etiquetado
      </button>

      <QueryBoundary query={q}>
        {(t) => (
          <div className="space-y-5">
            <header className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft flex items-start justify-between">
              <div>
                <h1 className="text-xl font-semibold flex items-center gap-2"><Crop className="h-5 w-5 text-primary" /> Etiquetar crops</h1>
                <p className="text-sm text-muted-foreground">{t.fridgeName} · {t.crops?.length || 0} crops · {Object.keys(labeled).length} marcados</p>
              </div>
              <Button onClick={finish}>
                <Check className="h-4 w-4" /> Finalizar revisión
              </Button>
            </header>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {(t.crops || []).map(c => {
                const status = labeled[c.id];
                return (
                  <div key={c.id} className={cn("rounded-3xl border-2 bg-card overflow-hidden shadow-soft transition", status ? "border-emerald-500" : "border-border/60")}>
                    <div className="relative bg-black aspect-square">
                      <img src={c.url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 text-[10px] rounded-full bg-black/70 text-white px-2 py-0.5">{c.source} · f{c.frame}</div>
                      {status && <div className="absolute top-2 right-2 rounded-full bg-emerald-500 text-white p-1"><Check className="h-3 w-3" /></div>}
                    </div>
                    <div className="p-2 space-y-1">
                      <div className="text-xs truncate text-muted-foreground">Sugerido: {c.productName} ({Math.round((c.confidence||0)*100)}%)</div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => c.productName && productsQ.data && decide(c.id, "label", productsQ.data.find(p => p.name === c.productName)?.id)}>
                          <Check className="h-3 w-3" /> OK
                        </Button>
                        <PickerBtn onPick={(pid) => decide(c.id, "label", pid)} products={productsQ.data || []} />
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="flex-1 h-6 text-[10px]" onClick={() => decide(c.id, "not_product")}><X className="h-3 w-3" />No es producto</Button>
                        <Button size="sm" variant="ghost" className="flex-1 h-6 text-[10px]" onClick={() => decide(c.id, "unclear")}><HelpCircle className="h-3 w-3" />Dudoso</Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}

function PickerBtn({ products, onPick }: { products: any[]; onPick: (pid: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-xs px-2">Otro</Button>
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
