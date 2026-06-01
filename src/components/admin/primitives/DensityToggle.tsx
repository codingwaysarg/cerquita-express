import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Rows3, Rows4 } from "lucide-react";

export function DensityToggle({ value, onChange }: { value: "compact" | "comfortable"; onChange: (v: "compact" | "comfortable") => void }) {
  return (
    <ToggleGroup type="single" value={value} onValueChange={(v) => v && onChange(v as "compact" | "comfortable")} size="sm" variant="outline">
      <ToggleGroupItem value="compact" aria-label="Compacto"><Rows4 className="h-4 w-4" /></ToggleGroupItem>
      <ToggleGroupItem value="comfortable" aria-label="Cómodo"><Rows3 className="h-4 w-4" /></ToggleGroupItem>
    </ToggleGroup>
  );
}
