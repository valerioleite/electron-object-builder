/**
 * Context menu for the Things list panel.
 * Displays actions available for the selected thing(s).
 *
 * Ported from legacy AS3: otlib/components/renders/ThingRendererBase.as context menu
 * with 14 menu items that enable/disable based on selection state.
 */

import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '../../stores'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ThingContextAction =
  | 'replace'
  | 'export'
  | 'edit'
  | 'duplicate'
  | 'bulk-edit'
  | 'copy-object'
  | 'paste-object'
  | 'copy-patterns'
  | 'paste-patterns'
  | 'copy-properties'
  | 'paste-properties'
  | 'remove'
  | 'copy-client-id'
  | 'copy-server-id'

interface ThingContextMenuProps {
  x: number
  y: number
  multipleSelected: boolean
  selectedId: number | null
  serverId?: number
  onAction: (action: ThingContextAction) => void
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Menu item component
// ---------------------------------------------------------------------------

interface MenuItemProps {
  label: string
  disabled?: boolean
  onClick: () => void
}

function MenuItem({ label, disabled, onClick }: MenuItemProps): React.JSX.Element {
  return (
    <button
      className={`flex w-full items-center px-3 py-1.5 text-left text-[11px] transition-colors ${
        disabled
          ? 'text-text-muted cursor-default'
          : 'text-text-primary hover:bg-accent hover:text-white cursor-pointer'
      }`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {label}
    </button>
  )
}

function MenuSeparator(): React.JSX.Element {
  return <div className="mx-2 my-1 border-t border-border-subtle" />
}

// ---------------------------------------------------------------------------
// ThingContextMenu
// ---------------------------------------------------------------------------

export function ThingContextMenu({
  x,
  y,
  multipleSelected,
  selectedId,
  serverId,
  onAction,
  onClose
}: ThingContextMenuProps): React.JSX.Element {
  const { t } = useTranslation()
  const menuRef = useRef<HTMLDivElement>(null)

  // Clipboard state from editor store
  const hasClipboardObject = useEditorStore((s) => s.clipboard.object !== null)
  const hasClipboardProperties = useEditorStore((s) => s.clipboard.properties !== null)
  const hasClipboardPatterns = useEditorStore((s) => s.clipboard.patterns !== null)

  const singleSelected = !multipleSelected

  // Position adjustment to keep menu within viewport
  useEffect(() => {
    const menu = menuRef.current
    if (!menu) return

    const rect = menu.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    if (rect.right > vw) {
      menu.style.left = `${Math.max(0, x - rect.width)}px`
    }
    if (rect.bottom > vh) {
      menu.style.top = `${Math.max(0, y - rect.height)}px`
    }
  }, [x, y])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Use setTimeout to avoid the click that opened the menu closing it immediately
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handler)
    }, 0)
    return () => {
      clearTimeout(timeout)
      document.removeEventListener('mousedown', handler)
    }
  }, [onClose])

  const handleAction = (action: ThingContextAction) => {
    onAction(action)
    onClose()
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] rounded-md border border-border bg-bg-secondary py-1"
      style={{ left: x, top: y, boxShadow: 'var(--shadow-lg)' }}
      data-testid="thing-context-menu"
    >
      <MenuItem label={t('labels.replace')} onClick={() => handleAction('replace')} />
      <MenuItem label={t('labels.export')} onClick={() => handleAction('export')} />

      <MenuSeparator />

      <MenuItem
        label={t('labels.edit')}
        disabled={multipleSelected}
        onClick={() => handleAction('edit')}
      />
      <MenuItem label={t('labels.duplicate')} onClick={() => handleAction('duplicate')} />
      <MenuItem
        label={t('labels.bulkEdit')}
        disabled={!multipleSelected}
        onClick={() => handleAction('bulk-edit')}
      />

      <MenuSeparator />

      <MenuItem
        label={t('labels.copyObject')}
        disabled={multipleSelected}
        onClick={() => handleAction('copy-object')}
      />
      <MenuItem
        label={t('labels.pasteObject')}
        disabled={!hasClipboardObject}
        onClick={() => handleAction('paste-object')}
      />
      <MenuItem
        label={t('labels.copyPatterns')}
        disabled={multipleSelected}
        onClick={() => handleAction('copy-patterns')}
      />
      <MenuItem
        label={t('labels.pastePatterns')}
        disabled={!hasClipboardPatterns}
        onClick={() => handleAction('paste-patterns')}
      />
      <MenuItem
        label={t('labels.copyProperties')}
        disabled={multipleSelected}
        onClick={() => handleAction('copy-properties')}
      />
      <MenuItem
        label={t('labels.pasteProperties')}
        disabled={!hasClipboardProperties}
        onClick={() => handleAction('paste-properties')}
      />

      <MenuSeparator />

      <MenuItem label={t('labels.remove')} onClick={() => handleAction('remove')} />

      <MenuSeparator />

      <MenuItem
        label={singleSelected && selectedId !== null
          ? t('labels.copyClientId', { 0: selectedId })
          : t('labels.copyClientId', { 0: '' }).replace(/:\s*$/, '')}
        disabled={multipleSelected}
        onClick={() => handleAction('copy-client-id')}
      />
      <MenuItem
        label={singleSelected && serverId
          ? t('labels.copyServerId', { 0: serverId })
          : t('labels.copyServerId', { 0: '' }).replace(/:\s*$/, '')}
        disabled={multipleSelected || !serverId}
        onClick={() => handleAction('copy-server-id')}
      />
    </div>
  )
}
