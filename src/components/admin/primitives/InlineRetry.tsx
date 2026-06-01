import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

export function InlineRetry({ message = "No pudimos cargar esto.", onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-3" role="alert">
      <div className="flex-1 text-sm">{message}</div>
      {onRetry && <Button variant="outline" size="sm" onClick={onRetry}><RefreshCcw className="h-3.5 w-3.5 mr-1" />Reintentar</Button>}
    </div>
  );
}
