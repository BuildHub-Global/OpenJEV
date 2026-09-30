import type { CacheStore } from './types.js';

type Entry<T> = { value: T; expiresAt?: number };

export class InMemoryCache<T = unknown> implements CacheStore<T> {
  private readonly entries = new Map<string, Entry<T>>();

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt !== undefined && entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    this.entries.set(key, {
      value,
      expiresAt: ttlMs === undefined ? undefined : Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.entries.delete(key);
  }
}
