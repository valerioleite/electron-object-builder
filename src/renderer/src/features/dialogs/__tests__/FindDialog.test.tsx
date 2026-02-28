/**
 * Tests for FindDialog component.
 * Covers tab switching, filter inputs, property checkboxes, search callbacks,
 * results rendering, selection, and reset behavior.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { FindDialog } from '../FindDialog'
import { ThingCategory } from '../../../types/things'
import type { FindDialogProps } from '../FindDialog'
import type { ThingType } from '../../../types/things'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultProps: FindDialogProps = {
  open: true,
  onClose: vi.fn(),
  onFindThings: vi.fn(),
  onFindSprites: vi.fn(),
  onSelectThing: vi.fn(),
  onSelectSprite: vi.fn(),
  thingResults: [],
  spriteResults: [],
  isSearching: false
}

function renderDialog(overrides: Partial<FindDialogProps> = {}) {
  return render(<FindDialog {...defaultProps} {...overrides} />)
}

function makeThingResult(id: number, name?: string): ThingType {
  return {
    id,
    category: ThingCategory.ITEM,
    marketName: name ?? '',
    name: ''
  } as unknown as ThingType
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FindDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  it('does not render when open=false', () => {
    renderDialog({ open: false })
    // Modal returns null when open=false, so the title should not appear
    expect(screen.queryByText('Find')).toBeNull()
  })

  it('renders Things and Sprites tabs', () => {
    renderDialog()
    expect(screen.getByText('Things')).toBeInTheDocument()
    expect(screen.getByText('Sprites')).toBeInTheDocument()
  })

  it('Things tab is active by default', () => {
    renderDialog()
    // Things tab content includes Category select
    expect(screen.getByText('Category')).toBeInTheDocument()
    // Sprites tab content should not be visible (unused/empty checkboxes)
    expect(screen.queryByText('Find unused sprites')).toBeNull()
  })

  // -------------------------------------------------------------------------
  // Things tab content
  // -------------------------------------------------------------------------

  it('Things tab shows category select, name input, and "no name" checkbox', () => {
    renderDialog()
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Find objects without name')).toBeInTheDocument()
  })

  it('Things tab shows Patterns section with numeric inputs', () => {
    renderDialog()
    expect(screen.getByText('Patterns')).toBeInTheDocument()
    expect(screen.getByText('Width')).toBeInTheDocument()
    expect(screen.getByText('Height')).toBeInTheDocument()
    expect(screen.getByText('Exact Size')).toBeInTheDocument()
    expect(screen.getByText('Layers')).toBeInTheDocument()
    expect(screen.getByText('Pattern X')).toBeInTheDocument()
    expect(screen.getByText('Pattern Y')).toBeInTheDocument()
    expect(screen.getByText('Pattern Z')).toBeInTheDocument()
    expect(screen.getByText('Frames')).toBeInTheDocument()
    expect(screen.getByText('Groups')).toBeInTheDocument()
  })

  it('Things tab shows Properties section with 42 property checkboxes', () => {
    renderDialog()
    expect(screen.getByText('Properties')).toBeInTheDocument()
    // Check a selection of properties from both columns
    expect(screen.getByText('Ground')).toBeInTheDocument()
    expect(screen.getByText('Ground Border')).toBeInTheDocument()
    expect(screen.getByText('Container')).toBeInTheDocument()
    expect(screen.getByText('Stackable')).toBeInTheDocument()
    expect(screen.getByText('Pickupable')).toBeInTheDocument()
    expect(screen.getByText('Rotatable')).toBeInTheDocument()
    expect(screen.getByText('Animate Always')).toBeInTheDocument()
    expect(screen.getByText('Top Effect')).toBeInTheDocument()
    expect(screen.getByText('Floor Change')).toBeInTheDocument()
    // Verify total count: 42 property checkboxes (all checkboxes inside Properties FieldGroup)
    // We find them by checking all checkbox inputs inside the Properties section
    const propertiesLabel = screen.getByText('Properties')
    const propertiesSection = propertiesLabel.closest('.flex.flex-col.gap-2')
    expect(propertiesSection).not.toBeNull()
    if (propertiesSection) {
      const checkboxes = within(propertiesSection as HTMLElement).getAllByRole('checkbox')
      expect(checkboxes.length).toBe(42)
    }
  })

  // -------------------------------------------------------------------------
  // Sprites tab
  // -------------------------------------------------------------------------

  it('switching to Sprites tab shows unused/empty sprite checkboxes', () => {
    renderDialog()
    fireEvent.click(screen.getByText('Sprites'))
    expect(screen.getByText('Find unused sprites')).toBeInTheDocument()
    expect(screen.getByText('Find empty sprites')).toBeInTheDocument()
    // Things-specific content should be hidden
    expect(screen.queryByText('Category')).toBeNull()
  })

  // -------------------------------------------------------------------------
  // Find button behavior
  // -------------------------------------------------------------------------

  it('Find button calls onFindThings with filters on Things tab', () => {
    const onFindThings = vi.fn()
    renderDialog({ onFindThings })

    // Click the Find button in the footer
    const findButtons = screen.getAllByText('Find')
    // The footer Find button (not the title)
    const findButton = findButtons.find(
      (btn) => btn.tagName === 'BUTTON' && btn.closest('.flex.shrink-0')
    )
    expect(findButton).toBeDefined()
    fireEvent.click(findButton!)

    expect(onFindThings).toHaveBeenCalledTimes(1)
    const filters = onFindThings.mock.calls[0][0]
    expect(filters.category).toBe(ThingCategory.ITEM)
    expect(filters.name).toBe('')
    expect(filters.noName).toBe(false)
    expect(filters.width).toBe(0)
    expect(typeof filters.properties).toBe('object')
  })

  it('Find button calls onFindSprites with filters on Sprites tab', () => {
    const onFindSprites = vi.fn()
    renderDialog({ onFindSprites })

    // Switch to Sprites tab
    fireEvent.click(screen.getByText('Sprites'))

    // Click Find button
    const findButtons = screen.getAllByText('Find')
    const findButton = findButtons.find(
      (btn) => btn.tagName === 'BUTTON' && btn.closest('.flex.shrink-0')
    )
    fireEvent.click(findButton!)

    expect(onFindSprites).toHaveBeenCalledTimes(1)
    const filters = onFindSprites.mock.calls[0][0]
    expect(filters.unusedSprites).toBe(false)
    expect(filters.emptySprites).toBe(false)
  })

  // -------------------------------------------------------------------------
  // Results rendering
  // -------------------------------------------------------------------------

  it('results list renders thing results with ID and name', () => {
    const thingResults = [
      makeThingResult(100, 'Golden Armor'),
      makeThingResult(101, 'Silver Sword')
    ]
    renderDialog({ thingResults })

    expect(screen.getByText('#100')).toBeInTheDocument()
    expect(screen.getByText('Golden Armor')).toBeInTheDocument()
    expect(screen.getByText('#101')).toBeInTheDocument()
    expect(screen.getByText('Silver Sword')).toBeInTheDocument()
  })

  it('results list renders sprite results', () => {
    renderDialog()
    // Switch to Sprites tab
    fireEvent.click(screen.getByText('Sprites'))

    // Unmount and re-render with sprite results on Sprites tab
    const { unmount } = renderDialog({ spriteResults: [50, 51, 52] })
    // Need to switch to sprites tab again since this is a new render
    fireEvent.click(screen.getAllByText('Sprites')[1])

    expect(screen.getByText('Sprite #50')).toBeInTheDocument()
    expect(screen.getByText('Sprite #51')).toBeInTheDocument()
    expect(screen.getByText('Sprite #52')).toBeInTheDocument()

    unmount()
  })

  it('clicking a thing result selects it', () => {
    const thingResults = [makeThingResult(100, 'Test Item')]
    renderDialog({ thingResults })

    const result = screen.getByText('#100')
    fireEvent.click(result.closest('div')!)

    // The selected result should have the accent background class
    expect(result.closest('div')).toHaveClass('bg-accent')
  })

  // -------------------------------------------------------------------------
  // Select button
  // -------------------------------------------------------------------------

  it('Select button calls onSelectThing for selected thing result', () => {
    const onSelectThing = vi.fn()
    const thingResults = [makeThingResult(100, 'Test Item')]
    renderDialog({ thingResults, onSelectThing })

    // Click to select the result
    const resultEl = screen.getByText('#100').closest('div')!
    fireEvent.click(resultEl)

    // Click Select button
    fireEvent.click(screen.getByText('Select'))

    expect(onSelectThing).toHaveBeenCalledWith(100, ThingCategory.ITEM)
  })

  // -------------------------------------------------------------------------
  // Reset button
  // -------------------------------------------------------------------------

  it('Reset button resets filters', () => {
    renderDialog()

    // Check the "no name" checkbox first
    const noNameCheckbox = screen
      .getByText('Find objects without name')
      .closest('label')!
      .querySelector('input')!
    fireEvent.click(noNameCheckbox)
    expect(noNameCheckbox.checked).toBe(true)

    // Click Reset
    fireEvent.click(screen.getByText('Reset'))

    // Checkbox should be unchecked
    expect(noNameCheckbox.checked).toBe(false)
  })

  // -------------------------------------------------------------------------
  // Searching state
  // -------------------------------------------------------------------------

  it('shows "Searching..." when isSearching=true', () => {
    renderDialog({ isSearching: true })
    expect(screen.getByText('Searching...')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Result count in header
  // -------------------------------------------------------------------------

  it('shows result count in header', () => {
    const thingResults = [
      makeThingResult(100, 'Item 1'),
      makeThingResult(101, 'Item 2'),
      makeThingResult(102, 'Item 3')
    ]
    renderDialog({ thingResults })

    // The result header uses t('labels.result') + count + t('labels.found')
    // en_US: "Result (3 Found)"
    expect(screen.getByText('Result (3 Found)')).toBeInTheDocument()
  })
})
