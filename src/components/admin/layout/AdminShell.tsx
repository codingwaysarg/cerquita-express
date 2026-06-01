import { Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { CommandPalette } from "./CommandPalette";
import { isAuthed } from "@/lib/admin/auth";

export function AdminShell() {
  const navigate = useNavigate();
  const paletteRef = useRef<{ open: () => void }>(null);

  useEffect(() => {
    if (!isAuthed()) navigate({ to: "/admin/login" });
  }, [navigate]);

  // CommandPalette handles ⌘K itself; topbar trigger opens it via DOM event
  const openPalette = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
  };

  return (
    <div className="min-h-screen flex bg-background w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onOpenPalette={openPalette} />
        <main className="flex-1 px-4 md:px-6 py-4 md:py-6 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
