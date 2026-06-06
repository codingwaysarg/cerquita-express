import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getProducts, createProduct } from "@/lib/admin/api/client";
import { QueryBoundary } from "@/components/admin/primitives/QueryBoundary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { fmtARS, relTime } from "@/lib/admin/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/products")({ component: Products });

function Products() {
  const [q, setQ] = useState("");
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["products", q], queryFn: () => getProducts(q) });
  const [openNew, setOpenNew] = useState(false);
  const [draft, setDraft] = useState({ name: "", price: 0, sku: "" });

  async function create() {
    if (!draft.name || !draft.price) return toast.error("Nombre y precio requeridos");
    await createProduct(draft);
    toast.success("Producto creado");
    setOpenNew(false); setDraft({ name: "", price: 0, sku: "" });
    qc.invalidateQueries({ queryKey: ["products"] });
  }

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Catálogo</h1>
          <p className="text-sm text-muted-foreground">Productos vendidos en las heladeras + estado de entrenamiento.</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar producto…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 w-64 rounded-full" />
          </div>
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Nuevo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo producto</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Nombre" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                <Input placeholder="SKU" value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} />
                <Input type="number" placeholder="Precio" value={draft.price || ""} onChange={(e) => setDraft({ ...draft, price: +e.target.value })} />
                <Button onClick={create} className="w-full">Crear</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <QueryBoundary query={query} isEmpty={d => d.length === 0} emptyTitle="Sin productos">
        {(data) => (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {data.map(p => (
              <li key={p.id}>
                <Link to="/admin/products/$id" params={{ id: p.id }} className="block rounded-3xl border border-border/60 bg-card p-4 shadow-soft hover:border-primary transition">
                  <div className="flex gap-3">
                    <img src={p.imageUrl} alt="" className="size-16 rounded-2xl object-cover border shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.sku}</div>
                      <div className="mt-1 text-sm font-medium tabular-nums">{fmtARS(p.price)}</div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-muted p-2"><div className="text-muted-foreground">Embeddings</div><div className="font-semibold">{p.embeddingCount}</div></div>
                    <div className="rounded-xl bg-muted p-2"><div className="text-muted-foreground">Imágenes</div><div className="font-semibold">{p.imageCount}</div></div>
                  </div>
                  {p.lastTrainedAt && <div className="mt-2 text-[11px] text-muted-foreground">Entrenado {relTime(p.lastTrainedAt)}</div>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </QueryBoundary>
    </div>
  );
}
