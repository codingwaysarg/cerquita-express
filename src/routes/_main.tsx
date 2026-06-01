import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { BottomNav } from "@/components/BottomNav";
import { useStore } from "@/lib/mock/store";
import { useHydrated } from "@tanstack/react-router";

export const Route = createFileRoute("/_main")({
  component: MainLayout,
});

function MainLayout() {
  const user = useStore((s) => s.user);
  const hydrated = useHydrated();

  // After hydration, if there is no user, redirect to the landing.
  // Before hydration we still render the shell so SSR/initial paint is never blank.
  if (hydrated && !user) {
    return <Navigate to="/" />;
  }

  return (
    <PhoneShell>
      <div className="flex-1 flex flex-col min-h-0">
        <Outlet />
      </div>
      <BottomNav />
    </PhoneShell>
  );
}
