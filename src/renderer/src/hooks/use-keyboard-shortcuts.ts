/**
 * Global keyboard shortcuts hook.
 *
 * Registers a document-level keydown listener that handles:
 * - Ctrl+Z / Cmd+Z: Undo
 * - Ctrl+Shift+Z / Cmd+Shift+Z / Ctrl+Y / Cmd+Y: Redo
 *
 * Undo/redo pops snapshots from the editor store and applies them
 * to the app store (thing arrays) and editor store (editing thing).
 *
 * Shortcuts are suppressed when a dialog is open (dialogOpen = true)
 * to avoid conflicts with dialog-specific keyboard handling.
 */

import { useEffect, useCallback } from 'react'
import { useEditorStore } from '../stores'
import { useAppStore } from '../stores'
import type { ThingSnapshot } from '../stores/use-editor-store'
import type { ThingData } from '../types/things'
import { FrameGroupType } from '../types/animation'

// ---------------------------------------------------------------------------
// Snapshot application helpers
// ---------------------------------------------------------------------------

/**
 * Apply an array of ThingSnapshots to the app store and editor store.
 * Used by both undo (applies `before` snapshots) and redo (applies `after`).
 */
function applySnapshots(snapshots: ThingSnapshot[]): void {
  const appStore = useAppStore.getState()
  const editorStore = useEditorStore.getState()
  const editingData = editorStore.editingThingData

  for (const snapshot of snapshots) {
    // Update thing in the app store
    appStore.updateThing(snapshot.category, snapshot.id, snapshot.thingType)

    // If this thing is currently being edited, update the editor store too
    if (
      editingData &&
      editingData.thing.id === snapshot.id &&
      editingData.thing.category === snapshot.category
    ) {
      const updatedData: ThingData = {
        ...editingData,
        thing: snapshot.thingType,
        sprites: new Map([[FrameGroupType.DEFAULT, []]])
      }
      editorStore.setEditingThingData(updatedData)
    }
  }

  // Mark project as changed
  appStore.setProjectChanged(true)
  if (window.api?.menu) {
    window.api.menu.updateState({ clientChanged: true })
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseKeyboardShortcutsOptions {
  /** Whether a dialog is currently open (suppresses global shortcuts). */
  dialogOpen: boolean
}

export function useKeyboardShortcuts({ dialogOpen }: UseKeyboardShortcutsOptions): void {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't handle shortcuts when a dialog is open
      if (dialogOpen) return

      // Don't interfere with input elements
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return
      }

      const isMod = e.ctrlKey || e.metaKey

      // Ctrl+Z / Cmd+Z: Undo
      if (isMod && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        const operation = useEditorStore.getState().undo()
        if (operation) {
          applySnapshots(operation.before)
        }
        return
      }

      // Ctrl+Shift+Z / Cmd+Shift+Z: Redo
      if (isMod && e.shiftKey && e.key === 'z') {
        e.preventDefault()
        const operation = useEditorStore.getState().redo()
        if (operation) {
          applySnapshots(operation.after)
        }
        return
      }

      // Ctrl+Y / Cmd+Y: Redo (alternative)
      if (isMod && !e.shiftKey && e.key === 'y') {
        e.preventDefault()
        const operation = useEditorStore.getState().redo()
        if (operation) {
          applySnapshots(operation.after)
        }
        return
      }
    },
    [dialogOpen]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
