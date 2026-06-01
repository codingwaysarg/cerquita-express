import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/admin/primitives/EmptyState";
export const Route = createFileRoute("/admin/products/$id")({ component: () => {
  const { id } = Route.useParams();
  return <div className="space-y-4"><header><h1 className="text-2xl font-semibold">{id}</h1></header><EmptyState variant="no-data" title="Detalle en construcción" /></div>;
}});
