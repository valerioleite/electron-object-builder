/**
 * Outfit colorization data.
 * Ported from legacy AS3: otlib/utils/OutfitData.as
 *
 * Stores HSI color indices (0-132) for each body part of an outfit
 * and addon bitmask for additional equipment layers.
 */

export interface OutfitData {
  /** HSI color index for head (0-132) */
  head: number
  /** HSI color index for body (0-132) */
  body: number
  /** HSI color index for legs (0-132) */
  legs: number
  /** HSI color index for feet (0-132) */
  feet: number
  /** Bitmask: bit 0 = addon 1 (patternY=1), bit 1 = addon 2 (patternY=2) */
  addons: number
}

export function createOutfitData(head = 0, body = 0, legs = 0, feet = 0, addons = 0): OutfitData {
  return { head, body, legs, feet, addons }
}

export function cloneOutfitData(data: OutfitData): OutfitData {
  return { head: data.head, body: data.body, legs: data.legs, feet: data.feet, addons: data.addons }
}
