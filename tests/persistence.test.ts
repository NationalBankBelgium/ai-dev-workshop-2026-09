import { describe, expect, it } from 'vitest';
import { createInitialState } from '../src/model';
import {
  readPersistedState,
  resetPersistedState,
  savePersistedState,
  STORAGE_KEY,
  type StorageLike,
} from '../src/persistence';

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  public removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe('workshop state persistence', () => {
  const validIdeaIds = new Set(['000', '001']);

  it('round-trips the selected idea and deck positions', () => {
    const storage = new MemoryStorage();
    const state = { ...createInitialState(), step: 'extend' as const, selectedIdeaId: '001', secondActOffset: 4, angleOffset: 3 };

    savePersistedState(storage, state);

    expect(readPersistedState(storage, validIdeaIds)).toEqual(state);
  });

  it('falls back to the initial state for corrupt or incompatible data', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, '{not-json');
    expect(readPersistedState(storage, validIdeaIds)).toEqual(createInitialState());

    storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 999, step: 'extend', selectedIdeaId: '000' }));
    expect(readPersistedState(storage, validIdeaIds)).toEqual(createInitialState());

    storage.setItem(STORAGE_KEY, JSON.stringify({ ...createInitialState(), step: 'extend', selectedIdeaId: 'missing' }));
    expect(readPersistedState(storage, validIdeaIds)).toEqual(createInitialState());
  });

  it('resets persisted state and returns a clean first step', () => {
    const storage = new MemoryStorage();
    savePersistedState(storage, { ...createInitialState(), step: 'choose' });

    expect(resetPersistedState(storage)).toEqual(createInitialState());
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('does not throw when storage is unavailable', () => {
    expect(() => savePersistedState(undefined, createInitialState())).not.toThrow();
    expect(readPersistedState(undefined, validIdeaIds)).toEqual(createInitialState());
    expect(resetPersistedState(undefined)).toEqual(createInitialState());
  });
});
