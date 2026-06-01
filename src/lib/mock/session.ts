// Mock session state machine. Replace with realtime backend later.
import { useEffect, useState } from "react";
import type { SessionState } from "./types";

type Session = {
  state: SessionState;
  fridgeId: string | null;
};

let current: Session = { state: "idle", fridgeId: null };
const listeners = new Set<(s: Session) => void>();
const emit = () => listeners.forEach((l) => l(current));
const timers: number[] = [];

function setState(s: SessionState) {
  current = { ...current, state: s };
  emit();
}

function clearTimers() {
  timers.forEach((t) => clearTimeout(t));
  timers.length = 0;
}

export function startSession(fridgeId: string, opts?: { simulateError?: boolean }) {
  clearTimers();
  current = { state: "unlocking", fridgeId };
  emit();

  timers.push(
    window.setTimeout(() => {
      if (opts?.simulateError) {
        setState("error");
        return;
      }
      setState("open");
      timers.push(
        window.setTimeout(() => {
          setState("processing");
          timers.push(
            window.setTimeout(() => setState("done"), 1800),
          );
        }, 4500),
      );
    }, 1100),
  );
}

export function resetSession() {
  clearTimers();
  current = { state: "idle", fridgeId: null };
  emit();
}

export function useSession() {
  const [s, setS] = useState<Session>(current);
  useEffect(() => {
    const l = (n: Session) => setS(n);
    listeners.add(l);
    setS(current);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return s;
}
