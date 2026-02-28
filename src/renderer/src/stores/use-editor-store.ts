/**
 * Editor store for object editing state.
 * Manages the currently edited thing, undo/redo history,
 * clipboard state, and edit mode (single vs bulk).
 *
 * Ported from legacy AS3: ObjectBuilder.mxml editing/clipboard state.
 * Undo/redo is a NEW feature not present in the legacy codebase.
 */

import { create } from 'zustand'
import {
  type ThingCategory,
  type ThingType,
  type ThingData,
  ClipboardAction,
  cloneThingType
} from '../types'

// ---------------------------------------------------------------------------
// Edit operation (for undo/redo)
// ---------------------------------------------------------------------------

export type EditOperationType =
  | 'update-thing'
  | 'replace-thing'
  | 'bulk-update'
  | 'paste-properties'
  | 'paste-patterns'

export interface ThingSnapshot {
  id: number
  category: ThingCategory
  thingType: ThingType
}

export interface EditOperation {
  type: EditOperationType
  timestamp: number
  description: string
  before: ThingSnapshot[]
  after: ThingSnapshot[]
}

// ---------------------------------------------------------------------------
// Clipboard data
// ---------------------------------------------------------------------------

export interface ClipboardData {
  /** Full thing data (object copy). */
  object: ThingData | null
  /** ThingType clone for properties copy. */
  properties: ThingType | null
  /** ThingType clone for patterns copy. */
  patterns: ThingType | null
  /** Source thing ID of the copied object. */
  sourceId: number | null
  /** Source category of the copied object. */
  sourceCategory: ThingCategory | null
}

function createClipboardData(): ClipboardData {
  return {
    object: null,
    properties: null,
    patterns: null,
    sourceId: null,
    sourceCategory: null
  }
}

// ---------------------------------------------------------------------------
// Editor state + actions
// ---------------------------------------------------------------------------

export interface EditorState {
  /** Thing currently being edited. */
  editingThingData: ThingData | null
  /** Whether the editing thing has unsaved changes. */
  editingChanged: boolean

  /** Current edit mode. */
  editMode: 'single' | 'bulk'
  /** IDs selected for bulk editing. */
  bulkEditIds: number[]
  /** Category of the bulk edit targets. */
  bulkEditCategory: ThingCategory | null

  /** Current clipboard action mode. */
  clipboardAction: ClipboardAction
  /** Clipboard contents. */
  clipboard: ClipboardData

  /** Undo history stack. */
  undoStack: EditOperation[]
  /** Redo history stack. */
  redoStack: EditOperation[]
  /** Maximum number of undo operations to keep. */
  maxHistorySize: number
}

export interface EditorActions {
  // Editing
  setEditingThingData(data: ThingData | null): void
  setEditingChanged(changed: boolean): void

  // Edit mode
  setEditMode(mode: 'single' | 'bulk'): void
  startBulkEdit(ids: number[], category: ThingCategory): void
  clearBulkEdit(): void

  // Clipboard
  setClipboardAction(action: ClipboardAction): void
  copyObject(data: ThingData, sourceId: number, sourceCategory: ThingCategory): void
  copyProperties(thingType: ThingType): void
  copyPatterns(thingType: ThingType): void
  clearClipboard(): void
  clearClipboardObject(): void

  // Undo/redo
  pushUndo(operation: EditOperation): void
  undo(): EditOperation | undefined
  redo(): EditOperation | undefined
  clearHistory(): void
  setMaxHistorySize(size: number): void

  // Getters
  canUndo(): boolean
  canRedo(): boolean
  hasClipboardObject(): boolean
  hasClipboardProperties(): boolean
  hasClipboardPatterns(): boolean
}

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

const DEFAULT_MAX_HISTORY = 50

// ---------------------------------------------------------------------------
// Store creation
// ---------------------------------------------------------------------------

export const useEditorStore = create<EditorState & EditorActions>()((set, get) => ({
  // --- Initial state ---
  editingThingData: null,
  editingChanged: false,
  editMode: 'single',
  bulkEditIds: [],
  bulkEditCategory: null,
  clipboardAction: ClipboardAction.OBJECT,
  clipboard: createClipboardData(),
  undoStack: [],
  redoStack: [],
  maxHistorySize: DEFAULT_MAX_HISTORY,

  // --- Editing actions ---

  setEditingThingData(data) {
    set({
      editingThingData: data,
      editingChanged: false
    })
  },

  setEditingChanged(changed) {
    set({ editingChanged: changed })
  },

  // --- Edit mode actions ---

  setEditMode(mode) {
    set({ editMode: mode })
  },

  startBulkEdit(ids, category) {
    set({
      editMode: 'bulk',
      bulkEditIds: [...ids],
      bulkEditCategory: category
    })
  },

  clearBulkEdit() {
    set({
      editMode: 'single',
      bulkEditIds: [],
      bulkEditCategory: null
    })
  },

  // --- Clipboard actions ---

  setClipboardAction(action) {
    set({ clipboardAction: action })
  },

  copyObject(data, sourceId, sourceCategory) {
    set((state) => ({
      clipboard: {
        ...state.clipboard,
        object: data,
        sourceId,
        sourceCategory
      }
    }))
  },

  copyProperties(thingType) {
    set((state) => ({
      clipboard: {
        ...state.clipboard,
        properties: cloneThingType(thingType)
      }
    }))
  },

  copyPatterns(thingType) {
    set((state) => ({
      clipboard: {
        ...state.clipboard,
        patterns: cloneThingType(thingType)
      }
    }))
  },

  clearClipboard() {
    set({ clipboard: createClipboardData() })
  },

  clearClipboardObject() {
    set((state) => ({
      clipboard: {
        ...state.clipboard,
        object: null,
        sourceId: null,
        sourceCategory: null
      }
    }))
  },

  // --- Undo/redo actions ---

  pushUndo(operation) {
    set((state) => {
      const stack = [...state.undoStack, operation]
      // Trim if exceeds max
      if (stack.length > state.maxHistorySize) {
        stack.splice(0, stack.length - state.maxHistorySize)
      }
      return {
        undoStack: stack,
        redoStack: [] // Clear redo on new action
      }
    })
  },

  undo() {
    const { undoStack, redoStack } = get()
    if (undoStack.length === 0) return undefined

    const operation = undoStack[undoStack.length - 1]
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, operation]
    })
    return operation
  },

  redo() {
    const { undoStack, redoStack } = get()
    if (redoStack.length === 0) return undefined

    const operation = redoStack[redoStack.length - 1]
    set({
      undoStack: [...undoStack, operation],
      redoStack: redoStack.slice(0, -1)
    })
    return operation
  },

  clearHistory() {
    set({
      undoStack: [],
      redoStack: []
    })
  },

  setMaxHistorySize(size) {
    set((state) => {
      const stack =
        state.undoStack.length > size
          ? state.undoStack.slice(state.undoStack.length - size)
          : state.undoStack
      return {
        maxHistorySize: size,
        undoStack: stack
      }
    })
  },

  // --- Getters ---

  canUndo() {
    return get().undoStack.length > 0
  },

  canRedo() {
    return get().redoStack.length > 0
  },

  hasClipboardObject() {
    return get().clipboard.object !== null
  },

  hasClipboardProperties() {
    return get().clipboard.properties !== null
  },

  hasClipboardPatterns() {
    return get().clipboard.patterns !== null
  }
}))

// ---------------------------------------------------------------------------
// Reset helper (for testing)
// ---------------------------------------------------------------------------

export function resetEditorStore(): void {
  useEditorStore.setState({
    editingThingData: null,
    editingChanged: false,
    editMode: 'single',
    bulkEditIds: [],
    bulkEditCategory: null,
    clipboardAction: ClipboardAction.OBJECT,
    clipboard: createClipboardData(),
    undoStack: [],
    redoStack: [],
    maxHistorySize: DEFAULT_MAX_HISTORY
  })
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectEditingThingData = (state: EditorState) => state.editingThingData
export const selectEditingChanged = (state: EditorState) => state.editingChanged
export const selectEditMode = (state: EditorState) => state.editMode
export const selectBulkEditIds = (state: EditorState) => state.bulkEditIds
export const selectBulkEditCategory = (state: EditorState) => state.bulkEditCategory
export const selectClipboardAction = (state: EditorState) => state.clipboardAction
export const selectClipboard = (state: EditorState) => state.clipboard
export const selectUndoStack = (state: EditorState) => state.undoStack
export const selectRedoStack = (state: EditorState) => state.redoStack
export const selectCanUndo = (state: EditorState) => state.undoStack.length > 0
export const selectCanRedo = (state: EditorState) => state.redoStack.length > 0
export const selectHasClipboardObject = (state: EditorState) => state.clipboard.object !== null
export const selectHasClipboardProperties = (state: EditorState) =>
  state.clipboard.properties !== null
export const selectHasClipboardPatterns = (state: EditorState) => state.clipboard.patterns !== null
