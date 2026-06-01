import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function TrainingPill({ embeddingCount }: { embeddingCount: number }) {
  let label = "Entrenado", color = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", tip = "Producto entrenado.";
  if (embeddingCount === 0) { label = "Sin entrenar"; color = "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300"; tip = "Sin embeddings."; }
  else if (embeddingCount < 50) { label = "Pocas muestras"; color = "bg-amber-500/10 text-amber-700 dark:text-amber-300"; tip = `Solo ${embeddingCount} embeddings — entrená más para mejorar.`; }
  return (
    <TooltipProvider><Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", color)}>{label}</span>
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip></TooltipProvider>
  );
}
