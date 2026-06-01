import { Button } from "@/components/ui/button";
import { Inbox, SearchX, AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  variant: "no-data" | "no-matches" | "not-found";
  title: string;
  description?: string;
  action?: ReactNode;
  filtersEcho?: string;
  onClear?: () => void;
}

export function EmptyState({ variant, title, description, action, filtersEcho, onClear }: Props) {
  const Icon = variant === "no-data" ? Inbox : variant === "no-matches" ? SearchX : AlertTriangle;
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-xl border border-dashed border-border">
      <div className="rounded-full bg-muted p-4"><Icon className="h-6 w-6 text-muted-foreground" /></div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground max-w-md">{description}</p>}
      {filtersEcho && <p className="mt-2 text-xs text-muted-foreground">Filtros activos: {filtersEcho}</p>}
      <div className="mt-4 flex gap-2">
        {action}
        {onClear && variant === "no-matches" && <Button variant="outline" size="sm" onClick={onClear}>Limpiar filtros</Button>}
      </div>
    </div>
  );
}
