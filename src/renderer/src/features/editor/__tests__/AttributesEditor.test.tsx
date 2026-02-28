/**
 * Tests for AttributesEditor component.
 * Covers: TFS server selection, basic info fields, type-specific controls,
 * add/remove attributes, search, bulk mode, and validation.
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AttributesEditor } from '../AttributesEditor'
import { loadServer, resetAttributeStorage } from '../../../services/item-attributes'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderEditor(props: Partial<React.ComponentProps<typeof AttributesEditor>> = {}) {
  const defaultProps: React.ComponentProps<typeof AttributesEditor> = {
    xmlAttributes: null,
    onChange: vi.fn(),
    ...props
  }
  return render(<AttributesEditor {...defaultProps} />)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AttributesEditor', () => {
  beforeEach(() => {
    resetAttributeStorage()
  })

  // -----------------------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------------------

  describe('rendering', () => {
    it('renders the component', () => {
      renderEditor()
      expect(screen.getByTestId('attributes-editor')).toBeInTheDocument()
    })

    it('renders TFS server selector', () => {
      renderEditor()
      const selector = screen.getByTestId('server-selector')
      expect(selector).toBeInTheDocument()
      expect(selector).toBeInstanceOf(HTMLSelectElement)
    })

    it('renders basic info section by default', () => {
      renderEditor()
      expect(screen.getByTestId('basic-info')).toBeInTheDocument()
    })

    it('renders active attributes section', () => {
      renderEditor()
      expect(screen.getByTestId('active-attributes')).toBeInTheDocument()
    })

    it('renders add attributes section', () => {
      renderEditor()
      expect(screen.getByTestId('add-attributes')).toBeInTheDocument()
    })

    it('renders search input', () => {
      renderEditor()
      expect(screen.getByTestId('attr-search')).toBeInTheDocument()
    })

    it('shows "No attributes set" when no active attributes', () => {
      renderEditor({ xmlAttributes: null })
      expect(screen.getByText('No attributes set.')).toBeInTheDocument()
    })
  })

  // -----------------------------------------------------------------------
  // TFS Server Selection
  // -----------------------------------------------------------------------

  describe('TFS server selection', () => {
    it('defaults to tfs1.4', () => {
      renderEditor()
      const selector = screen.getByTestId('server-selector') as HTMLSelectElement
      expect(selector.value).toBe('tfs1.4')
    })

    it('uses initialServer prop', () => {
      renderEditor({ initialServer: 'tfs1.6' })
      const selector = screen.getByTestId('server-selector') as HTMLSelectElement
      expect(selector.value).toBe('tfs1.6')
    })

    it('lists all 8 TFS servers', () => {
      renderEditor()
      const selector = screen.getByTestId('server-selector') as HTMLSelectElement
      const options = Array.from(selector.options)
      expect(options.length).toBe(8)
    })

    it('changes server on select', () => {
      renderEditor()
      const selector = screen.getByTestId('server-selector') as HTMLSelectElement
      fireEvent.change(selector, { target: { value: 'tfs1.6' } })
      expect(selector.value).toBe('tfs1.6')
    })
  })

  // -----------------------------------------------------------------------
  // Basic Info Fields
  // -----------------------------------------------------------------------

  describe('basic info fields', () => {
    it('renders article dropdown', () => {
      renderEditor()
      expect(screen.getByTestId('basic-article')).toBeInTheDocument()
    })

    it('renders name input', () => {
      renderEditor()
      expect(screen.getByTestId('basic-name')).toBeInTheDocument()
    })

    it('renders plural input', () => {
      renderEditor()
      expect(screen.getByTestId('basic-plural')).toBeInTheDocument()
    })

    it('renders description textarea', () => {
      renderEditor()
      expect(screen.getByTestId('basic-description')).toBeInTheDocument()
    })

    it('shows existing basic info values', () => {
      renderEditor({
        xmlAttributes: {
          article: 'a',
          name: 'sword',
          plural: 'swords',
          description: 'A sharp blade'
        }
      })
      expect((screen.getByTestId('basic-article') as HTMLSelectElement).value).toBe('a')
      expect((screen.getByTestId('basic-name') as HTMLInputElement).value).toBe('sword')
      expect((screen.getByTestId('basic-plural') as HTMLInputElement).value).toBe('swords')
      expect((screen.getByTestId('basic-description') as HTMLTextAreaElement).value).toBe(
        'A sharp blade'
      )
    })

    it('calls onChange when article changes', () => {
      const onChange = vi.fn()
      renderEditor({ xmlAttributes: { name: 'sword' }, onChange })
      fireEvent.change(screen.getByTestId('basic-article'), { target: { value: 'a' } })
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ article: 'a', name: 'sword' })
      )
    })

    it('calls onChange when name changes', () => {
      const onChange = vi.fn()
      renderEditor({ xmlAttributes: null, onChange })
      fireEvent.change(screen.getByTestId('basic-name'), { target: { value: 'shield' } })
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'shield' }))
    })

    it('calls onChange when plural changes', () => {
      const onChange = vi.fn()
      renderEditor({ xmlAttributes: null, onChange })
      fireEvent.change(screen.getByTestId('basic-plural'), { target: { value: 'shields' } })
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ plural: 'shields' }))
    })

    it('calls onChange when description changes', () => {
      const onChange = vi.fn()
      renderEditor({ xmlAttributes: null, onChange })
      fireEvent.change(screen.getByTestId('basic-description'), {
        target: { value: 'A sturdy shield' }
      })
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'A sturdy shield' })
      )
    })

    it('hides basic info in bulk mode', () => {
      renderEditor({ bulkMode: true })
      expect(screen.queryByTestId('basic-info')).not.toBeInTheDocument()
    })
  })

  // -----------------------------------------------------------------------
  // Active Attributes
  // -----------------------------------------------------------------------

  describe('active attributes', () => {
    it('shows count of non-basic active attributes', () => {
      renderEditor({
        xmlAttributes: { name: 'sword', attack: '20', defense: '5' }
      })
      expect(screen.getByText('Item Attributes (2)')).toBeInTheDocument()
    })

    it('renders attribute rows for non-basic attributes', () => {
      renderEditor({
        xmlAttributes: { name: 'sword', attack: '20' }
      })
      expect(screen.getByTestId('attr-row-attack')).toBeInTheDocument()
    })

    it('does not render basic attributes in the active list', () => {
      renderEditor({
        xmlAttributes: { name: 'sword', article: 'a', attack: '20' }
      })
      expect(screen.queryByTestId('attr-row-name')).not.toBeInTheDocument()
      expect(screen.queryByTestId('attr-row-article')).not.toBeInTheDocument()
      expect(screen.getByTestId('attr-row-attack')).toBeInTheDocument()
    })

    it('renders remove button for each attribute', () => {
      renderEditor({
        xmlAttributes: { attack: '20' }
      })
      expect(screen.getByTestId('attr-remove-attack')).toBeInTheDocument()
    })

    it('calls onChange when remove is clicked', () => {
      const onChange = vi.fn()
      renderEditor({
        xmlAttributes: { attack: '20', defense: '5' },
        onChange
      })
      fireEvent.click(screen.getByTestId('attr-remove-attack'))
      expect(onChange).toHaveBeenCalledWith({ defense: '5' })
    })

    it('calls onChange with null when last non-basic attribute is removed', () => {
      const onChange = vi.fn()
      renderEditor({
        xmlAttributes: { attack: '20' },
        onChange
      })
      fireEvent.click(screen.getByTestId('attr-remove-attack'))
      expect(onChange).toHaveBeenCalledWith(null)
    })

    it('sorts active attributes alphabetically', () => {
      renderEditor({
        xmlAttributes: { defense: '5', attack: '20', weight: '100' }
      })
      const rows = screen.getAllByTestId(/^attr-row-/)
      const keys = rows.map((r) => r.getAttribute('data-testid')!.replace('attr-row-', ''))
      expect(keys).toEqual(['attack', 'defense', 'weight'])
    })
  })

  // -----------------------------------------------------------------------
  // Type-specific controls
  // -----------------------------------------------------------------------

  describe('type-specific controls', () => {
    it('renders checkbox for boolean attributes', () => {
      // 'writeable' is a boolean attribute in tfs1.4
      loadServer('tfs1.4')
      renderEditor({
        xmlAttributes: { writeable: '1' },
        initialServer: 'tfs1.4'
      })
      const control = screen.getByTestId('attr-control-writeable')
      expect(control).toBeInstanceOf(HTMLInputElement)
      expect((control as HTMLInputElement).type).toBe('checkbox')
      expect((control as HTMLInputElement).checked).toBe(true)
    })

    it('renders text input for string attributes', () => {
      loadServer('tfs1.4')
      renderEditor({
        xmlAttributes: { runeSpellName: 'test spell' },
        initialServer: 'tfs1.4'
      })
      const control = screen.getByTestId('attr-control-runeSpellName')
      expect(control).toBeInstanceOf(HTMLInputElement)
      expect((control as HTMLInputElement).type).toBe('text')
      expect((control as HTMLInputElement).value).toBe('test spell')
    })

    it('renders numeric input for number attributes', () => {
      loadServer('tfs1.4')
      renderEditor({
        xmlAttributes: { weight: '3500' },
        initialServer: 'tfs1.4'
      })
      const control = screen.getByTestId('attr-control-weight')
      expect(control).toBeInstanceOf(HTMLInputElement)
      expect((control as HTMLInputElement).value).toBe('3500')
    })

    it('renders dropdown for enum attributes (string with values)', () => {
      loadServer('tfs1.4')
      renderEditor({
        xmlAttributes: { slotType: 'head' },
        initialServer: 'tfs1.4'
      })
      const control = screen.getByTestId('attr-control-slotType')
      expect(control).toBeInstanceOf(HTMLSelectElement)
      expect((control as HTMLSelectElement).value).toBe('head')
    })

    it('calls onChange when boolean attribute is toggled', () => {
      const onChange = vi.fn()
      loadServer('tfs1.4')
      renderEditor({
        xmlAttributes: { writeable: '0' },
        onChange,
        initialServer: 'tfs1.4'
      })
      fireEvent.click(screen.getByTestId('attr-control-writeable'))
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ writeable: '1' }))
    })

    it('calls onChange when string attribute changes', () => {
      const onChange = vi.fn()
      loadServer('tfs1.4')
      renderEditor({
        xmlAttributes: { runeSpellName: '' },
        onChange,
        initialServer: 'tfs1.4'
      })
      fireEvent.change(screen.getByTestId('attr-control-runeSpellName'), {
        target: { value: 'heal' }
      })
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ runeSpellName: 'heal' }))
    })

    it('calls onChange when enum attribute changes', () => {
      const onChange = vi.fn()
      loadServer('tfs1.4')
      renderEditor({
        xmlAttributes: { slotType: 'head' },
        onChange,
        initialServer: 'tfs1.4'
      })
      fireEvent.change(screen.getByTestId('attr-control-slotType'), {
        target: { value: 'body' }
      })
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ slotType: 'body' }))
    })

    it('renders text input as default for unknown attributes', () => {
      renderEditor({
        xmlAttributes: { customAttr: 'customValue' }
      })
      const control = screen.getByTestId('attr-control-customAttr')
      expect(control).toBeInstanceOf(HTMLInputElement)
      expect((control as HTMLInputElement).type).toBe('text')
    })
  })

  // -----------------------------------------------------------------------
  // Search and Add Attributes
  // -----------------------------------------------------------------------

  describe('search and add attributes', () => {
    it('shows search results when typing', () => {
      loadServer('tfs1.4')
      renderEditor({ initialServer: 'tfs1.4' })
      fireEvent.change(screen.getByTestId('attr-search'), { target: { value: 'attack' } })
      expect(screen.getByTestId('search-results')).toBeInTheDocument()
    })

    it('shows matching attributes in search results', () => {
      loadServer('tfs1.4')
      renderEditor({ initialServer: 'tfs1.4' })
      fireEvent.change(screen.getByTestId('attr-search'), { target: { value: 'attack' } })
      expect(screen.getByTestId('add-btn-attack')).toBeInTheDocument()
    })

    it('excludes already active attributes from search results', () => {
      loadServer('tfs1.4')
      renderEditor({
        xmlAttributes: { attack: '20' },
        initialServer: 'tfs1.4'
      })
      fireEvent.change(screen.getByTestId('attr-search'), { target: { value: 'attack' } })
      expect(screen.queryByTestId('add-btn-attack')).not.toBeInTheDocument()
    })

    it('excludes basic attributes from search results', () => {
      loadServer('tfs1.4')
      renderEditor({ initialServer: 'tfs1.4' })
      fireEvent.change(screen.getByTestId('attr-search'), { target: { value: 'name' } })
      expect(screen.queryByTestId('add-btn-name')).not.toBeInTheDocument()
    })

    it('shows "No matching attributes" for no results', () => {
      loadServer('tfs1.4')
      renderEditor({ initialServer: 'tfs1.4' })
      fireEvent.change(screen.getByTestId('attr-search'), { target: { value: 'xyznonexistent' } })
      expect(screen.getByText('No matching attributes.')).toBeInTheDocument()
    })

    it('adds attribute when add button is clicked', () => {
      const onChange = vi.fn()
      loadServer('tfs1.4')
      renderEditor({ onChange, initialServer: 'tfs1.4' })
      fireEvent.change(screen.getByTestId('attr-search'), { target: { value: 'attack' } })
      fireEvent.click(screen.getByTestId('add-btn-attack'))
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ attack: '' }))
    })

    it('adds boolean attribute with default value "0"', () => {
      const onChange = vi.fn()
      loadServer('tfs1.4')
      renderEditor({ onChange, initialServer: 'tfs1.4' })
      fireEvent.change(screen.getByTestId('attr-search'), { target: { value: 'writeable' } })
      fireEvent.click(screen.getByTestId('add-btn-writeable'))
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ writeable: '0' }))
    })

    it('adds enum attribute with first value as default', () => {
      const onChange = vi.fn()
      loadServer('tfs1.4')
      renderEditor({ onChange, initialServer: 'tfs1.4' })
      fireEvent.change(screen.getByTestId('attr-search'), { target: { value: 'slotType' } })
      fireEvent.click(screen.getByTestId('add-btn-slotType'))
      // The first value of slotType in tfs1.4
      expect(onChange).toHaveBeenCalled()
      const call = onChange.mock.calls[0][0]
      expect(call.slotType).toBeDefined()
    })
  })

  // -----------------------------------------------------------------------
  // Category Browsing
  // -----------------------------------------------------------------------

  describe('category browsing', () => {
    it('shows category browser when not searching', () => {
      loadServer('tfs1.4')
      renderEditor({ initialServer: 'tfs1.4' })
      expect(screen.getByTestId('category-browser')).toBeInTheDocument()
    })

    it('hides category browser when searching', () => {
      loadServer('tfs1.4')
      renderEditor({ initialServer: 'tfs1.4' })
      fireEvent.change(screen.getByTestId('attr-search'), { target: { value: 'attack' } })
      expect(screen.queryByTestId('category-browser')).not.toBeInTheDocument()
    })

    it('shows categories with available attributes', () => {
      loadServer('tfs1.4')
      renderEditor({ initialServer: 'tfs1.4' })
      // tfs1.4 has categories like General, Abilities, etc.
      const categoryBrowser = screen.getByTestId('category-browser')
      expect(categoryBrowser.querySelectorAll('[data-testid^="category-"]').length).toBeGreaterThan(
        0
      )
    })

    it('expands category on click', () => {
      loadServer('tfs1.4')
      renderEditor({ initialServer: 'tfs1.4' })
      const categories = screen.getByTestId('category-browser')
      const firstCategory = categories.querySelector('[data-testid^="category-"]')
      expect(firstCategory).not.toBeNull()
      fireEvent.click(firstCategory!)
      // Should show add buttons for attributes in that category
      const addButtons = categories.querySelectorAll('[data-testid^="add-btn-"]')
      expect(addButtons.length).toBeGreaterThan(0)
    })

    it('collapses category on second click', () => {
      loadServer('tfs1.4')
      renderEditor({ initialServer: 'tfs1.4' })
      const categories = screen.getByTestId('category-browser')
      const firstCategory = categories.querySelector('[data-testid^="category-"]')
      fireEvent.click(firstCategory!)
      const addButtonsBefore = categories.querySelectorAll('[data-testid^="add-btn-"]').length
      expect(addButtonsBefore).toBeGreaterThan(0)
      fireEvent.click(firstCategory!)
      const addButtonsAfter = categories.querySelectorAll('[data-testid^="add-btn-"]').length
      expect(addButtonsAfter).toBe(0)
    })
  })

  // -----------------------------------------------------------------------
  // Bulk Mode
  // -----------------------------------------------------------------------

  describe('bulk mode', () => {
    it('hides basic info in bulk mode', () => {
      renderEditor({ bulkMode: true })
      expect(screen.queryByTestId('basic-info')).not.toBeInTheDocument()
    })

    it('still shows active attributes in bulk mode', () => {
      renderEditor({ bulkMode: true })
      expect(screen.getByTestId('active-attributes')).toBeInTheDocument()
    })

    it('still shows add attributes in bulk mode', () => {
      renderEditor({ bulkMode: true })
      expect(screen.getByTestId('add-attributes')).toBeInTheDocument()
    })
  })

  // -----------------------------------------------------------------------
  // Disabled State
  // -----------------------------------------------------------------------

  describe('disabled state', () => {
    it('disables server selector when disabled', () => {
      renderEditor({ disabled: true })
      expect(screen.getByTestId('server-selector')).toBeDisabled()
    })

    it('disables basic info fields when disabled', () => {
      renderEditor({ disabled: true })
      expect(screen.getByTestId('basic-article')).toBeDisabled()
      expect(screen.getByTestId('basic-name')).toBeDisabled()
      expect(screen.getByTestId('basic-plural')).toBeDisabled()
      expect(screen.getByTestId('basic-description')).toBeDisabled()
    })

    it('disables search input when disabled', () => {
      renderEditor({ disabled: true })
      expect(screen.getByTestId('attr-search')).toBeDisabled()
    })

    it('disables attribute controls when disabled', () => {
      loadServer('tfs1.4')
      renderEditor({
        xmlAttributes: { attack: '20' },
        disabled: true,
        initialServer: 'tfs1.4'
      })
      expect(screen.getByTestId('attr-control-attack')).toBeDisabled()
    })

    it('disables remove buttons when disabled', () => {
      renderEditor({
        xmlAttributes: { attack: '20' },
        disabled: true
      })
      expect(screen.getByTestId('attr-remove-attack')).toBeDisabled()
    })
  })

  // -----------------------------------------------------------------------
  // Integration
  // -----------------------------------------------------------------------

  describe('integration', () => {
    it('full workflow: add attribute, edit value, remove attribute', () => {
      const onChange = vi.fn()
      loadServer('tfs1.4')
      const { rerender } = renderEditor({
        xmlAttributes: null,
        onChange,
        initialServer: 'tfs1.4'
      })

      // Search for attack
      fireEvent.change(screen.getByTestId('attr-search'), { target: { value: 'attack' } })

      // Add attack attribute
      fireEvent.click(screen.getByTestId('add-btn-attack'))
      expect(onChange).toHaveBeenCalled()
      const addedAttrs = onChange.mock.calls[0][0]
      expect(addedAttrs.attack).toBeDefined()

      // Re-render with the new attributes
      onChange.mockClear()
      rerender(
        <AttributesEditor
          xmlAttributes={{ attack: '20' }}
          onChange={onChange}
          initialServer="tfs1.4"
        />
      )

      // Edit attack value
      fireEvent.change(screen.getByTestId('attr-control-attack'), { target: { value: '30' } })
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ attack: '30' }))

      // Remove attack
      onChange.mockClear()
      fireEvent.click(screen.getByTestId('attr-remove-attack'))
      expect(onChange).toHaveBeenCalledWith(null)
    })

    it('preserves basic info when adding/removing dynamic attributes', () => {
      const onChange = vi.fn()
      loadServer('tfs1.4')
      renderEditor({
        xmlAttributes: { name: 'sword', article: 'a' },
        onChange,
        initialServer: 'tfs1.4'
      })

      // Search and add attack
      fireEvent.change(screen.getByTestId('attr-search'), { target: { value: 'attack' } })
      fireEvent.click(screen.getByTestId('add-btn-attack'))

      const result = onChange.mock.calls[0][0]
      expect(result.name).toBe('sword')
      expect(result.article).toBe('a')
      expect(result.attack).toBeDefined()
    })

    it('switching server resets search', () => {
      loadServer('tfs1.4')
      renderEditor({ initialServer: 'tfs1.4' })

      // Type a search
      fireEvent.change(screen.getByTestId('attr-search'), { target: { value: 'attack' } })
      expect((screen.getByTestId('attr-search') as HTMLInputElement).value).toBe('attack')

      // Switch server
      fireEvent.change(screen.getByTestId('server-selector'), { target: { value: 'tfs1.6' } })
      expect((screen.getByTestId('attr-search') as HTMLInputElement).value).toBe('')
    })
  })
})
