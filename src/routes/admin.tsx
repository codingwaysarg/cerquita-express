import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/layout/AdminShell";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/admin/login") return <Outlet />;
  return <AdminShell />;
}
