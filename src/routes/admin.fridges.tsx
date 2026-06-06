import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getFridges, createFridge } from "@/lib/admin/api/client";
import { QueryBoundary } from "@/components/admin/primitives/QueryBoundary";
import { StatusPill } from "@/components/admin/primitives/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, MapPin, Refrigerator } from "lucide-react";
import { relTime } from "@/lib/admin/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/fridges")({ component: Fridges });

function Fridges() {
  const q = useQuery({ queryKey: ["fridges"], queryFn: getFridges, refetchInterval: 10000 });
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", location: "", secret: "", cameras: 2 as 1 | 2 });

  async function create() {
    if (!draft.name || !draft.secret) return toast.error("Nombre y secret requeridos");
    await createFridge(draft);
    toast.success("Heladera registrada");
    setOpen(false); setDraft({ name: "", location: "", secret: "", cameras: 2 });
    qc.invalidateQueries({ queryKey: ["fridges"] });
  }

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Flota</h1>
          <p className="text-sm text-muted-foreground">Heladeras desplegadas y su estado en tiempo real.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Registrar heladera</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva heladera</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nombre" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              <Input placeholder="Ubicación" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
              <Input placeholder="Edge secret" value={draft.secret} onChange={(e) => setDraft({ ...draft, secret: e.target.value })} />
              <div className="flex gap-2">
                {[1, 2].map(n => (
                  <button key={n} onClick={() => setDraft({ ...draft, cameras: n as 1 | 2 })}
                    className={`flex-1 rounded-full border py-2 text-sm ${draft.cameras === n ? "bg-primary text-primary-foreground border-primary" : ""}`}>
                    {n} cámara{n > 1 ? "s" : ""}
                  </button>
                ))}
              </div>
              <Button onClick={create} className="w-full">Crear</Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <QueryBoundary query={q} isEmpty={d => d.length === 0} emptyTitle="Sin heladeras">
        {(data) => (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.map(f => (
              <li key={f.id}>
                <Link to="/admin/fridges/$id" params={{ id: f.id }} className="block rounded-3xl border border-border/60 bg-card p-5 shadow-soft hover:border-primary transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold truncate flex items-center gap-1.5"><Refrigerator className="h-4 w-4 text-primary shrink-0" /> {f.name}</div>
                      <div className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" /> {f.location}</div>
                    </div>
                    <StatusPill variant={f.status === "online" ? "fridge_online" : "fridge_offline"} />
                  </div>
                  {f.lastSnapshotUrl && (
                    <img src={f.lastSnapshotUrl} alt="" className="mt-3 rounded-2xl w-full aspect-[3/2] object-cover border" />
                  )}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-xl bg-muted p-2 text-center"><div className="font-semibold text-base">{f.txTodayCount}</div><div className="text-muted-foreground">Tx hoy</div></div>
                    <div className="rounded-xl bg-muted p-2 text-center"><div className="font-semibold text-base">{f.needsReviewToday}</div><div className="text-muted-foreground">Revisión</div></div>
                    <div className="rounded-xl bg-muted p-2 text-center"><div className="font-semibold text-base">{f.cameras}</div><div className="text-muted-foreground">Cámaras</div></div>
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground">Último visto {relTime(f.lastSeenAt)}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </QueryBoundary>
    </div>
  );
}
