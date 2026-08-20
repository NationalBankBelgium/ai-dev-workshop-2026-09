import { createInitialState, STATE_SCHEMA_VERSION, type WorkshopState, type WorkshopStep } from './model';

export const STORAGE_KEY = 'do-all-learning:workshop-state:v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const steps = new Set<WorkshopStep>(['intro', 'choose', 'extend']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeOffset(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function normalizeState(value: unknown, validIdeaIds: ReadonlySet<string>): WorkshopState | null {
  if (!isRecord(value) || value.schemaVersion !== STATE_SCHEMA_VERSION) {
    return null;
  }

  const step = value.step;
  if (typeof step !== 'string' || !steps.has(step as WorkshopStep)) {
    return null;
  }

  const selectedValue = value.selectedIdeaId;
  const selectedIdeaId = selectedValue === null ? null : typeof selectedValue === 'string' ? selectedValue : null;
  if (selectedIdeaId !== null && !validIdeaIds.has(selectedIdeaId)) {
    return null;
  }

  if (step === 'extend' && selectedIdeaId === null) {
    return null;
  }

  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    step: step as WorkshopStep,
    selectedIdeaId,
    secondActOffset: safeOffset(value.secondActOffset),
    angleOffset: safeOffset(value.angleOffset),
  };
}

export function readPersistedState(
  storage: StorageLike | undefined,
  validIdeaIds: ReadonlySet<string>,
): WorkshopState {
  const initialState = createInitialState();
  if (!storage) {
    return initialState;
  }

  try {
    const rawValue = storage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return initialState;
    }
    return normalizeState(JSON.parse(rawValue) as unknown, validIdeaIds) ?? initialState;
  } catch {
    return initialState;
  }
}

export function savePersistedState(storage: StorageLike | undefined, state: WorkshopState): void {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private browsing and strict storage policies can reject writes. The app remains usable in memory.
  }
}

export function resetPersistedState(storage: StorageLike | undefined): WorkshopState {
  const initialState = createInitialState();
  if (!storage) {
    return initialState;
  }
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // A failed remove should not prevent the in-memory reset.
  }
  return initialState;
}
