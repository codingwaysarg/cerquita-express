import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useStore } from "@/lib/mock/store";
import type { Transaction, TxStatus } from "@/lib/mock/types";
import { Receipt, ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_main/historial")({
  component: HistorialPage,
});

const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const STATUS_META: Record<TxStatus, { label: string; cls: string }> = {
  completed: { label: "Completada", cls: "bg-success/10 text-success" },
  in_review: { label: "En revisión", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  adjusted: { label: "Ajustada", cls: "bg-primary/10 text-primary" },
  cancelled: { label: "Cancelada", cls: "bg-destructive/10 text-destructive" },
};

export function txTotal(tx: Transaction) {
  return tx.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
}

function formatDateTime(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const isYest = d.toDateString() === yest.toDateString();
  const time = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `Hoy · ${time}`;
  if (isYest) return `Ayer · ${time}`;
  return `${d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" })} · ${time}`;
}

function HistorialPage() {
  const txs = useStore((s) => s.transactions);

  return (
    <>
      <AppHeader title="Historial" />
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6">
        {txs.length === 0 ? (
          <div className="rounded-3xl bg-card border border-border/60 p-8 text-center mt-6">
            <div className="mx-auto size-16 rounded-2xl bg-primary/10 text-primary grid place-items-center">
              <Receipt className="size-8" />
            </div>
            <h2 className="mt-4 font-semibold text-lg">Sin compras todavía</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tus compras en heladeras Cerquita van a aparecer acá.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {txs.map((tx) => {
              const meta = STATUS_META[tx.status];
              const itemsCount = tx.items.reduce((s, i) => s + i.qty, 0);
              return (
                <li key={tx.id}>
                  <Link
                    to="/historial/$txId"
                    params={{ txId: tx.id }}
                    className="block rounded-3xl bg-card border border-border/60 p-5 shadow-soft hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(tx.createdAt)}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 font-semibold truncate">
                          <MapPin className="size-4 text-muted-foreground shrink-0" />
                          <span className="truncate">{tx.fridgeName}</span>
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {itemsCount} {itemsCount === 1 ? "producto" : "productos"}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-semibold tabular-nums">
                          {ARS.format(txTotal(tx))}
                        </div>
                        <span
                          className={cn(
                            "mt-1 inline-block text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full font-medium",
                            meta.cls,
                          )}
                        >
                          {meta.label}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-end text-xs text-muted-foreground">
                      Ver detalle <ChevronRight className="size-4" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
