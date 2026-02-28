/**
 * Tests for ThingTypeEditor component.
 * Covers rendering states, tab navigation, property sections, conditional fields,
 * category-specific behavior, property editing with undo, and texture tab.
 */

import React, { act } from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThingTypeEditor } from '../ThingTypeEditor'
import {
  resetAppStore,
  resetEditorStore,
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
  overrides: Partial<ThingType> = {}
): ThingType {
  const t = createThingType()
  t.id = id
  t.category = category
  const fg = createFrameGroup()
  fg.spriteIndex = [0]
  t.frameGroups = [fg]
  Object.assign(t, overrides)
  return t
}

function makeThingData(
  thing: ThingType,
  clientVersion = 1060
): ThingData {
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
  clientVersion = 1060,
  thingOverrides: Partial<ThingType> = {}
): void {
  const thing = makeThing(id, category, thingOverrides)
  const data = makeThingData(thing, clientVersion)

  const clientInfo = createClientInfo()
  clientInfo.clientVersion = clientVersion
  clientInfo.loaded = true

  useAppStore.setState({ clientInfo })
  useEditorStore.getState().setEditingThingData(data)
}

/** Switch to the Properties tab (Texture is default) */
function switchToPropertiesTab(): void {
  fireEvent.click(screen.getByTestId('editor-tab-properties'))
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  resetAppStore()
  resetEditorStore()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ThingTypeEditor', () => {
  // -----------------------------------------------------------------------
  // Empty state
  // -----------------------------------------------------------------------

  describe('empty state', () => {
    it('shows "Edit" placeholder when no thing is loaded', () => {
      render(<ThingTypeEditor />)
      const editTexts = screen.getAllByText('Edit')
      expect(editTexts.length).toBeGreaterThanOrEqual(1)
    })
  })

  // -----------------------------------------------------------------------
  // Header and tabs
  // -----------------------------------------------------------------------

  describe('header and tabs', () => {
    it('shows category and ID for items', () => {
      loadEditorWithThing(100, ThingCategory.ITEM)
      render(<ThingTypeEditor />)
      expect(screen.getByText('Item #100')).toBeInTheDocument()
    })

    it('shows category and ID for outfits', () => {
      loadEditorWithThing(1, ThingCategory.OUTFIT)
      render(<ThingTypeEditor />)
      expect(screen.getByText('Outfit #1')).toBeInTheDocument()
    })

    it('shows category and ID for effects', () => {
      loadEditorWithThing(1, ThingCategory.EFFECT)
      render(<ThingTypeEditor />)
      expect(screen.getByText('Effect #1')).toBeInTheDocument()
    })

    it('shows category and ID for missiles', () => {
      loadEditorWithThing(1, ThingCategory.MISSILE)
      render(<ThingTypeEditor />)
      expect(screen.getByText('Missile #1')).toBeInTheDocument()
    })

    it('shows three tab buttons', () => {
      loadEditorWithThing(100, ThingCategory.ITEM)
      render(<ThingTypeEditor />)
      expect(screen.getByTestId('editor-tab-texture')).toBeInTheDocument()
      expect(screen.getByTestId('editor-tab-properties')).toBeInTheDocument()
      expect(screen.getByTestId('editor-tab-attributes')).toBeInTheDocument()
    })

    it('defaults to Texture tab', () => {
      loadEditorWithThing(100, ThingCategory.ITEM)
      render(<ThingTypeEditor />)
      expect(screen.getByText('Appearance')).toBeInTheDocument()
      expect(screen.getByText('Patterns')).toBeInTheDocument()
    })

    it('switches to Properties tab on click', () => {
      loadEditorWithThing(100, ThingCategory.ITEM)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.getAllByText('Properties').length).toBeGreaterThanOrEqual(2)
      expect(screen.getByLabelText('Has Light')).toBeInTheDocument()
    })
  })

  // -----------------------------------------------------------------------
  // Texture tab
  // -----------------------------------------------------------------------

  describe('texture tab', () => {
    it('shows Appearance section with zoom slider', () => {
      loadEditorWithThing(100, ThingCategory.ITEM)
      render(<ThingTypeEditor />)
      expect(screen.getByText('Appearance')).toBeInTheDocument()
      expect(screen.getByTestId('zoom-slider')).toBeInTheDocument()
    })

    it('shows Patterns section with dimension fields', () => {
      loadEditorWithThing(100, ThingCategory.ITEM)
      render(<ThingTypeEditor />)
      expect(screen.getByText('Patterns')).toBeInTheDocument()
      expect(screen.getByText('Width')).toBeInTheDocument()
      expect(screen.getByText('Height')).toBeInTheDocument()
      expect(screen.getByText('Layers')).toBeInTheDocument()
      expect(screen.getByText('Animations')).toBeInTheDocument()
    })

    it('shows Bones section for v780+', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 800)
      render(<ThingTypeEditor />)
      const hasBones = screen.getAllByText('Has Bones')
      expect(hasBones.length).toBeGreaterThanOrEqual(1)
    })

    it('hides Bones section for v740', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 740)
      render(<ThingTypeEditor />)
      expect(screen.queryByText('Has Bones')).not.toBeInTheDocument()
    })

    it('shows toggle options', () => {
      loadEditorWithThing(100, ThingCategory.ITEM)
      render(<ThingTypeEditor />)
      expect(screen.getByLabelText('Show Crop Size')).toBeInTheDocument()
      expect(screen.getByLabelText('Show Grid')).toBeInTheDocument()
    })
  })

  // -----------------------------------------------------------------------
  // Sections for ITEMS (Properties tab)
  // -----------------------------------------------------------------------

  describe('item sections', () => {
    beforeEach(() => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
    })

    it('shows Render Order section', () => {
      expect(screen.getAllByText('Properties').length).toBeGreaterThanOrEqual(2)
      expect(screen.getByLabelText('Common')).toBeInTheDocument()
      expect(screen.getByLabelText('Is Ground')).toBeInTheDocument()
      expect(screen.getByLabelText('Bottom')).toBeInTheDocument()
      expect(screen.getByLabelText('Top')).toBeInTheDocument()
    })

    it('shows Light section', () => {
      const hasLight = screen.getAllByText('Has Light')
      expect(hasLight.length).toBeGreaterThanOrEqual(1)
    })

    it('shows Offset section', () => {
      const hasOffset = screen.getAllByText('Has Offset')
      expect(hasOffset.length).toBeGreaterThanOrEqual(1)
    })

    it('shows Elevation section for items', () => {
      const hasElevation = screen.getAllByText('Has Elevation')
      expect(hasElevation.length).toBeGreaterThanOrEqual(1)
    })

    it('shows Minimap section for items', () => {
      const automap = screen.getAllByText('Automap')
      expect(automap.length).toBeGreaterThanOrEqual(1)
    })

    it('shows Write / Read section for items', () => {
      expect(screen.getByText('Write / Read')).toBeInTheDocument()
      expect(screen.getByLabelText('Writable')).toBeInTheDocument()
      expect(screen.getByLabelText('Writable Once')).toBeInTheDocument()
    })

    it('shows Equipment section for items', () => {
      const equip = screen.getAllByText('Equip')
      expect(equip.length).toBeGreaterThanOrEqual(1)
    })

    it('shows Market section for items (v1060)', () => {
      const market = screen.getAllByText('Market')
      expect(market.length).toBeGreaterThanOrEqual(1)
    })

    it('shows Default Action section for items (v1060)', () => {
      const hasAction = screen.getAllByText('Has Action')
      expect(hasAction.length).toBeGreaterThanOrEqual(1)
    })

    it('shows Lens Help section', () => {
      const lensHelp = screen.getAllByText('Lens Help')
      expect(lensHelp.length).toBeGreaterThanOrEqual(1)
    })

    it('shows Flags section with boolean checkboxes', () => {
      expect(screen.getByText('Flags')).toBeInTheDocument()
      expect(screen.getByLabelText('Container')).toBeInTheDocument()
      expect(screen.getByLabelText('Stackable')).toBeInTheDocument()
      expect(screen.getByLabelText('Force Use')).toBeInTheDocument()
      expect(screen.getByLabelText('Multi Use')).toBeInTheDocument()
      expect(screen.getByLabelText('Unpassable')).toBeInTheDocument()
      expect(screen.getByLabelText('Unmovable')).toBeInTheDocument()
      expect(screen.getByLabelText('Pickupable')).toBeInTheDocument()
    })
  })

  // -----------------------------------------------------------------------
  // Sections for OUTFITS (Properties tab)
  // -----------------------------------------------------------------------

  describe('outfit sections', () => {
    beforeEach(() => {
      loadEditorWithThing(1, ThingCategory.OUTFIT, 1060)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
    })

    it('does NOT show Render Order section', () => {
      expect(screen.queryByText('Render Order')).not.toBeInTheDocument()
    })

    it('does NOT show Elevation section', () => {
      expect(screen.queryByText('Has Elevation')).not.toBeInTheDocument()
    })

    it('does NOT show Minimap section', () => {
      expect(screen.queryByText('Automap')).not.toBeInTheDocument()
    })

    it('does NOT show Write / Read section', () => {
      expect(screen.queryByText('Write / Read')).not.toBeInTheDocument()
    })

    it('does NOT show Equipment section', () => {
      expect(screen.queryByText('Equip')).not.toBeInTheDocument()
    })

    it('does NOT show Market section', () => {
      expect(screen.queryByText('Market')).not.toBeInTheDocument()
    })

    it('shows Outfit Flags with Animate Always', () => {
      expect(screen.getByText('Flags')).toBeInTheDocument()
      expect(screen.getByLabelText('Animate Always')).toBeInTheDocument()
    })

    it('shows Light and Offset sections', () => {
      const hasLight = screen.getAllByText('Has Light')
      expect(hasLight.length).toBeGreaterThanOrEqual(1)
      const hasOffset = screen.getAllByText('Has Offset')
      expect(hasOffset.length).toBeGreaterThanOrEqual(1)
    })
  })

  // -----------------------------------------------------------------------
  // Sections for EFFECTS (Properties tab)
  // -----------------------------------------------------------------------

  describe('effect sections', () => {
    it('shows Top Effect for supported versions', () => {
      loadEditorWithThing(1, ThingCategory.EFFECT, 1092)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.getByLabelText('Top effect')).toBeInTheDocument()
    })

    it('does NOT show Top Effect for unsupported versions', () => {
      loadEditorWithThing(1, ThingCategory.EFFECT, 900)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.queryByLabelText('Top effect')).not.toBeInTheDocument()
    })
  })

  // -----------------------------------------------------------------------
  // Sections for MISSILES (Properties tab)
  // -----------------------------------------------------------------------

  describe('missile sections', () => {
    beforeEach(() => {
      loadEditorWithThing(1, ThingCategory.MISSILE, 1060)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
    })

    it('shows Light and Offset sections', () => {
      const hasLight = screen.getAllByText('Has Light')
      expect(hasLight.length).toBeGreaterThanOrEqual(1)
      const hasOffset = screen.getAllByText('Has Offset')
      expect(hasOffset.length).toBeGreaterThanOrEqual(1)
    })

    it('does NOT show item-specific sections', () => {
      expect(screen.queryByText('Render Order')).not.toBeInTheDocument()
      expect(screen.queryByText('Flags')).not.toBeInTheDocument()
      expect(screen.queryByText('Has Elevation')).not.toBeInTheDocument()
    })
  })

  // -----------------------------------------------------------------------
  // Conditional fields (GroupCheckBox expand/collapse)
  // -----------------------------------------------------------------------

  describe('conditional fields', () => {
    it('shows light level/color when Has Light is checked', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060, { hasLight: true, lightLevel: 5, lightColor: 100 })
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.getByText('Light Intensity')).toBeInTheDocument()
      expect(screen.getByText('Light Color')).toBeInTheDocument()
    })

    it('hides light fields when Has Light is unchecked', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060, { hasLight: false })
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.queryByText('Light Intensity')).not.toBeInTheDocument()
    })

    it('shows offset fields when Has Offset is checked', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060, { hasOffset: true })
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      // Offset X and Offset Y fields within the Offset section
      expect(screen.getByText('Offset X')).toBeInTheDocument()
      expect(screen.getByText('Offset Y')).toBeInTheDocument()
    })

    it('shows elevation height when Has Elevation is checked', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060, { hasElevation: true, elevation: 16 })
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.getByText('Elevation')).toBeInTheDocument()
    })

    it('shows minimap color when Automap is checked', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060, { miniMap: true, miniMapColor: 50 })
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.getByText('Automap Color')).toBeInTheDocument()
    })

    it('shows market fields when Market Item is checked', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060, { isMarketItem: true, marketName: 'Test' })
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Trade As')).toBeInTheDocument()
      expect(screen.getByText('Show As')).toBeInTheDocument()
    })

    it('shows cloth slot when Cloth is checked', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060, { cloth: true, clothSlot: 4 })
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.getByText('Slot')).toBeInTheDocument()
    })

    it('shows writable chars when Writable is checked', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060, { writable: true, maxReadWriteChars: 100 })
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      const maxLength = screen.getAllByText('Max Length')
      expect(maxLength.length).toBeGreaterThanOrEqual(1)
    })

    it('shows default action dropdown when Has Default Action is checked', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060, { hasDefaultAction: true, defaultAction: 2 })
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.getByText('Action Type')).toBeInTheDocument()
    })

    it('shows lens help type when Is Lens Help is checked', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060, { isLensHelp: true, lensHelp: 1100 })
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.getByText('Type')).toBeInTheDocument()
    })
  })

  // -----------------------------------------------------------------------
  // Version-conditional flags (Properties tab)
  // -----------------------------------------------------------------------

  describe('version-conditional flags', () => {
    it('shows Ground Border for v750+', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 800)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.getByLabelText('Ground Border')).toBeInTheDocument()
    })

    it('hides Ground Border for v740', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 740)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.queryByLabelText('Ground Border')).not.toBeInTheDocument()
    })

    it('shows No Move Animation for v1010+', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.getByLabelText('No Move Animation')).toBeInTheDocument()
    })

    it('hides No Move Animation for v960', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 960)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.queryByLabelText('No Move Animation')).not.toBeInTheDocument()
    })

    it('shows Hangable/Hook East/Hook South for v755+', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 800)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.getByLabelText('Hangable')).toBeInTheDocument()
      expect(screen.getByLabelText('Hook East')).toBeInTheDocument()
      expect(screen.getByLabelText('Hook South')).toBeInTheDocument()
    })

    it('hides Hangable/Hook East/Hook South for v740', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 740)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.queryByLabelText('Hangable')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Hook East')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Hook South')).not.toBeInTheDocument()
    })

    it("shows Don't Hide and Ignore Look for v780+", () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 800)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.getByLabelText("Don't Hide")).toBeInTheDocument()
      expect(screen.getByLabelText('Ignore Look')).toBeInTheDocument()
    })

    it('shows Translucent for v860+', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 900)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.getByLabelText('Translucent')).toBeInTheDocument()
    })

    it('hides Translucent for v800', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 800)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.queryByLabelText('Translucent')).not.toBeInTheDocument()
    })

    it('shows Usable for v1021+', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.getByLabelText('Useable')).toBeInTheDocument()
    })

    it('hides Usable for v1010', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1010)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.queryByLabelText('Useable')).not.toBeInTheDocument()
    })

    it('shows Has Charges for v780-854', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 800)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.getByLabelText('Has Charges')).toBeInTheDocument()
    })

    it('hides Has Charges for v860', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 860)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.queryByLabelText('Has Charges')).not.toBeInTheDocument()
    })

    it('shows Wrappable/Unwrappable for v1092+', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1092)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.getByLabelText('Wrappable')).toBeInTheDocument()
      expect(screen.getByLabelText('Unwrappable')).toBeInTheDocument()
    })

    it('shows Floor Change for v710-854', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 800)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.getByLabelText('Floor Change')).toBeInTheDocument()
    })

    it('hides Floor Change for v860', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 860)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.queryByLabelText('Floor Change')).not.toBeInTheDocument()
    })

    it('hides Market section for v930', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 930)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.queryByText('Market')).not.toBeInTheDocument()
    })

    it('hides Default Action section for v1010', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1010)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()
      expect(screen.queryByText('Has Action')).not.toBeInTheDocument()
    })
  })

  // -----------------------------------------------------------------------
  // Property editing (Properties tab)
  // -----------------------------------------------------------------------

  describe('property editing', () => {
    it('toggles a boolean flag and updates editor store', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()

      const checkbox = screen.getByLabelText('Container')
      expect(checkbox).not.toBeChecked()

      fireEvent.click(checkbox)

      const data = useEditorStore.getState().editingThingData
      expect(data?.thing.isContainer).toBe(true)
    })

    it('toggles a GroupCheckBox and shows child fields', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()

      // Light is off by default, so no Light Intensity/Light Color fields
      expect(screen.queryByText('Light Intensity')).not.toBeInTheDocument()

      // Toggle Has Light on
      fireEvent.click(screen.getByLabelText('Has Light'))

      // Now Light Intensity and Light Color should appear
      expect(screen.getByText('Light Intensity')).toBeInTheDocument()
    })

    it('changes render order via radio buttons', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()

      // Default is Common (no ground flags)
      expect(screen.getByLabelText('Common')).toBeChecked()

      // Switch to Bottom
      fireEvent.click(screen.getByLabelText('Bottom'))

      const data = useEditorStore.getState().editingThingData
      expect(data?.thing.isOnBottom).toBe(true)
      expect(data?.thing.isGround).toBe(false)
    })

    it('selects Ground and shows ground speed', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()

      fireEvent.click(screen.getByLabelText('Is Ground'))

      const data = useEditorStore.getState().editingThingData
      expect(data?.thing.isGround).toBe(true)
      expect(data?.thing.groundSpeed).toBe(100) // default ground speed

      // Ground Speed field should now be visible
      expect(screen.getByText('Ground Speed')).toBeInTheDocument()
    })

    it('records undo operations on property change', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()

      // Toggle Container
      fireEvent.click(screen.getByLabelText('Container'))

      const { undoStack } = useEditorStore.getState()
      expect(undoStack.length).toBe(1)
      expect(undoStack[0].type).toBe('update-thing')
      expect(undoStack[0].before[0].thingType.isContainer).toBe(false)
      expect(undoStack[0].after[0].thingType.isContainer).toBe(true)
    })

    it('marks editing as changed after property update', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()

      expect(useEditorStore.getState().editingChanged).toBe(false)

      fireEvent.click(screen.getByLabelText('Stackable'))

      expect(useEditorStore.getState().editingChanged).toBe(true)
    })
  })

  // -----------------------------------------------------------------------
  // Switching things
  // -----------------------------------------------------------------------

  describe('switching things', () => {
    it('updates display when editing thing changes', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060)
      const { rerender } = render(<ThingTypeEditor />)
      expect(screen.getByText('Item #100')).toBeInTheDocument()

      // Switch to a different thing
      act(() => {
        loadEditorWithThing(200, ThingCategory.OUTFIT, 1060)
      })
      rerender(<ThingTypeEditor />)
      expect(screen.getByText('Outfit #200')).toBeInTheDocument()
    })

    it('clears editor when thing data is set to null', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060)
      const { rerender } = render(<ThingTypeEditor />)
      expect(screen.getByText('Item #100')).toBeInTheDocument()

      act(() => {
        useEditorStore.getState().setEditingThingData(null)
      })
      rerender(<ThingTypeEditor />)
      const editTexts = screen.getAllByText('Edit')
      expect(editTexts.length).toBeGreaterThanOrEqual(1)
    })
  })

  // -----------------------------------------------------------------------
  // Save / Close footer
  // -----------------------------------------------------------------------

  describe('save and close', () => {
    it('shows Save and Close buttons when thing is loaded', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060)
      render(<ThingTypeEditor />)
      expect(screen.getByTestId('editor-save-btn')).toBeInTheDocument()
      expect(screen.getByTestId('editor-close-btn')).toBeInTheDocument()
    })

    it('Save button is disabled when no changes', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060)
      render(<ThingTypeEditor />)
      expect(screen.getByTestId('editor-save-btn')).toBeDisabled()
    })

    it('Save button is enabled after making changes', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()

      fireEvent.click(screen.getByLabelText('Container'))

      expect(screen.getByTestId('editor-save-btn')).not.toBeDisabled()
    })

    it('Save button saves changes and disables itself', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060)
      render(<ThingTypeEditor />)
      switchToPropertiesTab()

      fireEvent.click(screen.getByLabelText('Container'))
      expect(useEditorStore.getState().editingChanged).toBe(true)

      fireEvent.click(screen.getByTestId('editor-save-btn'))
      expect(useEditorStore.getState().editingChanged).toBe(false)
    })

    it('Close button clears editor', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060)
      const { rerender } = render(<ThingTypeEditor />)
      expect(screen.getByText('Item #100')).toBeInTheDocument()

      fireEvent.click(screen.getByTestId('editor-close-btn'))
      rerender(<ThingTypeEditor />)
      const editTexts = screen.getAllByText('Edit')
      expect(editTexts.length).toBeGreaterThanOrEqual(1)
    })

    it('does not show Save/Close in empty state', () => {
      render(<ThingTypeEditor />)
      expect(screen.queryByTestId('editor-save-btn')).not.toBeInTheDocument()
      expect(screen.queryByTestId('editor-close-btn')).not.toBeInTheDocument()
    })
  })

  // -----------------------------------------------------------------------
  // Attributes tab
  // -----------------------------------------------------------------------

  describe('attributes tab', () => {
    it('shows placeholder when OTB not loaded', () => {
      loadEditorWithThing(100, ThingCategory.ITEM, 1060)
      render(<ThingTypeEditor />)
      fireEvent.click(screen.getByTestId('editor-tab-attributes'))
      expect(screen.getByText('Load server items (OTB) to edit attributes')).toBeInTheDocument()
    })

    it('shows "only Items" message for non-item categories', () => {
      loadEditorWithThing(1, ThingCategory.OUTFIT, 1060)
      render(<ThingTypeEditor />)
      fireEvent.click(screen.getByTestId('editor-tab-attributes'))
      expect(screen.getByText('Attributes - Items')).toBeInTheDocument()
    })
  })
})
