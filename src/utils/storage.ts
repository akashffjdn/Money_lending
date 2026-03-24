/**
 * Simple synchronous storage adapter that works in Expo Go.
 * Mimics the MMKV API surface used in this project.
 * Data persists in memory during the session and syncs to AsyncStorage in background.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

class SyncStorage {
  private cache: Map<string, string> = new Map();
  private id: string;
  private loaded = false;
  private loadPromise: Promise<void>;

  constructor(id: string) {
    this.id = id;
    this.loadPromise = this.loadFromAsync();
  }

  private async loadFromAsync() {
    try {
      const raw = await AsyncStorage.getItem(`@storage_${this.id}`);
      if (raw) {
        const data = JSON.parse(raw) as Record<string, string>;
        Object.entries(data).forEach(([k, v]) => this.cache.set(k, v));
      }
    } catch {
      // ignore
    }
    this.loaded = true;
  }

  /** Wait until the cache has been hydrated from AsyncStorage */
  async waitUntilReady(): Promise<void> {
    await this.loadPromise;
  }

  private persistAsync() {
    const obj: Record<string, string> = {};
    this.cache.forEach((v, k) => {
      obj[k] = v;
    });
    AsyncStorage.setItem(`@storage_${this.id}`, JSON.stringify(obj)).catch(() => {});
  }

  set(key: string, value: string | boolean | number): void {
    this.cache.set(key, JSON.stringify(value));
    this.persistAsync();
  }

  getString(key: string): string | undefined {
    const val = this.cache.get(key);
    if (val === undefined) return undefined;
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }

  getBoolean(key: string): boolean | undefined {
    const val = this.cache.get(key);
    if (val === undefined) return undefined;
    try {
      return JSON.parse(val);
    } catch {
      return false;
    }
  }

  remove(key: string): void {
    this.cache.delete(key);
    this.persistAsync();
  }
}

export function createStorage(opts: { id: string }): SyncStorage {
  return new SyncStorage(opts.id);
}
