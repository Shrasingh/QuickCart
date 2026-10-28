// Deterministic API base for the data-fetching actions. `lib/api.ts` reads
// NEXT_PUBLIC_API_URL on every call (not at import time), so this only needs
// to be in place before a test triggers a request. Setting it here keeps the
// suite independent of a real .env; individual tests may override it.
process.env.NEXT_PUBLIC_API_URL ??= "https://api.example.com";

// Minimal in-memory localStorage so the zustand persist store (use-cart) can
// be imported and exercised in the node test environment.
class MemoryStorage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }
}

if (!("localStorage" in globalThis)) {
  globalThis.localStorage = new MemoryStorage() as unknown as Storage;
}
