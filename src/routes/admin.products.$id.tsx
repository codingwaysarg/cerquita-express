import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getProduct, updateProduct, deleteProduct, uploadProductImages, deleteProductImage,
  createTrainingJob, getEmbeddingStats,
} from "@/lib/admin/api/client";
import { QueryBoundary } from "@/components/admin/primitives/QueryBoundary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, Trash2, Brain, Save } from "lucide-react";
import { fmtARS, relTime } from "@/lib/admin/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/products/$id")({ component: ProductDetail });

function ProductDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["product", id], queryFn: () => getProduct(id) });
  const stats = useQuery({ queryKey: ["product-stats", id], queryFn: () => getEmbeddingStats(id), refetchInterval: 5000 });
  const [edit, setEdit] = useState<any>(null);
  const [deletedImages, setDeletedImages] = useState<{ id: string; url: string; expires: number } | null>(null);

  async function save() {
    await updateProduct(id, edit);
    toast.success("Producto actualizado");
    setEdit(null);
    qc.invalidateQueries({ queryKey: ["product", id] });
  }
  async function del() {
    if (!confirm("Eliminar este producto?")) return;
    await deleteProduct(id);
    toast.success("Eliminado");
    navigate({ to: "/admin/products" });
  }
  async function train() {
    await createTrainingJob([id], 10);
    toast.success("Entrenamiento encolado");
    qc.invalidateQueries({ queryKey: ["product-stats", id] });
  }
  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    await uploadProductImages(id, Array.from(files));
    toast.success(`${files.length} imágenes subidas`);
    qc.invalidateQueries({ queryKey: ["product", id] });
  }
  async function delImg(iid: string, url: string) {
    setDeletedImages({ id: iid, url, expires: Date.now() + 5000 });
    await deleteProductImage(id, iid);
    qc.invalidateQueries({ queryKey: ["product", id] });
    setTimeout(() => setDeletedImages(null), 5000);
  }

  return (
    <div className="space-y-5">
      <button onClick={() => navigate({ to: "/admin/products" })} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-3.5 w-3.5" /> Catálogo
      </button>
      <QueryBoundary query={q}>
        {(p) => (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 space-y-5">
              <header className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft flex items-start gap-4">
                <img src={p.imageUrl} alt="" className="size-24 rounded-2xl object-cover border" />
                <div className="flex-1 min-w-0">
                  {edit ? (
                    <div className="space-y-2">
                      <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
                      <div className="grid grid-cols-2 gap-2">
                        <Input value={edit.sku || ""} onChange={(e) => setEdit({ ...edit, sku: e.target.value })} placeholder="SKU" />
                        <Input type="number" value={edit.price} onChange={(e) => setEdit({ ...edit, price: +e.target.value })} placeholder="Precio" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="number" value={edit.weightG || ""} onChange={(e) => setEdit({ ...edit, weightG: +e.target.value || undefined })} placeholder="Peso (g)" />
                        <Input type="number" value={edit.toleranceG || ""} onChange={(e) => setEdit({ ...edit, toleranceG: +e.target.value || undefined })} placeholder="Tolerancia (g)" />
                      </div>
                      <div className="flex gap-2"><Button size="sm" onClick={save}><Save className="h-3.5 w-3.5" /> Guardar</Button><Button size="sm" variant="ghost" onClick={() => setEdit(null)}>Cancelar</Button></div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-2xl font-semibold">{p.name}</h1>
                      <div className="text-sm text-muted-foreground">{p.sku} · <span className="font-semibold text-foreground">{fmtARS(p.price)}</span> · {p.weightG ?? "—"}g {p.toleranceG ? `(±${p.toleranceG}g)` : ""}</div>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEdit({ name: p.name, sku: p.sku, price: p.price, weightG: p.weightG, toleranceG: p.toleranceG })}>Editar</Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={del}><Trash2 className="h-3.5 w-3.5" /> Eliminar</Button>
                      </div>
                    </>
                  )}
                </div>
              </header>

              <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">Galería ({p.images.length})</h2>
                  <label className="cursor-pointer">
                    <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files)} />
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border hover:bg-muted"><Upload className="h-3.5 w-3.5" /> Subir imágenes</span>
                  </label>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {p.images.map(img => (
                    <div key={img.id} className="relative group">
                      <img src={img.url} alt="" className="aspect-square rounded-2xl object-cover w-full border" />
                      <span className={cn("absolute top-1 left-1 text-[9px] rounded-full px-1.5 py-0.5", img.source === "catalog" ? "bg-primary text-primary-foreground" : "bg-emerald-500 text-white")}>{img.source}</span>
                      <button onClick={() => delImg(img.id, img.url)} className="absolute inset-0 grid place-items-center bg-black/60 opacity-0 group-hover:opacity-100 rounded-2xl transition">
                        <Trash2 className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
                {deletedImages && (
                  <div className="mt-3 rounded-2xl bg-muted p-3 text-sm flex items-center justify-between">
                    <span>Imagen eliminada</span>
                    <Button size="sm" variant="ghost" onClick={() => setDeletedImages(null)}>Deshacer</Button>
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-4">
              <div className="rounded-3xl border border-border/60 bg-gradient-card text-primary-foreground p-5 shadow-soft sticky top-20">
                <h2 className="font-semibold flex items-center gap-2"><Brain className="h-4 w-4" /> Entrenamiento</h2>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div><div className="text-xs opacity-80">Embeddings</div><div className="text-2xl font-semibold">{stats.data?.embedding_count ?? "—"}</div></div>
                  <div><div className="text-xs opacity-80">Imágenes</div><div className="text-2xl font-semibold">{stats.data?.image_count ?? "—"}</div></div>
                </div>
                <div className="mt-3 text-xs opacity-80">
                  Último entrenamiento: {stats.data?.last_trained_at ? relTime(stats.data.last_trained_at) : "nunca"}
                </div>
                <Button variant="secondary" className="mt-4 w-full" onClick={train}>
                  <Brain className="h-3.5 w-3.5" /> Entrenar ahora
                </Button>
              </div>
            </aside>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
