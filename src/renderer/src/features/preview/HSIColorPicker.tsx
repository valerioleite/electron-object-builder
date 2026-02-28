/**
 * HSI Color Picker component for outfit colorization.
 * Shows a color swatch button that opens a 19x7 grid popup
 * of HSI colors (133 total) used by OpenTibia outfits.
 *
 * Ported from legacy AS3: otlib/components/HSIColorPicker.as
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { hsiToRgb } from '../../services/sprite-render'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HSI_STEPS = 19
const HSI_VALUES = 7
const TOTAL_COLORS = HSI_STEPS * HSI_VALUES // 133
const CELL_SIZE = 12

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface HSIColorPickerProps {
  /** Label displayed next to the swatch (e.g. "Head", "Body") */
  label: string
  /** Current HSI color index (0-132) */
  value: number
  /** Callback when a color is selected */
  onChange: (index: number) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hsiToHex(index: number): string {
  const rgb = hsiToRgb(index)
  return `#${rgb.toString(16).padStart(6, '0')}`
}

// ---------------------------------------------------------------------------
// HSIColorPicker
// ---------------------------------------------------------------------------

export function HSIColorPicker({ label, value, onChange }: HSIColorPickerProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return

    const handleClick = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        popupRef.current &&
        !popupRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleSelect = useCallback(
    (index: number) => {
      onChange(index)
      setOpen(false)
    },
    [onChange]
  )

  const currentColor = hsiToHex(value)

  return (
    <div className="flex items-center gap-2">
      <span className="w-10 text-xs text-secondary">{label}</span>
      <div ref={triggerRef} className="relative">
        <button
          type="button"
          className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded border border-border hover:border-accent"
          onClick={() => setOpen(!open)}
          title={`${label}: color ${value}`}
        >
          <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: currentColor }} />
        </button>

        {open && (
          <div
            ref={popupRef}
            className="absolute left-0 top-full z-50 mt-1 rounded border border-border bg-bg-tertiary p-1 shadow-lg"
            style={{ width: HSI_STEPS * (CELL_SIZE + 1) + 2 }}
          >
            <div
              className="grid gap-px"
              style={{
                gridTemplateColumns: `repeat(${HSI_STEPS}, ${CELL_SIZE}px)`,
                gridTemplateRows: `repeat(${HSI_VALUES}, ${CELL_SIZE}px)`
              }}
            >
              {Array.from({ length: TOTAL_COLORS }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`cursor-pointer border ${
                    i === value ? 'border-white' : 'border-transparent hover:border-accent'
                  }`}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    backgroundColor: hsiToHex(i)
                  }}
                  onClick={() => handleSelect(i)}
                  title={`Color ${i}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
