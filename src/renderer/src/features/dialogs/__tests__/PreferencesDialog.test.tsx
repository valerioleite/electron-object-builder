/**
 * Tests for PreferencesDialog component.
 * Covers tab rendering and switching, form fields per tab, confirm/cancel
 * behavior, settings loading, and otbLoaded-dependent controls.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PreferencesDialog } from '../PreferencesDialog'
import type { ObjectBuilderSettings } from '../../../../../shared/settings'
import { createObjectBuilderSettings } from '../../../../../shared/settings'

// ---------------------------------------------------------------------------
// Mock window.api.settings
// ---------------------------------------------------------------------------

const mockSettings = createObjectBuilderSettings()

beforeEach(() => {
  vi.clearAllMocks()
  window.api = {
    settings: {
      load: vi.fn().mockResolvedValue({ ...mockSettings })
    }
  } as unknown as typeof window.api
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: (settings: ObjectBuilderSettings) => void
  otbLoaded?: boolean
}

const defaultProps: Props = {
  open: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  otbLoaded: false
}

function renderDialog(overrides: Partial<Props> = {}) {
  return render(<PreferencesDialog {...defaultProps} {...overrides} />)
}

/**
 * Click a specific tab button by its label text.
 * The tab bar is a div with border-b containing button children.
 * This avoids ambiguity when the same text appears in tab content.
 */
function clickTab(tabLabel: string): void {
  // Find all buttons, filter to the one in the tab bar area
  const buttons = screen.getAllByRole('button')
  const tabButton = buttons.find(
    (btn) => btn.textContent === tabLabel && btn.parentElement?.classList.contains('border-b')
  )
  if (!tabButton) {
    throw new Error(`Tab button "${tabLabel}" not found in tab bar`)
  }
  fireEvent.click(tabButton)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PreferencesDialog', () => {
  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  it('does not render when open=false', () => {
    renderDialog({ open: false })
    expect(screen.queryByText('Preferences')).toBeNull()
  })

  it('renders 5 tabs', () => {
    renderDialog()
    // All 5 tab labels should be visible as buttons in the tab bar
    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('Custom Client')).toBeInTheDocument()
    expect(screen.getByText('Sprite Sheet')).toBeInTheDocument()
    expect(screen.getByText('Things')).toBeInTheDocument()
    // "Items" tab button exists (may also appear as content label later)
    const itemsElements = screen.getAllByText('Items')
    expect(itemsElements.length).toBeGreaterThanOrEqual(1)
  })

  // -------------------------------------------------------------------------
  // General tab
  // -------------------------------------------------------------------------

  it('General tab shows theme, language, autosave, clipboard, and list amount fields', () => {
    renderDialog()
    // General tab is active by default
    expect(screen.getByText('Appearance')).toBeInTheDocument()
    expect(screen.getByText('Theme')).toBeInTheDocument()
    // "Language" appears as both FieldGroup label and SelectField label
    const languageElements = screen.getAllByText('Language')
    expect(languageElements.length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('Auto save object changes')).toBeInTheDocument()
    expect(screen.getByText('Clipboard Action')).toBeInTheDocument()
    expect(screen.getByText('List Amount')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Custom Client tab
  // -------------------------------------------------------------------------

  it('Custom Client tab shows extended/transparency checkboxes', () => {
    renderDialog()
    clickTab('Custom Client')

    expect(screen.getByText('Extended option always selected')).toBeInTheDocument()
    expect(screen.getByText('Transparency option always selected')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Sprite Sheet tab
  // -------------------------------------------------------------------------

  it('Sprite Sheet tab shows radio options (None, Only Patterns, All Properties)', () => {
    renderDialog()
    clickTab('Sprite Sheet')

    expect(screen.getByText('Save Object Properties')).toBeInTheDocument()
    expect(screen.getByText('None')).toBeInTheDocument()
    expect(screen.getByText('Only Patterns')).toBeInTheDocument()
    expect(screen.getByText('All Properties')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Things tab
  // -------------------------------------------------------------------------

  it('Things tab shows duration fields for Items, Outfits, Effects, Missiles', () => {
    renderDialog()
    clickTab('Things')

    expect(screen.getByText('Default durations')).toBeInTheDocument()
    // Duration labels use i18n translated category names
    // "Items" appears both as tab and as duration label;
    // verify the duration-specific labels
    expect(screen.getByText('Outfits')).toBeInTheDocument()
    expect(screen.getByText('Effects')).toBeInTheDocument()
    expect(screen.getByText('Missiles')).toBeInTheDocument()
    // "Items" appears at least as the duration label on the Things tab
    const itemsElements = screen.getAllByText('Items')
    expect(itemsElements.length).toBeGreaterThanOrEqual(2) // tab + duration label
  })

  // -------------------------------------------------------------------------
  // Items tab
  // -------------------------------------------------------------------------

  it('Items tab shows sync OTB checkbox', () => {
    renderDialog({ otbLoaded: true })
    clickTab('Items')

    expect(
      screen.getByText('Automatically create missing server items (new/update/duplicate/import)')
    ).toBeInTheDocument()
  })

  it('Items tab sync checkbox is disabled when otbLoaded=false', () => {
    renderDialog({ otbLoaded: false })
    clickTab('Items')

    const syncLabel = screen.getByText(
      'Automatically create missing server items (new/update/duplicate/import)'
    )
    const checkbox = syncLabel.closest('label')?.querySelector('input')
    expect(checkbox).toBeDisabled()
  })

  // -------------------------------------------------------------------------
  // Tab switching
  // -------------------------------------------------------------------------

  it('tab switching works correctly', () => {
    renderDialog()

    // Start on General
    expect(screen.getByText('Appearance')).toBeInTheDocument()

    // Switch to Custom Client
    clickTab('Custom Client')
    expect(screen.getByText('Extended option always selected')).toBeInTheDocument()
    expect(screen.queryByText('Appearance')).toBeNull()

    // Switch to Sprite Sheet
    clickTab('Sprite Sheet')
    expect(screen.getByText('Save Object Properties')).toBeInTheDocument()

    // Switch to Things
    clickTab('Things')
    expect(screen.getByText('Default durations')).toBeInTheDocument()

    // Switch to Items
    clickTab('Items')
    expect(
      screen.getByText('Automatically create missing server items (new/update/duplicate/import)')
    ).toBeInTheDocument()

    // Back to General
    clickTab('General')
    expect(screen.getByText('Appearance')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Confirm and Cancel
  // -------------------------------------------------------------------------

  it('Confirm calls onConfirm with settings and closes', async () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    renderDialog({ onConfirm, onClose })

    // Wait for settings to load (useEffect triggers on open)
    await waitFor(() => {
      expect(window.api.settings.load).toHaveBeenCalled()
    })

    fireEvent.click(screen.getByText('Confirm'))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    const settings = onConfirm.mock.calls[0][0]
    expect(settings).toBeDefined()
    expect(typeof settings.language).toBe('string')
    expect(typeof settings.autosaveThingChanges).toBe('boolean')

    // onClose is also called on confirm
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Cancel closes without calling onConfirm', () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    renderDialog({ onConfirm, onClose })

    fireEvent.click(screen.getByText('Cancel'))

    expect(onConfirm).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  // -------------------------------------------------------------------------
  // Restart note
  // -------------------------------------------------------------------------

  it('shows "Some changes may require restart" note', () => {
    renderDialog()
    expect(screen.getByText('Some changes may require restart')).toBeInTheDocument()
  })
})
