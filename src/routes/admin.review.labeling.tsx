import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getReviewQueue } from "@/lib/admin/api/client";
import { QueryBoundary } from "@/components/admin/primitives/QueryBoundary";
import { ConfidenceBar } from "@/components/admin/primitives/ConfidenceBar";
import { relTime } from "@/lib/admin/format";
import { Tag } from "lucide-react";

export const Route = createFileRoute("/admin/review/labeling")({ component: Labeling });

function Labeling() {
  const q = useQuery({ queryKey: ["review-labeling"], queryFn: () => getReviewQueue({ limit: 80 }) });
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2"><Tag className="h-5 w-5 text-primary" /> Etiquetado de crops</h1>
        <p className="text-sm text-muted-foreground">Active learning: etiquetá crops dudosos para mejorar el modelo.</p>
      </header>
      <QueryBoundary query={q} isEmpty={d => d.length === 0} emptyTitle="No hay crops para etiquetar" emptyDescription="El modelo está confiado en todo lo reciente.">
        {(data) => (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.map(t => (
              <li key={t.transactionId}>
                <Link to="/admin/review/label/$transactionId" params={{ transactionId: t.transactionId }} className="block rounded-3xl border border-border/60 bg-card p-4 shadow-soft hover:border-primary transition">
                  <div className="flex items-center gap-3">
                    {t.thumbnailUrl && <img src={t.thumbnailUrl} alt="" className="size-14 rounded-2xl object-cover border" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground">{t.fridgeName} · {relTime(t.createdAt)}</div>
                      <div className="font-medium truncate">{t.topProduct}</div>
                      <div className="text-xs text-muted-foreground">{t.cropsCount} crops · {t.itemsCount} items</div>
                    </div>
                  </div>
                  <div className="mt-2"><ConfidenceBar value={t.topConfidence} /></div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </QueryBoundary>
    </div>
  );
}
