/**
 * Color conversion utilities for OpenTibia outfit colorization.
 * Ported from legacy AS3: otlib/utils/ColorUtils.as
 *
 * The HSI color system uses indices 0-132 (7 saturation levels x 19 hues)
 * to represent outfit colors (head, body, legs, feet).
 */

const HSI_VALUES = 7
const HSI_STEPS = 19

/**
 * Convert an HSI color index (0-132) to RGB packed integer.
 * HSI indices are used by the OpenTibia protocol for outfit colors.
 */
export function hsiToRgb(color: number): number {
  let H = 0
  let S = 0
  let I = 0

  if (color >= HSI_STEPS * HSI_VALUES) {
    color = 0
  }

  if (color % HSI_STEPS === 0) {
    H = 0
    S = 0
    I = 1 - color / HSI_STEPS / HSI_VALUES
  } else {
    H = (color % HSI_STEPS) * (1 / 18)
    S = 1
    I = 1

    switch (Math.floor(color / HSI_STEPS)) {
      case 0:
        S = 0.25
        I = 1
        break
      case 1:
        S = 0.25
        I = 0.75
        break
      case 2:
        S = 0.5
        I = 0.75
        break
      case 3:
        S = 0.667
        I = 0.75
        break
      case 4:
        S = 1
        I = 1
        break
      case 5:
        S = 1
        I = 0.75
        break
      case 6:
        S = 1
        I = 0.5
        break
    }
  }

  if (I === 0) return 0x000000
  if (S === 0) {
    const v = Math.floor(I * 0xff)
    return (v << 16) | (v << 8) | v
  }

  let R = 0
  let G = 0
  let B = 0

  if (H < 1 / 6) {
    R = I
    B = I * (1 - S)
    G = B + (I - B) * 6 * H
  } else if (H < 2 / 6) {
    G = I
    B = I * (1 - S)
    R = G - (I - B) * (6 * H - 1)
  } else if (H < 3 / 6) {
    G = I
    R = I * (1 - S)
    B = R + (I - R) * (6 * H - 2)
  } else if (H < 4 / 6) {
    B = I
    R = I * (1 - S)
    G = B - (I - R) * (6 * H - 3)
  } else if (H < 5 / 6) {
    B = I
    G = I * (1 - S)
    R = G + (I - G) * (6 * H - 4)
  } else {
    R = I
    G = I * (1 - S)
    B = R - (I - G) * (6 * H - 5)
  }

  return (Math.floor(R * 0xff) << 16) | (Math.floor(G * 0xff) << 8) | Math.floor(B * 0xff)
}

/**
 * Convert an HSI color index to ARGB packed integer (with full alpha).
 */
export function hsiToArgb(color: number): number {
  return toArgb(hsiToRgb(color))
}

/**
 * Add alpha channel to an RGB packed integer.
 */
export function toArgb(color: number, alpha: number = 0xff): number {
  const R = (color >> 16) & 0xff
  const G = (color >> 8) & 0xff
  const B = color & 0xff
  alpha = Math.min(alpha, 0xff)
  return ((alpha << 24) | (R << 16) | (G << 8) | B) >>> 0
}

/**
 * Convert 8-bit indexed color (0-215) to RGB packed integer.
 */
export function from8Bit(color: number): number {
  if (color >= 216) return 0
  const R = (Math.floor(color / 36) % 6) * 51
  const G = (Math.floor(color / 6) % 6) * 51
  const B = (color % 6) * 51
  return (R << 16) | (G << 8) | B
}
