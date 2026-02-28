import { LruCache } from '../lru-cache'

describe('LruCache', () => {
  // ─── Constructor ───────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('sets maxSize from argument', () => {
      const cache = new LruCache<string, number>(10)
      expect(cache.maxSize).toBe(10)
    })

    it('starts empty', () => {
      const cache = new LruCache<string, number>(5)
      expect(cache.size).toBe(0)
    })

    it('enforces minimum maxSize of 1 when 0 is passed', () => {
      const cache = new LruCache<string, number>(0)
      expect(cache.maxSize).toBe(1)
    })

    it('enforces minimum maxSize of 1 when negative is passed', () => {
      const cache = new LruCache<string, number>(-5)
      expect(cache.maxSize).toBe(1)
    })
  })

  // ─── get ───────────────────────────────────────────────────────────────────

  describe('get', () => {
    it('returns the stored value for an existing key', () => {
      const cache = new LruCache<string, number>(3)
      cache.set('a', 1)
      expect(cache.get('a')).toBe(1)
    })

    it('returns undefined for a missing key', () => {
      const cache = new LruCache<string, number>(3)
      expect(cache.get('nonexistent')).toBeUndefined()
    })

    it('promotes the accessed entry to most-recently-used', () => {
      const cache = new LruCache<string, number>(3)
      cache.set('a', 1)
      cache.set('b', 2)
      cache.set('c', 3)

      // Access 'a' to promote it to MRU
      cache.get('a')

      // Order should now be b(LRU), c, a(MRU)
      const keys = [...cache.keys()]
      expect(keys).toEqual(['b', 'c', 'a'])
    })
  })

  // ─── has ───────────────────────────────────────────────────────────────────

  describe('has', () => {
    it('returns true for an existing key', () => {
      const cache = new LruCache<string, number>(3)
      cache.set('a', 1)
      expect(cache.has('a')).toBe(true)
    })

    it('returns false for a missing key', () => {
      const cache = new LruCache<string, number>(3)
      expect(cache.has('nonexistent')).toBe(false)
    })

    it('does NOT promote the entry', () => {
      const cache = new LruCache<string, number>(3)
      cache.set('a', 1)
      cache.set('b', 2)
      cache.set('c', 3)

      // has('a') should NOT change order
      cache.has('a')

      // Order should remain a(LRU), b, c(MRU)
      const keys = [...cache.keys()]
      expect(keys).toEqual(['a', 'b', 'c'])
    })
  })

  // ─── set ───────────────────────────────────────────────────────────────────

  describe('set', () => {
    it('adds a new entry', () => {
      const cache = new LruCache<string, number>(3)
      cache.set('a', 1)
      expect(cache.size).toBe(1)
      expect(cache.get('a')).toBe(1)
    })

    it('updates an existing entry and promotes it to MRU', () => {
      const cache = new LruCache<string, number>(3)
      cache.set('a', 1)
      cache.set('b', 2)
      cache.set('c', 3)

      // Update 'a' with new value
      cache.set('a', 10)

      expect(cache.get('a')).toBe(10)
      // 'a' should now be MRU
      const keys = [...cache.keys()]
      expect(keys).toEqual(['b', 'c', 'a'])
    })

    it('evicts the LRU entry when the cache is full', () => {
      const cache = new LruCache<string, number>(3)
      cache.set('a', 1)
      cache.set('b', 2)
      cache.set('c', 3)

      // Adding 'd' should evict 'a' (the LRU)
      cache.set('d', 4)

      expect(cache.size).toBe(3)
      expect(cache.has('a')).toBe(false)
      expect(cache.has('b')).toBe(true)
      expect(cache.has('c')).toBe(true)
      expect(cache.has('d')).toBe(true)
    })
  })

  // ─── delete ────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('returns true and removes an existing key', () => {
      const cache = new LruCache<string, number>(3)
      cache.set('a', 1)

      expect(cache.delete('a')).toBe(true)
      expect(cache.size).toBe(0)
      expect(cache.has('a')).toBe(false)
    })

    it('returns false for a missing key', () => {
      const cache = new LruCache<string, number>(3)
      expect(cache.delete('nonexistent')).toBe(false)
    })
  })

  // ─── clear ─────────────────────────────────────────────────────────────────

  describe('clear', () => {
    it('empties the cache and resets size to 0', () => {
      const cache = new LruCache<string, number>(5)
      cache.set('a', 1)
      cache.set('b', 2)
      cache.set('c', 3)

      cache.clear()

      expect(cache.size).toBe(0)
      expect(cache.has('a')).toBe(false)
      expect(cache.has('b')).toBe(false)
      expect(cache.has('c')).toBe(false)
    })
  })

  // ─── setMaxSize ────────────────────────────────────────────────────────────

  describe('setMaxSize', () => {
    it('shrinks the cache by evicting LRU entries when new size is smaller', () => {
      const cache = new LruCache<string, number>(5)
      cache.set('a', 1)
      cache.set('b', 2)
      cache.set('c', 3)
      cache.set('d', 4)
      cache.set('e', 5)

      cache.setMaxSize(2)

      expect(cache.maxSize).toBe(2)
      expect(cache.size).toBe(2)
      // Only the 2 most recently used should remain: d, e
      expect(cache.has('a')).toBe(false)
      expect(cache.has('b')).toBe(false)
      expect(cache.has('c')).toBe(false)
      expect(cache.has('d')).toBe(true)
      expect(cache.has('e')).toBe(true)
    })

    it('is a no-op when new size is >= current size', () => {
      const cache = new LruCache<string, number>(3)
      cache.set('a', 1)
      cache.set('b', 2)

      cache.setMaxSize(5)

      expect(cache.maxSize).toBe(5)
      expect(cache.size).toBe(2)
      expect(cache.has('a')).toBe(true)
      expect(cache.has('b')).toBe(true)
    })

    it('enforces minimum of 1', () => {
      const cache = new LruCache<string, number>(5)
      cache.set('a', 1)
      cache.set('b', 2)

      cache.setMaxSize(0)

      expect(cache.maxSize).toBe(1)
      expect(cache.size).toBe(1)
      // Only 'b' (MRU) should remain
      expect(cache.has('a')).toBe(false)
      expect(cache.has('b')).toBe(true)
    })
  })

  // ─── Iteration ─────────────────────────────────────────────────────────────

  describe('iteration', () => {
    it('entries() yields [key, value] pairs in LRU-to-MRU order', () => {
      const cache = new LruCache<string, number>(5)
      cache.set('a', 1)
      cache.set('b', 2)
      cache.set('c', 3)

      const entries = [...cache.entries()]
      expect(entries).toEqual([
        ['a', 1],
        ['b', 2],
        ['c', 3]
      ])
    })

    it('keys() yields keys in LRU-to-MRU order', () => {
      const cache = new LruCache<string, number>(5)
      cache.set('a', 1)
      cache.set('b', 2)
      cache.set('c', 3)

      expect([...cache.keys()]).toEqual(['a', 'b', 'c'])
    })

    it('values() yields values in LRU-to-MRU order', () => {
      const cache = new LruCache<string, number>(5)
      cache.set('a', 1)
      cache.set('b', 2)
      cache.set('c', 3)

      expect([...cache.values()]).toEqual([1, 2, 3])
    })

    it('iteration order reflects access patterns', () => {
      const cache = new LruCache<string, number>(5)
      cache.set('a', 1)
      cache.set('b', 2)
      cache.set('c', 3)

      // Access 'a' to promote it
      cache.get('a')

      expect([...cache.keys()]).toEqual(['b', 'c', 'a'])
    })
  })

  // ─── Complex scenarios ─────────────────────────────────────────────────────

  describe('complex scenarios', () => {
    it('access patterns change eviction order', () => {
      const cache = new LruCache<string, number>(3)
      cache.set('a', 1)
      cache.set('b', 2)
      cache.set('c', 3)

      // Access 'a' so 'b' becomes LRU
      cache.get('a')

      // Adding 'd' should now evict 'b' (not 'a')
      cache.set('d', 4)

      expect(cache.has('a')).toBe(true)
      expect(cache.has('b')).toBe(false)
      expect(cache.has('c')).toBe(true)
      expect(cache.has('d')).toBe(true)
    })

    it('multiple evictions happen correctly in sequence', () => {
      const cache = new LruCache<string, number>(2)
      cache.set('a', 1)
      cache.set('b', 2)

      // Evicts 'a'
      cache.set('c', 3)
      expect(cache.has('a')).toBe(false)

      // Evicts 'b'
      cache.set('d', 4)
      expect(cache.has('b')).toBe(false)

      expect(cache.size).toBe(2)
      expect([...cache.keys()]).toEqual(['c', 'd'])
    })

    it('set on existing key does not increase size', () => {
      const cache = new LruCache<string, number>(3)
      cache.set('a', 1)
      cache.set('b', 2)

      cache.set('a', 10)

      expect(cache.size).toBe(2)
    })

    it('works with numeric keys', () => {
      const cache = new LruCache<number, string>(3)
      cache.set(1, 'one')
      cache.set(2, 'two')
      cache.set(3, 'three')

      cache.get(1) // promote 1

      cache.set(4, 'four') // evicts 2 (LRU)

      expect(cache.has(1)).toBe(true)
      expect(cache.has(2)).toBe(false)
      expect(cache.has(3)).toBe(true)
      expect(cache.has(4)).toBe(true)
    })

    it('cache with maxSize 1 always holds only the latest entry', () => {
      const cache = new LruCache<string, number>(1)
      cache.set('a', 1)
      expect(cache.size).toBe(1)
      expect(cache.get('a')).toBe(1)

      cache.set('b', 2)
      expect(cache.size).toBe(1)
      expect(cache.has('a')).toBe(false)
      expect(cache.get('b')).toBe(2)
    })
  })
})
