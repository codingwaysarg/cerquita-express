import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LayoutGrid, Table2 } from "lucide-react";

export function ViewToggle({ value, onChange }: { value: "grid" | "table"; onChange: (v: "grid" | "table") => void }) {
  return (
    <ToggleGroup type="single" value={value} onValueChange={(v) => v && onChange(v as "grid" | "table")} size="sm" variant="outline">
      <ToggleGroupItem value="grid" aria-label="Cuadrícula"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
      <ToggleGroupItem value="table" aria-label="Tabla"><Table2 className="h-4 w-4" /></ToggleGroupItem>
    </ToggleGroup>
  );
}
