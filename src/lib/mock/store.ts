// In-memory mock store. Replace with real API calls later.
import { useEffect, useState } from "react";
import type { Card, Fridge, User } from "./types";

type State = {
  user: User | null;
  cards: Card[];
  locationGranted: boolean;
  fridges: Fridge[];
};

const initialFridges: Fridge[] = [
  { id: "f1", name: "Cerquita · Palermo", address: "Av. Santa Fe 3120", distanceM: 120, online: true },
  { id: "f2", name: "Cerquita · Recoleta", address: "Av. Callao 1500", distanceM: 340, online: true },
  { id: "f3", name: "Cerquita · Belgrano", address: "Cabildo 2200", distanceM: 980, online: false },
  { id: "f4", name: "Cerquita · Núñez", address: "Av. Cabildo 3801", distanceM: 1820, online: true },
];

const state: State = {
  user: null,
  cards: [],
  locationGranted: false,
  fridges: [],
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
};
