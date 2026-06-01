import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/admin/primitives/EmptyState";
export const Route = createFileRoute("/admin/sim/$fridgeId")({ component: () => {
  const { fridgeId } = Route.useParams();
  return <div className="space-y-4"><header><h1 className="text-2xl font-semibold">Simulador · {fridgeId}</h1></header><EmptyState variant="no-data" title="Playground en construcción" description="Controles de sesión, peso, snapshots y entrenamiento." /></div>;
}});
