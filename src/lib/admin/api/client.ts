// Capa única de datos del backoffice. Hoy: mock en memoria.
// Para swap a backend real: reemplazar cuerpo de funciones por fetch(E.xxx()).
import { getDB, emit } from "../mock/db";
import { buildTimeline, buildTopProducts, imgFor, seedProducts as _ } from "../mock/seed";
import type {
  Transaction, Product, Fridge, TrainingJob, ReviewQueueItem, TopProduct, TimelineBucket, TxItem,
} from "../types";

void _;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const latency = () => 120 + Math.floor(Math.random() * 220);

// --------------- AUTH ---------------
export async function adminLogin(email: string, password: string): Promise<{ token: string }> {
  await sleep(latency());
  if (!email.includes("@")) throw new Response("Bad", { status: 400 });
  if (!password || password.length < 4) throw new Response("Unauthorized", { status: 401 });
  return { token: `tok_${btoa(email).slice(0, 12)}` };
}

// --------------- TRANSACTIONS ---------------
export interface TxQuery {
  status?: string[]; needs_review?: boolean; fridge_id?: string;
  sort?: "status" | "amount" | "created_at"; dir?: "asc" | "desc";
  cursor?: number; limit?: number;
}
export async function getTransactions(q: TxQuery = {}): Promise<{ items: Transaction[]; nextCursor: number | null; total: number }> {
  await sleep(latency());
  const db = getDB();
  let items = [...db.transactions];
  if (q.status?.length) items = items.filter(t => q.status!.includes(t.status));
  if (q.needs_review) items = items.filter(t => t.needsReview);
  if (q.fridge_id) items = items.filter(t => t.fridgeId === q.fridge_id);
  const total = items.length;
  const sort = q.sort || "created_at";
  const dir = q.dir || "desc";
  items.sort((a, b) => {
    const av = sort === "amount" ? a.total : sort === "status" ? a.status : +new Date(a.createdAt);
    const bv = sort === "amount" ? b.total : sort === "status" ? b.status : +new Date(b.createdAt);
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return dir === "asc" ? cmp : -cmp;
  });
  const cursor = q.cursor || 0;
  const limit = q.limit || 25;
  const page = items.slice(cursor, cursor + limit);
  return { items: page, nextCursor: cursor + limit < items.length ? cursor + limit : null, total };
}
export async function getTransaction(id: string): Promise<Transaction> {
  await sleep(latency());
  const t = getDB().transactions.find(x => x.id === id || x.id.startsWith(id));
  if (!t) throw new Response("Not found", { status: 404 });
  return t;
}
export async function bulkReview(ids: string[]) {
  await sleep(latency());
  const db = getDB();
  ids.forEach(id => { const t = db.transactions.find(x => x.id === id); if (t) t.needsReview = false; });
  emit();
  return { ok: true, count: ids.length };
}
export async function approveItem(txId: string, itemId: string) {
  await sleep(latency());
  const t = getDB().transactions.find(x => x.id === txId); if (!t) throw new Error("Not found");
  const it = t.items.find(i => i.id === itemId); if (it) it.reviewed = true;
  if (t.items.every(i => i.reviewed)) t.needsReview = false;
  emit(); return { ok: true };
}
export async function correctItem(txId: string, itemId: string, productId: string, quantity?: number) {
  await sleep(latency());
  const t = getDB().transactions.find(x => x.id === txId); if (!t) throw new Error("Not found");
  const p = getDB().products.find(p => p.id === productId); if (!p) throw new Error("Producto no encontrado");
  const it = t.items.find(i => i.id === itemId); if (!it) throw new Error("Item no encontrado");
  it.productId = p.id; it.productName = p.name; it.productImageUrl = p.imageUrl; it.unitPrice = p.price;
  if (quantity) it.quantity = quantity;
  it.confidence = Math.max(it.confidence, 0.95);
  t.total = t.items.reduce((s, x) => s + x.unitPrice * x.quantity, 0);
  emit(); return { ok: true };
}
export async function waiveItem(txId: string, itemId: string) {
  await sleep(latency());
  const t = getDB().transactions.find(x => x.id === txId); if (!t) throw new Error("Not found");
  t.items = t.items.filter(i => i.id !== itemId);
  t.total = t.items.reduce((s, x) => s + x.unitPrice * x.quantity, 0);
  emit(); return { ok: true };
}
export async function addItem(txId: string, productId: string, quantity = 1) {
  await sleep(latency());
  const t = getDB().transactions.find(x => x.id === txId); if (!t) throw new Error("Not found");
  const p = getDB().products.find(p => p.id === productId); if (!p) throw new Error("Producto no encontrado");
  const newItem: TxItem = { id: `it_new_${Date.now()}`, productId: p.id, productName: p.name, productImageUrl: p.imageUrl, quantity, unitPrice: p.price, confidence: 1, reviewed: true };
  t.items.push(newItem);
  t.total = t.items.reduce((s, x) => s + x.unitPrice * x.quantity, 0);
  emit(); return { ok: true, item: newItem };
}
export async function resolveDispute(txId: string, eventId: string, action: "confirm" | "reject", productId?: string) {
  await sleep(latency());
  const t = getDB().transactions.find(x => x.id === txId);
  const ev = t?.events?.find(e => e.id === eventId);
  if (ev) ev.resolved = true;
  if (action === "confirm" && productId) await addItem(txId, productId, 1);
  emit(); return { ok: true };
}
export async function resolveReturn(txId: string, eventId: string) {
  await sleep(latency());
  const t = getDB().transactions.find(x => x.id === txId);
  const ev = t?.events?.find(e => e.id === eventId);
  if (ev) ev.resolved = true;
  emit(); return { ok: true };
}
export async function getCrops(txId: string) { await sleep(latency()); return (await getTransaction(txId)).crops || []; }
export async function getVideoUrl(txId: string, role: "combined" | "top" | "side" = "combined") {
  await sleep(latency());
  const t = await getTransaction(txId);
  if (role === "top") return { url: t.videoTop };
  if (role === "side") return { url: t.videoSide };
  return { url: t.videoCombinedReady ? t.videoCombined : null };
}

// --------------- DASHBOARD ---------------
export async function getDashboardTimeline(): Promise<TimelineBucket[]> {
  await sleep(latency()); return buildTimeline(getDB().transactions);
}
export async function getDashboardFridgesStatus(): Promise<Fridge[]> { await sleep(latency()); return getDB().fridges; }
export async function getTopProducts(window: "24h" | "7d" | "30d" = "24h"): Promise<TopProduct[]> {
  await sleep(latency()); return buildTopProducts(getDB().transactions, window);
}

// --------------- FRIDGES ---------------
export async function getFridges(): Promise<Fridge[]> { await sleep(latency()); return getDB().fridges; }
export async function getFridge(id: string): Promise<Fridge> {
  await sleep(latency());
  const f = getDB().fridges.find(x => x.id === id); if (!f) throw new Response("Not found", { status: 404 });
  return f;
}
export async function patchFridge(id: string, patch: Partial<Fridge>) {
  await sleep(latency());
  const f = getDB().fridges.find(x => x.id === id); if (!f) throw new Error("Not found");
  Object.assign(f, patch); emit(); return f;
}
export async function calibrateFridge(id: string) {
  await sleep(latency());
  const f = getDB().fridges.find(x => x.id === id); if (!f) throw new Response("Not found", { status: 503 });
  if (f.status === "offline") throw new Response("Edge unreachable", { status: 503 });
  return { ok: true };
}
export async function createFridge(input: { name: string; location?: string; secret: string; cameras: 1 | 2 }) {
  await sleep(latency());
  const f: Fridge = {
    id: `fr_${Date.now().toString(36)}`,
    name: input.name, location: input.location, status: "offline", lastSeenAt: new Date().toISOString(),
    cameras: input.cameras, confidenceThreshold: 0.78, shelves: [], txTodayCount: 0, needsReviewToday: 0,
    lastSnapshotUrl: imgFor("new"),
  };
  getDB().fridges.push(f); emit(); return f;
}
export async function addShelf(fridgeId: string, index: number, label?: string) {
  await sleep(latency()); const f = await getFridge(fridgeId);
  const s = { id: `sh_${Date.now()}`, index, label, planogram: [] };
  f.shelves.push(s); emit(); return s;
}
export async function removeShelf(shelfId: string) {
  await sleep(latency());
  for (const f of getDB().fridges) f.shelves = f.shelves.filter(s => s.id !== shelfId);
  emit(); return { ok: true };
}
export async function addPlanogram(shelfId: string, productId: string, expectedQty: number) {
  await sleep(latency());
  const p = getDB().products.find(p => p.id === productId);
  for (const f of getDB().fridges) for (const s of f.shelves) if (s.id === shelfId) {
    const e = { id: `pg_${Date.now()}`, productId, productName: p?.name || productId, expectedQty, weightG: p?.weightG };
    s.planogram.push(e); emit(); return e;
  }
  throw new Error("Shelf not found");
}
export async function removePlanogram(entryId: string) {
  await sleep(latency());
  for (const f of getDB().fridges) for (const s of f.shelves) s.planogram = s.planogram.filter(p => p.id !== entryId);
  emit(); return { ok: true };
}

// --------------- PRODUCTS ---------------
export async function getProducts(q?: string): Promise<Product[]> {
  await sleep(latency());
  const all = getDB().products;
  if (!q) return all;
  const needle = q.toLowerCase();
  return all.filter(p => p.name.toLowerCase().includes(needle));
}
export async function getProduct(id: string): Promise<Product> {
  await sleep(latency());
  const p = getDB().products.find(p => p.id === id); if (!p) throw new Response("Not found", { status: 404 });
  return p;
}
export async function createProduct(input: { name: string; price: number; sku?: string }) {
  await sleep(latency());
  const p: Product = {
    id: `p_${Date.now().toString(36)}`,
    name: input.name, price: input.price, sku: input.sku,
    imageUrl: imgFor(input.name),
    embeddingCount: 0, imageCount: 0, images: [],
  };
  getDB().products.push(p); emit(); return p;
}
export async function updateProduct(id: string, patch: Partial<Product>) {
  await sleep(latency());
  const p = getDB().products.find(p => p.id === id); if (!p) throw new Error("Not found");
  Object.assign(p, patch); emit(); return p;
}
export async function deleteProduct(id: string) {
  await sleep(latency());
  const db = getDB();
  db.products = db.products.filter(p => p.id !== id); emit(); return { ok: true };
}
export async function uploadProductImages(id: string, files: File[]) {
  await sleep(latency() + 200);
  const p = getDB().products.find(p => p.id === id); if (!p) throw new Error("Not found");
  for (const f of files) {
    p.images.push({ id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, url: imgFor(`${p.id}_${f.name}`), source: "catalog" });
  }
  p.imageCount = p.images.length; emit(); return { ok: true };
}
export async function deleteProductImage(pid: string, iid: string) {
  await sleep(latency());
  const p = getDB().products.find(p => p.id === pid); if (!p) throw new Error("Not found");
  p.images = p.images.filter(i => i.id !== iid); p.imageCount = p.images.length; emit(); return { ok: true };
}
export async function getEmbeddingStats(id: string) {
  await sleep(latency());
  const p = await getProduct(id);
  return { embedding_count: p.embeddingCount, image_count: p.imageCount, last_trained_at: p.lastTrainedAt };
}

// --------------- TRAINING ---------------
export async function getTrainingJobs(filter?: { status?: string; since?: string }): Promise<{ items: TrainingJob[]; nextCursor: number | null }> {
  await sleep(latency());
  let items = [...getDB().trainingJobs].sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt));
  if (filter?.status && filter.status !== "all") items = items.filter(j => j.status === filter.status);
  if (filter?.since) items = items.filter(j => +new Date(j.startedAt) >= +new Date(filter.since!));
  return { items, nextCursor: null };
}
export async function createTrainingJob(productIds: string[], epochs = 20) {
  await sleep(latency());
  const job: TrainingJob = {
    id: `job_${Date.now()}`, productIds, status: "queued", epochs,
    startedAt: new Date().toISOString(), logLines: [],
  };
  getDB().trainingJobs.unshift(job); emit(); return job;
}
export async function cancelTrainingJob(id: string) {
  await sleep(latency());
  const j = getDB().trainingJobs.find(j => j.id === id);
  if (j && (j.status === "queued" || j.status === "running")) { j.status = "failed"; j.finishedAt = new Date().toISOString(); }
  emit(); return { ok: true };
}
export async function getTrainingJobLog(id: string, tail = 200) {
  await sleep(latency());
  const j = getDB().trainingJobs.find(j => j.id === id); if (!j) throw new Error("Not found");
  return { lines: j.logLines.slice(-tail), total: j.logLines.length };
}

// --------------- REVIEW QUEUE ---------------
export async function getReviewQueue(filters?: { band?: "low" | "mid" | "high"; fridge_id?: string; date_from?: string; date_to?: string; limit?: number }): Promise<ReviewQueueItem[]> {
  await sleep(latency());
  let items = getDB().transactions.filter(t => t.needsReview);
  if (filters?.fridge_id) items = items.filter(t => t.fridgeId === filters.fridge_id);
  if (filters?.date_from) items = items.filter(t => +new Date(t.createdAt) >= +new Date(filters.date_from!));
  if (filters?.date_to) items = items.filter(t => +new Date(t.createdAt) <= +new Date(filters.date_to!));
  if (filters?.band) {
    items = items.filter(t => {
      const c = t.confidence ?? 0;
      if (filters.band === "low") return c < 0.5;
      if (filters.band === "mid") return c >= 0.5 && c < 0.75;
      return c >= 0.75;
    });
  }
  const limit = filters?.limit || 100;
  return items.slice(0, limit).map(t => ({
    transactionId: t.id, fridgeId: t.fridgeId, fridgeName: t.fridgeName,
    createdAt: t.createdAt, cropsCount: t.crops?.length || 0,
    topProduct: t.items[0]?.productName, topConfidence: t.items[0]?.confidence,
    itemsCount: t.items.length, thumbnailUrl: t.crops?.[0]?.url, shadow: true,
  }));
}
export async function submitLabel(input: { transaction_crop_id: string; decision: "label" | "not_product" | "unclear" | "bbox_wrong"; product_id?: string; mark_transaction_reviewed?: boolean; transactionId?: string }) {
  await sleep(latency());
  if (input.mark_transaction_reviewed && input.transactionId) {
    const t = getDB().transactions.find(x => x.id === input.transactionId);
    if (t) t.needsReview = false;
    emit();
  }
  return { ok: true };
}
export async function submitTextLabel(_input: { transactionId: string; text: string; product_id?: string }) { await sleep(latency()); return { ok: true }; }

// --------------- SIM ---------------
export async function simUnlock(fridgeId: string) {
  await sleep(latency());
  const id = `sim_${Date.now().toString(36)}`;
  getDB().simSessions[id] = { id, fridgeId, state: "connecting", startedAt: new Date().toISOString(), samples: [] };
  emit(); return { session_id: id };
}
export async function getSimSession(fridgeId: string) {
  await sleep(50);
  const sessions = Object.values(getDB().simSessions).filter(s => s.fridgeId === fridgeId).sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt));
  return sessions[0] || null;
}
export async function simWeightDelta(sid: string, shelfIndex: number, deltaG: number) {
  await sleep(latency());
  const s = getDB().simSessions[sid]; if (!s) throw new Error("No session");
  const t = (Date.now() - +new Date(s.startedAt)) / 1000;
  s.samples.push({ shelfIndex, tSec: +t.toFixed(2), deltaG });
  emit(); return { ok: true };
}
export async function simForceClose(sid: string) {
  await sleep(latency());
  const s = getDB().simSessions[sid]; if (!s) throw new Error("No session");
  s.state = "closing"; emit();
  // simular inferencia
  setTimeout(() => { s.state = "inferring"; emit(); }, 1500);
  setTimeout(() => { s.state = "done"; emit(); }, 3500);
  return { ok: true };
}
export async function simSnapshot(fridgeId: string) {
  await sleep(latency() + 200);
  const sessions = Object.values(getDB().simSessions).filter(s => s.fridgeId === fridgeId);
  const sid = sessions[sessions.length - 1]?.id || "no_session";
  const snap = { id: `snap_${Date.now()}`, sessionId: sid, top: imgFor(`top_${Date.now()}`), side: imgFor(`side_${Date.now()}`), takenAt: new Date().toISOString(), isNew: true };
  getDB().snapshots.push(snap); emit(); return snap;
}
export async function simAssignSnapshot(snapshotId: string, productId: string, train: boolean) {
  await sleep(latency() + 200);
  const snap = getDB().snapshots.find(s => s.id === snapshotId); if (snap) { snap.productId = productId; snap.isNew = false; }
  const p = getDB().products.find(p => p.id === productId);
  if (p) {
    p.images.push({ id: `img_${Date.now()}`, url: snap?.top || imgFor("snap"), source: "feedback" });
    p.imageCount = p.images.length;
    if (train) await createTrainingJob([productId], 5);
  }
  emit(); return { ok: true };
}
