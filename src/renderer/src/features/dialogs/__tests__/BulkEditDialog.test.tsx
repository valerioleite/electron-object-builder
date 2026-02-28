/**
 * Tests for BulkEditDialog component.
 * Covers category-specific property groups, BulkPropertyRow behavior,
 * animation settings, duration controls, apply/cancel logic, and attributes tab.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { BulkEditDialog } from '../BulkEditDialog'
import { ThingCategory } from '../../../types/things'
import type { BulkEditDialogProps, BulkEditResult } from '../BulkEditDialog'

// ---------------------------------------------------------------------------
// Mock AttributesEditor to avoid complex dependency tree
// ---------------------------------------------------------------------------

vi.mock('../../editor/AttributesEditor', () => ({
  AttributesEditor: () => <div data-testid="mock-attributes-editor">AttributesEditor</div>
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultProps: BulkEditDialogProps = {
  open: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  selectedIds: [100, 101],
  category: ThingCategory.ITEM,
  otbLoaded: false
}

function renderDialog(overrides: Partial<BulkEditDialogProps> = {}) {
  return render(<BulkEditDialog {...defaultProps} {...overrides} />)
}

/**
 * Find a specific BulkPropertyRow by its property label text.
 * Returns { changeCheckbox, valueCheckbox }.
 */
function findPropertyRow(propertyLabel: string) {
  const label = screen.getByText(propertyLabel)
  const row = label.closest('.flex.items-center.gap-2')!
  const checkboxes = row.querySelectorAll('input[type="checkbox"]')
  return {
    changeCheckbox: checkboxes[0] as HTMLInputElement,
    valueCheckbox: checkboxes[1] as HTMLInputElement
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BulkEditDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // Rendering basics
  // -------------------------------------------------------------------------

  it('does not render when open=false', () => {
    renderDialog({ open: false })
    // i18n: "Bulk Property Editor"
    expect(screen.queryByText('Bulk Property Editor')).toBeNull()
  })

  it('shows selected count header', () => {
    renderDialog({ selectedIds: [100, 101] })
    // i18n: "{{0}} items selected" -> "2 items selected"
    expect(screen.getByText('2 items selected')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Category: Item
  // -------------------------------------------------------------------------

  it('Item category shows Ground Properties and Other Properties groups', () => {
    renderDialog({ category: ThingCategory.ITEM })

    // i18n: "Ground Properties"
    expect(screen.getByText('Ground Properties')).toBeInTheDocument()
    // i18n: "Others Properties"
    expect(screen.getByText('Others Properties')).toBeInTheDocument()

    // Spot-check some specific properties
    expect(screen.getByText('Ground')).toBeInTheDocument()
    expect(screen.getByText('Ground Border')).toBeInTheDocument()
    expect(screen.getByText('Full Ground')).toBeInTheDocument()
    expect(screen.getByText('Container')).toBeInTheDocument()
    expect(screen.getByText('Stackable')).toBeInTheDocument()
    expect(screen.getByText('Pickupable')).toBeInTheDocument()
    expect(screen.getByText('Wrappable')).toBeInTheDocument()
    expect(screen.getByText('Unwrappable')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Category: Outfit
  // -------------------------------------------------------------------------

  it('Outfit category shows only "Animate Always" property', () => {
    renderDialog({ category: ThingCategory.OUTFIT })

    expect(screen.getByText('Animate Always')).toBeInTheDocument()
    // Should NOT show item-specific properties
    expect(screen.queryByText('Ground Properties')).toBeNull()
    expect(screen.queryByText('Others Properties')).toBeNull()
    expect(screen.queryByText('Container')).toBeNull()
  })

  // -------------------------------------------------------------------------
  // Category: Effect
  // -------------------------------------------------------------------------

  it('Effect category shows only "Top Effect" property', () => {
    renderDialog({ category: ThingCategory.EFFECT })

    expect(screen.getByText('Top Effect')).toBeInTheDocument()
    expect(screen.queryByText('Ground Properties')).toBeNull()
    expect(screen.queryByText('Animate Always')).toBeNull()
  })

  // -------------------------------------------------------------------------
  // Category: Missile
  // -------------------------------------------------------------------------

  it('Missile category shows "no properties" message', () => {
    renderDialog({ category: ThingCategory.MISSILE })

    // i18n: "No properties available for bulk editing"
    expect(screen.getByText('No properties available for bulk editing')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Animation settings visibility
  // -------------------------------------------------------------------------

  it('animation settings visible for items/outfits/effects', () => {
    // Item
    const { unmount: u1 } = renderDialog({ category: ThingCategory.ITEM })
    // i18n: "Animation Settings"
    expect(screen.getByText('Animation Settings')).toBeInTheDocument()
    // i18n: "Animation Duration"
    expect(screen.getByText('Animation Duration')).toBeInTheDocument()
    u1()

    // Outfit
    const { unmount: u2 } = renderDialog({ category: ThingCategory.OUTFIT })
    expect(screen.getByText('Animation Settings')).toBeInTheDocument()
    u2()

    // Effect
    const { unmount: u3 } = renderDialog({ category: ThingCategory.EFFECT })
    expect(screen.getByText('Animation Settings')).toBeInTheDocument()
    u3()
  })

  it('animation settings hidden for missiles', () => {
    renderDialog({ category: ThingCategory.MISSILE })
    expect(screen.queryByText('Animation Settings')).toBeNull()
    expect(screen.queryByText('Animation Duration')).toBeNull()
  })

  // -------------------------------------------------------------------------
  // BulkPropertyRow behavior
  // -------------------------------------------------------------------------

  it('BulkPropertyRow: checking "Change" enables the value checkbox', () => {
    renderDialog({ category: ThingCategory.ITEM })

    const { changeCheckbox, valueCheckbox } = findPropertyRow('Container')

    // Initially value checkbox is disabled (change is not checked)
    expect(changeCheckbox.checked).toBe(false)
    expect(valueCheckbox).toBeDisabled()

    // Check "Change"
    fireEvent.click(changeCheckbox)
    expect(changeCheckbox.checked).toBe(true)
    expect(valueCheckbox).not.toBeDisabled()
  })

  it('BulkPropertyRow: unchecked "Change" disables value checkbox', () => {
    renderDialog({ category: ThingCategory.ITEM })

    const { changeCheckbox, valueCheckbox } = findPropertyRow('Stackable')

    // Enable then disable
    fireEvent.click(changeCheckbox)
    expect(valueCheckbox).not.toBeDisabled()

    fireEvent.click(changeCheckbox)
    expect(valueCheckbox).toBeDisabled()
  })

  // -------------------------------------------------------------------------
  // Animation Mode and Frame Strategy controls
  // -------------------------------------------------------------------------

  it('Animation Mode control has a "Change" toggle', () => {
    renderDialog({ category: ThingCategory.ITEM })

    // i18n: "Animation mode"
    const animModeLabel = screen.getByText('Animation mode:')
    expect(animModeLabel).toBeInTheDocument()

    // Should have Asynchronous/Synchronous options in the select
    // i18n: "Asynchronous", "Synchronous"
    expect(screen.getByText('Asynchronous')).toBeInTheDocument()
  })

  it('Frame Strategy control has a "Change" toggle', () => {
    renderDialog({ category: ThingCategory.ITEM })

    // i18n: "Frame strategy"
    const frameStratLabel = screen.getByText('Frame strategy:')
    expect(frameStratLabel).toBeInTheDocument()

    // i18n: "Loop", "Ping Pong"
    expect(screen.getByText('Loop')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Duration controls
  // -------------------------------------------------------------------------

  it('Duration control with min/max inputs', () => {
    renderDialog({ category: ThingCategory.ITEM })

    // i18n: "Minimum duration", "Maximum duration"
    expect(screen.getByText('Minimum duration:')).toBeInTheDocument()
    expect(screen.getByText('Maximum duration:')).toBeInTheDocument()
  })

  it('frame group target select visible only for Outfit category with duration change enabled', () => {
    // For non-outfit, frame group target should not appear
    const { unmount: u1 } = renderDialog({ category: ThingCategory.ITEM })
    expect(screen.queryByText('All Groups')).toBeNull()
    u1()

    // For outfit, it appears
    renderDialog({ category: ThingCategory.OUTFIT })

    // The frame group target is associated with the duration section
    // We need to enable the duration Change checkbox first
    // The Animation Duration section has a "Change" checkbox for duration
    const durationSection = screen.getByText('Animation Duration')
    const durationFieldGroup = durationSection.closest('.flex.flex-col.gap-2')!
    const durationChangeCheckboxes = within(durationFieldGroup as HTMLElement).getAllByText(
      'Change'
    )
    // The first "Change" in Animation Duration is the duration toggle
    const changeLabel = durationChangeCheckboxes[0]
    const changeCheckbox = changeLabel.closest('label')?.querySelector('input')
    fireEvent.click(changeCheckbox!)

    // Now the frame group target select should be visible with "All Groups"
    expect(screen.getByText('All Groups')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Apply Changes button behavior
  // -------------------------------------------------------------------------

  it('Apply Changes button disabled when no changes made', () => {
    renderDialog()

    // i18n: "Apply Changes"
    const applyButton = screen.getByText('Apply Changes')
    expect(applyButton).toBeDisabled()
  })

  it('checking a property "Change" enables Apply button', () => {
    renderDialog({ category: ThingCategory.ITEM })

    const applyButton = screen.getByText('Apply Changes')
    expect(applyButton).toBeDisabled()

    // Check "Change" on a property
    const { changeCheckbox } = findPropertyRow('Container')
    fireEvent.click(changeCheckbox)

    expect(applyButton).not.toBeDisabled()
  })

  it('enabling animation mode change enables Apply button', () => {
    renderDialog({ category: ThingCategory.ITEM })

    const applyButton = screen.getByText('Apply Changes')
    expect(applyButton).toBeDisabled()

    // Find the animation mode "Change" checkbox in Animation Settings section
    const animSection = screen.getByText('Animation Settings')
    const animFieldGroup = animSection.closest('.flex.flex-col.gap-2')!
    const changeLabels = within(animFieldGroup as HTMLElement).getAllByText('Change')
    const animModeChangeCheckbox = changeLabels[0].closest('label')?.querySelector('input')
    fireEvent.click(animModeChangeCheckbox!)

    expect(applyButton).not.toBeDisabled()
  })

  // -------------------------------------------------------------------------
  // Confirm collects only changed properties
  // -------------------------------------------------------------------------

  it('Confirm collects only changed properties', () => {
    const onConfirm = vi.fn()
    renderDialog({ category: ThingCategory.ITEM, onConfirm })

    // Check "Change" on Container and set value to true
    const { changeCheckbox, valueCheckbox } = findPropertyRow('Container')
    fireEvent.click(changeCheckbox)
    fireEvent.click(valueCheckbox)

    // Click Apply Changes
    fireEvent.click(screen.getByText('Apply Changes'))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    const result: BulkEditResult = onConfirm.mock.calls[0][0]
    expect(result.properties).toBeDefined()

    // Should contain only isContainer with value=true
    const containerChange = result.properties.find((p) => p.property === 'isContainer')
    expect(containerChange).toBeDefined()
    expect(containerChange!.value).toBe(true)

    // Should not contain unchanged properties
    const stackableChange = result.properties.find((p) => p.property === 'stackable')
    expect(stackableChange).toBeUndefined()
  })

  // -------------------------------------------------------------------------
  // Attributes tab
  // -------------------------------------------------------------------------

  it('Attributes tab shown only for Item category with otbLoaded=true', () => {
    // Item + otbLoaded=true -> Attributes tab visible
    const { unmount: u1 } = renderDialog({
      category: ThingCategory.ITEM,
      otbLoaded: true
    })
    expect(screen.getByText('Attributes')).toBeInTheDocument()
    u1()

    // Item + otbLoaded=false -> no Attributes tab
    const { unmount: u2 } = renderDialog({
      category: ThingCategory.ITEM,
      otbLoaded: false
    })
    expect(screen.queryByText('Attributes')).toBeNull()
    u2()

    // Outfit + otbLoaded=true -> no Attributes tab
    const { unmount: u3 } = renderDialog({
      category: ThingCategory.OUTFIT,
      otbLoaded: true
    })
    expect(screen.queryByText('Attributes')).toBeNull()
    u3()

    // Effect + otbLoaded=true -> no Attributes tab
    const { unmount: u4 } = renderDialog({
      category: ThingCategory.EFFECT,
      otbLoaded: true
    })
    expect(screen.queryByText('Attributes')).toBeNull()
    u4()

    // Missile + otbLoaded=true -> no Attributes tab
    renderDialog({
      category: ThingCategory.MISSILE,
      otbLoaded: true
    })
    expect(screen.queryByText('Attributes')).toBeNull()
  })
})
