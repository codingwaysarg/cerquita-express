import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/admin/primitives/EmptyState";

export const Route = createFileRoute("/admin/transactions")({ component: () => (
  <div className="space-y-4">
    <header><h1 className="text-2xl font-semibold">Transactions</h1><p className="text-sm text-muted-foreground">Auto-resolved cycles + items needing review.</p></header>
    <EmptyState variant="no-data" title="Pantalla en construcción" description="Tabla con 9 columnas, filtros en URL, bulk bar y atajos de teclado." />
  </div>
)});
