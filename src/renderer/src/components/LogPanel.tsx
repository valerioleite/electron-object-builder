/**
 * Collapsible log panel at the bottom of the application.
 * Shows application log entries (info, warning, error) with timestamps.
 * Vertically resizable via drag handle.
 *
 * Ported from legacy otlib/components/LogPanel.
 */

import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore, selectLogs } from '../stores'
import { IconClose } from './Icons'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LogPanelProps {
  height: number
  onHeightChange: (height: number) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_HEIGHT = 60
const MAX_HEIGHT = 400
const CHROME_HEIGHT = 32 // drag handle (4px) + header (28px)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function levelColor(level: string): string {
  switch (level) {
    case 'warning':
      return 'text-warning'
    case 'error':
      return 'text-error'
    default:
      return 'text-text-secondary'
  }
}

function levelBadge(level: string): string {
  switch (level) {
    case 'warning':
      return 'bg-warning/15 text-warning'
    case 'error':
      return 'bg-error/15 text-error'
    default:
      return ''
  }
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp)
  return d.toLocaleTimeString()
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LogPanel({ height, onHeightChange }: LogPanelProps): React.JSX.Element {
  const { t } = useTranslation()
  const logs = useAppStore(selectLogs)
  const clearLogs = useAppStore((s) => s.clearLogs)
  const togglePanel = useAppStore((s) => s.togglePanel)
  const listRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null)

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [logs.length])

  // Vertical drag resize
  useEffect(() => {
    const onMouseMove = (e: MouseEvent): void => {
      const drag = dragRef.current
      if (!drag) return
      const delta = drag.startY - e.clientY
      const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, drag.startHeight + delta))
      onHeightChange(newHeight)
    }

    const onMouseUp = (): void => {
      if (dragRef.current) {
        dragRef.current = null
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [onHeightChange])

  const handleDragStart = (e: React.MouseEvent): void => {
    e.preventDefault()
    dragRef.current = { startY: e.clientY, startHeight: height }
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
  }

  const contentHeight = Math.max(0, height - CHROME_HEIGHT)

  return (
    <div className="shrink-0" style={{ height }} data-testid="log-panel">
      {/* Drag handle */}
      <div
        className="h-1 cursor-row-resize bg-border transition-colors hover:bg-accent"
        onMouseDown={handleDragStart}
        data-testid="log-drag-handle"
      />

      {/* Header — Material surface */}
      <div className="flex h-8 items-center justify-between bg-bg-secondary px-3">
        <span className="text-xs font-medium text-text-secondary">{t('controls.logWindow')}</span>
        <div className="flex items-center gap-1">
          <button
            className="rounded-full px-3 py-0.5 text-[11px] font-medium text-accent transition-colors hover:bg-accent-subtle"
            title="Open Log File"
            onClick={() => window.api?.log?.openFile()}
          >
            Open File
          </button>
          <button
            className="rounded-full px-3 py-0.5 text-[11px] font-medium text-accent transition-colors hover:bg-accent-subtle"
            title={t('labels.clear')}
            onClick={clearLogs}
          >
            {t('labels.clear')}
          </button>
          <button
            className="flex h-6 w-6 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
            title={t('labels.close')}
            onClick={() => togglePanel('log')}
          >
            <IconClose size={14} />
          </button>
        </div>
      </div>

      {/* Log entries */}
      <div
        ref={listRef}
        className="overflow-auto bg-bg-primary"
        style={{ height: contentHeight }}
        data-testid="log-content"
      >
        {logs.length === 0 ? (
          <div className="p-3 text-xs text-text-muted">{t('labels.none')}</div>
        ) : (
          logs.map((entry) => (
            <div
              key={entry.id}
              className={`flex items-baseline gap-1.5 px-2 py-0.5 font-mono text-[11px] leading-5 ${levelColor(entry.level)}`}
            >
              <span className="shrink-0 text-text-muted">{formatTime(entry.timestamp)}</span>
              {entry.level !== 'info' && (
                <span
                  className={`shrink-0 rounded px-1 text-[10px] font-semibold uppercase ${levelBadge(entry.level)}`}
                >
                  {entry.level}
                </span>
              )}
              <span className="break-all">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
