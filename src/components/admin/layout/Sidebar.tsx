import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NAV, SETTINGS_ITEM, type NavItem } from "./nav-config";

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(item.to + "/");
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => { setCollapsed(localStorage.getItem("sf_sidebar_collapsed") === "1"); }, []);
  useEffect(() => { localStorage.setItem("sf_sidebar_collapsed", collapsed ? "1" : "0"); }, [collapsed]);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <TooltipProvider delayDuration={100}>
      <aside aria-label="Primary" className={cn("hidden md:flex flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 sticky top-0 h-screen", collapsed ? "w-14" : "w-60")}>
        <div className="h-14 flex items-center px-3 border-b">
          <Link to="/admin" className="flex items-center gap-2 font-semibold tracking-tight">
            <div className="h-7 w-7 rounded-lg bg-gradient-card flex items-center justify-center text-primary-foreground text-xs font-bold">SF</div>
            {!collapsed && <span>SmartFridge</span>}
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {NAV.map((g) => (
            <div key={g.label}>
              {collapsed ? <div className="mx-2 border-t my-2" /> : <div className="px-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">{g.label}</div>}
              <ul className="space-y-0.5">
                {g.items.map((it) => {
                  const active = isActive(pathname, it);
                  const link = (
                    <Link
                      to={it.to}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm",
                        active ? (collapsed ? "bg-sidebar-accent" : "font-semibold bg-sidebar-accent/40") : "hover:bg-sidebar-accent/30 text-muted-foreground",
                      )}
                    >
                      {active && !collapsed && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />}
                      <it.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{it.label}</span>}
                    </Link>
                  );
                  return (
                    <li key={it.to}>
                      {collapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>{link}</TooltipTrigger>
                          <TooltipContent side="right">{it.label}</TooltipContent>
                        </Tooltip>
                      ) : link}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t p-2">
          {(() => {
            const active = isActive(pathname, SETTINGS_ITEM);
            const link = (
              <Link to={SETTINGS_ITEM.to} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm", active ? "bg-sidebar-accent/40 font-semibold" : "hover:bg-sidebar-accent/30 text-muted-foreground")}>
                <SETTINGS_ITEM.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{SETTINGS_ITEM.label}</span>}
              </Link>
            );
            return collapsed ? <Tooltip><TooltipTrigger asChild>{link}</TooltipTrigger><TooltipContent side="right">{SETTINGS_ITEM.label}</TooltipContent></Tooltip> : link;
          })()}
          <button
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="mt-2 w-full flex items-center justify-center rounded-lg py-1.5 text-muted-foreground hover:bg-sidebar-accent/30"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
