/**
 * Tests for the Modal dialog component and all its form sub-components:
 * Modal, DialogButton, FieldGroup, SelectField, CheckboxField,
 * TextInputField, BrowseField, InfoRow, NumberInputField, RadioField.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  Modal,
  DialogButton,
  FieldGroup,
  SelectField,
  CheckboxField,
  TextInputField,
  BrowseField,
  InfoRow,
  NumberInputField,
  RadioField
} from '../Modal'

// ===========================================================================
// Modal
// ===========================================================================

describe('Modal', () => {
  const defaultProps = {
    title: 'Test Dialog',
    open: true,
    onClose: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not render when open=false', () => {
    render(
      <Modal {...defaultProps} open={false}>
        <p>Hidden content</p>
      </Modal>
    )
    expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument()
  })

  it('renders title and children when open=true', () => {
    render(
      <Modal {...defaultProps}>
        <p>Visible content</p>
      </Modal>
    )
    expect(screen.getByText('Test Dialog')).toBeInTheDocument()
    expect(screen.getByText('Visible content')).toBeInTheDocument()
  })

  it('renders footer when provided', () => {
    render(
      <Modal {...defaultProps} footer={<button>Save</button>}>
        <p>Content</p>
      </Modal>
    )
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('does not render footer when not provided', () => {
    const { container } = render(
      <Modal {...defaultProps}>
        <p>Content</p>
      </Modal>
    )
    // The footer wrapper div should not be present
    const footerDivs = container.querySelectorAll('.justify-end')
    expect(footerDivs.length).toBe(0)
  })

  it('calls onClose when close button clicked', () => {
    render(
      <Modal {...defaultProps}>
        <p>Content</p>
      </Modal>
    )
    const closeButton = screen.getByTitle('Close')
    fireEvent.click(closeButton)
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape key is pressed', () => {
    render(
      <Modal {...defaultProps}>
        <p>Content</p>
      </Modal>
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop clicked with closeOnBackdrop=true (default)', () => {
    const { container } = render(
      <Modal {...defaultProps}>
        <p>Content</p>
      </Modal>
    )
    // The backdrop is the outermost fixed div
    const backdrop = container.querySelector('.fixed.inset-0')!
    fireEvent.click(backdrop)
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('does NOT call onClose when backdrop clicked with closeOnBackdrop=false', () => {
    const { container } = render(
      <Modal {...defaultProps} closeOnBackdrop={false}>
        <p>Content</p>
      </Modal>
    )
    const backdrop = container.querySelector('.fixed.inset-0')!
    fireEvent.click(backdrop)
    expect(defaultProps.onClose).not.toHaveBeenCalled()
  })

  it('does NOT close when clicking dialog content (stopPropagation)', () => {
    render(
      <Modal {...defaultProps}>
        <p>Content</p>
      </Modal>
    )
    // Clicking on the content text should not trigger onClose
    fireEvent.click(screen.getByText('Content'))
    expect(defaultProps.onClose).not.toHaveBeenCalled()
  })

  it('sets custom width style on dialog', () => {
    const { container } = render(
      <Modal {...defaultProps} width={600}>
        <p>Content</p>
      </Modal>
    )
    const dialogDiv = container.querySelector('[tabindex="-1"]') as HTMLElement
    expect(dialogDiv).toBeTruthy()
    expect(dialogDiv.style.width).toBe('600px')
  })

  it('uses default width of 480 when not specified', () => {
    const { container } = render(
      <Modal {...defaultProps}>
        <p>Content</p>
      </Modal>
    )
    const dialogDiv = container.querySelector('[tabindex="-1"]') as HTMLElement
    expect(dialogDiv).toBeTruthy()
    expect(dialogDiv.style.width).toBe('480px')
  })

  it('focuses dialog on open', () => {
    const { container } = render(
      <Modal {...defaultProps}>
        <p>Content</p>
      </Modal>
    )
    const dialogDiv = container.querySelector('[tabindex="-1"]') as HTMLElement
    expect(dialogDiv).toBeTruthy()
    expect(document.activeElement).toBe(dialogDiv)
  })

  it('does not add Escape listener when closed', () => {
    const onClose = vi.fn()
    render(
      <Modal title="Closed" open={false} onClose={onClose}>
        <p>Content</p>
      </Modal>
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })
})

// ===========================================================================
// DialogButton
// ===========================================================================

describe('DialogButton', () => {
  it('renders label text', () => {
    render(<DialogButton label="Confirm" onClick={vi.fn()} />)
    expect(screen.getByText('Confirm')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<DialogButton label="Confirm" onClick={handleClick} />)
    fireEvent.click(screen.getByText('Confirm'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled=true', () => {
    const handleClick = vi.fn()
    render(<DialogButton label="Confirm" onClick={handleClick} disabled />)
    const button = screen.getByText('Confirm')
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('has different styling for primary=true', () => {
    const { rerender } = render(
      <DialogButton label="Primary" onClick={vi.fn()} primary />
    )
    const primaryButton = screen.getByText('Primary')
    // Primary button has bg-accent (solid background) and text-bg-primary
    expect(primaryButton.className).toContain('bg-accent')
    expect(primaryButton.className).toContain('text-bg-primary')

    rerender(<DialogButton label="Secondary" onClick={vi.fn()} />)
    const secondaryButton = screen.getByText('Secondary')
    // Secondary button does NOT have bg-accent as a standalone class (only hover:bg-accent-subtle)
    // and does NOT have text-bg-primary; instead it has text-accent
    expect(secondaryButton.className).not.toContain('text-bg-primary')
    expect(secondaryButton.className).toContain('text-accent')
  })
})

// ===========================================================================
// FieldGroup
// ===========================================================================

describe('FieldGroup', () => {
  it('renders label', () => {
    render(
      <FieldGroup label="Settings">
        <p>Field content</p>
      </FieldGroup>
    )
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders children', () => {
    render(
      <FieldGroup label="Settings">
        <p>Field content</p>
        <p>More content</p>
      </FieldGroup>
    )
    expect(screen.getByText('Field content')).toBeInTheDocument()
    expect(screen.getByText('More content')).toBeInTheDocument()
  })
})

// ===========================================================================
// SelectField
// ===========================================================================

describe('SelectField', () => {
  const options = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
    { value: 'c', label: 'Option C' }
  ]

  it('renders label and all options', () => {
    render(
      <SelectField label="Choose" value="a" onChange={vi.fn()} options={options} />
    )
    expect(screen.getByText('Choose')).toBeInTheDocument()
    expect(screen.getByText('Option A')).toBeInTheDocument()
    expect(screen.getByText('Option B')).toBeInTheDocument()
    expect(screen.getByText('Option C')).toBeInTheDocument()
  })

  it('calls onChange with selected value', () => {
    const handleChange = vi.fn()
    render(
      <SelectField label="Choose" value="a" onChange={handleChange} options={options} />
    )
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'b' } })
    expect(handleChange).toHaveBeenCalledWith('b')
  })

  it('disables when disabled=true', () => {
    render(
      <SelectField label="Choose" value="a" onChange={vi.fn()} options={options} disabled />
    )
    const select = screen.getByRole('combobox')
    expect(select).toBeDisabled()
  })
})

// ===========================================================================
// CheckboxField
// ===========================================================================

describe('CheckboxField', () => {
  it('renders label', () => {
    render(<CheckboxField label="Enable feature" checked={false} onChange={vi.fn()} />)
    expect(screen.getByText('Enable feature')).toBeInTheDocument()
  })

  it('calls onChange with new checked state', () => {
    const handleChange = vi.fn()
    render(<CheckboxField label="Enable" checked={false} onChange={handleChange} />)
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('disables when disabled=true', () => {
    render(<CheckboxField label="Enable" checked={false} onChange={vi.fn()} disabled />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeDisabled()
  })
})

// ===========================================================================
// TextInputField
// ===========================================================================

describe('TextInputField', () => {
  it('renders label and value', () => {
    render(
      <TextInputField label="Name" value="Hello" onChange={vi.fn()} />
    )
    expect(screen.getByText('Name')).toBeInTheDocument()
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('Hello')
  })

  it('calls onChange on input', () => {
    const handleChange = vi.fn()
    render(
      <TextInputField label="Name" value="" onChange={handleChange} />
    )
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'World' } })
    expect(handleChange).toHaveBeenCalledWith('World')
  })

  it('handles readonly and disabled states', () => {
    const { rerender } = render(
      <TextInputField label="Name" value="Fixed" onChange={vi.fn()} readOnly />
    )
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.readOnly).toBe(true)

    rerender(
      <TextInputField label="Name" value="Fixed" onChange={vi.fn()} disabled />
    )
    const disabledInput = screen.getByRole('textbox') as HTMLInputElement
    expect(disabledInput).toBeDisabled()
  })
})

// ===========================================================================
// BrowseField
// ===========================================================================

describe('BrowseField', () => {
  it('renders label, value, and browse button', () => {
    render(
      <BrowseField label="Folder" value="/home/user" onBrowse={vi.fn()} />
    )
    expect(screen.getByText('Folder')).toBeInTheDocument()
    const input = screen.getByDisplayValue('/home/user') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input.readOnly).toBe(true)
    expect(screen.getByText('Browse')).toBeInTheDocument()
  })

  it('calls onBrowse when browse button clicked', () => {
    const handleBrowse = vi.fn()
    render(
      <BrowseField label="Folder" value="" onBrowse={handleBrowse} />
    )
    fireEvent.click(screen.getByText('Browse'))
    expect(handleBrowse).toHaveBeenCalledTimes(1)
  })

  it('uses default placeholder when none provided', () => {
    render(
      <BrowseField label="Folder" value="" onBrowse={vi.fn()} />
    )
    const input = screen.getByPlaceholderText('Select folder...')
    expect(input).toBeInTheDocument()
  })
})

// ===========================================================================
// InfoRow
// ===========================================================================

describe('InfoRow', () => {
  it('renders label and string value', () => {
    render(<InfoRow label="Version" value="10.56" />)
    expect(screen.getByText('Version')).toBeInTheDocument()
    expect(screen.getByText('10.56')).toBeInTheDocument()
  })

  it('renders label and number value', () => {
    render(<InfoRow label="Count" value={42} />)
    expect(screen.getByText('Count')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })
})

// ===========================================================================
// NumberInputField
// ===========================================================================

describe('NumberInputField', () => {
  it('renders label and value', () => {
    render(
      <NumberInputField label="Speed" value={100} onChange={vi.fn()} />
    )
    expect(screen.getByText('Speed')).toBeInTheDocument()
    const input = screen.getByRole('spinbutton') as HTMLInputElement
    expect(input.value).toBe('100')
  })

  it('calls onChange with number value', () => {
    const handleChange = vi.fn()
    render(
      <NumberInputField label="Speed" value={100} onChange={handleChange} />
    )
    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '200' } })
    expect(handleChange).toHaveBeenCalledWith(200)
  })

  it('calls onChange with 0 for empty input (NaN guard passes for empty string)', () => {
    const handleChange = vi.fn()
    render(
      <NumberInputField label="Speed" value={100} onChange={handleChange} />
    )
    const input = screen.getByRole('spinbutton')
    // In jsdom, type="number" inputs normalize non-numeric strings (like 'abc') to ''.
    // Number('') === 0 which is not NaN, so onChange IS called with 0.
    // The NaN guard in the component (isNaN check) protects against actual NaN values at runtime.
    fireEvent.change(input, { target: { value: '' } })
    expect(handleChange).toHaveBeenCalledWith(0)
  })

  it('disables when disabled=true', () => {
    render(
      <NumberInputField label="Speed" value={100} onChange={vi.fn()} disabled />
    )
    const input = screen.getByRole('spinbutton')
    expect(input).toBeDisabled()
  })

  it('passes min, max, and step attributes', () => {
    render(
      <NumberInputField
        label="Speed"
        value={50}
        onChange={vi.fn()}
        min={0}
        max={200}
        step={10}
      />
    )
    const input = screen.getByRole('spinbutton') as HTMLInputElement
    expect(input.min).toBe('0')
    expect(input.max).toBe('200')
    expect(input.step).toBe('10')
  })
})

// ===========================================================================
// RadioField
// ===========================================================================

describe('RadioField', () => {
  it('renders label and radio input', () => {
    render(
      <RadioField
        label="Option A"
        name="group1"
        value="a"
        checked={false}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByText('Option A')).toBeInTheDocument()
    const radio = screen.getByRole('radio') as HTMLInputElement
    expect(radio).toBeInTheDocument()
    expect(radio.checked).toBe(false)
    expect(radio.name).toBe('group1')
    expect(radio.value).toBe('a')
  })

  it('calls onChange with value when selected', () => {
    const handleChange = vi.fn()
    render(
      <RadioField
        label="Option A"
        name="group1"
        value="a"
        checked={false}
        onChange={handleChange}
      />
    )
    const radio = screen.getByRole('radio')
    fireEvent.click(radio)
    expect(handleChange).toHaveBeenCalledWith('a')
  })

  it('renders as checked when checked=true', () => {
    render(
      <RadioField
        label="Option A"
        name="group1"
        value="a"
        checked={true}
        onChange={vi.fn()}
      />
    )
    const radio = screen.getByRole('radio') as HTMLInputElement
    expect(radio.checked).toBe(true)
  })

  it('disables when disabled=true', () => {
    render(
      <RadioField
        label="Option A"
        name="group1"
        value="a"
        checked={false}
        onChange={vi.fn()}
        disabled
      />
    )
    const radio = screen.getByRole('radio')
    expect(radio).toBeDisabled()
  })
})
