/**
 * Reactive Storage Service
 * Simulates local caching and persistence. Designed to be swapped with Firestore
 * listeners (onSnapshot) or backend REST APIs without breaking UI components.
 */

type Listener = () => void;

class StorageEmitter {
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Storage listener error:', err);
      }
    });
  }
}

export const storageEmitter = new StorageEmitter();

export function getStoredItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(`skillswap_${key}`);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`Failed to read ${key} from storage:`, error);
    return defaultValue;
  }
}

export function setStoredItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`skillswap_${key}`, JSON.stringify(value));
    storageEmitter.notify();
  } catch (error) {
    console.error(`Failed to save ${key} to storage:`, error);
  }
}

export function removeStoredItem(key: string): void {
  try {
    localStorage.removeItem(`skillswap_${key}`);
    storageEmitter.notify();
  } catch (error) {
    console.error(`Failed to remove ${key} from storage:`, error);
  }
}
