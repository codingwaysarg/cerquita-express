import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { BottomNav } from "@/components/BottomNav";
import { useStore } from "@/lib/mock/store";

export const Route = createFileRoute("/_main")({
  component: MainLayout,
});

function MainLayout() {
  const user = useStore((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate({ to: "/" });
  }, [user, navigate]);

  return (
    <PhoneShell>
      <div className="flex-1 flex flex-col min-h-0">
        <Outlet />
      </div>
      <BottomNav />
    </PhoneShell>
  );
}
