import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCardView } from "@/components/CreditCardView";
import { useStore, api } from "@/lib/mock/store";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, CreditCard as CardIcon, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_main/tarjetas")({
  component: TarjetasPage,
});

function TarjetasPage() {
  const cards = useStore((s) => s.cards);
  const [open, setOpen] = useState(false);

  return (
    <>
      <AppHeader title="Tarjetas" />
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-32">
        {cards.length === 0 ? (
          <EmptyState onAdd={() => setOpen(true)} />
        ) : (
          <ul className="space-y-5">
            {cards.map((c, i) => (
              <li key={c.id} className="space-y-3">
                <CreditCardView card={c} variant={i % 2 === 0 ? 1 : 2} />
                <div className="flex gap-2">
                  {!c.isDefault && (
                    <Button variant="outline" size="sm" className="rounded-full"
                      onClick={() => { api.setDefault(c.id); toast.success("Tarjeta predeterminada actualizada"); }}>
                      <Check className="size-4 mr-1" /> Hacer predeterminada
                    </Button>
                  )}
                  <DeleteCardButton id={c.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="sticky bottom-16 px-5 safe-bottom pointer-events-none">
        <div className="pointer-events-auto">
          <AddCardDialog open={open} onOpenChange={setOpen} />
        </div>
      </div>
    </>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-3xl bg-card border border-border/60 p-8 text-center mt-6">
      <div className="mx-auto size-16 rounded-2xl bg-primary/10 text-primary grid place-items-center">
        <CardIcon className="size-8" />
      </div>
      <h2 className="mt-4 font-semibold text-lg">Sin tarjetas vinculadas</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Vinculá una tarjeta para empezar a desbloquear heladeras.
      </p>
      <Button onClick={onAdd} className="mt-5 h-12 rounded-2xl px-6">
        <Plus className="size-4 mr-1" /> Vincular tarjeta
      </Button>
    </div>
  );
}

function DeleteCardButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="sm" className="rounded-full text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}>
        <Trash2 className="size-4 mr-1" /> Eliminar
      </Button>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar tarjeta?</AlertDialogTitle>
          <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={async () => { await api.removeCard(id); toast.success("Tarjeta eliminada"); }}
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AddCardDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [number, setNumber] = useState("");
  const [exp, setExp] = useState("");
  const [holder, setHolder] = useState("");
  const [loading, setLoading] = useState(false);

  function formatNumber(v: string) {
    return v.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
  }
  function formatExp(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (number.replace(/\s/g, "").length < 13 || !exp.match(/^\d{2}\/\d{2}$/) || holder.trim().length < 2) {
      toast.error("Revisá los datos de la tarjeta");
      return;
    }
    setLoading(true);
    try {
      await api.addCard({ number, exp, holder });
      toast.success("Tarjeta vinculada");
      setNumber(""); setExp(""); setHolder("");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full h-14 rounded-2xl shadow-soft text-base">
          <Plus className="size-5 mr-1" /> Vincular nueva tarjeta
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Nueva tarjeta</DialogTitle>
          <DialogDescription>Solo simulamos los datos — no se valida con el banco.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="num">Número</Label>
            <Input id="num" inputMode="numeric" placeholder="1234 5678 9012 3456"
              className="h-12 rounded-2xl tabular-nums"
              value={number} onChange={(e) => setNumber(formatNumber(e.target.value))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="exp">Vencimiento</Label>
              <Input id="exp" inputMode="numeric" placeholder="MM/AA"
                className="h-12 rounded-2xl tabular-nums"
                value={exp} onChange={(e) => setExp(formatExp(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hold">Titular</Label>
              <Input id="hold" placeholder="Nombre Apellido"
                className="h-12 rounded-2xl"
                value={holder} onChange={(e) => setHolder(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl">
              {loading ? "Vinculando…" : "Vincular tarjeta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
