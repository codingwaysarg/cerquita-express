import { cn } from "@/lib/utils";

export function ConfidenceBar({ value, className }: { value?: number; className?: string }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  const pct = Math.round(value * 100);
  const color = value >= 0.85 ? "bg-emerald-500" : value >= 0.65 ? "bg-amber-500" : "bg-red-500";
  const text = value >= 0.85 ? "text-emerald-700 dark:text-emerald-300" : value >= 0.65 ? "text-amber-700 dark:text-amber-300" : "text-red-700 dark:text-red-300";
  return (
    <div role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={`Confidence ${pct}%`} className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("text-xs tabular-nums font-medium", text)}>{pct}%</span>
    </div>
  );
}
