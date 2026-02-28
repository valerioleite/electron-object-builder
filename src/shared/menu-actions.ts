/**
 * Menu action identifiers shared between main process (menu clicks) and renderer (event handler).
 * Ported from legacy ob/menu/Menu.as static constants.
 */

// ---------------------------------------------------------------------------
// File menu actions
// ---------------------------------------------------------------------------

export const MENU_FILE_NEW = 'fileNew'
export const MENU_FILE_OPEN = 'fileOpen'
export const MENU_FILE_COMPILE = 'fileCompile'
export const MENU_FILE_COMPILE_AS = 'fileCompileAs'
export const MENU_FILE_CLOSE = 'fileClose'
export const MENU_FILE_MERGE = 'fileMerge'
export const MENU_FILE_PREFERENCES = 'filePreferences'
export const MENU_FILE_EXIT = 'fileExit'

// ---------------------------------------------------------------------------
// View menu actions
// ---------------------------------------------------------------------------

export const MENU_VIEW_SHOW_PREVIEW = 'viewShowPreview'
export const MENU_VIEW_SHOW_OBJECTS = 'viewShowObjects'
export const MENU_VIEW_SHOW_SPRITES = 'viewShowSprites'

// ---------------------------------------------------------------------------
// Tools menu actions
// ---------------------------------------------------------------------------

export const MENU_TOOLS_FIND = 'toolsFind'
export const MENU_TOOLS_LOOK_TYPE_GENERATOR = 'toolsLookTypeGenerator'
export const MENU_TOOLS_OBJECT_VIEWER = 'toolsObjectViewer'
export const MENU_TOOLS_SLICER = 'toolsSlicer'
export const MENU_TOOLS_ANIMATION_EDITOR = 'toolsAnimationEditor'
export const MENU_TOOLS_ASSET_STORE = 'toolsAssetStore'
export const MENU_TOOLS_SPRITES_OPTIMIZER = 'toolsSpritesOptimizer'
export const MENU_TOOLS_FRAME_DURATIONS_OPTIMIZER = 'toolsFrameDurationsOptimizer'
export const MENU_TOOLS_FRAME_GROUPS_CONVERTER = 'toolsFrameGroupsConverter'
export const MENU_TOOLS_CREATE_MISSING_ITEMS = 'toolsCreateMissingItems'
export const MENU_TOOLS_RELOAD_ITEM_ATTRIBUTES = 'toolsReloadItemAttributes'

// ---------------------------------------------------------------------------
// Window menu actions
// ---------------------------------------------------------------------------

export const MENU_WINDOW_LOG = 'windowLog'
export const MENU_WINDOW_VERSIONS = 'windowVersions'

// ---------------------------------------------------------------------------
// Help menu actions
// ---------------------------------------------------------------------------

export const MENU_HELP_CONTENTS = 'helpContents'
export const MENU_HELP_CHECK_FOR_UPDATES = 'helpCheckForUpdates'
export const MENU_HELP_ABOUT = 'helpAbout'

// ---------------------------------------------------------------------------
// All actions (for type safety)
// ---------------------------------------------------------------------------

export const MENU_ACTIONS = [
  // File
  MENU_FILE_NEW,
  MENU_FILE_OPEN,
  MENU_FILE_COMPILE,
  MENU_FILE_COMPILE_AS,
  MENU_FILE_CLOSE,
  MENU_FILE_MERGE,
  MENU_FILE_PREFERENCES,
  MENU_FILE_EXIT,
  // View
  MENU_VIEW_SHOW_PREVIEW,
  MENU_VIEW_SHOW_OBJECTS,
  MENU_VIEW_SHOW_SPRITES,
  // Tools
  MENU_TOOLS_FIND,
  MENU_TOOLS_LOOK_TYPE_GENERATOR,
  MENU_TOOLS_OBJECT_VIEWER,
  MENU_TOOLS_SLICER,
  MENU_TOOLS_ANIMATION_EDITOR,
  MENU_TOOLS_ASSET_STORE,
  MENU_TOOLS_SPRITES_OPTIMIZER,
  MENU_TOOLS_FRAME_DURATIONS_OPTIMIZER,
  MENU_TOOLS_FRAME_GROUPS_CONVERTER,
  MENU_TOOLS_CREATE_MISSING_ITEMS,
  MENU_TOOLS_RELOAD_ITEM_ATTRIBUTES,
  // Window
  MENU_WINDOW_LOG,
  MENU_WINDOW_VERSIONS,
  // Help
  MENU_HELP_CONTENTS,
  MENU_HELP_CHECK_FOR_UPDATES,
  MENU_HELP_ABOUT
] as const

/** Union type of all menu action identifiers */
export type MenuAction = (typeof MENU_ACTIONS)[number]

// ---------------------------------------------------------------------------
// Menu state for dynamic enable/disable and checked state
// ---------------------------------------------------------------------------

export interface MenuState {
  /** Whether a client project is currently loaded */
  clientLoaded: boolean
  /** Whether the loaded project has unsaved changes */
  clientChanged: boolean
  /** Whether the loaded project is temporary (not yet saved to disk) */
  clientIsTemporary: boolean
  /** Whether OTB server items are loaded */
  otbLoaded: boolean
  /** Whether the preview panel is currently visible */
  showPreviewPanel: boolean
  /** Whether the things/objects panel is currently visible */
  showThingsPanel: boolean
  /** Whether the sprites panel is currently visible */
  showSpritesPanel: boolean
  /** Whether the log panel is currently visible */
  showLogPanel: boolean
}

/** Creates a default MenuState (nothing loaded, all panels visible) */
export function createDefaultMenuState(): MenuState {
  return {
    clientLoaded: false,
    clientChanged: false,
    clientIsTemporary: false,
    otbLoaded: false,
    showPreviewPanel: true,
    showThingsPanel: true,
    showSpritesPanel: true,
    showLogPanel: true
  }
}
