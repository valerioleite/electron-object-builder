/**
 * Tests for SpritePanel component.
 * Covers empty state, sprite grid, selection, preview,
 * action buttons, frame group selector, and drag-and-drop.
 */

import React, { act } from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SpritePanel } from '../SpritePanel'
import {
  resetAppStore,
  resetEditorStore,
  resetSpriteStore,
  useAppStore,
  useEditorStore
} from '../../../stores'
import {
  ThingCategory,
  createThingType,
  createClientInfo,
  FrameGroupType,
  createFrameGroup
} from '../../../types'
import type { ThingType, ThingData } from '../../../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeThing(
  id: number,
  category: ThingCategory,
  spriteIds: number[] = [100, 101, 102, 103],
  overrides: Partial<ThingType> = {}
): ThingType {
  const t = createThingType()
  t.id = id
  t.category = category
  const fg = createFrameGroup()
  fg.spriteIndex = spriteIds
  t.frameGroups = [fg]
  Object.assign(t, overrides)
  return t
}

function makeThingData(thing: ThingType, clientVersion = 1060): ThingData {
  return {
    obdVersion: 0,
    clientVersion,
    thing,
    sprites: new Map([[FrameGroupType.DEFAULT, []]]),
    xmlAttributes: null
  }
}

function loadEditorWithThing(
  id: number,
  category: ThingCategory,
  spriteIds: number[] = [100, 101, 102, 103],
  thingOverrides: Partial<ThingType> = {}
): void {
  const thing = makeThing(id, category, spriteIds, thingOverrides)
  const data = makeThingData(thing)

  const clientInfo = createClientInfo()
  clientInfo.clientVersion = 1060
  clientInfo.loaded = true

  useAppStore.setState({ clientInfo })
  useEditorStore.getState().setEditingThingData(data)
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

// Suppress jsdom canvas warnings (getContext not implemented without canvas npm package)
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  resetAppStore()
  resetEditorStore()
  resetSpriteStore()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SpritePanel', () => {
  // -----------------------------------------------------------------------
  // Empty state
  // -----------------------------------------------------------------------

  describe('empty state', () => {
    it('shows "No object selected" when no editing data', () => {
      render(<SpritePanel />)
      expect(screen.getByText('No object selected')).toBeInTheDocument()
    })

    it('shows header with "Sprites" label', () => {
      render(<SpritePanel />)
      expect(screen.getByText('Sprites')).toBeInTheDocument()
    })

    it('has sprite-panel test id', () => {
      render(<SpritePanel />)
      expect(screen.getByTestId('sprite-panel')).toBeInTheDocument()
    })

    it('does not show grid or actions', () => {
      render(<SpritePanel />)
      expect(screen.queryByTestId('sprite-grid')).not.toBeInTheDocument()
      expect(screen.queryByTestId('sprite-actions')).not.toBeInTheDocument()
    })
  })

  // -----------------------------------------------------------------------
  // With editing data - sprite grid
  // -----------------------------------------------------------------------

  describe('sprite grid', () => {
    beforeEach(() => {
      loadEditorWithThing(100, ThingCategory.ITEM)
    })

    it('shows sprite count in header', () => {
      render(<SpritePanel />)
      expect(screen.getByText('Sprites (4)')).toBeInTheDocument()
    })

    it('renders sprite grid container', () => {
      render(<SpritePanel />)
      expect(screen.getByTestId('sprite-grid')).toBeInTheDocument()
    })

    it('renders correct number of sprite cells', () => {
      render(<SpritePanel />)
      expect(screen.getByTestId('sprite-cell-0')).toBeInTheDocument()
      expect(screen.getByTestId('sprite-cell-1')).toBeInTheDocument()
      expect(screen.getByTestId('sprite-cell-2')).toBeInTheDocument()
      expect(screen.getByTestId('sprite-cell-3')).toBeInTheDocument()
    })

    it('shows sprite IDs in cells', () => {
      render(<SpritePanel />)
      expect(screen.getByText('#100')).toBeInTheDocument()
      expect(screen.getByText('#101')).toBeInTheDocument()
      expect(screen.getByText('#102')).toBeInTheDocument()
      expect(screen.getByText('#103')).toBeInTheDocument()
    })

    it('shows "empty" for sprite ID 0', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, [0, 50])
      render(<SpritePanel />)
      expect(screen.getByText('empty')).toBeInTheDocument()
      expect(screen.getByText('#50')).toBeInTheDocument()
    })

    it('shows "No sprites" when frame group has empty spriteIndex', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, [])
      render(<SpritePanel />)
      expect(screen.getByText('Empty')).toBeInTheDocument()
    })

    it('renders canvas elements for each sprite cell', () => {
      render(<SpritePanel />)
      const cells = screen.getAllByTestId(/^sprite-cell-/)
      for (const cell of cells) {
        const canvas = cell.querySelector('canvas')
        expect(canvas).toBeInTheDocument()
      }
    })

    it('renders with single sprite', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, [42])
      render(<SpritePanel />)
      expect(screen.getByText('Sprites (1)')).toBeInTheDocument()
      expect(screen.getByText('#42')).toBeInTheDocument()
    })
  })

  // -----------------------------------------------------------------------
  // Selection
  // -----------------------------------------------------------------------

  describe('selection', () => {
    beforeEach(() => {
      loadEditorWithThing(100, ThingCategory.ITEM)
    })

    it('selects a sprite cell on click', () => {
      render(<SpritePanel />)
      const cell = screen.getByTestId('sprite-cell-0')
      fireEvent.click(cell)
      expect(cell.className).toContain('bg-accent')
    })

    it('deselects on second click', () => {
      render(<SpritePanel />)
      const cell = screen.getByTestId('sprite-cell-0')
      fireEvent.click(cell)
      expect(cell.className).toContain('bg-accent')
      fireEvent.click(cell)
      expect(cell.className).not.toContain('bg-accent')
    })

    it('selects a different cell (previous is deselected)', () => {
      render(<SpritePanel />)
      const cell0 = screen.getByTestId('sprite-cell-0')
      const cell1 = screen.getByTestId('sprite-cell-1')
      fireEvent.click(cell0)
      expect(cell0.className).toContain('bg-accent')
      fireEvent.click(cell1)
      expect(cell1.className).toContain('bg-accent')
      expect(cell0.className).not.toContain('bg-accent')
    })
  })

  // -----------------------------------------------------------------------
  // Preview
  // -----------------------------------------------------------------------

  describe('preview', () => {
    beforeEach(() => {
      loadEditorWithThing(100, ThingCategory.ITEM)
    })

    it('does not show preview initially', () => {
      render(<SpritePanel />)
      expect(screen.queryByTestId('sprite-preview')).not.toBeInTheDocument()
    })

    it('shows preview when sprite is selected', () => {
      render(<SpritePanel />)
      fireEvent.click(screen.getByTestId('sprite-cell-1'))
      expect(screen.getByTestId('sprite-preview')).toBeInTheDocument()
      expect(screen.getByText('Sprite #101')).toBeInTheDocument()
    })

    it('shows preview on hover', () => {
      render(<SpritePanel />)
      fireEvent.mouseEnter(screen.getByTestId('sprite-cell-2'))
      expect(screen.getByTestId('sprite-preview')).toBeInTheDocument()
      expect(screen.getByText('Sprite #102')).toBeInTheDocument()
    })

    it('hides preview when hover leaves (no selection)', () => {
      render(<SpritePanel />)
      fireEvent.mouseEnter(screen.getByTestId('sprite-cell-2'))
      expect(screen.getByTestId('sprite-preview')).toBeInTheDocument()
      fireEvent.mouseLeave(screen.getByTestId('sprite-cell-2'))
      expect(screen.queryByTestId('sprite-preview')).not.toBeInTheDocument()
    })

    it('shows selected sprite preview when hover leaves', () => {
      render(<SpritePanel />)
      fireEvent.click(screen.getByTestId('sprite-cell-1'))
      expect(screen.getByText('Sprite #101')).toBeInTheDocument()
      // Hover a different cell
      fireEvent.mouseEnter(screen.getByTestId('sprite-cell-3'))
      expect(screen.getByText('Sprite #103')).toBeInTheDocument()
      // Leave hover -> back to selected
      fireEvent.mouseLeave(screen.getByTestId('sprite-cell-3'))
      expect(screen.getByText('Sprite #101')).toBeInTheDocument()
    })

    it('shows "(empty)" for sprite ID 0 in preview', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, [0])
      render(<SpritePanel />)
      fireEvent.click(screen.getByTestId('sprite-cell-0'))
      expect(screen.getByText('Sprite (empty)')).toBeInTheDocument()
    })

    it('preview has a canvas element', () => {
      render(<SpritePanel />)
      fireEvent.click(screen.getByTestId('sprite-cell-0'))
      const preview = screen.getByTestId('sprite-preview')
      expect(preview.querySelector('canvas')).toBeInTheDocument()
    })
  })

  // -----------------------------------------------------------------------
  // Action buttons
  // -----------------------------------------------------------------------

  describe('action buttons', () => {
    beforeEach(() => {
      loadEditorWithThing(100, ThingCategory.ITEM)
    })

    it('shows all four action buttons', () => {
      render(<SpritePanel />)
      expect(screen.getByTestId('sprite-import-btn')).toBeInTheDocument()
      expect(screen.getByTestId('sprite-export-btn')).toBeInTheDocument()
      expect(screen.getByTestId('sprite-replace-btn')).toBeInTheDocument()
      expect(screen.getByTestId('sprite-remove-btn')).toBeInTheDocument()
    })

    it('import button is always enabled', () => {
      render(<SpritePanel />)
      expect(screen.getByTestId('sprite-import-btn')).not.toBeDisabled()
    })

    it('export, replace, remove disabled without selection', () => {
      render(<SpritePanel />)
      expect(screen.getByTestId('sprite-export-btn')).toBeDisabled()
      expect(screen.getByTestId('sprite-replace-btn')).toBeDisabled()
      expect(screen.getByTestId('sprite-remove-btn')).toBeDisabled()
    })

    it('export, replace, remove enabled with selection', () => {
      render(<SpritePanel />)
      fireEvent.click(screen.getByTestId('sprite-cell-0'))
      expect(screen.getByTestId('sprite-export-btn')).not.toBeDisabled()
      expect(screen.getByTestId('sprite-replace-btn')).not.toBeDisabled()
      expect(screen.getByTestId('sprite-remove-btn')).not.toBeDisabled()
    })

    it('buttons become disabled when selection is cleared', () => {
      render(<SpritePanel />)
      fireEvent.click(screen.getByTestId('sprite-cell-0'))
      expect(screen.getByTestId('sprite-export-btn')).not.toBeDisabled()
      // Deselect
      fireEvent.click(screen.getByTestId('sprite-cell-0'))
      expect(screen.getByTestId('sprite-export-btn')).toBeDisabled()
    })
  })

  // -----------------------------------------------------------------------
  // Frame group selector
  // -----------------------------------------------------------------------

  describe('frame group selector', () => {
    it('not shown for items (single frame group)', () => {
      loadEditorWithThing(100, ThingCategory.ITEM)
      render(<SpritePanel />)
      expect(screen.queryByTestId('frame-group-select')).not.toBeInTheDocument()
    })

    it('not shown for effects', () => {
      loadEditorWithThing(100, ThingCategory.EFFECT)
      render(<SpritePanel />)
      expect(screen.queryByTestId('frame-group-select')).not.toBeInTheDocument()
    })

    it('not shown for missiles', () => {
      loadEditorWithThing(100, ThingCategory.MISSILE)
      render(<SpritePanel />)
      expect(screen.queryByTestId('frame-group-select')).not.toBeInTheDocument()
    })

    it('not shown for outfits without walking group', () => {
      loadEditorWithThing(100, ThingCategory.OUTFIT)
      render(<SpritePanel />)
      expect(screen.queryByTestId('frame-group-select')).not.toBeInTheDocument()
    })

    it('shown for outfits with walking group', () => {
      const thing = makeThing(100, ThingCategory.OUTFIT)
      const walkingFg = createFrameGroup()
      walkingFg.type = FrameGroupType.WALKING
      walkingFg.spriteIndex = [200, 201]
      thing.frameGroups[FrameGroupType.WALKING] = walkingFg

      const data = makeThingData(thing)
      const clientInfo = createClientInfo()
      clientInfo.loaded = true
      useAppStore.setState({ clientInfo })
      useEditorStore.getState().setEditingThingData(data)

      render(<SpritePanel />)
      expect(screen.getByTestId('frame-group-select')).toBeInTheDocument()
    })

    it('has Default and Walking options', () => {
      const thing = makeThing(100, ThingCategory.OUTFIT)
      const walkingFg = createFrameGroup()
      walkingFg.type = FrameGroupType.WALKING
      walkingFg.spriteIndex = [200, 201]
      thing.frameGroups[FrameGroupType.WALKING] = walkingFg

      const data = makeThingData(thing)
      const clientInfo = createClientInfo()
      clientInfo.loaded = true
      useAppStore.setState({ clientInfo })
      useEditorStore.getState().setEditingThingData(data)

      render(<SpritePanel />)
      const select = screen.getByTestId('frame-group-select') as HTMLSelectElement
      expect(select.options).toHaveLength(2)
      expect(select.options[0].textContent).toBe('Idle')
      expect(select.options[1].textContent).toBe('Walking')
    })

    it('switches to walking frame group', () => {
      const thing = makeThing(100, ThingCategory.OUTFIT, [100, 101, 102, 103])
      const walkingFg = createFrameGroup()
      walkingFg.type = FrameGroupType.WALKING
      walkingFg.spriteIndex = [200, 201]
      thing.frameGroups[FrameGroupType.WALKING] = walkingFg

      const data = makeThingData(thing)
      const clientInfo = createClientInfo()
      clientInfo.loaded = true
      useAppStore.setState({ clientInfo })
      useEditorStore.getState().setEditingThingData(data)

      render(<SpritePanel />)
      expect(screen.getByText('Sprites (4)')).toBeInTheDocument()

      fireEvent.change(screen.getByTestId('frame-group-select'), {
        target: { value: String(FrameGroupType.WALKING) }
      })

      expect(screen.getByText('Sprites (2)')).toBeInTheDocument()
      expect(screen.getByText('#200')).toBeInTheDocument()
      expect(screen.getByText('#201')).toBeInTheDocument()
    })

    it('clears selection when switching frame group', () => {
      const thing = makeThing(100, ThingCategory.OUTFIT, [100, 101])
      const walkingFg = createFrameGroup()
      walkingFg.type = FrameGroupType.WALKING
      walkingFg.spriteIndex = [200]
      thing.frameGroups[FrameGroupType.WALKING] = walkingFg

      const data = makeThingData(thing)
      const clientInfo = createClientInfo()
      clientInfo.loaded = true
      useAppStore.setState({ clientInfo })
      useEditorStore.getState().setEditingThingData(data)

      render(<SpritePanel />)
      fireEvent.click(screen.getByTestId('sprite-cell-0'))
      expect(screen.getByTestId('sprite-cell-0').className).toContain('bg-accent')

      fireEvent.change(screen.getByTestId('frame-group-select'), {
        target: { value: String(FrameGroupType.WALKING) }
      })

      // After switch, the new cell should not be selected
      expect(screen.getByTestId('sprite-cell-0').className).not.toContain('bg-accent')
    })
  })

  // -----------------------------------------------------------------------
  // Drag-and-drop
  // -----------------------------------------------------------------------

  describe('drag-and-drop', () => {
    beforeEach(() => {
      loadEditorWithThing(100, ThingCategory.ITEM)
    })

    it('shows visual feedback on drag over', () => {
      render(<SpritePanel />)
      const panel = screen.getByTestId('sprite-panel')
      fireEvent.dragOver(panel)
      expect(panel.className).toContain('ring-accent')
    })

    it('removes visual feedback on drag leave', () => {
      render(<SpritePanel />)
      const panel = screen.getByTestId('sprite-panel')
      fireEvent.dragOver(panel)
      expect(panel.className).toContain('ring-accent')
      fireEvent.dragLeave(panel)
      expect(panel.className).not.toContain('ring-accent')
    })
  })

  // -----------------------------------------------------------------------
  // Thing change reset
  // -----------------------------------------------------------------------

  describe('thing change', () => {
    it('resets to "No object selected" when editing data is cleared', () => {
      loadEditorWithThing(100, ThingCategory.ITEM)
      const { rerender } = render(<SpritePanel />)
      expect(screen.getByText('Sprites (4)')).toBeInTheDocument()

      act(() => {
        useEditorStore.getState().setEditingThingData(null)
      })
      rerender(<SpritePanel />)
      expect(screen.getByText('No object selected')).toBeInTheDocument()
    })

    it('updates grid when different thing is loaded', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, [10, 20])
      const { rerender } = render(<SpritePanel />)
      expect(screen.getByText('Sprites (2)')).toBeInTheDocument()
      expect(screen.getByText('#10')).toBeInTheDocument()

      act(() => {
        loadEditorWithThing(200, ThingCategory.ITEM, [30, 40, 50])
      })
      rerender(<SpritePanel />)
      expect(screen.getByText('Sprites (3)')).toBeInTheDocument()
      expect(screen.getByText('#30')).toBeInTheDocument()
    })
  })

  // -----------------------------------------------------------------------
  // Categories
  // -----------------------------------------------------------------------

  describe('categories', () => {
    it('works with outfit category', () => {
      loadEditorWithThing(100, ThingCategory.OUTFIT, [10, 20, 30, 40])
      render(<SpritePanel />)
      expect(screen.getByText('Sprites (4)')).toBeInTheDocument()
    })

    it('works with effect category', () => {
      loadEditorWithThing(100, ThingCategory.EFFECT, [10])
      render(<SpritePanel />)
      expect(screen.getByText('Sprites (1)')).toBeInTheDocument()
    })

    it('works with missile category', () => {
      loadEditorWithThing(100, ThingCategory.MISSILE, [1, 2, 3, 4, 5, 6, 7, 8, 9])
      render(<SpritePanel />)
      expect(screen.getByText('Sprites (9)')).toBeInTheDocument()
    })
  })
})
