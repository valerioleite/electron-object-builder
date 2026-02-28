import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { SpriteRenderer } from '../SpriteRenderer'
import { useAppStore, useEditorStore, useSpriteStore } from '../../../stores'
import {
  ThingCategory,
  type ThingData,
  type ThingType,
  createThingType
} from '../../../types/things'
import { createFrameGroup, FrameGroupType, type FrameGroup } from '../../../types/animation'
import { SPRITE_DEFAULT_DATA_SIZE } from '../../../types/sprites'
import type { SpriteData } from '../../../types/sprites'
import { createOutfitData } from '../../../services/sprite-render/outfit-data'
import type { ClientInfo } from '../../../types/project'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeSolidSprite(a: number, r: number, g: number, b: number): Uint8Array {
  const pixels = new Uint8Array(SPRITE_DEFAULT_DATA_SIZE)
  for (let i = 0; i < SPRITE_DEFAULT_DATA_SIZE; i += 4) {
    pixels[i] = a
    pixels[i + 1] = r
    pixels[i + 2] = g
    pixels[i + 3] = b
  }
  return pixels
}

function makeThing(overrides: Partial<ThingType> = {}): ThingType {
  const fg: FrameGroup = {
    ...createFrameGroup(),
    spriteIndex: [1]
  }
  return {
    ...createThingType(),
    id: 100,
    category: ThingCategory.ITEM,
    frameGroups: [fg],
    ...overrides
  }
}

function makeThingData(thing?: ThingType): ThingData {
  const t = thing ?? makeThing()
  const sprites = new Map<FrameGroupType, SpriteData[]>()
  const fg = t.frameGroups[0]!
  const spriteData: SpriteData[] = fg.spriteIndex.map((_, i) => ({
    id: i + 1,
    pixels: makeSolidSprite(0xff, 0x80, 0x80, 0x80)
  }))
  sprites.set(FrameGroupType.DEFAULT, spriteData)
  return {
    obdVersion: 0,
    clientVersion: 1056,
    thing: t,
    sprites,
    xmlAttributes: null
  }
}

function loadAppStore(): void {
  useAppStore.getState().setClientInfo({
    clientVersion: 1056,
    clientVersionStr: '10.56',
    features: {
      extended: true,
      transparency: false,
      improvedAnimations: true,
      frameGroups: true,
      metadataController: 'default',
      attributeServer: null
    }
  } as ClientInfo)
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  act(() => {
    useAppStore.getState().unloadProject()
    useEditorStore.getState().setEditingThingData(null)
    useSpriteStore.getState().clearSprites()
  })
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SpriteRenderer', () => {
  describe('empty state', () => {
    it('renders with null thingData', () => {
      render(<SpriteRenderer thingData={null} />)
      expect(screen.getByTestId('sprite-renderer')).toBeInTheDocument()
    })

    it('renders canvas element', () => {
      render(<SpriteRenderer thingData={null} />)
      expect(screen.getByTestId('sprite-renderer-canvas')).toBeInTheDocument()
    })
  })

  describe('with thing data', () => {
    it('renders with simple item', () => {
      loadAppStore()
      const data = makeThingData()
      render(<SpriteRenderer thingData={data} />)
      expect(screen.getByTestId('sprite-renderer')).toBeInTheDocument()
    })

    it('renders with multi-tile item (2x2)', () => {
      loadAppStore()
      const fg: FrameGroup = {
        ...createFrameGroup(),
        width: 2,
        height: 2,
        spriteIndex: [1, 2, 3, 4]
      }
      const thing = makeThing({ frameGroups: [fg] })
      const data = makeThingData(thing)
      render(<SpriteRenderer thingData={data} />)
      expect(screen.getByTestId('sprite-renderer')).toBeInTheDocument()
    })

    it('renders with outfit thing', () => {
      loadAppStore()
      const fg: FrameGroup = {
        ...createFrameGroup(),
        layers: 2,
        patternX: 4,
        spriteIndex: new Array(8).fill(1)
      }
      const thing = makeThing({
        category: ThingCategory.OUTFIT,
        frameGroups: [fg]
      })
      const data = makeThingData(thing)
      const outfit = createOutfitData(10, 20, 30, 40)
      render(<SpriteRenderer thingData={data} outfitData={outfit} />)
      expect(screen.getByTestId('sprite-renderer')).toBeInTheDocument()
    })

    it('renders without outfit data for outfit thing (no colorization)', () => {
      loadAppStore()
      const fg: FrameGroup = {
        ...createFrameGroup(),
        layers: 2,
        patternX: 4,
        spriteIndex: new Array(8).fill(1)
      }
      const thing = makeThing({
        category: ThingCategory.OUTFIT,
        frameGroups: [fg]
      })
      const data = makeThingData(thing)
      render(<SpriteRenderer thingData={data} />)
      expect(screen.getByTestId('sprite-renderer')).toBeInTheDocument()
    })
  })

  describe('props', () => {
    it('applies className', () => {
      render(<SpriteRenderer thingData={null} className="test-class" />)
      expect(screen.getByTestId('sprite-renderer')).toHaveClass('test-class')
    })

    it('accepts frameGroupType prop', () => {
      loadAppStore()
      const data = makeThingData()
      render(<SpriteRenderer thingData={data} frameGroupType={FrameGroupType.WALKING} />)
      expect(screen.getByTestId('sprite-renderer')).toBeInTheDocument()
    })

    it('accepts frame prop', () => {
      loadAppStore()
      const data = makeThingData()
      render(<SpriteRenderer thingData={data} frame={0} />)
      expect(screen.getByTestId('sprite-renderer')).toBeInTheDocument()
    })

    it('accepts patternX prop', () => {
      loadAppStore()
      const data = makeThingData()
      render(<SpriteRenderer thingData={data} patternX={2} />)
      expect(screen.getByTestId('sprite-renderer')).toBeInTheDocument()
    })

    it('accepts zoom prop', () => {
      loadAppStore()
      const data = makeThingData()
      render(<SpriteRenderer thingData={data} zoom={2} />)
      expect(screen.getByTestId('sprite-renderer')).toBeInTheDocument()
    })

    it('accepts minSize prop', () => {
      loadAppStore()
      const data = makeThingData()
      render(<SpriteRenderer thingData={data} minSize={64} />)
      expect(screen.getByTestId('sprite-renderer')).toBeInTheDocument()
    })

    it('accepts showCheckerboard=false', () => {
      loadAppStore()
      const data = makeThingData()
      render(<SpriteRenderer thingData={data} showCheckerboard={false} />)
      expect(screen.getByTestId('sprite-renderer')).toBeInTheDocument()
    })

    it('accepts drawBlendLayer prop', () => {
      loadAppStore()
      const data = makeThingData()
      render(<SpriteRenderer thingData={data} drawBlendLayer={true} />)
      expect(screen.getByTestId('sprite-renderer')).toBeInTheDocument()
    })
  })

  describe('zoom', () => {
    it('calls onZoomChange on wheel event', () => {
      loadAppStore()
      const data = makeThingData()
      const onZoomChange = vi.fn()
      render(<SpriteRenderer thingData={data} onZoomChange={onZoomChange} />)

      fireEvent.wheel(screen.getByTestId('sprite-renderer'), { deltaY: -100 })
      expect(onZoomChange).toHaveBeenCalled()
    })

    it('resets zoom on double click', () => {
      loadAppStore()
      const data = makeThingData()
      const onZoomChange = vi.fn()
      render(<SpriteRenderer thingData={data} onZoomChange={onZoomChange} />)

      fireEvent.doubleClick(screen.getByTestId('sprite-renderer'))
      expect(onZoomChange).toHaveBeenCalledWith(1)
    })

    it('respects controlled zoom prop', () => {
      loadAppStore()
      const data = makeThingData()
      const onZoomChange = vi.fn()
      render(<SpriteRenderer thingData={data} zoom={3} onZoomChange={onZoomChange} />)

      fireEvent.wheel(screen.getByTestId('sprite-renderer'), { deltaY: -100 })
      // Should call with zoom near 3 + step
      expect(onZoomChange).toHaveBeenCalled()
      const newZoom = onZoomChange.mock.calls[0][0]
      expect(newZoom).toBeGreaterThan(3)
    })
  })

  describe('pan', () => {
    it('shows grab cursor when zoom > 1', () => {
      loadAppStore()
      const data = makeThingData()
      render(<SpriteRenderer thingData={data} zoom={2} />)
      const el = screen.getByTestId('sprite-renderer')
      expect(el.style.cursor).toBe('grab')
    })

    it('shows default cursor when zoom <= 1', () => {
      loadAppStore()
      const data = makeThingData()
      render(<SpriteRenderer thingData={data} zoom={1} />)
      const el = screen.getByTestId('sprite-renderer')
      expect(el.style.cursor).toBe('default')
    })
  })

  describe('canvas rendering', () => {
    it('sets imageRendering to pixelated', () => {
      render(<SpriteRenderer thingData={null} />)
      const canvas = screen.getByTestId('sprite-renderer-canvas') as HTMLCanvasElement
      expect(canvas.style.imageRendering).toBe('pixelated')
    })
  })

  describe('sprite store fallback', () => {
    it('reads from sprite store when inline sprites are empty', () => {
      loadAppStore()
      const fg: FrameGroup = {
        ...createFrameGroup(),
        spriteIndex: [5]
      }
      const thing = makeThing({ frameGroups: [fg] })
      const data: ThingData = {
        obdVersion: 0,
        clientVersion: 1056,
        thing,
        sprites: new Map([[FrameGroupType.DEFAULT, [{ id: 5, pixels: null }]]]),
        xmlAttributes: null
      }

      // Load a sprite into the store
      const sprites = new Map<number, Uint8Array>()
      sprites.set(5, new Uint8Array([0, 1, 0xff, 0x80, 0x80, 0x80])) // Some compressed data
      act(() => {
        useSpriteStore.getState().loadSprites(sprites)
      })

      render(<SpriteRenderer thingData={data} />)
      expect(screen.getByTestId('sprite-renderer')).toBeInTheDocument()
    })
  })
})
