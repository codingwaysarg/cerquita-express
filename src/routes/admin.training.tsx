import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getTrainingJobs } from "@/lib/admin/api/client";
import { QueryBoundary } from "@/components/admin/primitives/QueryBoundary";
import { StatusPill } from "@/components/admin/primitives/StatusPill";
import { relTime } from "@/lib/admin/format";

export const Route = createFileRoute("/admin/training")({ component: Training });
function Training() {
  const q = useQuery({ queryKey: ["jobs"], queryFn: () => getTrainingJobs(), refetchInterval: 5000 });
  return (
    <div className="space-y-4">
      <header><h1 className="text-2xl font-semibold">Entrenamiento</h1><p className="text-sm text-muted-foreground">Trabajos de entrenamiento del modelo.</p></header>
      <QueryBoundary query={{ data: q.data?.items, isLoading: q.isLoading, isError: q.isError, refetch: q.refetch }} isEmpty={d => !d?.length} emptyTitle="Aún no hay trabajos de entrenamiento">
        {(items) => (
          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50"><tr><th className="text-left p-3">ID</th><th className="text-left p-3">Productos</th><th className="text-left p-3">Estado</th><th className="text-left p-3">Épocas</th><th className="text-left p-3">Iniciado</th></tr></thead>
              <tbody>{items.map(j => (
                <tr key={j.id} className="border-t"><td className="p-3 font-mono">{j.id.slice(-8)}</td><td className="p-3">{j.productIds.length} producto(s)</td><td className="p-3"><StatusPill variant={`job_${j.status}` as any} /></td><td className="p-3">{j.epochs}</td><td className="p-3 text-muted-foreground">{relTime(j.startedAt)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
