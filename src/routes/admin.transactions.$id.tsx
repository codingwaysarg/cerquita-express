import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/admin/primitives/EmptyState";

export const Route = createFileRoute("/admin/transactions/$id")({ component: () => {
  const { id } = Route.useParams();
  return <div className="space-y-4"><header><h1 className="text-xl font-mono">{id.slice(0,18)}…</h1></header><EmptyState variant="no-data" title="Detalle en construcción" /></div>;
}});
