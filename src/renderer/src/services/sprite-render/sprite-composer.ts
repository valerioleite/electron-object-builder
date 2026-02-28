/**
 * Sprite composition engine for rendering multi-tile, multi-layer OpenTibia objects.
 * Ported from legacy AS3:
 * - otlib/things/ThingData.as (getSpriteSheet, getColoredSpriteSheet, setColor)
 * - otlib/components/ThingDataView.as (draw method)
 *
 * Handles building sprite sheet atlases from frame groups, outfit colorization
 * with HSI-to-RGB channel masking, and single-frame extraction for display.
 */

import { SPRITE_DEFAULT_SIZE, SPRITE_DEFAULT_DATA_SIZE } from '../../types/sprites'
import type { FrameGroup } from '../../types/animation'
import {
  getFrameGroupTotalX,
  getFrameGroupTotalY,
  getFrameGroupTotalTextures,
  getFrameGroupSpriteIndex,
  getFrameGroupTextureIndex
} from '../../types/animation'
import { argbToRgba } from '../spr'
import type { OutfitData } from './outfit-data'
import { hsiToArgb } from './color-utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Rectangle within a sprite sheet */
export interface TextureRect {
  x: number
  y: number
  width: number
  height: number
}

/** Composed sprite sheet with texture index for frame extraction */
export interface SpriteSheet {
  /** ARGB pixel data */
  pixels: Uint8Array
  /** Total width in pixels */
  width: number
  /** Total height in pixels */
  height: number
  /** Rectangles for each texture in the sheet */
  textureIndex: TextureRect[]
}

/** Rendered frame ready for display */
export interface RenderedFrame {
  /** ARGB pixel data for the frame */
  pixels: Uint8Array
  /** Frame width in pixels */
  width: number
  /** Frame height in pixels */
  height: number
}

/**
 * Provider function for sprite pixel data.
 * Given a sprite array index (position in spriteIndex[]), returns
 * 4096 bytes of ARGB pixel data, or null if the sprite is empty.
 */
export type SpritePixelProvider = (spriteArrayIndex: number) => Uint8Array | null

// ---------------------------------------------------------------------------
// Internal pixel helpers
// ---------------------------------------------------------------------------

/**
 * Blit a single sprite (32x32 ARGB) onto a larger destination buffer
 * with alpha compositing (premultiplied "over" operation).
 */
function blitSprite(
  dst: Uint8Array,
  dstWidth: number,
  src: Uint8Array,
  destX: number,
  destY: number
): void {
  const size = SPRITE_DEFAULT_SIZE
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const si = (y * size + x) * 4
      const sA = src[si]
      if (sA === 0) continue

      const di = ((destY + y) * dstWidth + (destX + x)) * 4
      if (sA === 0xff) {
        dst[di] = src[si]
        dst[di + 1] = src[si + 1]
        dst[di + 2] = src[si + 2]
        dst[di + 3] = src[si + 3]
      } else {
        const srcA = sA / 255
        const dstA = dst[di] / 255
        const outA = srcA + dstA * (1 - srcA)
        if (outA > 0) {
          dst[di] = Math.min(255, Math.round(outA * 255))
          dst[di + 1] = Math.round(
            (src[si + 1] * srcA + dst[di + 1] * dstA * (1 - srcA)) / outA
          )
          dst[di + 2] = Math.round(
            (src[si + 2] * srcA + dst[di + 2] * dstA * (1 - srcA)) / outA
          )
          dst[di + 3] = Math.round(
            (src[si + 3] * srcA + dst[di + 3] * dstA * (1 - srcA)) / outA
          )
        }
      }
    }
  }
}

/**
 * Copy a rectangular region from a source buffer to a destination buffer
 * with alpha compositing.
 */
function blitRegion(
  dst: Uint8Array,
  dstWidth: number,
  src: Uint8Array,
  srcWidth: number,
  srcX: number,
  srcY: number,
  w: number,
  h: number,
  destX: number,
  destY: number
): void {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = ((srcY + y) * srcWidth + (srcX + x)) * 4
      const sA = src[si]
      if (sA === 0) continue

      const di = ((destY + y) * dstWidth + (destX + x)) * 4
      if (sA === 0xff) {
        dst[di] = src[si]
        dst[di + 1] = src[si + 1]
        dst[di + 2] = src[si + 2]
        dst[di + 3] = src[si + 3]
      } else {
        const srcAlpha = sA / 255
        const dstAlpha = dst[di] / 255
        const outA = srcAlpha + dstAlpha * (1 - srcAlpha)
        if (outA > 0) {
          dst[di] = Math.min(255, Math.round(outA * 255))
          dst[di + 1] = Math.round(
            (src[si + 1] * srcAlpha + dst[di + 1] * dstAlpha * (1 - srcAlpha)) / outA
          )
          dst[di + 2] = Math.round(
            (src[si + 2] * srcAlpha + dst[di + 2] * dstAlpha * (1 - srcAlpha)) / outA
          )
          dst[di + 3] = Math.round(
            (src[si + 3] * srcAlpha + dst[di + 3] * dstAlpha * (1 - srcAlpha)) / outA
          )
        }
      }
    }
  }
}

/**
 * Copy a rectangular region without alpha compositing (replace).
 */
function copyRegion(
  dst: Uint8Array,
  dstWidth: number,
  src: Uint8Array,
  srcWidth: number,
  srcX: number,
  srcY: number,
  w: number,
  h: number,
  destX: number,
  destY: number
): void {
  for (let y = 0; y < h; y++) {
    const srcRow = ((srcY + y) * srcWidth + srcX) * 4
    const dstRow = ((destY + y) * dstWidth + destX) * 4
    dst.set(src.subarray(srcRow, srcRow + w * 4), dstRow)
  }
}

// ---------------------------------------------------------------------------
// Sprite Sheet Building
// ---------------------------------------------------------------------------

/**
 * Build a sprite sheet (atlas) from a FrameGroup's sprites.
 * Arranges all sprites in a grid layout matching the legacy getSpriteSheet() logic.
 *
 * @param fg - Frame group defining the layout
 * @param getPixels - Provider for sprite pixel data (ARGB format, indexed by spriteIndex position)
 * @param bgColor - Background color as ARGB uint32 (default: 0x00000000 transparent)
 */
export function buildSpriteSheet(
  fg: FrameGroup,
  getPixels: SpritePixelProvider,
  bgColor: number = 0
): SpriteSheet {
  const size = SPRITE_DEFAULT_SIZE
  const totalX = getFrameGroupTotalX(fg)
  const totalY = getFrameGroupTotalY(fg)
  const bitmapWidth = totalX * fg.width * size
  const bitmapHeight = totalY * fg.height * size
  const pixelsWidth = fg.width * size
  const pixelsHeight = fg.height * size

  if (bitmapWidth === 0 || bitmapHeight === 0) {
    return { pixels: new Uint8Array(0), width: 0, height: 0, textureIndex: [] }
  }

  const pixels = new Uint8Array(bitmapWidth * bitmapHeight * 4)

  if (bgColor !== 0) {
    const a = (bgColor >>> 24) & 0xff
    const r = (bgColor >> 16) & 0xff
    const g = (bgColor >> 8) & 0xff
    const b = bgColor & 0xff
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = a
      pixels[i + 1] = r
      pixels[i + 2] = g
      pixels[i + 3] = b
    }
  }

  const totalTextures = getFrameGroupTotalTextures(fg)
  const textureIndex: TextureRect[] = new Array(totalTextures)

  for (let f = 0; f < fg.frames; f++) {
    for (let z = 0; z < fg.patternZ; z++) {
      for (let y = 0; y < fg.patternY; y++) {
        for (let x = 0; x < fg.patternX; x++) {
          for (let l = 0; l < fg.layers; l++) {
            const texIdx = getFrameGroupTextureIndex(fg, l, x, y, z, f)
            const fx = (texIdx % totalX) * pixelsWidth
            const fy = Math.floor(texIdx / totalX) * pixelsHeight

            textureIndex[texIdx] = { x: fx, y: fy, width: pixelsWidth, height: pixelsHeight }

            for (let w = 0; w < fg.width; w++) {
              for (let h = 0; h < fg.height; h++) {
                const sprIdx = getFrameGroupSpriteIndex(fg, w, h, l, x, y, z, f)
                const destX = (fg.width - w - 1) * size + fx
                const destY = (fg.height - h - 1) * size + fy
                const spritePixels = getPixels(sprIdx)
                if (spritePixels && spritePixels.length >= SPRITE_DEFAULT_DATA_SIZE) {
                  blitSprite(pixels, bitmapWidth, spritePixels, destX, destY)
                }
              }
            }
          }
        }
      }
    }
  }

  return { pixels, width: bitmapWidth, height: bitmapHeight, textureIndex }
}

// ---------------------------------------------------------------------------
// Outfit Colorization
// ---------------------------------------------------------------------------

/**
 * Apply the equivalent of the legacy ColorMatrixFilter to blend layer pixels.
 *
 * The original Flash matrix [1,-1,0,0,0, -1,1,0,0,0, 1,1,0,0,-255, 0,0,-1,1,0]
 * transforms channels to separate body part regions:
 *   newR = R - G        (body region)
 *   newG = -R + G       (legs region)
 *   newB = R + G - 255  (head region, where yellow = R+G)
 *   newA = A - B         (removes feet from alpha)
 */
function applyBlendFilter(pixels: Uint8Array, width: number, height: number): void {
  const total = width * height * 4
  for (let i = 0; i < total; i += 4) {
    const a = pixels[i]
    const r = pixels[i + 1]
    const g = pixels[i + 2]
    const b = pixels[i + 3]

    pixels[i] = Math.max(0, Math.min(255, a - b))
    pixels[i + 1] = Math.max(0, Math.min(255, r - g))
    pixels[i + 2] = Math.max(0, Math.min(255, -r + g))
    pixels[i + 3] = Math.max(0, Math.min(255, r + g - 255))
  }
}

/** Flash BitmapDataChannel constants */
const CHANNEL_RED = 1
const CHANNEL_GREEN = 2
const CHANNEL_BLUE = 4

/**
 * Apply color to a grey bitmap using a blend channel mask.
 * Port of legacy ThingData.setColor():
 *   1. canvas = copy of grey
 *   2. canvas.alpha = blend[channel]  (blend channel becomes alpha mask)
 *   3. canvas.RGB *= color multipliers (tint with outfit color)
 *   4. alpha-composite canvas onto grey
 */
function setColor(
  grey: Uint8Array,
  blend: Uint8Array,
  width: number,
  height: number,
  channel: number,
  color: number
): void {
  const rMul = ((color >> 16) & 0xff) / 0xff
  const gMul = ((color >> 8) & 0xff) / 0xff
  const bMul = (color & 0xff) / 0xff

  const total = width * height * 4
  for (let i = 0; i < total; i += 4) {
    // Step 2: Get channel value from blend to use as alpha mask
    let channelValue: number
    if (channel === CHANNEL_BLUE) {
      channelValue = blend[i + 3] // B (ARGB: index 3)
    } else if (channel === CHANNEL_RED) {
      channelValue = blend[i + 1] // R (ARGB: index 1)
    } else {
      channelValue = blend[i + 2] // G (ARGB: index 2)
    }

    if (channelValue === 0) continue

    // Step 1 + 3: Take grey RGB, multiply by color
    const cR = Math.min(255, Math.round(grey[i + 1] * rMul))
    const cG = Math.min(255, Math.round(grey[i + 2] * gMul))
    const cB = Math.min(255, Math.round(grey[i + 3] * bMul))

    // Step 4: Alpha-composite onto grey
    if (channelValue === 255) {
      grey[i] = 255
      grey[i + 1] = cR
      grey[i + 2] = cG
      grey[i + 3] = cB
    } else {
      const srcA = channelValue / 255
      const dstA = grey[i] / 255
      const outA = srcA + dstA * (1 - srcA)
      if (outA > 0) {
        grey[i] = Math.min(255, Math.round(outA * 255))
        grey[i + 1] = Math.round(
          (cR * srcA + grey[i + 1] * dstA * (1 - srcA)) / outA
        )
        grey[i + 2] = Math.round(
          (cG * srcA + grey[i + 2] * dstA * (1 - srcA)) / outA
        )
        grey[i + 3] = Math.round(
          (cB * srcA + grey[i + 3] * dstA * (1 - srcA)) / outA
        )
      }
    }
  }
}

/**
 * Build a colorized sprite sheet for an outfit.
 * Applies outfit colors using the blend layer channel mask technique:
 * - Blue channel -> feet color (applied before filter)
 * - After filter: Blue -> head, Red -> body, Green -> legs
 *
 * The result has layers=1 and patternY=1 (flattened for display).
 *
 * Ported from legacy ThingData.getColoredSpriteSheet().
 */
export function buildColoredSpriteSheet(
  fg: FrameGroup,
  getPixels: SpritePixelProvider,
  outfitData: OutfitData
): SpriteSheet {
  if (fg.layers < 2) {
    return buildSpriteSheet(fg, getPixels, 0)
  }

  const size = SPRITE_DEFAULT_SIZE

  // Build full sprite sheet with all layers
  const fullSheet = buildSpriteSheet(fg, getPixels, 0)
  const fullTextureIndex = fullSheet.textureIndex

  // Flattened output dimensions (no layers, no patternY)
  const pixelsWidth = fg.width * size
  const pixelsHeight = fg.height * size
  const bitmapWidth = fg.patternZ * fg.patternX * pixelsWidth
  const bitmapHeight = fg.frames * pixelsHeight

  if (bitmapWidth === 0 || bitmapHeight === 0) {
    return { pixels: new Uint8Array(0), width: 0, height: 0, textureIndex: [] }
  }

  const bufSize = bitmapWidth * bitmapHeight * 4
  const resultBitmap = new Uint8Array(bufSize)

  // Build destination rect list for flattened coordinates (y=0 only)
  const rectList: (TextureRect | undefined)[] = []
  for (let f = 0; f < fg.frames; f++) {
    for (let z = 0; z < fg.patternZ; z++) {
      for (let x = 0; x < fg.patternX; x++) {
        const idx =
          (((f % fg.frames) * fg.patternZ + z) * fg.patternY + 0) * fg.patternX * fg.layers +
          x * fg.layers
        rectList[idx] = {
          x: (z * fg.patternX + x) * pixelsWidth,
          y: f * pixelsHeight,
          width: pixelsWidth,
          height: pixelsHeight
        }
      }
    }
  }

  // Process each patternY (base + addon layers)
  for (let y = 0; y < fg.patternY; y++) {
    // y=0 is always rendered (base), y>0 only if addon bit is set
    if (y > 0 && (outfitData.addons & (1 << (y - 1))) === 0) continue

    const grayBitmap = new Uint8Array(bufSize)
    const blendBitmap = new Uint8Array(bufSize)

    for (let f = 0; f < fg.frames; f++) {
      for (let z = 0; z < fg.patternZ; z++) {
        for (let x = 0; x < fg.patternX; x++) {
          // Source texture index in full sprite sheet
          const srcTexIdx =
            (((f % fg.frames) * fg.patternZ + z) * fg.patternY + y) * fg.patternX * fg.layers +
            x * fg.layers

          // Destination index (flattened, y=0)
          const dstTexIdx =
            (((f * fg.patternZ + z) * fg.patternY + 0) * fg.patternX + x) * fg.layers

          const destRect = rectList[dstTexIdx]
          if (!destRect) continue

          // Copy gray layer (layer 0) from full sheet
          if (srcTexIdx < fullTextureIndex.length) {
            const srcRect = fullTextureIndex[srcTexIdx]
            copyRegion(
              grayBitmap,
              bitmapWidth,
              fullSheet.pixels,
              fullSheet.width,
              srcRect.x,
              srcRect.y,
              srcRect.width,
              srcRect.height,
              destRect.x,
              destRect.y
            )
          }

          // Copy blend layer (layer 1) from full sheet
          if (srcTexIdx + 1 < fullTextureIndex.length) {
            const srcRect = fullTextureIndex[srcTexIdx + 1]
            copyRegion(
              blendBitmap,
              bitmapWidth,
              fullSheet.pixels,
              fullSheet.width,
              srcRect.x,
              srcRect.y,
              srcRect.width,
              srcRect.height,
              destRect.x,
              destRect.y
            )
          }
        }
      }
    }

    // Apply colorization sequence (matching legacy exactly):
    // 1. feet -> blue channel (before filter)
    setColor(grayBitmap, blendBitmap, bitmapWidth, bitmapHeight, CHANNEL_BLUE, hsiToArgb(outfitData.feet))
    // 2. Apply filter to redistribute channels
    applyBlendFilter(blendBitmap, bitmapWidth, bitmapHeight)
    // 3. head -> blue channel (after filter, blue = R+G-255 = yellow area)
    setColor(grayBitmap, blendBitmap, bitmapWidth, bitmapHeight, CHANNEL_BLUE, hsiToArgb(outfitData.head))
    // 4. body -> red channel
    setColor(grayBitmap, blendBitmap, bitmapWidth, bitmapHeight, CHANNEL_RED, hsiToArgb(outfitData.body))
    // 5. legs -> green channel
    setColor(grayBitmap, blendBitmap, bitmapWidth, bitmapHeight, CHANNEL_GREEN, hsiToArgb(outfitData.legs))

    // Alpha-composite colorized result onto output
    blitRegion(
      resultBitmap,
      bitmapWidth,
      grayBitmap,
      bitmapWidth,
      0,
      0,
      bitmapWidth,
      bitmapHeight,
      0,
      0
    )
  }

  // Build texture index for the flattened result
  const flatTextureIndex: TextureRect[] = []
  for (let f = 0; f < fg.frames; f++) {
    for (let z = 0; z < fg.patternZ; z++) {
      for (let x = 0; x < fg.patternX; x++) {
        flatTextureIndex.push({
          x: (z * fg.patternX + x) * pixelsWidth,
          y: f * pixelsHeight,
          width: pixelsWidth,
          height: pixelsHeight
        })
      }
    }
  }

  return {
    pixels: resultBitmap,
    width: bitmapWidth,
    height: bitmapHeight,
    textureIndex: flatTextureIndex
  }
}

// ---------------------------------------------------------------------------
// Frame Extraction
// ---------------------------------------------------------------------------

/**
 * Extract a single rendered frame from a sprite sheet.
 * Composites the relevant layers for display.
 *
 * Ported from legacy ThingDataView.draw().
 *
 * @param sheet - The sprite sheet (from buildSpriteSheet or buildColoredSpriteSheet)
 * @param fg - The frame group (use the original for non-outfits, or a modified fg for colorized)
 * @param options - Frame, pattern, and layer selection
 */
export function extractFrame(
  sheet: SpriteSheet,
  fg: FrameGroup,
  options: {
    layer?: number
    patternX?: number
    patternY?: number
    patternZ?: number
    frame?: number
    drawBlendLayer?: boolean
  } = {}
): RenderedFrame {
  const size = SPRITE_DEFAULT_SIZE
  const frameW = fg.width * size
  const frameH = fg.height * size

  if (frameW === 0 || frameH === 0 || sheet.textureIndex.length === 0) {
    return { pixels: new Uint8Array(0), width: 0, height: 0 }
  }

  const pixels = new Uint8Array(frameW * frameH * 4)
  const px = (options.patternX ?? 0) % fg.patternX
  const py = (options.patternY ?? 0) % fg.patternY
  const pz = (options.patternZ ?? 0) % fg.patternZ
  const frame = (options.frame ?? 0) % fg.frames
  const layers = options.drawBlendLayer ? fg.layers : 1

  for (let l = 0; l < layers; l++) {
    let texIdx = getFrameGroupTextureIndex(fg, l, px, py, pz, frame)
    if (texIdx >= sheet.textureIndex.length) {
      texIdx = 0
    }

    const rect = sheet.textureIndex[texIdx]
    if (!rect) continue

    blitRegion(
      pixels,
      frameW,
      sheet.pixels,
      sheet.width,
      rect.x,
      rect.y,
      Math.min(rect.width, frameW),
      Math.min(rect.height, frameH),
      0,
      0
    )
  }

  return { pixels, width: frameW, height: frameH }
}

// ---------------------------------------------------------------------------
// Canvas Rendering Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a rendered frame (ARGB) to Canvas2D ImageData.
 */
export function frameToImageData(frame: RenderedFrame): ImageData | null {
  if (frame.width === 0 || frame.height === 0) return null
  const rgba = argbToRgba(frame.pixels)
  return new ImageData(rgba, frame.width, frame.height)
}

/**
 * Draw a checkerboard pattern on a canvas context (for transparency visualization).
 */
export function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tileSize: number = 8
): void {
  ctx.fillStyle = '#636363'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#555555'
  for (let y = 0; y < height; y += tileSize) {
    for (let x = 0; x < width; x += tileSize) {
      if ((Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0) {
        ctx.fillRect(x, y, tileSize, tileSize)
      }
    }
  }
}
