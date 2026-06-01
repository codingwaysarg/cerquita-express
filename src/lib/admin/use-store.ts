import { useSyncExternalStore } from "react";
import { subscribe, getDB } from "./mock/db";

// Suscripción global a cambios del mock para que las queries refresquen
export function useStoreSnapshot<T>(selector: (db: ReturnType<typeof getDB>) => T): T {
  return useSyncExternalStore(
    (cb) => subscribe(cb),
    () => selector(getDB()),
    () => selector(getDB()),
  );
}
