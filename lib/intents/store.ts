import type { DepositIntent } from "./types";

/**
 * In-memory intent store for the scaffold.
 * TODO: replace with persistent storage (DB) before production use.
 */
const store = new Map<string, DepositIntent>();

export function saveIntent(intent: DepositIntent): void {
  store.set(intent.id, intent);
}

export function getIntent(id: string): DepositIntent | undefined {
  return store.get(id);
}

export function updateIntent(
  id: string,
  patch: Partial<DepositIntent>
): DepositIntent | undefined {
  const existing = store.get(id);
  if (!existing) return undefined;
  const updated: DepositIntent = {
    ...existing,
    ...patch,
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };
  store.set(id, updated);
  return updated;
}
