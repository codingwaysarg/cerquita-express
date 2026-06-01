// Tipos del backoffice — separados de la app de consumidor

export type TxStatus = "processing" | "completed" | "empty" | "failed" | "awaiting_upload";
export type ChargeTier = 1 | 2 | 3;
export type InferenceMode = "weight" | "weight+image" | "image";
export type FridgeStatus = "online" | "offline";
export type JobStatus = "queued" | "running" | "completed" | "failed";
export type ReviewDecision = "label" | "not_product" | "unclear" | "bbox_wrong";

export interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  imageUrl?: string;
  weightG?: number;
  toleranceG?: number;
  embeddingCount: number;
  imageCount: number;
  lastTrainedAt?: string;
  images: ProductImage[];
}
export interface ProductImage {
  id: string;
  url: string;
  source: "catalog" | "feedback";
}

export interface TxItem {
  id: string;
  productId: string;
  productName: string;
  productImageUrl?: string;
  quantity: number;
  unitPrice: number;
  confidence: number;
  reviewed?: boolean;
}

export interface TxCrop {
  id: string;
  trackedItemId: string;
  url: string;
  productName?: string;
  confidence?: number;
  source: "top" | "side";
  frame: number;
  margin?: number;
}

export interface TxEvent {
  id: string;
  type: "dispute" | "return";
  windowFromSec: number;
  windowToSec: number;
  source: "top" | "side" | "scale";
  candidates?: Array<{ productId: string; productName: string; cameraConfidence: number }>;
  resolved?: boolean;
}

export interface ScaleDelta { shelfIndex: number; deltaG: number; }
export interface PipelineEvents { doorOpen?: string; uploadDone?: number; settled?: number; }

export interface Transaction {
  id: string;
  fridgeId?: string;
  fridgeName?: string;
  status: TxStatus;
  needsReview: boolean;
  total: number;
  confidence?: number;
  inference?: InferenceMode;
  frameFps?: number;
  processedInSec?: number;
  createdAt: string;
  items: TxItem[];
  customer?: { phone?: string; paymentProvider?: string; paymentStatus?: "paid" | "pending" | "failed" };
  pipeline?: PipelineEvents;
  scaleDeltas?: ScaleDelta[];
  chargeTier?: ChargeTier;
  riskBadge?: string;
  modelVersions?: { detector: number; embedder: number; head: number };
  crops?: TxCrop[];
  events?: TxEvent[];
  videoCombined?: string;
  videoTop?: string;
  videoSide?: string;
  videoCombinedReady?: boolean;
}

export interface Fridge {
  id: string;
  name: string;
  location?: string;
  status: FridgeStatus;
  lastSeenAt: string;
  cameras: 1 | 2;
  confidenceThreshold: number;
  shelves: Shelf[];
  lastSnapshotUrl?: string;
  lastDoorOpenAt?: string;
  txTodayCount: number;
  needsReviewToday: number;
}
export interface Shelf { id: string; index: number; label?: string; planogram: PlanogramEntry[]; }
export interface PlanogramEntry { id: string; productId: string; productName: string; expectedQty: number; weightG?: number; }

export interface TrainingJob {
  id: string;
  productIds: string[];
  status: JobStatus;
  epochs: number;
  startedAt: string;
  finishedAt?: string;
  durationSec?: number;
  logLines: string[];
}

export interface ReviewQueueItem {
  transactionId: string;
  fridgeId?: string;
  fridgeName?: string;
  createdAt: string;
  cropsCount: number;
  topProduct?: string;
  topConfidence?: number;
  itemsCount: number;
  thumbnailUrl?: string;
  shadow?: boolean;
}

export interface SimSession {
  id: string;
  fridgeId: string;
  state: "idle" | "connecting" | "warming" | "ready" | "open" | "closing" | "inferring" | "done";
  startedAt: string;
  samples: Array<{ shelfIndex: number; tSec: number; deltaG: number }>;
}

export interface TimelineBucket {
  hour: string; // ISO hour
  completed: number; review: number; failed: number; empty: number;
}

export interface TopProduct { productId: string; productName: string; sku?: string; units: number; revenue: number; }
