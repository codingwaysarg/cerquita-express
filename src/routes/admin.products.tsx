import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/lib/admin/api/client";
import { QueryBoundary } from "@/components/admin/primitives/QueryBoundary";
import { TrainingPill } from "@/components/admin/primitives/TrainingPill";
import { fmtARS } from "@/lib/admin/format";

export const Route = createFileRoute("/admin/products")({ component: Products });

function Products() {
  const q = useQuery({ queryKey: ["products"], queryFn: () => getProducts() });
  return (
    <div className="space-y-4">
      <header className="flex justify-between items-end"><div><h1 className="text-2xl font-semibold">Productos</h1><p className="text-sm text-muted-foreground">Catálogo de productos del fleet.</p></div></header>
      <QueryBoundary query={q} isEmpty={d => d.length === 0} emptyTitle="Aún no hay productos">
        {(data) => (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {data.map(p => (
              <Link key={p.id} to="/admin/products/$id" params={{ id: p.id }} className="rounded-2xl border bg-card overflow-hidden hover:shadow-soft transition">
                <div className="aspect-square bg-muted"><img src={p.imageUrl} alt={p.name} className="size-full object-cover" /></div>
                <div className="p-3 space-y-1">
                  <div className="flex items-start justify-between gap-2"><div className="text-sm font-medium leading-tight">{p.name}</div></div>
                  <TrainingPill embeddingCount={p.embeddingCount} />
                  <div className="text-sm tabular-nums">{fmtARS(p.price)}</div>
                  <div className="text-[11px] text-muted-foreground">{p.embeddingCount} embeddings · {p.imageCount} fotos</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
