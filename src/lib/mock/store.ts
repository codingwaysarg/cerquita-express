// In-memory mock store. Replace with real API calls later.
import { useEffect, useState } from "react";
import type { Card, Fridge, Product, Transaction, TxItem, User } from "./types";

type State = {
  user: User | null;
  cards: Card[];
  locationGranted: boolean;
  fridges: Fridge[];
  products: Product[];
  transactions: Transaction[];
};

const initialFridges: Fridge[] = [
  { id: "f1", name: "Cerquita · Palermo", address: "Av. Santa Fe 3120", distanceM: 120, online: true },
  { id: "f2", name: "Cerquita · Recoleta", address: "Av. Callao 1500", distanceM: 340, online: true },
  { id: "f3", name: "Cerquita · Belgrano", address: "Cabildo 2200", distanceM: 980, online: false },
  { id: "f4", name: "Cerquita · Núñez", address: "Av. Cabildo 3801", distanceM: 1820, online: true },
];

const initialProducts: Product[] = [
  { id: "p1", name: "Coca-Cola 500ml", brand: "Coca-Cola", price: 1200, emoji: "🥤" },
  { id: "p2", name: "Coca-Cola Zero 500ml", brand: "Coca-Cola", price: 1200, emoji: "🥤" },
  { id: "p3", name: "Agua mineral 500ml", brand: "Villavicencio", price: 900, emoji: "💧" },
  { id: "p4", name: "Agua saborizada pomelo", brand: "Levité", price: 1100, emoji: "💧" },
  { id: "p5", name: "Sprite 500ml", brand: "Sprite", price: 1200, emoji: "🥤" },
  { id: "p6", name: "Red Bull 250ml", brand: "Red Bull", price: 2400, emoji: "⚡" },
  { id: "p7", name: "Speed XL", brand: "Speed", price: 1800, emoji: "⚡" },
  { id: "p8", name: "Alfajor Jorgito triple", brand: "Jorgito", price: 850, emoji: "🍫" },
  { id: "p9", name: "Alfajor Havanna mixto", brand: "Havanna", price: 1500, emoji: "🍫" },
  { id: "p10", name: "Barrita de cereal", brand: "Cereal Mix", price: 700, emoji: "🌾" },
  { id: "p11", name: "Sandwich JyQ", brand: "Cerquita", price: 2900, emoji: "🥪" },
  { id: "p12", name: "Ensalada César", brand: "Cerquita", price: 3500, emoji: "🥗" },
  { id: "p13", name: "Yogurt con frutilla", brand: "La Serenísima", price: 1300, emoji: "🥛" },
  { id: "p14", name: "Papas Lays clásicas", brand: "Lays", price: 1400, emoji: "🥔" },
  { id: "p15", name: "Chocolate Milka", brand: "Milka", price: 2200, emoji: "🍫" },
];

const now = Date.now();
const initialTransactions: Transaction[] = [
  {
    id: "tx-seed-1",
    fridgeId: "f1",
    fridgeName: "Cerquita · Palermo",
    createdAt: now - 1000 * 60 * 60 * 26,
    items: [
      { productId: "p1", qty: 1, unitPrice: 1200 },
      { productId: "p8", qty: 2, unitPrice: 850 },
    ],
    status: "completed",
  },
  {
    id: "tx-seed-2",
    fridgeId: "f2",
    fridgeName: "Cerquita · Recoleta",
    createdAt: now - 1000 * 60 * 60 * 72,
    items: [
      { productId: "p6", qty: 1, unitPrice: 2400 },
      { productId: "p11", qty: 1, unitPrice: 2900 },
    ],
    status: "completed",
  },
];

const state: State = {
  user: null,
  cards: [],
  locationGranted: false,
  fridges: [],
  products: initialProducts,
  transactions: initialTransactions,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function getState(): State {
  return state;
}

export function useStore<T>(selector: (s: State) => T): T {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return selector(state);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const api = {
  async register(email: string, _password: string) {
    await sleep(500);
    state.user = { id: crypto.randomUUID(), email };
    emit();
    return state.user;
  },
  async login(email: string, _password: string) {
    await sleep(500);
    state.user = { id: crypto.randomUUID(), email };
    emit();
    return state.user;
  },
  logout() {
    state.user = null;
    state.cards = [];
    state.locationGranted = false;
    state.fridges = [];
    emit();
  },
  async addCard(input: { number: string; exp: string; holder: string }) {
    await sleep(600);
    const last4 = input.number.replace(/\s/g, "").slice(-4).padStart(4, "0");
    const first = input.number.replace(/\s/g, "")[0];
    const brand: Card["brand"] = first === "4" ? "visa" : first === "3" ? "amex" : "mastercard";
    const card: Card = {
      id: crypto.randomUUID(),
      brand,
      last4,
      holder: input.holder.toUpperCase(),
      exp: input.exp,
      isDefault: state.cards.length === 0,
    };
    state.cards = [...state.cards, card];
    emit();
    return card;
  },
  async removeCard(id: string) {
    await sleep(300);
    const wasDefault = state.cards.find((c) => c.id === id)?.isDefault;
    state.cards = state.cards.filter((c) => c.id !== id);
    if (wasDefault && state.cards[0]) state.cards[0].isDefault = true;
    emit();
  },
  setDefault(id: string) {
    state.cards = state.cards.map((c) => ({ ...c, isDefault: c.id === id }));
    emit();
  },
  async requestLocation() {
    await sleep(700);
    state.locationGranted = true;
    state.fridges = [...initialFridges].sort((a, b) => a.distanceM - b.distanceM);
    emit();
    return true;
  },
  createTransaction(input: { fridgeId: string; items: TxItem[] }) {
    const fridge =
      state.fridges.find((f) => f.id === input.fridgeId) ??
      initialFridges.find((f) => f.id === input.fridgeId);
    const defaultCard = state.cards.find((c) => c.isDefault) ?? state.cards[0];
    const tx: Transaction = {
      id: `tx-${crypto.randomUUID().slice(0, 8)}`,
      fridgeId: input.fridgeId,
      fridgeName: fridge?.name ?? "Heladera",
      createdAt: Date.now(),
      items: input.items,
      status: "completed",
      cardLast4: defaultCard?.last4,
    };
    state.transactions = [tx, ...state.transactions];
    emit();
    return tx;
  },
  async appealTransaction(input: { id: string; items: TxItem[]; reason: string }) {
    await sleep(500);
    state.transactions = state.transactions.map((t) =>
      t.id === input.id
        ? { ...t, items: input.items, appealReason: input.reason, status: "in_review" }
        : t,
    );
    emit();
  },
};

// Convenient helper to invent a plausible cart for a fridge session.
export function mockCartForFridge(): TxItem[] {
  const pool = initialProducts;
  const count = 1 + Math.floor(Math.random() * 3);
  const picked = new Set<string>();
  const items: TxItem[] = [];
  while (items.length < count) {
    const p = pool[Math.floor(Math.random() * pool.length)];
    if (picked.has(p.id)) continue;
    picked.add(p.id);
    items.push({ productId: p.id, qty: 1 + Math.floor(Math.random() * 2), unitPrice: p.price });
  }
  return items;
}
