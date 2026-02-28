/**
 * Frame durations optimizer.
 * Batch-updates all frame durations for selected categories (items, outfits, effects)
 * to a specified min/max range.
 * Ported from legacy SpritesOptimizer: otlib/utils/FrameDurationsOptimizer.as
 */

import { FrameGroupType, type FrameDuration, cloneFrameDuration } from '../../types/animation'
import { type ThingType, cloneThingType } from '../../types/things'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CategoryDurationConfig {
  enabled: boolean
  minimum: number
  maximum: number
}

export interface OptimizeDurationsConfig {
  items: CategoryDurationConfig
  outfits: CategoryDurationConfig
  effects: CategoryDurationConfig
}

export interface OptimizeDurationsProgress {
  step: number
  totalSteps: number
  label: string
}

export interface OptimizeDurationsResult {
  newThings: {
    items: ThingType[]
    outfits: ThingType[]
    effects: ThingType[]
  }
  itemsChanged: number
  outfitsChanged: number
  effectsChanged: number
  totalChanged: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function yieldToUI(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Changes frame durations for all things in a category list.
 * Returns the count of things actually modified.
 */
function changeFrameDurations(
  things: ThingType[],
  minimum: number,
  maximum: number
): { result: ThingType[]; changed: number } {
  let changed = 0
  const result = things.map((thing) => {
    let modified = false

    for (
      let groupType = FrameGroupType.DEFAULT;
      groupType <= FrameGroupType.WALKING;
      groupType++
    ) {
      const frameGroup = thing.frameGroups[groupType]
      if (!frameGroup || !frameGroup.frameDurations) continue

      for (let frame = 0; frame < frameGroup.frames; frame++) {
        const duration = frameGroup.frameDurations[frame]
        if (duration && (duration.minimum !== minimum || duration.maximum !== maximum)) {
          modified = true
          break
        }
      }
      if (modified) break
    }

    if (!modified) return thing

    // Clone thing and update durations
    const cloned = cloneThingType(thing)
    for (
      let groupType = FrameGroupType.DEFAULT;
      groupType <= FrameGroupType.WALKING;
      groupType++
    ) {
      const frameGroup = cloned.frameGroups[groupType]
      if (!frameGroup || !frameGroup.frameDurations) continue

      for (let frame = 0; frame < frameGroup.frames; frame++) {
        if (frameGroup.frameDurations[frame]) {
          frameGroup.frameDurations[frame] = cloneFrameDuration({
            minimum,
            maximum
          } as FrameDuration)
        }
      }
    }

    changed++
    return cloned
  })

  return { result, changed }
}

// ---------------------------------------------------------------------------
// Main optimizer
// ---------------------------------------------------------------------------

export async function optimizeFrameDurations(
  things: {
    items: ThingType[]
    outfits: ThingType[]
    effects: ThingType[]
  },
  config: OptimizeDurationsConfig,
  onProgress: (progress: OptimizeDurationsProgress) => void
): Promise<OptimizeDurationsResult> {
  const totalSteps = 5
  let step = 0

  onProgress({ step: step++, totalSteps, label: 'Starting optimization...' })
  await yieldToUI()

  // Step 1: Items
  let itemsResult = things.items
  let itemsChanged = 0
  onProgress({ step: step++, totalSteps, label: 'Changing durations in items...' })
  await yieldToUI()
  if (config.items.enabled) {
    const r = changeFrameDurations(things.items, config.items.minimum, config.items.maximum)
    itemsResult = r.result
    itemsChanged = r.changed
  }

  // Step 2: Outfits
  let outfitsResult = things.outfits
  let outfitsChanged = 0
  onProgress({ step: step++, totalSteps, label: 'Changing durations in outfits...' })
  await yieldToUI()
  if (config.outfits.enabled) {
    const r = changeFrameDurations(things.outfits, config.outfits.minimum, config.outfits.maximum)
    outfitsResult = r.result
    outfitsChanged = r.changed
  }

  // Step 3: Effects
  let effectsResult = things.effects
  let effectsChanged = 0
  onProgress({ step: step++, totalSteps, label: 'Changing durations in effects...' })
  await yieldToUI()
  if (config.effects.enabled) {
    const r = changeFrameDurations(things.effects, config.effects.minimum, config.effects.maximum)
    effectsResult = r.result
    effectsChanged = r.changed
  }

  // Step 4: Done
  const totalChanged = itemsChanged + outfitsChanged + effectsChanged
  onProgress({ step: step++, totalSteps, label: `Done. ${totalChanged} objects changed.` })

  return {
    newThings: {
      items: itemsResult,
      outfits: outfitsResult,
      effects: effectsResult
    },
    itemsChanged,
    outfitsChanged,
    effectsChanged,
    totalChanged
  }
}
