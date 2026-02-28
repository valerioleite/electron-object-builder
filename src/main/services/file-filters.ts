/**
 * Electron dialog file filter definitions for Object Builder.
 * Ported from legacy FileFilter usage across ObjectBuilder.mxml,
 * OtlibUtils.createImagesFileFilter(), and various dialog components.
 */

/** Electron file filter type */
export interface FileFilter {
  name: string
  extensions: string[]
}

// ---------------------------------------------------------------------------
// Client file filters
// ---------------------------------------------------------------------------

/** DAT metadata file */
export const DAT_FILTER: FileFilter = {
  name: 'Metadata File (*.dat)',
  extensions: ['dat']
}

/** SPR sprites file */
export const SPR_FILTER: FileFilter = {
  name: 'Sprites File (*.spr)',
  extensions: ['spr']
}

/** Client files (DAT + SPR) */
export const CLIENT_FILES_FILTER: FileFilter = {
  name: 'Client Files (*.dat, *.spr)',
  extensions: ['dat', 'spr']
}

// ---------------------------------------------------------------------------
// Object Builder Data filters
// ---------------------------------------------------------------------------

/** OBD file */
export const OBD_FILTER: FileFilter = {
  name: 'Object Builder Data (*.obd)',
  extensions: ['obd']
}

// ---------------------------------------------------------------------------
// Image filters
// ---------------------------------------------------------------------------

/** PNG image */
export const PNG_FILTER: FileFilter = {
  name: 'PNG (*.png)',
  extensions: ['png']
}

/** BMP image */
export const BMP_FILTER: FileFilter = {
  name: 'BMP (*.bmp)',
  extensions: ['bmp']
}

/** JPEG image */
export const JPG_FILTER: FileFilter = {
  name: 'JPEG (*.jpg)',
  extensions: ['jpg']
}

/** GIF image */
export const GIF_FILTER: FileFilter = {
  name: 'GIF (*.gif)',
  extensions: ['gif']
}

/** All supported image formats */
export const ALL_IMAGES_FILTER: FileFilter = {
  name: 'All Images (*.png, *.bmp, *.jpg, *.gif)',
  extensions: ['png', 'bmp', 'jpg', 'gif']
}

/** Image filters array (all + individual) - matches legacy createImagesFileFilter() */
export const IMAGE_FILTERS: FileFilter[] = [
  ALL_IMAGES_FILTER,
  PNG_FILTER,
  BMP_FILTER,
  JPG_FILTER,
  GIF_FILTER
]

// ---------------------------------------------------------------------------
// Server item filters
// ---------------------------------------------------------------------------

/** OTB server items file */
export const OTB_FILTER: FileFilter = {
  name: 'Server Items (*.otb)',
  extensions: ['otb']
}

/** XML server items file */
export const ITEMS_XML_FILTER: FileFilter = {
  name: 'Items XML (*.xml)',
  extensions: ['xml']
}

/** Server item files (OTB + XML) */
export const SERVER_ITEMS_FILTERS: FileFilter[] = [OTB_FILTER, ITEMS_XML_FILTER]

// ---------------------------------------------------------------------------
// OTFI filters
// ---------------------------------------------------------------------------

/** OTFI file */
export const OTFI_FILTER: FileFilter = {
  name: 'OpenTibia File Interface (*.otfi)',
  extensions: ['otfi']
}

// ---------------------------------------------------------------------------
// Generic filters
// ---------------------------------------------------------------------------

/** All files */
export const ALL_FILES_FILTER: FileFilter = {
  name: 'All Files',
  extensions: ['*']
}
