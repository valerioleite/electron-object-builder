/**
 * OTFI (OpenTibia File Interface) reader/writer.
 * Reads and writes .otfi files in OTML format.
 * Stores client feature flags, file references, and sprite dimensions.
 *
 * Ported from legacy AS3: otlib/utils/OTFI.as + otlib/otml/
 */

import {
  type ClientFeatures,
  createClientFeatures,
  SPRITE_DEFAULT_SIZE,
  SPRITE_DEFAULT_DATA_SIZE
} from '../../types'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface OtfiData {
  features: ClientFeatures
  metadataFile: string | null
  spritesFile: string | null
  spriteSize: number
  spriteDataSize: number
}

export function createOtfiData(
  features?: ClientFeatures,
  metadataFile?: string | null,
  spritesFile?: string | null,
  spriteSize?: number,
  spriteDataSize?: number
): OtfiData {
  return {
    features: features ?? createClientFeatures(),
    metadataFile: metadataFile ?? null,
    spritesFile: spritesFile ?? null,
    spriteSize: spriteSize ?? SPRITE_DEFAULT_SIZE,
    spriteDataSize: spriteDataSize ?? SPRITE_DEFAULT_DATA_SIZE
  }
}

/**
 * Parses an OTFI file content string (OTML format) into OtfiData.
 * Returns null if the content is invalid or missing the DatSpr root node.
 */
export function parseOtfi(text: string): OtfiData | null {
  const nodes = parseOtml(text)
  const datSpr = nodes.find((n) => n.tag === 'DatSpr')
  if (!datSpr) return null

  const children = datSpr.children
  const features = createClientFeatures()

  features.extended = getBooleanValue(children, 'extended')
  features.transparency = getBooleanValue(children, 'transparency')
  features.improvedAnimations = getBooleanValue(children, 'frame-durations')
  features.frameGroups = getBooleanValue(children, 'frame-groups')
  features.metadataController = getStringValue(children, 'metadata-controller') ?? 'default'
  features.attributeServer = getStringValue(children, 'attribute-server') ?? 'tfs1.4'

  const metadataFile = getStringValue(children, 'metadata-file')
  const spritesFile = getStringValue(children, 'sprites-file')

  const spriteSizeStr = getStringValue(children, 'sprite-size')
  const spriteDataSizeStr = getStringValue(children, 'sprite-data-size')

  return {
    features,
    metadataFile,
    spritesFile,
    spriteSize: spriteSizeStr !== null ? parseInt(spriteSizeStr, 10) || 0 : 0,
    spriteDataSize: spriteDataSizeStr !== null ? parseInt(spriteDataSizeStr, 10) || 0 : 0
  }
}

/**
 * Writes OtfiData to an OTFI file content string (OTML format).
 */
export function writeOtfi(data: OtfiData): string {
  const lines: string[] = []
  lines.push('DatSpr')
  lines.push(`  extended: ${data.features.extended}`)
  lines.push(`  transparency: ${data.features.transparency}`)
  lines.push(`  frame-durations: ${data.features.improvedAnimations}`)
  lines.push(`  frame-groups: ${data.features.frameGroups}`)
  lines.push(`  metadata-controller: ${data.features.metadataController}`)
  lines.push(`  attribute-server: ${data.features.attributeServer ?? 'tfs1.4'}`)

  if (data.metadataFile) {
    lines.push(`  metadata-file: ${data.metadataFile}`)
  }

  if (data.spritesFile) {
    lines.push(`  sprites-file: ${data.spritesFile}`)
  }

  if (data.spriteSize) {
    lines.push(`  sprite-size: ${data.spriteSize}`)
  }

  if (data.spriteDataSize) {
    lines.push(`  sprite-data-size: ${data.spriteDataSize}`)
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// OTML parser (simplified for OTFI use)
// ---------------------------------------------------------------------------

interface OtmlNode {
  tag: string
  value: string | null
  children: OtmlNode[]
}

/**
 * Parses OTML text into a flat list of top-level nodes with children.
 * Supports indentation-based nesting (2 spaces per level), comments (//),
 * and key: value syntax.
 */
function parseOtml(text: string): OtmlNode[] {
  const lines = text.split('\n')
  const roots: OtmlNode[] = []
  const stack: { node: OtmlNode; depth: number }[] = []

  for (const rawLine of lines) {
    // Skip empty lines
    const trimmed = rawLine.trim()
    if (trimmed.length === 0) continue

    // Skip comments
    if (trimmed.startsWith('//')) continue

    // Calculate depth (2 spaces per level)
    let spaces = 0
    while (spaces < rawLine.length && rawLine[spaces] === ' ') {
      spaces++
    }
    const depth = Math.floor(spaces / 2)

    // Parse tag and value
    const colonPos = trimmed.indexOf(':')
    let tag: string
    let value: string | null = null

    if (colonPos !== -1) {
      tag = trimmed.substring(0, colonPos).trim()
      const rawValue = trimmed.substring(colonPos + 1).trim()
      value = rawValue.length > 0 ? (rawValue === '~' ? null : rawValue) : null
    } else {
      tag = trimmed
    }

    const node: OtmlNode = { tag, value, children: [] }

    if (depth === 0) {
      roots.push(node)
      stack.length = 0
      stack.push({ node, depth: 0 })
    } else {
      // Find parent at depth - 1
      while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
        stack.pop()
      }

      if (stack.length > 0) {
        stack[stack.length - 1].node.children.push(node)
      }

      stack.push({ node, depth })
    }
  }

  return roots
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStringValue(children: OtmlNode[], tag: string): string | null {
  const node = children.find((n) => n.tag === tag)
  return node?.value ?? null
}

function getBooleanValue(children: OtmlNode[], tag: string): boolean {
  return getStringValue(children, tag) === 'true'
}
