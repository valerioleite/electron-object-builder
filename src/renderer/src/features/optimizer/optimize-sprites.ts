/**
 * Sprites optimization algorithm.
 * Detects and removes empty, duplicate, and unused sprites.
 * Reindexes remaining sprites for contiguous IDs.
 * Ported from legacy SpritesOptimizer.as.
 */

import type { ThingType } from '../../types/things'
import { cloneThingType } from '../../types/things'
import { ThingCategory } from '../../types/things'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OptimizeResult {
  removedCount: number
  oldCount: number
  newCount: number
  newSprites: Map<number, Uint8Array>
  newThings: {
    items: ThingType[]
    outfits: ThingType[]
    effects: ThingType[]
    missiles: ThingType[]
  }
  newMaxSpriteId: number
}

export interface OptimizeProgress {
  step: number
  totalSteps: number
  label: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function yieldToUI(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/** FNV-1a-based hash for Uint8Array. Combined with length for reduced collisions. */
function hashBytes(data: Uint8Array): string {
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < data.length; i++) {
    h1 = Math.imul(h1 ^ data[i], 0x01000193)
    h2 = Math.imul(h2 ^ data[i], 0x811c9dc5)
  }
  return `${(h1 >>> 0).toString(16)}_${(h2 >>> 0).toString(16)}_${data.length}`
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

const CATEGORIES = [
  ThingCategory.ITEM,
  ThingCategory.OUTFIT,
  ThingCategory.EFFECT,
  ThingCategory.MISSILE
] as const

type ThingArrays = {
  items: ThingType[]
  outfits: ThingType[]
  effects: ThingType[]
  missiles: ThingType[]
}

const CATEGORY_KEYS: Record<string, keyof ThingArrays> = {
  [ThingCategory.ITEM]: 'items',
  [ThingCategory.OUTFIT]: 'outfits',
  [ThingCategory.EFFECT]: 'effects',
  [ThingCategory.MISSILE]: 'missiles'
}

function forEachSpriteIndex(
  things: ThingArrays,
  callback: (spriteIndex: number[], idx: number) => void
): void {
  for (const cat of CATEGORIES) {
    const key = CATEGORY_KEYS[cat]
    for (const thing of things[key]) {
      for (const fg of thing.frameGroups) {
        if (!fg?.spriteIndex) continue
        for (let i = 0; i < fg.spriteIndex.length; i++) {
          callback(fg.spriteIndex, i)
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Main optimizer
// ---------------------------------------------------------------------------

export async function optimizeSprites(
  sprites: Map<number, Uint8Array>,
  things: ThingArrays,
  spriteCount: number,
  onProgress: (progress: OptimizeProgress) => void
): Promise<OptimizeResult> {
  const totalSteps = 7

  // Step 1: Hash all sprites and find duplicates
  onProgress({ step: 1, totalSteps, label: 'Hashing sprites...' })
  await yieldToUI()

  const hashToId = new Map<string, number>()
  const duplicateMap = new Map<number, number>()

  // Sort by ID to ensure the canonical ID is always the smallest
  const sortedIds = [...sprites.keys()].sort((a, b) => a - b)

  for (const id of sortedIds) {
    const compressed = sprites.get(id)!
    const hash = hashBytes(compressed)
    const existing = hashToId.get(hash)
    if (existing !== undefined) {
      const existingData = sprites.get(existing)!
      if (bytesEqual(compressed, existingData)) {
        duplicateMap.set(id, existing)
      }
    } else {
      hashToId.set(hash, id)
    }
  }

  // Step 2: Clone things and replace duplicate references
  onProgress({ step: 2, totalSteps, label: 'Replacing duplicate references...' })
  await yieldToUI()

  const newThings: ThingArrays = {
    items: things.items.map(cloneThingType),
    outfits: things.outfits.map(cloneThingType),
    effects: things.effects.map(cloneThingType),
    missiles: things.missiles.map(cloneThingType)
  }

  if (duplicateMap.size > 0) {
    forEachSpriteIndex(newThings, (spriteIndex, i) => {
      const canonical = duplicateMap.get(spriteIndex[i])
      if (canonical !== undefined) {
        spriteIndex[i] = canonical
      }
    })
  }

  // Step 3: Find used sprite IDs (after duplicate replacement)
  onProgress({ step: 3, totalSteps, label: 'Finding used sprites...' })
  await yieldToUI()

  const usedIds = new Set<number>()
  forEachSpriteIndex(newThings, (spriteIndex, i) => {
    const sid = spriteIndex[i]
    if (sid !== 0) usedIds.add(sid)
  })

  // Step 4: Identify sprites to keep (non-empty AND used)
  onProgress({ step: 4, totalSteps, label: 'Identifying removable sprites...' })
  await yieldToUI()

  const keepIds = new Set<number>()
  for (const id of usedIds) {
    if (sprites.has(id)) {
      keepIds.add(id)
    }
  }

  // Step 5: Build new sequential ID mapping
  onProgress({ step: 5, totalSteps, label: 'Reindexing sprites...' })
  await yieldToUI()

  const oldToNewId = new Map<number, number>()
  const newSprites = new Map<number, Uint8Array>()
  let nextId = 1

  const sortedKeepIds = [...keepIds].sort((a, b) => a - b)
  for (const oldId of sortedKeepIds) {
    oldToNewId.set(oldId, nextId)
    newSprites.set(nextId, sprites.get(oldId)!)
    nextId++
  }

  // Step 6: Update thing references with new sequential IDs
  onProgress({ step: 6, totalSteps, label: 'Updating references...' })
  await yieldToUI()

  forEachSpriteIndex(newThings, (spriteIndex, i) => {
    const oldId = spriteIndex[i]
    if (oldId === 0) return
    spriteIndex[i] = oldToNewId.get(oldId) ?? 0
  })

  // Step 7: Finalize
  onProgress({ step: 7, totalSteps, label: 'Complete' })
  await yieldToUI()

  const newCount = nextId - 1
  const removedCount = spriteCount - newCount

  return {
    removedCount,
    oldCount: spriteCount,
    newCount,
    newSprites,
    newThings,
    newMaxSpriteId: newCount
  }
}
