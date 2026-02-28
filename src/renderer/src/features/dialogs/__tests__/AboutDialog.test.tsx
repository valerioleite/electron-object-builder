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

  it('renders dialog title with "About" and app name', () => {
    render(<AboutDialog open={true} onClose={vi.fn()} />)
    // i18n key labels.about = "About"
    // Title is "About Object Builder"
    expect(screen.getByText('About Object Builder')).toBeInTheDocument()
  })

  it('shows app name "Object Builder"', () => {
    render(<AboutDialog open={true} onClose={vi.fn()} />)
    // Multiple h2 elements exist (title bar + content); find all and check
    const headings = screen.getAllByRole('heading', { level: 2 })
    // At least one h2 should contain just "Object Builder" as the app name heading
    const appNameHeading = headings.find((h) => h.textContent === 'Object Builder')
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
    expect(screen.getByText('Copyright (c) 2014-2026 Contributors')).toBeInTheDocument()
  })

  it('shows license text', () => {
    render(<AboutDialog open={true} onClose={vi.fn()} />)
    expect(
      screen.getByText(/This software is licensed under the MIT License/)
    ).toBeInTheDocument()
  })

  it('shows supporter links', () => {
    render(<AboutDialog open={true} onClose={vi.fn()} />)
    expect(screen.getByText('Supported By:')).toBeInTheDocument()
    expect(screen.getByText('dbko-inferno.pl')).toBeInTheDocument()
    expect(screen.getByText('otpokemon.com')).toBeInTheDocument()
  })

  it('supporter links open URLs on click', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<AboutDialog open={true} onClose={vi.fn()} />)

    fireEvent.click(screen.getByText('dbko-inferno.pl'))
    expect(openSpy).toHaveBeenCalledWith('https://dbko-inferno.pl', '_blank')

    fireEvent.click(screen.getByText('otpokemon.com'))
    expect(openSpy).toHaveBeenCalledWith('https://otpokemon.com', '_blank')
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
