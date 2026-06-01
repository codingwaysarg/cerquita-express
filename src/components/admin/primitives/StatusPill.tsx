import { cn } from "@/lib/utils";

type Variant =
  | "tx_processing" | "tx_completed" | "tx_empty" | "tx_failed" | "tx_awaiting"
  | "needs_review" | "fridge_online" | "fridge_offline"
  | "job_queued" | "job_running" | "job_completed" | "job_failed";

const MAP: Record<Variant, { label: string; dot: string; ring: string; pulse?: boolean; outline?: boolean }> = {
  tx_processing: { label: "Processing", dot: "bg-cyan-500", ring: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300", pulse: true },
  tx_completed: { label: "Completed", dot: "bg-emerald-500", ring: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  tx_empty: { label: "Empty cart", dot: "bg-zinc-400", ring: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300" },
  tx_failed: { label: "Failed", dot: "bg-red-500", ring: "bg-red-500/10 text-red-700 dark:text-red-300" },
  tx_awaiting: { label: "Awaiting upload", dot: "bg-amber-500", ring: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  needs_review: { label: "Needs review", dot: "bg-amber-500", ring: "border border-amber-500/40 text-amber-700 dark:text-amber-300", outline: true },
  fridge_online: { label: "En línea", dot: "bg-emerald-500", ring: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  fridge_offline: { label: "Sin conexión", dot: "bg-zinc-400", ring: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300" },
  job_queued: { label: "En cola", dot: "bg-zinc-400", ring: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300" },
  job_running: { label: "Entrenando", dot: "bg-cyan-500", ring: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300", pulse: true },
  job_completed: { label: "Completado", dot: "bg-emerald-500", ring: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  job_failed: { label: "Fallido", dot: "bg-red-500", ring: "bg-red-500/10 text-red-700 dark:text-red-300" },
};

export function StatusPill({ variant, className }: { variant: Variant; className?: string }) {
  const cfg = MAP[variant];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", cfg.ring, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot, cfg.pulse && "pulse-dot")} aria-hidden />
      {cfg.label}
    </span>
  );
}

export function txVariant(status: string): Variant {
  if (status === "processing") return "tx_processing";
  if (status === "completed") return "tx_completed";
  if (status === "empty") return "tx_empty";
  if (status === "failed") return "tx_failed";
  return "tx_awaiting";
}
