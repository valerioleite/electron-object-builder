/**
 * Application settings re-exported from shared module,
 * plus renderer-specific helpers.
 *
 * The canonical type definition lives in src/shared/settings.ts
 * so both main and renderer processes can use it.
 */

import type { ThingCategory } from './things'

// Re-export the shared settings type and factory
export { type ObjectBuilderSettings, createObjectBuilderSettings } from '../../../shared/settings'
import type { ObjectBuilderSettings } from '../../../shared/settings'

// ---------------------------------------------------------------------------
// Renderer-specific helpers
// ---------------------------------------------------------------------------

/**
 * Returns the default animation duration (ms) for a given ThingCategory.
 * Mirrors legacy ObjectBuilderSettings.getDefaultDuration().
 */
export function getDefaultDuration(
  settings: ObjectBuilderSettings,
  category: ThingCategory
): number {
  switch (category) {
    case 'item':
      return settings.itemsDuration
    case 'outfit':
      return settings.outfitsDuration
    case 'effect':
      return settings.effectsDuration
    case 'missile':
      return settings.missilesDuration
    default:
      return 0
  }
}
