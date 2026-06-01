import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function KpiCard({ icon, label, value, sub, accent, className }: {
  icon?: ReactNode; label: string; value: ReactNode; sub?: ReactNode;
  accent?: "default" | "amber" | "red" | "emerald"; className?: string;
}) {
  const accentMap = {
    default: "",
    amber: "text-amber-700 dark:text-amber-400",
    red: "text-red-700 dark:text-red-400",
    emerald: "text-emerald-700 dark:text-emerald-400",
  };
  return (
    <div className={cn("rounded-2xl border bg-card p-4", className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className={cn("mt-2 text-3xl font-semibold tabular-nums tracking-tight", accent && accentMap[accent])}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
