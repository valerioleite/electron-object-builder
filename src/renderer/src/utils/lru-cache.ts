/**
 * Generic LRU (Least Recently Used) cache with configurable max size.
 *
 * Uses a Map for O(1) get/set/delete. Map iteration order (insertion order)
 * is maintained by re-inserting entries on access (get/set), making the
 * most recently used entry always the last in iteration order.
 * Eviction removes the first entry (least recently used).
 */

export class LruCache<K, V> {
  private readonly cache = new Map<K, V>()
  private _maxSize: number

  constructor(maxSize: number) {
    this._maxSize = Math.max(1, maxSize)
  }

  get maxSize(): number {
    return this._maxSize
  }

  get size(): number {
    return this.cache.size
  }

  /**
   * Get a value by key. Promotes the entry to most-recently-used.
   * Returns undefined if the key is not in the cache.
   */
  get(key: K): V | undefined {
    const value = this.cache.get(key)
    if (value === undefined) return undefined

    // Promote to most recently used by re-inserting
    this.cache.delete(key)
    this.cache.set(key, value)
    return value
  }

  /**
   * Check if a key exists in the cache (does NOT promote the entry).
   */
  has(key: K): boolean {
    return this.cache.has(key)
  }

  /**
   * Set a key-value pair. Promotes existing entries to most-recently-used.
   * Evicts the least recently used entry if the cache is full.
   */
  set(key: K, value: V): void {
    // Delete first to update insertion order (promote to MRU)
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }

    this.cache.set(key, value)

    // Evict LRU entries if over capacity
    while (this.cache.size > this._maxSize) {
      const firstKey = this.cache.keys().next().value as K
      this.cache.delete(firstKey)
    }
  }

  /**
   * Delete a specific key from the cache.
   * Returns true if the key was found and deleted.
   */
  delete(key: K): boolean {
    return this.cache.delete(key)
  }

  /** Clear all entries from the cache. */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Update the max size. If the new size is smaller than the current
   * number of entries, evicts LRU entries to fit.
   */
  setMaxSize(newMaxSize: number): void {
    this._maxSize = Math.max(1, newMaxSize)
    while (this.cache.size > this._maxSize) {
      const firstKey = this.cache.keys().next().value as K
      this.cache.delete(firstKey)
    }
  }

  /** Iterate over all entries (from LRU to MRU order). */
  *entries(): IterableIterator<[K, V]> {
    yield* this.cache.entries()
  }

  /** Iterate over all keys (from LRU to MRU order). */
  *keys(): IterableIterator<K> {
    yield* this.cache.keys()
  }

  /** Iterate over all values (from LRU to MRU order). */
  *values(): IterableIterator<V> {
    yield* this.cache.values()
  }
}
