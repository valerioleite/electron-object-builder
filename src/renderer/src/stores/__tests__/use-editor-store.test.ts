import { describe, it, expect, beforeEach } from 'vitest'
import {
  useEditorStore,
  resetEditorStore,
  type EditOperation,
  type ThingSnapshot,
  selectEditingThingData,
  selectEditingChanged,
  selectEditMode,
  selectBulkEditIds,
  selectBulkEditCategory,
  selectClipboardAction,
  selectClipboard,
  selectUndoStack,
  selectRedoStack,
  selectCanUndo,
  selectCanRedo,
  selectHasClipboardObject,
  selectHasClipboardProperties,
  selectHasClipboardPatterns
} from '../use-editor-store'
import {
  ThingCategory,
  ClipboardAction,
  createThingType,
  createThingData,
  type ThingType,
  type ThingData,
  FrameGroupType,
  createFrameGroup
} from '../../types'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeThing(id: number, category: ThingCategory = ThingCategory.ITEM): ThingType {
  const t = createThingType()
  t.id = id
  t.category = category
  t.name = `Thing ${id}`
  return t
}

function makeThingData(
  id: number,
  category: ThingCategory = ThingCategory.ITEM
): ThingData {
  const thing = makeThing(id, category)
  thing.frameGroups[FrameGroupType.DEFAULT] = createFrameGroup()
  return createThingData(300, 1056, thing, new Map())
}

function makeSnapshot(id: number, category: ThingCategory = ThingCategory.ITEM): ThingSnapshot {
  return { id, category, thingType: makeThing(id, category) }
}

function makeOperation(
  type: EditOperation['type'] = 'update-thing',
  description = 'test operation'
): EditOperation {
  return {
    type,
    timestamp: Date.now(),
    description,
    before: [makeSnapshot(100)],
    after: [makeSnapshot(100)]
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useEditorStore', () => {
  beforeEach(() => {
    resetEditorStore()
  })

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  describe('initial state', () => {
    it('has null editing thing data', () => {
      expect(useEditorStore.getState().editingThingData).toBeNull()
    })

    it('has editingChanged false', () => {
      expect(useEditorStore.getState().editingChanged).toBe(false)
    })

    it('has single edit mode', () => {
      expect(useEditorStore.getState().editMode).toBe('single')
    })

    it('has empty bulk edit ids', () => {
      expect(useEditorStore.getState().bulkEditIds).toEqual([])
    })

    it('has null bulk edit category', () => {
      expect(useEditorStore.getState().bulkEditCategory).toBeNull()
    })

    it('has OBJECT clipboard action', () => {
      expect(useEditorStore.getState().clipboardAction).toBe(ClipboardAction.OBJECT)
    })

    it('has empty clipboard', () => {
      const { clipboard } = useEditorStore.getState()
      expect(clipboard.object).toBeNull()
      expect(clipboard.properties).toBeNull()
      expect(clipboard.patterns).toBeNull()
      expect(clipboard.sourceId).toBeNull()
      expect(clipboard.sourceCategory).toBeNull()
    })

    it('has empty undo/redo stacks', () => {
      expect(useEditorStore.getState().undoStack).toEqual([])
      expect(useEditorStore.getState().redoStack).toEqual([])
    })

    it('has default max history size', () => {
      expect(useEditorStore.getState().maxHistorySize).toBe(50)
    })
  })

  // -------------------------------------------------------------------------
  // Editing actions
  // -------------------------------------------------------------------------

  describe('editing actions', () => {
    it('sets editing thing data and resets changed', () => {
      const data = makeThingData(100)
      useEditorStore.getState().setEditingChanged(true)
      useEditorStore.getState().setEditingThingData(data)

      const state = useEditorStore.getState()
      expect(state.editingThingData).toBe(data)
      expect(state.editingChanged).toBe(false)
    })

    it('clears editing thing data', () => {
      useEditorStore.getState().setEditingThingData(makeThingData(100))
      useEditorStore.getState().setEditingThingData(null)

      expect(useEditorStore.getState().editingThingData).toBeNull()
    })

    it('sets editing changed flag', () => {
      useEditorStore.getState().setEditingChanged(true)
      expect(useEditorStore.getState().editingChanged).toBe(true)

      useEditorStore.getState().setEditingChanged(false)
      expect(useEditorStore.getState().editingChanged).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Edit mode actions
  // -------------------------------------------------------------------------

  describe('edit mode actions', () => {
    it('sets edit mode', () => {
      useEditorStore.getState().setEditMode('bulk')
      expect(useEditorStore.getState().editMode).toBe('bulk')

      useEditorStore.getState().setEditMode('single')
      expect(useEditorStore.getState().editMode).toBe('single')
    })

    it('starts bulk edit with ids and category', () => {
      useEditorStore.getState().startBulkEdit([100, 101, 102], ThingCategory.ITEM)

      const state = useEditorStore.getState()
      expect(state.editMode).toBe('bulk')
      expect(state.bulkEditIds).toEqual([100, 101, 102])
      expect(state.bulkEditCategory).toBe(ThingCategory.ITEM)
    })

    it('creates a copy of bulk edit ids array', () => {
      const ids = [100, 101]
      useEditorStore.getState().startBulkEdit(ids, ThingCategory.OUTFIT)

      ids.push(102)
      expect(useEditorStore.getState().bulkEditIds).toEqual([100, 101])
    })

    it('clears bulk edit state', () => {
      useEditorStore.getState().startBulkEdit([100, 101], ThingCategory.ITEM)
      useEditorStore.getState().clearBulkEdit()

      const state = useEditorStore.getState()
      expect(state.editMode).toBe('single')
      expect(state.bulkEditIds).toEqual([])
      expect(state.bulkEditCategory).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // Clipboard actions
  // -------------------------------------------------------------------------

  describe('clipboard actions', () => {
    it('sets clipboard action mode', () => {
      useEditorStore.getState().setClipboardAction(ClipboardAction.PROPERTIES)
      expect(useEditorStore.getState().clipboardAction).toBe(ClipboardAction.PROPERTIES)

      useEditorStore.getState().setClipboardAction(ClipboardAction.PATTERNS)
      expect(useEditorStore.getState().clipboardAction).toBe(ClipboardAction.PATTERNS)

      useEditorStore.getState().setClipboardAction(ClipboardAction.ATTRIBUTES)
      expect(useEditorStore.getState().clipboardAction).toBe(ClipboardAction.ATTRIBUTES)
    })

    it('copies object to clipboard', () => {
      const data = makeThingData(100)
      useEditorStore.getState().copyObject(data, 100, ThingCategory.ITEM)

      const { clipboard } = useEditorStore.getState()
      expect(clipboard.object).toBe(data)
      expect(clipboard.sourceId).toBe(100)
      expect(clipboard.sourceCategory).toBe(ThingCategory.ITEM)
    })

    it('copies properties to clipboard (clones ThingType)', () => {
      const thing = makeThing(100)
      thing.isGround = true
      thing.groundSpeed = 150
      useEditorStore.getState().copyProperties(thing)

      const { clipboard } = useEditorStore.getState()
      expect(clipboard.properties).not.toBeNull()
      expect(clipboard.properties).not.toBe(thing) // must be a clone
      expect(clipboard.properties!.isGround).toBe(true)
      expect(clipboard.properties!.groundSpeed).toBe(150)
    })

    it('copies patterns to clipboard (clones ThingType)', () => {
      const thing = makeThing(200, ThingCategory.OUTFIT)
      thing.frameGroups[FrameGroupType.DEFAULT] = createFrameGroup()
      useEditorStore.getState().copyPatterns(thing)

      const { clipboard } = useEditorStore.getState()
      expect(clipboard.patterns).not.toBeNull()
      expect(clipboard.patterns).not.toBe(thing)
      expect(clipboard.patterns!.id).toBe(200)
    })

    it('preserves other clipboard fields when copying', () => {
      const data = makeThingData(100)
      useEditorStore.getState().copyObject(data, 100, ThingCategory.ITEM)
      useEditorStore.getState().copyProperties(makeThing(200))

      const { clipboard } = useEditorStore.getState()
      expect(clipboard.object).toBe(data)
      expect(clipboard.properties).not.toBeNull()
    })

    it('clears all clipboard data', () => {
      useEditorStore.getState().copyObject(makeThingData(100), 100, ThingCategory.ITEM)
      useEditorStore.getState().copyProperties(makeThing(200))
      useEditorStore.getState().copyPatterns(makeThing(300))
      useEditorStore.getState().clearClipboard()

      const { clipboard } = useEditorStore.getState()
      expect(clipboard.object).toBeNull()
      expect(clipboard.properties).toBeNull()
      expect(clipboard.patterns).toBeNull()
      expect(clipboard.sourceId).toBeNull()
      expect(clipboard.sourceCategory).toBeNull()
    })

    it('clears only clipboard object', () => {
      useEditorStore.getState().copyObject(makeThingData(100), 100, ThingCategory.ITEM)
      useEditorStore.getState().copyProperties(makeThing(200))
      useEditorStore.getState().clearClipboardObject()

      const { clipboard } = useEditorStore.getState()
      expect(clipboard.object).toBeNull()
      expect(clipboard.sourceId).toBeNull()
      expect(clipboard.sourceCategory).toBeNull()
      expect(clipboard.properties).not.toBeNull() // preserved
    })
  })

  // -------------------------------------------------------------------------
  // Undo/redo actions
  // -------------------------------------------------------------------------

  describe('undo/redo actions', () => {
    it('pushes operation to undo stack', () => {
      const op = makeOperation()
      useEditorStore.getState().pushUndo(op)

      expect(useEditorStore.getState().undoStack).toHaveLength(1)
      expect(useEditorStore.getState().undoStack[0]).toBe(op)
    })

    it('clears redo stack on new push', () => {
      const op1 = makeOperation('update-thing', 'op1')
      const op2 = makeOperation('update-thing', 'op2')

      useEditorStore.getState().pushUndo(op1)
      useEditorStore.getState().undo()
      expect(useEditorStore.getState().redoStack).toHaveLength(1)

      useEditorStore.getState().pushUndo(op2)
      expect(useEditorStore.getState().redoStack).toHaveLength(0)
    })

    it('trims undo stack to max history size', () => {
      useEditorStore.getState().setMaxHistorySize(3)

      for (let i = 0; i < 5; i++) {
        useEditorStore.getState().pushUndo(makeOperation('update-thing', `op${i}`))
      }

      expect(useEditorStore.getState().undoStack).toHaveLength(3)
      expect(useEditorStore.getState().undoStack[0].description).toBe('op2')
      expect(useEditorStore.getState().undoStack[2].description).toBe('op4')
    })

    it('undo returns last operation and moves it to redo', () => {
      const op1 = makeOperation('update-thing', 'op1')
      const op2 = makeOperation('replace-thing', 'op2')

      useEditorStore.getState().pushUndo(op1)
      useEditorStore.getState().pushUndo(op2)

      const undone = useEditorStore.getState().undo()
      expect(undone).toBe(op2)
      expect(useEditorStore.getState().undoStack).toHaveLength(1)
      expect(useEditorStore.getState().redoStack).toHaveLength(1)
      expect(useEditorStore.getState().redoStack[0]).toBe(op2)
    })

    it('undo returns undefined when stack is empty', () => {
      const result = useEditorStore.getState().undo()
      expect(result).toBeUndefined()
    })

    it('redo returns last undone operation and moves it to undo', () => {
      const op = makeOperation()
      useEditorStore.getState().pushUndo(op)
      useEditorStore.getState().undo()

      const redone = useEditorStore.getState().redo()
      expect(redone).toBe(op)
      expect(useEditorStore.getState().undoStack).toHaveLength(1)
      expect(useEditorStore.getState().redoStack).toHaveLength(0)
    })

    it('redo returns undefined when stack is empty', () => {
      const result = useEditorStore.getState().redo()
      expect(result).toBeUndefined()
    })

    it('supports multiple undo/redo cycles', () => {
      const ops = Array.from({ length: 3 }, (_, i) =>
        makeOperation('update-thing', `op${i}`)
      )
      ops.forEach((op) => useEditorStore.getState().pushUndo(op))

      // Undo all 3
      useEditorStore.getState().undo()
      useEditorStore.getState().undo()
      useEditorStore.getState().undo()

      expect(useEditorStore.getState().undoStack).toHaveLength(0)
      expect(useEditorStore.getState().redoStack).toHaveLength(3)

      // Redo all 3
      useEditorStore.getState().redo()
      useEditorStore.getState().redo()
      useEditorStore.getState().redo()

      expect(useEditorStore.getState().undoStack).toHaveLength(3)
      expect(useEditorStore.getState().redoStack).toHaveLength(0)
    })

    it('clears both undo and redo stacks', () => {
      useEditorStore.getState().pushUndo(makeOperation())
      useEditorStore.getState().pushUndo(makeOperation())
      useEditorStore.getState().undo()
      useEditorStore.getState().clearHistory()

      expect(useEditorStore.getState().undoStack).toHaveLength(0)
      expect(useEditorStore.getState().redoStack).toHaveLength(0)
    })

    it('setMaxHistorySize trims existing stack', () => {
      for (let i = 0; i < 10; i++) {
        useEditorStore.getState().pushUndo(makeOperation('update-thing', `op${i}`))
      }

      useEditorStore.getState().setMaxHistorySize(5)
      expect(useEditorStore.getState().undoStack).toHaveLength(5)
      expect(useEditorStore.getState().undoStack[0].description).toBe('op5')
    })

    it('setMaxHistorySize does not trim when stack is within limits', () => {
      useEditorStore.getState().pushUndo(makeOperation('update-thing', 'op0'))
      useEditorStore.getState().pushUndo(makeOperation('update-thing', 'op1'))

      useEditorStore.getState().setMaxHistorySize(10)
      expect(useEditorStore.getState().undoStack).toHaveLength(2)
    })
  })

  // -------------------------------------------------------------------------
  // Getters
  // -------------------------------------------------------------------------

  describe('getters', () => {
    it('canUndo returns false when empty', () => {
      expect(useEditorStore.getState().canUndo()).toBe(false)
    })

    it('canUndo returns true when has items', () => {
      useEditorStore.getState().pushUndo(makeOperation())
      expect(useEditorStore.getState().canUndo()).toBe(true)
    })

    it('canRedo returns false when empty', () => {
      expect(useEditorStore.getState().canRedo()).toBe(false)
    })

    it('canRedo returns true when has items', () => {
      useEditorStore.getState().pushUndo(makeOperation())
      useEditorStore.getState().undo()
      expect(useEditorStore.getState().canRedo()).toBe(true)
    })

    it('hasClipboardObject returns false when empty', () => {
      expect(useEditorStore.getState().hasClipboardObject()).toBe(false)
    })

    it('hasClipboardObject returns true when set', () => {
      useEditorStore.getState().copyObject(makeThingData(100), 100, ThingCategory.ITEM)
      expect(useEditorStore.getState().hasClipboardObject()).toBe(true)
    })

    it('hasClipboardProperties returns false when empty', () => {
      expect(useEditorStore.getState().hasClipboardProperties()).toBe(false)
    })

    it('hasClipboardProperties returns true when set', () => {
      useEditorStore.getState().copyProperties(makeThing(100))
      expect(useEditorStore.getState().hasClipboardProperties()).toBe(true)
    })

    it('hasClipboardPatterns returns false when empty', () => {
      expect(useEditorStore.getState().hasClipboardPatterns()).toBe(false)
    })

    it('hasClipboardPatterns returns true when set', () => {
      useEditorStore.getState().copyPatterns(makeThing(100))
      expect(useEditorStore.getState().hasClipboardPatterns()).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // Reset
  // -------------------------------------------------------------------------

  describe('reset', () => {
    it('resets all state to defaults', () => {
      // Modify everything
      useEditorStore.getState().setEditingThingData(makeThingData(100))
      useEditorStore.getState().setEditingChanged(true)
      useEditorStore.getState().startBulkEdit([100, 101], ThingCategory.ITEM)
      useEditorStore.getState().setClipboardAction(ClipboardAction.PATTERNS)
      useEditorStore.getState().copyObject(makeThingData(200), 200, ThingCategory.OUTFIT)
      useEditorStore.getState().copyProperties(makeThing(300))
      useEditorStore.getState().copyPatterns(makeThing(400))
      useEditorStore.getState().pushUndo(makeOperation())
      useEditorStore.getState().setMaxHistorySize(10)

      // Reset
      resetEditorStore()

      const state = useEditorStore.getState()
      expect(state.editingThingData).toBeNull()
      expect(state.editingChanged).toBe(false)
      expect(state.editMode).toBe('single')
      expect(state.bulkEditIds).toEqual([])
      expect(state.bulkEditCategory).toBeNull()
      expect(state.clipboardAction).toBe(ClipboardAction.OBJECT)
      expect(state.clipboard.object).toBeNull()
      expect(state.clipboard.properties).toBeNull()
      expect(state.clipboard.patterns).toBeNull()
      expect(state.undoStack).toEqual([])
      expect(state.redoStack).toEqual([])
      expect(state.maxHistorySize).toBe(50)
    })
  })

  // -------------------------------------------------------------------------
  // Selectors
  // -------------------------------------------------------------------------

  describe('selectors', () => {
    it('selectEditingThingData extracts editing thing', () => {
      const data = makeThingData(100)
      useEditorStore.getState().setEditingThingData(data)
      expect(selectEditingThingData(useEditorStore.getState())).toBe(data)
    })

    it('selectEditingChanged extracts changed flag', () => {
      useEditorStore.getState().setEditingChanged(true)
      expect(selectEditingChanged(useEditorStore.getState())).toBe(true)
    })

    it('selectEditMode extracts edit mode', () => {
      useEditorStore.getState().setEditMode('bulk')
      expect(selectEditMode(useEditorStore.getState())).toBe('bulk')
    })

    it('selectBulkEditIds extracts bulk ids', () => {
      useEditorStore.getState().startBulkEdit([1, 2, 3], ThingCategory.ITEM)
      expect(selectBulkEditIds(useEditorStore.getState())).toEqual([1, 2, 3])
    })

    it('selectBulkEditCategory extracts bulk category', () => {
      useEditorStore.getState().startBulkEdit([1], ThingCategory.EFFECT)
      expect(selectBulkEditCategory(useEditorStore.getState())).toBe(ThingCategory.EFFECT)
    })

    it('selectClipboardAction extracts clipboard action', () => {
      useEditorStore.getState().setClipboardAction(ClipboardAction.PROPERTIES)
      expect(selectClipboardAction(useEditorStore.getState())).toBe(ClipboardAction.PROPERTIES)
    })

    it('selectClipboard extracts clipboard data', () => {
      useEditorStore.getState().copyProperties(makeThing(100))
      const clipboard = selectClipboard(useEditorStore.getState())
      expect(clipboard.properties).not.toBeNull()
    })

    it('selectUndoStack extracts undo stack', () => {
      useEditorStore.getState().pushUndo(makeOperation())
      expect(selectUndoStack(useEditorStore.getState())).toHaveLength(1)
    })

    it('selectRedoStack extracts redo stack', () => {
      useEditorStore.getState().pushUndo(makeOperation())
      useEditorStore.getState().undo()
      expect(selectRedoStack(useEditorStore.getState())).toHaveLength(1)
    })

    it('selectCanUndo returns boolean', () => {
      expect(selectCanUndo(useEditorStore.getState())).toBe(false)
      useEditorStore.getState().pushUndo(makeOperation())
      expect(selectCanUndo(useEditorStore.getState())).toBe(true)
    })

    it('selectCanRedo returns boolean', () => {
      expect(selectCanRedo(useEditorStore.getState())).toBe(false)
      useEditorStore.getState().pushUndo(makeOperation())
      useEditorStore.getState().undo()
      expect(selectCanRedo(useEditorStore.getState())).toBe(true)
    })

    it('selectHasClipboardObject returns boolean', () => {
      expect(selectHasClipboardObject(useEditorStore.getState())).toBe(false)
      useEditorStore.getState().copyObject(makeThingData(100), 100, ThingCategory.ITEM)
      expect(selectHasClipboardObject(useEditorStore.getState())).toBe(true)
    })

    it('selectHasClipboardProperties returns boolean', () => {
      expect(selectHasClipboardProperties(useEditorStore.getState())).toBe(false)
      useEditorStore.getState().copyProperties(makeThing(100))
      expect(selectHasClipboardProperties(useEditorStore.getState())).toBe(true)
    })

    it('selectHasClipboardPatterns returns boolean', () => {
      expect(selectHasClipboardPatterns(useEditorStore.getState())).toBe(false)
      useEditorStore.getState().copyPatterns(makeThing(100))
      expect(selectHasClipboardPatterns(useEditorStore.getState())).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // Integration scenarios
  // -------------------------------------------------------------------------

  describe('integration scenarios', () => {
    it('edit -> modify -> undo -> redo workflow', () => {
      const data = makeThingData(100)
      useEditorStore.getState().setEditingThingData(data)
      useEditorStore.getState().setEditingChanged(true)

      const op = makeOperation('update-thing', 'changed ground speed')
      useEditorStore.getState().pushUndo(op)

      // Undo
      const undone = useEditorStore.getState().undo()
      expect(undone).toBe(op)
      expect(useEditorStore.getState().canUndo()).toBe(false)
      expect(useEditorStore.getState().canRedo()).toBe(true)

      // Redo
      const redone = useEditorStore.getState().redo()
      expect(redone).toBe(op)
      expect(useEditorStore.getState().canUndo()).toBe(true)
      expect(useEditorStore.getState().canRedo()).toBe(false)
    })

    it('copy object -> paste -> clear workflow', () => {
      const data = makeThingData(100)
      useEditorStore.getState().copyObject(data, 100, ThingCategory.ITEM)
      expect(useEditorStore.getState().hasClipboardObject()).toBe(true)

      // After paste, record undo
      const op = makeOperation('replace-thing', 'pasted object')
      useEditorStore.getState().pushUndo(op)

      // Clear clipboard (deleteAfterPaste behavior)
      useEditorStore.getState().clearClipboardObject()
      expect(useEditorStore.getState().hasClipboardObject()).toBe(false)

      // Undo should still be available
      expect(useEditorStore.getState().canUndo()).toBe(true)
    })

    it('bulk edit workflow', () => {
      useEditorStore.getState().startBulkEdit([100, 101, 102], ThingCategory.ITEM)
      expect(useEditorStore.getState().editMode).toBe('bulk')
      expect(useEditorStore.getState().bulkEditIds).toHaveLength(3)

      // Record bulk undo operation
      const op = makeOperation('bulk-update', 'bulk changed isGround')
      useEditorStore.getState().pushUndo(op)

      // Clear
      useEditorStore.getState().clearBulkEdit()
      expect(useEditorStore.getState().editMode).toBe('single')

      // History preserved
      expect(useEditorStore.getState().canUndo()).toBe(true)
    })

    it('new action after undo discards redo', () => {
      useEditorStore.getState().pushUndo(makeOperation('update-thing', 'op1'))
      useEditorStore.getState().pushUndo(makeOperation('update-thing', 'op2'))
      useEditorStore.getState().pushUndo(makeOperation('update-thing', 'op3'))

      // Undo 2 operations
      useEditorStore.getState().undo()
      useEditorStore.getState().undo()
      expect(useEditorStore.getState().undoStack).toHaveLength(1)
      expect(useEditorStore.getState().redoStack).toHaveLength(2)

      // New action discards redo
      useEditorStore.getState().pushUndo(makeOperation('update-thing', 'op4'))
      expect(useEditorStore.getState().undoStack).toHaveLength(2)
      expect(useEditorStore.getState().redoStack).toHaveLength(0)
    })

    it('clipboard and editing are independent', () => {
      useEditorStore.getState().setEditingThingData(makeThingData(100))
      useEditorStore.getState().copyProperties(makeThing(200))

      // Clearing editing doesn't affect clipboard
      useEditorStore.getState().setEditingThingData(null)
      expect(useEditorStore.getState().hasClipboardProperties()).toBe(true)

      // Clearing clipboard doesn't affect editing
      useEditorStore.getState().setEditingThingData(makeThingData(300))
      useEditorStore.getState().clearClipboard()
      expect(useEditorStore.getState().editingThingData).not.toBeNull()
    })
  })
})
