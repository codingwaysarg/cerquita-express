import type {
  Fridge, Product, Transaction, TrainingJob, TimelineBucket, TopProduct,
} from "../types";

const NOW = () => Date.now();
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

const PALETTE = ["#ef4444","#f59e0b","#10b981","#06b6d4","#8b5cf6","#ec4899","#f97316","#22c55e"];

export function imgFor(seed: string, w = 240, h = 240) {
  // Imagen estable y diversa por seed sin requerir red
  let h1 = 0;
  for (let i = 0; i < seed.length; i++) h1 = (h1 * 31 + seed.charCodeAt(i)) >>> 0;
  const color = PALETTE[h1 % PALETTE.length];
  const initial = seed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase() || "??";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="55%" font-family="system-ui,sans-serif" font-size="${Math.floor(w/3)}" font-weight="700" fill="white" text-anchor="middle">${initial}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const VIDEO_TOP = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";
const VIDEO_SIDE = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";
const VIDEO_COMBO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4";

export const seedProducts: Product[] = [
  ["p_coca_500","Coca-Cola 500ml","COC500",1200,500],
  ["p_coca_zero","Coca-Cola Zero 354ml","COCZ354",950,354],
  ["p_agua_500","Agua Mineral 500ml","AGUA500",700,500],
  ["p_powerade","Powerade Mountain Blast 500ml","POW500",1400,500],
  ["p_snickers","Snickers 40g","SNK40",900,40],
  ["p_alfajor","Alfajor Jorgito Triple","JOR3",850,80],
  ["p_oreo","Oreo Original","OREO",1100,118],
  ["p_lays","Lays Clásicas 130g","LAY130",1900,130],
  ["p_yogur","Yogur Bebible Vainilla","YOG200",1500,200],
  ["p_chocomilk","Chocolatada La Serenísima","CHOC250",1300,250],
  ["p_pepsi","Pepsi Black 500ml","PEPB500",1100,500],
  ["p_sprite","Sprite 500ml","SPR500",1150,500],
  ["p_kitkat","Kit Kat","KKT",950,42],
  ["p_milky","Milky Way","MWY",950,52],
  ["p_paty","Sándwich de Jamón y Queso","SJQ",2800,180],
].map(([id,name,sku,price,weight], i) => ({
  id: id as string,
  name: name as string,
  sku: sku as string,
  price: price as number,
  weightG: weight as number,
  toleranceG: undefined,
  imageUrl: imgFor(id as string),
  embeddingCount: i < 8 ? 80 + i * 12 : i < 12 ? 30 + i * 2 : 0,
  imageCount: i < 8 ? 25 + i * 3 : i < 12 ? 8 + i : 0,
  lastTrainedAt: i < 12 ? ago(1000 * 60 * 60 * (12 + i * 5)) : undefined,
  images: Array.from({ length: i < 8 ? 6 : 2 }).map((_, k) => ({
    id: `${id}_img_${k}`,
    url: imgFor(`${id}_${k}`),
    source: k < 4 ? ("catalog" as const) : ("feedback" as const),
  })),
}));

export const seedFridges: Fridge[] = [
  ["fr_centro","SmartFridge Centro","Oficinas Microcentro · Lobby",90,"online"],
  ["fr_palermo","SmartFridge Palermo","Coworking · Cocina",60,"online"],
  ["fr_belgrano","SmartFridge Belgrano","Edificio Norte · PB",30,"offline"],
  ["fr_pilar","SmartFridge Pilar","Campus · Gym",10,"online"],
].map(([id,name,location,minutesAgo,status]) => ({
  id: id as string,
  name: name as string,
  location: location as string,
  status: status as "online" | "offline",
  lastSeenAt: ago(1000 * 60 * (minutesAgo as number)),
  cameras: 2,
  confidenceThreshold: 0.78,
  shelves: [
    { id: `${id}_s1`, index: 1, label: "Bebidas", planogram: [
      { id: `${id}_pg1`, productId: "p_coca_500", productName: "Coca-Cola 500ml", expectedQty: 6, weightG: 500 },
      { id: `${id}_pg2`, productId: "p_agua_500", productName: "Agua Mineral 500ml", expectedQty: 8, weightG: 500 },
    ]},
    { id: `${id}_s2`, index: 2, label: "Snacks", planogram: [
      { id: `${id}_pg3`, productId: "p_snickers", productName: "Snickers 40g", expectedQty: 12, weightG: 40 },
      { id: `${id}_pg4`, productId: "p_oreo", productName: "Oreo Original", expectedQty: 10, weightG: 118 },
    ]},
    { id: `${id}_s3`, index: 3, label: "Frescos", planogram: [
      { id: `${id}_pg5`, productId: "p_yogur", productName: "Yogur Bebible Vainilla", expectedQty: 6, weightG: 200 },
    ]},
  ],
  lastSnapshotUrl: imgFor(`snap_${id}`, 480, 320),
  lastDoorOpenAt: ago(1000 * 60 * ((minutesAgo as number) + 5)),
  txTodayCount: 15 + Math.floor(Math.random() * 25),
  needsReviewToday: Math.floor(Math.random() * 5),
}));

function pick<T>(arr: T[], i: number) { return arr[i % arr.length]; }

export function buildSeedTransactions(): Transaction[] {
  const txs: Transaction[] = [];
  for (let i = 0; i < 120; i++) {
    const fridge = pick(seedFridges, i);
    const statusRoll = i % 13;
    const status =
      statusRoll < 8 ? "completed" :
      statusRoll === 8 ? "processing" :
      statusRoll === 9 ? "empty" :
      statusRoll === 10 ? "failed" :
      statusRoll === 11 ? "awaiting_upload" : "completed";
    const itemsCount = status === "empty" ? 0 : 1 + (i % 4);
    const items = Array.from({ length: itemsCount }).map((_, k) => {
      const p = pick(seedProducts, i + k * 3);
      const qty = 1 + ((i + k) % 2);
      const conf = status === "completed" ? 0.86 + Math.random() * 0.12 : 0.45 + Math.random() * 0.4;
      return { id: `it_${i}_${k}`, productId: p.id, productName: p.name, productImageUrl: p.imageUrl, quantity: qty, unitPrice: p.price, confidence: Math.min(0.99, conf) };
    });
    const total = items.reduce((s, x) => s + x.unitPrice * x.quantity, 0);
    const minConf = items.length ? Math.min(...items.map(x => x.confidence)) : undefined;
    const needsReview = !!minConf && minConf < 0.78 && status !== "empty";
    const createdAt = ago(1000 * 60 * (5 + i * 18));
    const crops = items.flatMap((it, k) => ([
      { id: `c_${i}_${k}_t`, trackedItemId: `ti_${i}_${k}`, url: imgFor(`crop_${it.productId}_t_${k}`, 160, 160), productName: it.productName, confidence: it.confidence, source: "top" as const, frame: 12 + k * 4, margin: 0.04 + Math.random() * 0.2 },
      { id: `c_${i}_${k}_s`, trackedItemId: `ti_${i}_${k}`, url: imgFor(`crop_${it.productId}_s_${k}`, 160, 160), productName: it.productName, confidence: Math.min(0.99, it.confidence + 0.04), source: "side" as const, frame: 14 + k * 4, margin: 0.06 + Math.random() * 0.18 },
    ]));
    txs.push({
      id: `tx_${(i + 1).toString(16).padStart(8, "0")}${Math.random().toString(16).slice(2, 8)}`,
      fridgeId: fridge.id,
      fridgeName: fridge.name,
      status,
      needsReview,
      total,
      confidence: minConf,
      inference: i % 3 === 0 ? "weight+image" : i % 3 === 1 ? "image" : "weight",
      frameFps: 12,
      processedInSec: 1.2 + Math.random() * 2.4,
      createdAt,
      items,
      customer: i % 4 === 0 ? { phone: "+54 9 11 5555 0" + (100 + i), paymentProvider: "MercadoPago", paymentStatus: status === "completed" ? "paid" : status === "failed" ? "failed" : "pending" } : undefined,
      pipeline: { doorOpen: createdAt, uploadDone: 2.1 + Math.random(), settled: 4.3 + Math.random() },
      scaleDeltas: [
        { shelfIndex: 1, deltaG: -500 - Math.floor(Math.random() * 200) },
        { shelfIndex: 3, deltaG: 40 + Math.floor(Math.random() * 40) },
      ],
      chargeTier: minConf && minConf > 0.85 ? 1 : minConf && minConf > 0.7 ? 2 : 3,
      riskBadge: needsReview ? "Prioridad media" : undefined,
      modelVersions: { detector: 7, embedder: 12, head: 3 },
      crops,
      events: i % 11 === 0 ? [{
        id: `ev_${i}`, type: "dispute", windowFromSec: 3.2, windowToSec: 4.8, source: "top",
        candidates: [
          { productId: "p_coca_500", productName: "Coca-Cola 500ml", cameraConfidence: 0.62 },
          { productId: "p_pepsi", productName: "Pepsi Black 500ml", cameraConfidence: 0.55 },
        ],
      }] : i % 17 === 0 ? [{
        id: `evr_${i}`, type: "return", windowFromSec: 6.5, windowToSec: 7.2, source: "scale",
      }] : undefined,
      videoCombined: VIDEO_COMBO,
      videoTop: VIDEO_TOP,
      videoSide: VIDEO_SIDE,
      videoCombinedReady: i % 5 !== 0,
    });
  }
  return txs.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function buildSeedJobs(): TrainingJob[] {
  const jobs: TrainingJob[] = [];
  for (let i = 0; i < 8; i++) {
    const status: TrainingJob["status"] = i === 0 ? "running" : i === 1 ? "queued" : i === 2 ? "failed" : "completed";
    jobs.push({
      id: `job_${(NOW() - i * 100000).toString(16)}`,
      productIds: [seedProducts[i % seedProducts.length].id],
      status,
      epochs: 20,
      startedAt: ago(1000 * 60 * (i * 30 + 5)),
      finishedAt: status === "completed" || status === "failed" ? ago(1000 * 60 * (i * 30)) : undefined,
      durationSec: status === "completed" ? 180 + i * 12 : undefined,
      logLines: Array.from({ length: 12 + i * 3 }).map((_, k) => `[epoch ${k + 1}/20] loss=${(1 - k * 0.04).toFixed(3)} acc=${(0.6 + k * 0.02).toFixed(3)}`),
    });
  }
  return jobs;
}

export function buildTimeline(txs: Transaction[]): TimelineBucket[] {
  const out: TimelineBucket[] = [];
  for (let h = 23; h >= 0; h--) {
    const start = Date.now() - h * 3600_000;
    const hour = new Date(start - (start % 3600_000)).toISOString();
    const inHour = txs.filter(t => {
      const dt = +new Date(t.createdAt);
      return dt >= start - 3600_000 && dt < start;
    });
    out.push({
      hour,
      completed: inHour.filter(t => t.status === "completed").length,
      review: inHour.filter(t => t.needsReview).length,
      failed: inHour.filter(t => t.status === "failed").length,
      empty: inHour.filter(t => t.status === "empty").length,
    });
  }
  return out.reverse();
}

export function buildTopProducts(txs: Transaction[], _window: "24h" | "7d" | "30d"): TopProduct[] {
  const since = Date.now() - (_window === "24h" ? 86_400_000 : _window === "7d" ? 7 * 86_400_000 : 30 * 86_400_000);
  const map = new Map<string, TopProduct>();
  for (const t of txs) {
    if (+new Date(t.createdAt) < since) continue;
    for (const it of t.items) {
      const cur = map.get(it.productId) || { productId: it.productId, productName: it.productName, units: 0, revenue: 0, sku: seedProducts.find(p => p.id === it.productId)?.sku };
      cur.units += it.quantity;
      cur.revenue += it.quantity * it.unitPrice;
      map.set(it.productId, cur);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.units - a.units).slice(0, 10);
}
