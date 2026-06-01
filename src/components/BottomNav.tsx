import { Link, useLocation } from "@tanstack/react-router";
import { CreditCard, Refrigerator } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/heladeras", label: "Heladeras", Icon: Refrigerator },
  { to: "/tarjetas", label: "Tarjetas", Icon: CreditCard },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="sticky bottom-0 z-20 bg-background/90 backdrop-blur-md border-t border-border/60 safe-bottom">
      <ul className="grid grid-cols-2 px-2 pt-2">
        {items.map(({ to, label, Icon }) => {
          const active = pathname.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 min-h-[56px] rounded-2xl text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("size-6", active && "stroke-[2.4]")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
