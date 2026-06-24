/**
 * Unified storage utility using tauri-plugin-store with localStorage fallback.
 *
 * In Tauri runtime → uses tauri-plugin-store (file-based, survives browser cache clear)
 *                      AND keeps localStorage in sync for getSync() reads
 * In browser / dev  → falls back to localStorage only
 */

import { load, type Store } from '@tauri-apps/plugin-store'

let _store: Store | null = null
let _initPromise: Promise<Store | null> | null = null

/** Detect if running inside Tauri */
function isTauri(): boolean {
  return !!(window as any).__TAURI_INTERNALS__
}

/** Lazily initialise and cache the Tauri store */
async function getStore(): Promise<Store | null> {
  if (_store) return _store
  if (_initPromise) return _initPromise

  _initPromise = (async () => {
    if (!isTauri()) return null
    try {
      _store = await load('openqmt.json', { autoSave: true, defaults: {} })
      return _store
    } catch (e) {
      console.warn('[storage] tauri-plugin-store init failed, falling back to localStorage:', e)
      return null
    }
  })()

  return _initPromise
}

// ── Internal helpers ──

/** Write to localStorage so getSync() can read it */
function setLocalStorage(key: string, value: unknown): void {
  if (value === null || value === undefined) {
    localStorage.removeItem(key)
  } else if (typeof value === 'string') {
    localStorage.setItem(key, value)
  } else {
    localStorage.setItem(key, JSON.stringify(value))
  }
}

// ── Public API ──

/**
 * Get a value from persistent storage.
 * Returns `null` if key doesn't exist.
 */
export async function get<T = unknown>(key: string): Promise<T | null> {
  const store = await getStore()
  if (store) {
    const val = await store.get<T>(key)
    return val !== undefined && val !== null ? val : null
  }
  // localStorage fallback
  const raw = localStorage.getItem(key)
  if (raw === null) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return raw as unknown as T
  }
}

/**
 * Set a value in persistent storage.
 * Stores the actual object (not JSON string) so both tauri store and
 * localStorage contain the correct representation.
 */
export async function set(key: string, value: unknown): Promise<void> {
  // Always keep localStorage in sync for getSync() reads
  setLocalStorage(key, value)

  const store = await getStore()
  if (store) {
    await store.set(key, value)
  }
}

/**
 * Remove a key from persistent storage.
 */
export async function remove(key: string): Promise<void> {
  localStorage.removeItem(key)
  const store = await getStore()
  if (store) {
    await store.delete(key)
  }
}

/**
 * Synchronous get (localStorage only – used for initial state before async is available).
 * Prefer the async `get()` whenever possible.
 *
 * Returns the parsed value (object, array, number, etc.) or a plain string
 * if the stored value isn't valid JSON.
 */
export function getSync<T = unknown>(key: string): T | null {
  const raw = localStorage.getItem(key)
  if (raw === null) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return raw as unknown as T
  }
}

/**
 * Synchronous set (localStorage only – used for initial state before async is available).
 * Prefer the async `set()` whenever possible.
 */
export function setSync(key: string, value: unknown): void {
  setLocalStorage(key, value)
}
