import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { App } from './App'
import { resetAppStore } from './stores'

beforeEach(() => {
  resetAppStore()
})

describe('App', () => {
  it('renders the main layout with all panels', () => {
    render(<App />)
    // ThingListPanel shows category tabs
    expect(screen.getByTestId('thing-list-panel')).toBeInTheDocument()
    expect(screen.getByText('Items')).toBeInTheDocument()
    // Placeholder panels
    expect(screen.getAllByText('Edit').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Sprites')).toBeInTheDocument()
    // "No project loaded" appears in both ThingListPanel and StatusBar
    expect(screen.getAllByText('No project loaded').length).toBeGreaterThanOrEqual(1)
  })
})
