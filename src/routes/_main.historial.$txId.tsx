import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { api, useStore } from "@/lib/mock/store";
import type { Product, TxItem, TxStatus } from "@/lib/mock/types";
import {
  ChevronsUpDown,
  Check,
  Minus,
  Plus,
  Trash2,
  Pencil,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_main/historial/$txId")({
  component: TxDetailPage,
});

const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const STATUS_META: Record<TxStatus, { label: string; cls: string }> = {
  completed: { label: "Completada", cls: "bg-success/10 text-success" },
  in_review: {
    label: "En revisión",
    cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  adjusted: { label: "Ajustada", cls: "bg-primary/10 text-primary" },
  cancelled: { label: "Cancelada", cls: "bg-destructive/10 text-destructive" },
};

function TxDetailPage() {
  const { txId } = Route.useParams();
  const tx = useStore((s) => s.transactions.find((t) => t.id === txId));
  const products = useStore((s) => s.products);
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<TxItem[]>(tx?.items ?? []);
  const [reason, setReason] = useState(tx?.appealReason ?? "");
  const [submitting, setSubmitting] = useState(false);

  const productById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  if (!tx) {
    return <Navigate to="/historial" />;
  }

  const items = editing ? draft : tx.items;
  const total = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const meta = STATUS_META[tx.status];


  function startEdit() {
    setDraft(tx!.items.map((i) => ({ ...i })));
    setReason(tx!.appealReason ?? "");
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(tx!.items);
    setReason(tx!.appealReason ?? "");
  }

  function setQty(idx: number, qty: number) {
    setDraft((d) =>
      d.map((it, i) => (i === idx ? { ...it, qty: Math.max(1, qty) } : it)),
    );
  }

  function removeItem(idx: number) {
    setDraft((d) => d.filter((_, i) => i !== idx));
  }

  function replaceProduct(idx: number, p: Product) {
    setDraft((d) =>
      d.map((it, i) =>
        i === idx ? { ...it, productId: p.id, unitPrice: p.price } : it,
      ),
    );
  }

  function addProduct(p: Product) {
    setDraft((d) => {
      const existing = d.findIndex((it) => it.productId === p.id);
      if (existing >= 0) {
        return d.map((it, i) =>
          i === existing ? { ...it, qty: it.qty + 1 } : it,
        );
      }
      return [...d, { productId: p.id, qty: 1, unitPrice: p.price }];
    });
  }

  async function submitAppeal() {
    if (draft.length === 0) {
      toast.error("Tiene que haber al menos un producto");
      return;
    }
    if (reason.trim().length < 4) {
      toast.error("Contanos brevemente el motivo del reclamo");
      return;
    }
    setSubmitting(true);
    try {
      await api.appealTransaction({ id: tx!.id, items: draft, reason: reason.trim() });
      toast.success("Reclamo enviado. Quedó en revisión.");
      setEditing(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <AppHeader title="Detalle" back />
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-40">
        <div className="rounded-3xl bg-card border border-border/60 p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">
                {new Date(tx.createdAt).toLocaleString("es-AR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
              <div className="mt-1 flex items-center gap-1.5 font-semibold">
                <MapPin className="size-4 text-muted-foreground" />
                {tx.fridgeName}
              </div>
              {tx.cardLast4 && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Tarjeta •••• {tx.cardLast4}
                </div>
              )}
            </div>
            <Badge
              variant="outline"
              className={cn(
                "rounded-full border-0 text-[11px] font-medium px-2.5 py-1",
                meta.cls,
              )}
            >
              {meta.label}
            </Badge>
          </div>
        </div>

        <SessionVideo createdAt={tx.createdAt} fridgeName={tx.fridgeName} />


        <div className="mt-5 flex items-center justify-between">
          <h2 className="font-semibold">Productos</h2>
          {!editing && tx.status !== "in_review" && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-primary"
              onClick={startEdit}
            >
              <Pencil className="size-4 mr-1" /> Corregir
            </Button>
          )}
        </div>

        <ul className="mt-2 space-y-2">
          {items.map((it, idx) => {
            const p = productById.get(it.productId);
            return (
              <li
                key={`${it.productId}-${idx}`}
                className="rounded-2xl bg-card border border-border/60 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-accent grid place-items-center text-xl shrink-0">
                    {p?.emoji ?? "🛒"}
                  </div>
                  <div className="flex-1 min-w-0">
                    {editing ? (
                      <ProductPicker
                        value={p}
                        products={products}
                        onChange={(np) => replaceProduct(idx, np)}
                      />
                    ) : (
                      <>
                        <div className="font-medium truncate">
                          {p?.name ?? "Producto"}
                        </div>
                        {p?.brand && (
                          <div className="text-xs text-muted-foreground">
                            {p.brand}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold tabular-nums">
                      {ARS.format(it.qty * it.unitPrice)}
                    </div>
                    <div className="text-[11px] text-muted-foreground tabular-nums">
                      {it.qty} × {ARS.format(it.unitPrice)}
                    </div>
                  </div>
                </div>

                {editing && (
                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-full border border-border">
                      <button
                        aria-label="Restar"
                        onClick={() => setQty(idx, it.qty - 1)}
                        className="size-9 grid place-items-center rounded-l-full hover:bg-muted"
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="px-3 text-sm font-medium tabular-nums w-8 text-center">
                        {it.qty}
                      </span>
                      <button
                        aria-label="Sumar"
                        onClick={() => setQty(idx, it.qty + 1)}
                        className="size-9 grid place-items-center rounded-r-full hover:bg-muted"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-destructive hover:text-destructive"
                      onClick={() => removeItem(idx)}
                    >
                      <Trash2 className="size-4 mr-1" /> Quitar
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {editing && (
          <div className="mt-3">
            <AddProductButton products={products} onPick={addProduct} />
          </div>
        )}

        <div className="mt-5 rounded-2xl bg-muted/40 p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl font-semibold tabular-nums">
            {ARS.format(total)}
          </span>
        </div>

        {editing && (
          <div className="mt-5 space-y-2">
            <Label htmlFor="reason" className="flex items-center gap-1.5">
              <AlertCircle className="size-4 text-amber-500" />
              Motivo del reclamo
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contanos qué pasó: faltaba un producto, sobraba, otro ítem…"
              className="min-h-28 rounded-2xl"
            />
            <p className="text-xs text-muted-foreground">
              Al enviar, la transacción queda pendiente de revisión por nuestro equipo.
            </p>
          </div>
        )}

        {!editing && tx.status === "in_review" && tx.appealReason && (
          <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="text-xs uppercase tracking-wide text-amber-600 dark:text-amber-400 font-semibold">
              Reclamo en revisión
            </div>
            <p className="mt-1 text-sm">{tx.appealReason}</p>
          </div>
        )}
      </div>

      <div className="sticky bottom-16 px-5 pb-3 safe-bottom bg-gradient-to-t from-background via-background to-transparent">
        {editing ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-2xl"
              onClick={cancelEdit}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              className="flex-[2] h-12 rounded-2xl"
              onClick={submitAppeal}
              disabled={submitting}
            >
              <Check className="size-4 mr-1" />
              {submitting ? "Enviando…" : "Enviar reclamo"}
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full h-12 rounded-2xl"
            onClick={() => navigate({ to: "/historial" })}
          >
            Volver al historial
          </Button>
        )}
      </div>
    </>
  );
}

function ProductPicker({
  value,
  products,
  onChange,
}: {
  value?: Product;
  products: Product[];
  onChange: (p: Product) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-full text-left flex items-center justify-between gap-2 rounded-xl border border-input px-3 h-10 hover:bg-muted/40 transition-colors">
          <span className="truncate text-sm font-medium">
            {value?.name ?? "Elegir producto"}
          </span>
          <ChevronsUpDown className="size-4 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(20rem,calc(100vw-2rem))] p-0 rounded-2xl pointer-events-auto"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Buscar producto…" />
          <CommandList>
            <CommandEmpty>Sin resultados</CommandEmpty>
            <CommandGroup>
              {products.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.name} ${p.brand ?? ""}`}
                  onSelect={() => {
                    onChange(p);
                    setOpen(false);
                  }}
                >
                  <span className="mr-2">{p.emoji ?? "🛒"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {ARS.format(p.price)}
                    </div>
                  </div>
                  {value?.id === p.id && <Check className="size-4 ml-2" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function AddProductButton({
  products,
  onPick,
}: {
  products: Product[];
  onPick: (p: Product) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-12 rounded-2xl border-dashed"
        >
          <Plus className="size-4 mr-1" /> Agregar producto
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(20rem,calc(100vw-2rem))] p-0 rounded-2xl pointer-events-auto"
        align="center"
      >
        <Command>
          <CommandInput placeholder="Buscar producto…" />
          <CommandList>
            <CommandEmpty>Sin resultados</CommandEmpty>
            <CommandGroup>
              {products.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.name} ${p.brand ?? ""}`}
                  onSelect={() => {
                    onPick(p);
                    setOpen(false);
                  }}
                >
                  <span className="mr-2">{p.emoji ?? "🛒"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {ARS.format(p.price)}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
