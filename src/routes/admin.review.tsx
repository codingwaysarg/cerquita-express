import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getReviewQueue } from "@/lib/admin/api/client";
import { QueryBoundary } from "@/components/admin/primitives/QueryBoundary";
import { ConfidenceBar } from "@/components/admin/primitives/ConfidenceBar";
import { StatusPill } from "@/components/admin/primitives/StatusPill";
import { relTime } from "@/lib/admin/format";

export const Route = createFileRoute("/admin/review")({ component: ReviewPage });

function ReviewPage() {
  const q = useQuery({ queryKey: ["review-queue"], queryFn: () => getReviewQueue(), refetchInterval: 10000 });
  return (
    <div className="space-y-4">
      <header><h1 className="text-2xl font-semibold">Cola de revisión</h1><p className="text-sm text-muted-foreground">Transacciones con baja confianza que requieren revisión manual.</p></header>
      <QueryBoundary query={q} isEmpty={d => d.length === 0} emptyTitle="Cola vacía" emptyDescription="Todo procesado ✓">
        {(data) => (
          <ul className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {data.map(item => (
              <li key={item.transactionId}>
                <Link to="/admin/transactions/$id" params={{ id: item.transactionId }} className="block rounded-2xl border bg-card p-4 hover:shadow-soft transition">
                  <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{item.fridgeName}</span><span>{relTime(item.createdAt)}</span></div>
                  <div className="mt-1 font-mono text-sm">{item.transactionId.slice(0,18)}…</div>
                  <div className="mt-2 flex items-center gap-2"><StatusPill variant="needs_review" /><span className="text-sm">{item.topProduct}</span></div>
                  <div className="mt-2"><ConfidenceBar value={item.topConfidence} /></div>
                  <div className="mt-2 text-xs text-muted-foreground">{item.itemsCount} ítems · {item.cropsCount} crops</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </QueryBoundary>
    </div>
  );
}
