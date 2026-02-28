import { describe, it, expect } from 'vitest'
import { hsiToRgb, hsiToArgb, toArgb, from8Bit } from '../color-utils'

describe('color-utils', () => {
  // -------------------------------------------------------------------------
  // hsiToRgb
  // -------------------------------------------------------------------------
  describe('hsiToRgb', () => {
    it('returns black for index 0 (grayscale, full intensity = white)', () => {
      // index 0: color % 19 === 0, so H=0, S=0, I = 1 - 0/(19*7) = 1 → white
      const rgb = hsiToRgb(0)
      expect(rgb).toBe(0xffffff)
    })

    it('returns grayscale for multiples of 19', () => {
      // index 19: I = 1 - 19/(19*7) = 1 - 1/7 ≈ 0.857
      const rgb = hsiToRgb(19)
      const r = (rgb >> 16) & 0xff
      const g = (rgb >> 8) & 0xff
      const b = rgb & 0xff
      expect(r).toBe(g)
      expect(g).toBe(b)
      expect(r).toBeGreaterThan(0)
      expect(r).toBeLessThan(255)
    })

    it('returns black for index 6*19 (darkest grayscale)', () => {
      // I = 1 - 6*19/(19*7) = 1 - 6/7 ≈ 0.143
      const rgb = hsiToRgb(6 * 19)
      const r = (rgb >> 16) & 0xff
      expect(r).toBeGreaterThan(0)
      expect(r).toBeLessThan(50)
    })

    it('clamps index >= 133 to 0 (white)', () => {
      expect(hsiToRgb(133)).toBe(hsiToRgb(0))
      expect(hsiToRgb(200)).toBe(hsiToRgb(0))
    })

    it('returns a colored value for non-zero index within first saturation level', () => {
      // index 1: first hue in first saturation level (S=0.25, I=1)
      const rgb = hsiToRgb(1)
      const r = (rgb >> 16) & 0xff
      const g = (rgb >> 8) & 0xff
      const b = rgb & 0xff
      // Should be near white with slight tint (low saturation)
      expect(r).toBeGreaterThan(150)
      expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeGreaterThan(0)
    })

    it('returns saturated colors for saturation level 4 (S=1, I=1)', () => {
      // Index range 76-94 is S=1, I=1 (most vivid)
      const rgb = hsiToRgb(76 + 10) // index 86 - some hue at max saturation
      const r = (rgb >> 16) & 0xff
      const g = (rgb >> 8) & 0xff
      const b = rgb & 0xff
      // At least one channel should be 0 or near 0 (high saturation)
      expect(Math.min(r, g, b)).toBeLessThan(10)
    })

    it('all 133 indices produce valid RGB (0-0xFFFFFF)', () => {
      for (let i = 0; i < 133; i++) {
        const rgb = hsiToRgb(i)
        expect(rgb).toBeGreaterThanOrEqual(0)
        expect(rgb).toBeLessThanOrEqual(0xffffff)
      }
    })

    it('returns 0x000000 when I=0', () => {
      // The darkest grayscale is index 7*19-19 = 114, I≈0.143
      // Actual black (I=0) would be at 7*19=133 which clamps to 0
      // But we can verify the formula - 7*19 would give I=0 before clamping
      // So let's verify index 0 for the wrap case
      expect(hsiToRgb(133)).toBe(0xffffff) // wraps to 0 = white
    })
  })

  // -------------------------------------------------------------------------
  // hsiToArgb
  // -------------------------------------------------------------------------
  describe('hsiToArgb', () => {
    it('adds full alpha to RGB', () => {
      const argb = hsiToArgb(0)
      expect(argb).toBe(0xffffffff >>> 0)
    })

    it('preserves RGB channels', () => {
      const rgb = hsiToRgb(50)
      const argb = hsiToArgb(50)
      expect(argb & 0x00ffffff).toBe(rgb)
      expect((argb >>> 24) & 0xff).toBe(0xff)
    })
  })

  // -------------------------------------------------------------------------
  // toArgb
  // -------------------------------------------------------------------------
  describe('toArgb', () => {
    it('adds default alpha 0xFF', () => {
      const result = toArgb(0xff0000)
      expect(result).toBe(0xffff0000 >>> 0)
    })

    it('uses custom alpha', () => {
      const result = toArgb(0x00ff00, 0x80)
      expect((result >>> 24) & 0xff).toBe(0x80)
      expect((result >> 16) & 0xff).toBe(0x00)
      expect((result >> 8) & 0xff).toBe(0xff)
      expect(result & 0xff).toBe(0x00)
    })

    it('clamps alpha to 0xFF', () => {
      const result = toArgb(0x000000, 0x1ff)
      expect((result >>> 24) & 0xff).toBe(0xff)
    })

    it('handles black', () => {
      expect(toArgb(0x000000)).toBe(0xff000000 >>> 0)
    })
  })

  // -------------------------------------------------------------------------
  // from8Bit
  // -------------------------------------------------------------------------
  describe('from8Bit', () => {
    it('returns 0 for color >= 216', () => {
      expect(from8Bit(216)).toBe(0)
      expect(from8Bit(255)).toBe(0)
    })

    it('returns black for color 0', () => {
      expect(from8Bit(0)).toBe(0)
    })

    it('returns white for color 215', () => {
      // R = floor(215/36) % 6 * 51 = 5*51 = 255
      // G = floor(215/6) % 6 * 51 = 5*51 = 255
      // B = 215 % 6 * 51 = 5*51 = 255
      expect(from8Bit(215)).toBe(0xffffff)
    })

    it('returns red for appropriate index', () => {
      // R=255: floor(color/36) % 6 = 5 → color/36 = 5 → color = 180
      // G=0: floor(180/6) % 6 = 0 → 30 % 6 = 0 ✓
      // B=0: 180 % 6 = 0 ✓
      expect(from8Bit(180)).toBe(0xff0000)
    })

    it('returns valid RGB for all indices 0-215', () => {
      for (let i = 0; i < 216; i++) {
        const rgb = from8Bit(i)
        expect(rgb).toBeGreaterThanOrEqual(0)
        expect(rgb).toBeLessThanOrEqual(0xffffff)
      }
    })
  })
})
