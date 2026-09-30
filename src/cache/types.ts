export interface CacheStore<T = unknown> {
  get(key: string): Promise<T | undefined> | T | undefined;
  set(key: string, value: T, ttlMs?: number): Promise<void> | void;
  delete(key: string): Promise<void> | void;
}
