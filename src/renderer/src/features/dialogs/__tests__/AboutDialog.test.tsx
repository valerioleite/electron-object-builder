/**
 * Tests for AboutDialog component.
 * Covers rendering, content display, supporter links, and close behavior.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AboutDialog } from '../AboutDialog'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AboutDialog', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('does not render when open=false', () => {
    const { container } = render(<AboutDialog open={false} onClose={vi.fn()} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders app name heading', () => {
    render(<AboutDialog open={true} onClose={vi.fn()} />)
    const headings = screen.getAllByRole('heading', { level: 2 })
    const appNameHeading = headings.find((h) => h.textContent === 'Electron - Object Builder')
    expect(appNameHeading).toBeDefined()
  })

  it('shows version "0.1.0"', () => {
    render(<AboutDialog open={true} onClose={vi.fn()} />)
    // i18n key labels.version = "Version"
    // Text rendered: "Version 0.1.0"
    expect(screen.getByText(/Version 0\.1\.0/)).toBeInTheDocument()
  })

  it('shows copyright text', () => {
    render(<AboutDialog open={true} onClose={vi.fn()} />)
    expect(screen.getByText('Copyright (c) 2026 Contributors')).toBeInTheDocument()
  })

  it('shows license text', () => {
    render(<AboutDialog open={true} onClose={vi.fn()} />)
    expect(screen.getByText(/This software is licensed under the MIT License/)).toBeInTheDocument()
  })

  it('shows tech stack text', () => {
    render(<AboutDialog open={true} onClose={vi.fn()} />)
    expect(screen.getByText('Built with Electron + React + TypeScript')).toBeInTheDocument()
  })

  it('close button calls onClose', () => {
    const onClose = vi.fn()
    render(<AboutDialog open={true} onClose={onClose} />)
    // i18n key labels.close = "Close"
    fireEvent.click(screen.getByText('Close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
