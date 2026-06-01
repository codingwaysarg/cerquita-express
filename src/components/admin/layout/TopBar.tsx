import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Breadcrumb } from "./Breadcrumb";
import { ThemeToggle } from "./ThemeToggle";
import { MobileNav } from "./MobileNav";
import { UserMenu } from "./UserMenu";
import { cn } from "@/lib/utils";

export function TopBar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  const hint = isMac ? "⌘K" : "Ctrl K";

  return (
    <header className={cn("sticky top-0 z-30 h-14 border-b bg-background/95 transition-[backdrop-filter,background-color]", scrolled && "bg-background/70 backdrop-blur")}>
      <div className="h-full flex items-center justify-between gap-2 px-3 md:px-5">
        <div className="flex items-center gap-2 min-w-0">
          <MobileNav />
          <div className="md:hidden font-semibold">SmartFridge</div>
          <div className="hidden md:block min-w-0"><Breadcrumb /></div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={onOpenPalette} className="hidden md:inline-flex gap-2 text-muted-foreground">
            <Search className="h-3.5 w-3.5" /> Search… <kbd className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">{hint}</kbd>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden min-h-11 min-w-11" onClick={onOpenPalette} aria-label="Search"><Search className="h-4 w-4" /></Button>
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
