/**
 * Sprite store for managing loaded sprites, render cache,
 * selection state, change tracking, and pending operations.
 *
 * Ported from legacy AS3: SpriteStorage (sprite dictionary + lazy loading),
 * SpriteList (selection state), sprite commands (import/export/replace/remove).
 * Render cache and pending operation tracking are NEW features.
 *
 * Memory optimization: Supports lazy loading via SpriteAccessor. When loaded
 * from a raw SPR buffer, sprites are extracted on demand instead of all at once,
 * saving significant memory for large files (50K+ sprites).
 */

import { create } from 'zustand'
import { LruCache } from '../utils/lru-cache'
import { SpriteAccessor } from '../services/spr/sprite-accessor'

// ---------------------------------------------------------------------------
// Sprite operation tracking
// ---------------------------------------------------------------------------

export type SpriteOperationType = 'import' | 'export' | 'replace' | 'remove'

export interface SpriteOperation {
  type: SpriteOperationType
  spriteIds: number[]
  total: number
  completed: number
}

// ---------------------------------------------------------------------------
// Sprite store state + actions
// ---------------------------------------------------------------------------

export interface SpriteStoreState {
  /**
   * Override sprites: id -> compressed pixels.
   * Contains only sprites that were added/modified/replaced after loading.
   * For unmodified sprites, data comes from the SpriteAccessor.
   */
  sprites: Map<number, Uint8Array>

  /**
   * Lazy accessor for the raw SPR buffer. Extracts sprites on demand.
   * null when sprites were loaded via loadSprites(Map) or when no project is loaded.
   */
  spriteAccessor: SpriteAccessor | null

  /**
   * IDs of sprites explicitly deleted (to shadow accessor entries).
   * Only needed when using SpriteAccessor.
   */
  deletedSpriteIds: Set<number>

  /** Total sprite count (accessor count + added - deleted). */
  totalSpriteCount: number

  /** Rendered sprite cache: id -> data URL for quick display (LRU eviction). */
  renderedCache: LruCache<number, string>

  /** Primary selected sprite ID. */
  selectedSpriteId: number | null
  /** Multiple selected sprite IDs. */
  selectedSpriteIds: number[]

  /** IDs of sprites modified since last save. */
  changedSpriteIds: number[]

  /** Currently active async sprite operation. */
  pendingOperation: SpriteOperation | null
}

export interface SpriteStoreActions {
  // Bulk loading
  loadSprites(sprites: Map<number, Uint8Array>): void
  loadFromBuffer(buffer: ArrayBuffer, extended: boolean): void
  clearSprites(): void

  // Individual sprite CRUD
  getSprite(id: number): Uint8Array | undefined
  setSprite(id: number, compressed: Uint8Array): void
  removeSprite(id: number): void
  addSprite(compressed: Uint8Array | null): number

  // Batch operations
  replaceSprites(entries: Array<[number, Uint8Array]>): void
  removeSprites(ids: number[]): void

  // Materialization
  getAllSprites(): Map<number, Uint8Array>

  // Rendered cache
  getCachedRender(id: number): string | undefined
  setCachedRender(id: number, dataUrl: string): void
  invalidateRender(id: number): void
  invalidateAllRenders(): void
  setCacheMaxSize(size: number): void

  // Selection
  selectSprite(id: number | null): void
  selectSprites(ids: number[]): void
  clearSpriteSelection(): void

  // Change tracking
  markSpriteChanged(id: number): void
  markSpritesChanged(ids: number[]): void
  clearChangedSprites(): void

  // Operations
  startOperation(type: SpriteOperationType, spriteIds: number[]): void
  updateOperationProgress(completed: number): void
  completeOperation(): void
  cancelOperation(): void

  // Getters
  hasPendingOperation(): boolean
  getSpriteCount(): number
  hasSprite(id: number): boolean
  isSpriteChanged(id: number): boolean
}

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

const DEFAULT_CACHE_MAX_SIZE = 2000

// ---------------------------------------------------------------------------
// Store creation
// ---------------------------------------------------------------------------

export const useSpriteStore = create<SpriteStoreState & SpriteStoreActions>()((set, get) => ({
  // --- Initial state ---
  sprites: new Map(),
  spriteAccessor: null,
  deletedSpriteIds: new Set(),
  totalSpriteCount: 0,
  renderedCache: new LruCache<number, string>(DEFAULT_CACHE_MAX_SIZE),
  selectedSpriteId: null,
  selectedSpriteIds: [],
  changedSpriteIds: [],
  pendingOperation: null,

  // --- Bulk loading ---

  loadSprites(sprites) {
    const accessor = get().spriteAccessor
    if (accessor) accessor.dispose()
    get().renderedCache.clear()
    set({
      sprites: new Map(sprites),
      spriteAccessor: null,
      deletedSpriteIds: new Set(),
      totalSpriteCount: sprites.size,
      renderedCache: new LruCache<number, string>(get().renderedCache.maxSize),
      changedSpriteIds: [],
      selectedSpriteId: null,
      selectedSpriteIds: []
    })
  },

  loadFromBuffer(buffer, extended) {
    const oldAccessor = get().spriteAccessor
    if (oldAccessor) oldAccessor.dispose()
    get().renderedCache.clear()

    const accessor = new SpriteAccessor(buffer, extended)
    set({
      sprites: new Map(),
      spriteAccessor: accessor,
      deletedSpriteIds: new Set(),
      totalSpriteCount: accessor.spriteCount,
      renderedCache: new LruCache<number, string>(get().renderedCache.maxSize),
      changedSpriteIds: [],
      selectedSpriteId: null,
      selectedSpriteIds: []
    })
  },

  clearSprites() {
    const accessor = get().spriteAccessor
    if (accessor) accessor.dispose()
    get().renderedCache.clear()
    set({
      sprites: new Map(),
      spriteAccessor: null,
      deletedSpriteIds: new Set(),
      totalSpriteCount: 0,
      renderedCache: new LruCache<number, string>(DEFAULT_CACHE_MAX_SIZE),
      changedSpriteIds: [],
      selectedSpriteId: null,
      selectedSpriteIds: [],
      pendingOperation: null
    })
  },

  // --- Individual sprite CRUD ---

  getSprite(id) {
    const state = get()
    // Check overrides first
    const override = state.sprites.get(id)
    if (override !== undefined) return override
    // Check if deleted
    if (state.deletedSpriteIds.has(id)) return undefined
    // Fall back to accessor
    if (state.spriteAccessor) return state.spriteAccessor.get(id)
    return undefined
  },

  setSprite(id, compressed) {
    get().renderedCache.delete(id)
    set((state) => {
      const newSprites = new Map(state.sprites)
      newSprites.set(id, compressed)
      const newDeleted = new Set(state.deletedSpriteIds)
      newDeleted.delete(id) // Un-delete if was deleted
      const changedSpriteIds = state.changedSpriteIds.includes(id)
        ? state.changedSpriteIds
        : [...state.changedSpriteIds, id]
      return { sprites: newSprites, deletedSpriteIds: newDeleted, changedSpriteIds }
    })
  },

  removeSprite(id) {
    get().renderedCache.delete(id)
    set((state) => {
      const newSprites = new Map(state.sprites)
      newSprites.delete(id)
      const newDeleted = new Set(state.deletedSpriteIds)
      // Mark as deleted to shadow accessor
      if (state.spriteAccessor && state.spriteAccessor.has(id)) {
        newDeleted.add(id)
      }
      const changedSpriteIds = state.changedSpriteIds.includes(id)
        ? state.changedSpriteIds
        : [...state.changedSpriteIds, id]
      return { sprites: newSprites, deletedSpriteIds: newDeleted, changedSpriteIds }
    })
  },

  addSprite(compressed) {
    const state = get()
    // Find max ID across overrides and accessor
    let maxId = 0
    for (const id of state.sprites.keys()) {
      if (id > maxId) maxId = id
    }
    if (state.spriteAccessor && state.spriteAccessor.spriteCount > maxId) {
      maxId = state.spriteAccessor.spriteCount
    }
    const newId = maxId + 1

    set((s) => {
      const newSprites = new Map(s.sprites)
      if (compressed) {
        newSprites.set(newId, compressed)
      }
      return {
        sprites: newSprites,
        totalSpriteCount: Math.max(s.totalSpriteCount, newId),
        changedSpriteIds: [...s.changedSpriteIds, newId]
      }
    })

    return newId
  },

  // --- Batch operations ---

  replaceSprites(entries) {
    const cache = get().renderedCache
    for (const [id] of entries) {
      cache.delete(id)
    }
    set((state) => {
      const newSprites = new Map(state.sprites)
      const newDeleted = new Set(state.deletedSpriteIds)
      const changedSet = new Set(state.changedSpriteIds)

      for (const [id, compressed] of entries) {
        newSprites.set(id, compressed)
        newDeleted.delete(id) // Un-delete if was deleted
        changedSet.add(id)
      }

      return {
        sprites: newSprites,
        deletedSpriteIds: newDeleted,
        changedSpriteIds: Array.from(changedSet)
      }
    })
  },

  removeSprites(ids) {
    const cache = get().renderedCache
    for (const id of ids) {
      cache.delete(id)
    }
    set((state) => {
      const newSprites = new Map(state.sprites)
      const newDeleted = new Set(state.deletedSpriteIds)
      const changedSet = new Set(state.changedSpriteIds)

      for (const id of ids) {
        newSprites.delete(id)
        if (state.spriteAccessor && state.spriteAccessor.has(id)) {
          newDeleted.add(id)
        }
        changedSet.add(id)
      }

      return {
        sprites: newSprites,
        deletedSpriteIds: newDeleted,
        changedSpriteIds: Array.from(changedSet)
      }
    })
  },

  // --- Materialization ---

  getAllSprites() {
    const state = get()
    const result = new Map<number, Uint8Array>()

    // Start with accessor data (if any)
    if (state.spriteAccessor) {
      for (const id of state.spriteAccessor.ids()) {
        if (!state.deletedSpriteIds.has(id)) {
          const data = state.spriteAccessor.get(id)
          if (data) result.set(id, data)
        }
      }
    }

    // Apply overrides (add/replace)
    for (const [id, data] of state.sprites) {
      result.set(id, data)
    }

    return result
  },

  // --- Rendered cache ---

  getCachedRender(id) {
    return get().renderedCache.get(id)
  },

  setCachedRender(id, dataUrl) {
    get().renderedCache.set(id, dataUrl)
  },

  invalidateRender(id) {
    get().renderedCache.delete(id)
  },

  invalidateAllRenders() {
    get().renderedCache.clear()
  },

  setCacheMaxSize(size) {
    get().renderedCache.setMaxSize(size)
  },

  // --- Selection ---

  selectSprite(id) {
    set({
      selectedSpriteId: id,
      selectedSpriteIds: id !== null ? [id] : []
    })
  },

  selectSprites(ids) {
    set({
      selectedSpriteIds: [...ids],
      selectedSpriteId: ids.length > 0 ? ids[ids.length - 1] : null
    })
  },

  clearSpriteSelection() {
    set({
      selectedSpriteId: null,
      selectedSpriteIds: []
    })
  },

  // --- Change tracking ---

  markSpriteChanged(id) {
    const { changedSpriteIds } = get()
    if (changedSpriteIds.includes(id)) return
    set({ changedSpriteIds: [...changedSpriteIds, id] })
  },

  markSpritesChanged(ids) {
    const { changedSpriteIds } = get()
    const changedSet = new Set(changedSpriteIds)
    let changed = false
    for (const id of ids) {
      if (!changedSet.has(id)) {
        changedSet.add(id)
        changed = true
      }
    }
    if (!changed) return
    set({ changedSpriteIds: Array.from(changedSet) })
  },

  clearChangedSprites() {
    set({ changedSpriteIds: [] })
  },

  // --- Operations ---

  startOperation(type, spriteIds) {
    set({
      pendingOperation: {
        type,
        spriteIds: [...spriteIds],
        total: spriteIds.length,
        completed: 0
      }
    })
  },

  updateOperationProgress(completed) {
    const { pendingOperation } = get()
    if (!pendingOperation) return
    set({
      pendingOperation: {
        ...pendingOperation,
        completed
      }
    })
  },

  completeOperation() {
    set({ pendingOperation: null })
  },

  cancelOperation() {
    set({ pendingOperation: null })
  },

  // --- Getters ---

  hasPendingOperation() {
    return get().pendingOperation !== null
  },

  getSpriteCount() {
    const state = get()
    if (state.spriteAccessor) {
      // Accessor count + new overrides (IDs beyond accessor range) - deleted
      let count = state.spriteAccessor.spriteCount
      for (const id of state.sprites.keys()) {
        if (id > state.spriteAccessor.spriteCount) count++
      }
      count -= state.deletedSpriteIds.size
      return count
    }
    return state.sprites.size
  },

  hasSprite(id) {
    const state = get()
    if (state.sprites.has(id)) return true
    if (state.deletedSpriteIds.has(id)) return false
    if (state.spriteAccessor) return state.spriteAccessor.has(id)
    return false
  },

  isSpriteChanged(id) {
    return get().changedSpriteIds.includes(id)
  }
}))

// ---------------------------------------------------------------------------
// Reset helper (for testing)
// ---------------------------------------------------------------------------

export function resetSpriteStore(): void {
  const state = useSpriteStore.getState()
  state.renderedCache.clear()
  if (state.spriteAccessor) state.spriteAccessor.dispose()
  useSpriteStore.setState({
    sprites: new Map(),
    spriteAccessor: null,
    deletedSpriteIds: new Set(),
    totalSpriteCount: 0,
    renderedCache: new LruCache<number, string>(DEFAULT_CACHE_MAX_SIZE),
    selectedSpriteId: null,
    selectedSpriteIds: [],
    changedSpriteIds: [],
    pendingOperation: null
  })
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectSprites = (state: SpriteStoreState) => state.sprites
export const selectSpriteAccessor = (state: SpriteStoreState) => state.spriteAccessor
export const selectRenderedCache = (state: SpriteStoreState) => state.renderedCache
export const selectSelectedSpriteId = (state: SpriteStoreState) => state.selectedSpriteId
export const selectSelectedSpriteIds = (state: SpriteStoreState) => state.selectedSpriteIds
export const selectChangedSpriteIds = (state: SpriteStoreState) => state.changedSpriteIds
export const selectPendingOperation = (state: SpriteStoreState) => state.pendingOperation
export const selectHasPendingOperation = (state: SpriteStoreState) =>
  state.pendingOperation !== null
export const selectSpriteStoreCount = (state: SpriteStoreState) =>
  state.spriteAccessor
    ? state.spriteAccessor.spriteCount + countNewOverrides(state) - state.deletedSpriteIds.size
    : state.sprites.size
export const selectHasChangedSprites = (state: SpriteStoreState) =>
  state.changedSpriteIds.length > 0

// Helper for selector
function countNewOverrides(state: SpriteStoreState): number {
  if (!state.spriteAccessor) return 0
  let count = 0
  for (const id of state.sprites.keys()) {
    if (id > state.spriteAccessor.spriteCount) count++
  }
  return count
}
