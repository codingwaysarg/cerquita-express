import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NAV, SETTINGS_ITEM } from "./nav-config";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open navigation" className="md:hidden min-h-11 min-w-11"><Menu className="h-5 w-5" /></Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetTitle className="sr-only">Navegación</SheetTitle>
        <div className="h-14 flex items-center px-4 border-b font-semibold">SmartFridge</div>
        <nav className="overflow-y-auto p-3 space-y-4 h-[calc(100%-3.5rem)]">
          {NAV.map(g => (
            <div key={g.label}>
              <div className="px-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">{g.label}</div>
              <ul className="space-y-0.5">
                {g.items.map(it => {
                  const active = it.exact ? pathname === it.to : (pathname === it.to || pathname.startsWith(it.to + "/"));
                  return (
                    <li key={it.to}>
                      <Link to={it.to} onClick={() => setOpen(false)} className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm min-h-11", active ? "bg-accent font-semibold" : "hover:bg-accent/50")}>
                        <it.icon className="h-4 w-4" />{it.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <div className="border-t pt-3">
            <Link to={SETTINGS_ITEM.to} onClick={() => setOpen(false)} className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm min-h-11", pathname === SETTINGS_ITEM.to ? "bg-accent font-semibold" : "hover:bg-accent/50")}>
              <SETTINGS_ITEM.icon className="h-4 w-4" />{SETTINGS_ITEM.label}
            </Link>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
