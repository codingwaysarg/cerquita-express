import type { Fridge, Product, Transaction, TrainingJob } from "../types";
import { buildSeedJobs, buildSeedTransactions, seedFridges, seedProducts } from "./seed";

export interface DB {
  fridges: Fridge[];
  products: Product[];
  transactions: Transaction[];
  trainingJobs: TrainingJob[];
  simSessions: Record<string, {
    id: string; fridgeId: string;
    state: "idle" | "connecting" | "warming" | "ready" | "open" | "closing" | "inferring" | "done";
    startedAt: string;
    samples: Array<{ shelfIndex: number; tSec: number; deltaG: number }>;
  }>;
  snapshots: Array<{ id: string; sessionId: string; top: string; side: string; productId?: string; takenAt: string; isNew: boolean }>;
}

const db: DB = {
  fridges: seedFridges,
  products: seedProducts,
  transactions: buildSeedTransactions(),
  trainingJobs: buildSeedJobs(),
  simSessions: {},
  snapshots: [],
};

type Listener = () => void;
const listeners = new Set<Listener>();
export function subscribe(l: Listener) { listeners.add(l); return () => listeners.delete(l); }
export function emit() { listeners.forEach(l => l()); }

export function getDB() { return db; }

// Simula avance de jobs running/queued
if (typeof window !== "undefined") {
  setInterval(() => {
    let changed = false;
    for (const job of db.trainingJobs) {
      if (job.status === "running") {
        job.logLines.push(`[epoch ${job.logLines.length + 1}/20] loss=${(Math.max(0.1, 1 - job.logLines.length * 0.04)).toFixed(3)} acc=${(Math.min(0.99, 0.6 + job.logLines.length * 0.015)).toFixed(3)}`);
        if (job.logLines.length >= 20) { job.status = "completed"; job.finishedAt = new Date().toISOString(); job.durationSec = 180; }
        changed = true;
      } else if (job.status === "queued") {
        // Empieza si no hay otro running
        if (!db.trainingJobs.some(j => j.status === "running")) { job.status = "running"; changed = true; }
      }
    }
    // Avanza sesiones del simulador
    for (const sid of Object.keys(db.simSessions)) {
      const s = db.simSessions[sid];
      const t = (Date.now() - +new Date(s.startedAt)) / 1000;
      const next =
        t < 1 ? "connecting" :
        t < 3 ? "warming" :
        t < 4 ? "ready" :
        s.state === "closing" ? (t > 15 ? "inferring" : "closing") :
        s.state === "inferring" ? (t > 18 ? "done" : "inferring") :
        "open";
      if (s.state !== next && s.state !== "closing" && s.state !== "inferring" && s.state !== "done") {
        s.state = next as typeof s.state; changed = true;
      }
    }
    if (changed) emit();
  }, 1000);
}
