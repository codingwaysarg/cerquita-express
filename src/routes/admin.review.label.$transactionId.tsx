import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/admin/primitives/EmptyState";
export const Route = createFileRoute("/admin/review/label/$transactionId")({ component: () => (
  <div className="space-y-4"><header><h1 className="text-2xl font-semibold">Etiquetar crops</h1></header><EmptyState variant="no-data" title="En construcción" /></div>
)});
