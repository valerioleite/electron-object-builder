/**
 * Frame groups conversion algorithm.
 * Converts outfits between single-group (legacy) and dual-group (idle + walking) formats.
 * Ported from legacy FrameGroupsConverter.as + ThingUtils.convertFrameGroups().
 */

import { FrameGroupType } from '../../types/animation'
import {
  type ThingType,
  cloneThingType,
  getThingFrameGroup,
  addThingFrameGroupState,
  removeThingFrameGroupState
} from '../../types/things'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConvertFrameGroupsConfig {
  addFrameGroups: boolean
  removeMounts: boolean
  improvedAnimations: boolean
  defaultDuration: number
}

export interface ConvertFrameGroupsProgress {
  step: number
  totalSteps: number
  label: string
}

export interface ConvertFrameGroupsResult {
  newOutfits: ThingType[]
  changed: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function yieldToUI(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

// ---------------------------------------------------------------------------
// Main conversion
// ---------------------------------------------------------------------------

export async function convertFrameGroups(
  outfits: ThingType[],
  config: ConvertFrameGroupsConfig,
  onProgress: (progress: ConvertFrameGroupsProgress) => void
): Promise<ConvertFrameGroupsResult> {
  const totalSteps = 3

  // Step 0: Starting
  onProgress({ step: 0, totalSteps, label: 'Starting conversion...' })
  await yieldToUI()

  // Step 1: Converting outfits
  onProgress({ step: 1, totalSteps, label: 'Converting outfits...' })
  await yieldToUI()

  let changed = 0
  const newOutfits = outfits.map((outfit) => {
    // Skip animateAlways outfits (matching legacy ThingUtils.convertFrameGroups)
    if (outfit.animateAlways) return outfit

    if (config.addFrameGroups) {
      // ADD: only process outfits with single frame group and enough frames
      const defaultFg = getThingFrameGroup(outfit, FrameGroupType.DEFAULT)
      if (!defaultFg || defaultFg.frames < 3) return outfit
      if (getThingFrameGroup(outfit, FrameGroupType.WALKING)) return outfit

      const clone = cloneThingType(outfit)
      addThingFrameGroupState(clone, config.improvedAnimations, config.defaultDuration)
      changed++
      return clone
    } else {
      // REMOVE: only process outfits with multiple frame groups
      if (!getThingFrameGroup(outfit, FrameGroupType.WALKING)) return outfit

      const clone = cloneThingType(outfit)
      removeThingFrameGroupState(clone, config.defaultDuration, config.removeMounts)
      changed++
      return clone
    }
  })

  // Step 2: Done
  onProgress({
    step: 2,
    totalSteps,
    label: changed > 0 ? `Done - ${changed} outfits converted` : 'Done - no outfits needed conversion'
  })
  await yieldToUI()

  return { newOutfits, changed }
}
