/**
 * Node (22+) defines a native, experimental `localStorage` global that throws/warns
 * unless the process is started with `--localstorage-file`. Vitest's jsdom environment
 * skips overwriting globals that already exist on `globalThis`, so that inert native
 * stub wins over jsdom's working `window.localStorage` — leaving `localStorage`
 * `undefined` in every spec that touches it. Replace both Storage globals with a
 * simple in-memory implementation before any spec file runs.
 */
class MemoryStorage implements Storage {
  private readonly store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

function installMemoryStorage(name: 'localStorage' | 'sessionStorage'): void {
  Object.defineProperty(globalThis, name, {
    value: new MemoryStorage(),
    writable: true,
    configurable: true,
  });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, name, {
      value: (globalThis as unknown as Record<string, Storage>)[name],
      writable: true,
      configurable: true,
    });
  }
}

installMemoryStorage('localStorage');
installMemoryStorage('sessionStorage');
