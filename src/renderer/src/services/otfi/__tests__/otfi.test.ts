import { describe, it, expect } from 'vitest'
import { parseOtfi, writeOtfi, createOtfiData, type OtfiData } from '../index'
import { createClientFeatures } from '../../../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFullOtfi(): string {
  return [
    'DatSpr',
    '  extended: true',
    '  transparency: false',
    '  frame-durations: true',
    '  frame-groups: true',
    '  metadata-controller: default',
    '  attribute-server: tfs1.4',
    '  metadata-file: Tibia.dat',
    '  sprites-file: Tibia.spr',
    '  sprite-size: 32',
    '  sprite-data-size: 4096'
  ].join('\n')
}

function makeFullOtfiData(): OtfiData {
  return {
    features: createClientFeatures(true, false, true, true, 'default', 'tfs1.4'),
    metadataFile: 'Tibia.dat',
    spritesFile: 'Tibia.spr',
    spriteSize: 32,
    spriteDataSize: 4096
  }
}

// ---------------------------------------------------------------------------
// createOtfiData
// ---------------------------------------------------------------------------

describe('createOtfiData', () => {
  it('should create with defaults', () => {
    const data = createOtfiData()
    expect(data.features.extended).toBe(false)
    expect(data.features.transparency).toBe(false)
    expect(data.features.improvedAnimations).toBe(false)
    expect(data.features.frameGroups).toBe(false)
    expect(data.features.metadataController).toBe('default')
    expect(data.features.attributeServer).toBeNull()
    expect(data.metadataFile).toBeNull()
    expect(data.spritesFile).toBeNull()
    expect(data.spriteSize).toBe(32)
    expect(data.spriteDataSize).toBe(4096)
  })

  it('should create with custom features', () => {
    const features = createClientFeatures(true, true, true, true, 'canary', 'tfs1.3')
    const data = createOtfiData(features, 'test.dat', 'test.spr', 64, 16384)
    expect(data.features.extended).toBe(true)
    expect(data.features.transparency).toBe(true)
    expect(data.metadataFile).toBe('test.dat')
    expect(data.spritesFile).toBe('test.spr')
    expect(data.spriteSize).toBe(64)
    expect(data.spriteDataSize).toBe(16384)
  })
})

// ---------------------------------------------------------------------------
// parseOtfi
// ---------------------------------------------------------------------------

describe('parseOtfi', () => {
  it('should parse a complete OTFI file', () => {
    const data = parseOtfi(makeFullOtfi())
    expect(data).not.toBeNull()
    expect(data!.features.extended).toBe(true)
    expect(data!.features.transparency).toBe(false)
    expect(data!.features.improvedAnimations).toBe(true)
    expect(data!.features.frameGroups).toBe(true)
    expect(data!.features.metadataController).toBe('default')
    expect(data!.features.attributeServer).toBe('tfs1.4')
    expect(data!.metadataFile).toBe('Tibia.dat')
    expect(data!.spritesFile).toBe('Tibia.spr')
    expect(data!.spriteSize).toBe(32)
    expect(data!.spriteDataSize).toBe(4096)
  })

  it('should return null for empty string', () => {
    expect(parseOtfi('')).toBeNull()
  })

  it('should return null for missing DatSpr root', () => {
    expect(parseOtfi('SomethingElse\n  key: value')).toBeNull()
  })

  it('should use defaults for missing feature fields', () => {
    const text = 'DatSpr\n  extended: true'
    const data = parseOtfi(text)
    expect(data).not.toBeNull()
    expect(data!.features.extended).toBe(true)
    expect(data!.features.transparency).toBe(false)
    expect(data!.features.improvedAnimations).toBe(false)
    expect(data!.features.frameGroups).toBe(false)
    expect(data!.features.metadataController).toBe('default')
    expect(data!.features.attributeServer).toBe('tfs1.4')
    expect(data!.metadataFile).toBeNull()
    expect(data!.spritesFile).toBeNull()
    expect(data!.spriteSize).toBe(0)
    expect(data!.spriteDataSize).toBe(0)
  })

  it('should handle comments and empty lines', () => {
    const text = [
      '// This is a comment',
      '',
      'DatSpr',
      '  // Another comment',
      '  extended: true',
      '',
      '  transparency: true'
    ].join('\n')

    const data = parseOtfi(text)
    expect(data).not.toBeNull()
    expect(data!.features.extended).toBe(true)
    expect(data!.features.transparency).toBe(true)
  })

  it('should parse all features as false', () => {
    const text = [
      'DatSpr',
      '  extended: false',
      '  transparency: false',
      '  frame-durations: false',
      '  frame-groups: false'
    ].join('\n')

    const data = parseOtfi(text)
    expect(data).not.toBeNull()
    expect(data!.features.extended).toBe(false)
    expect(data!.features.transparency).toBe(false)
    expect(data!.features.improvedAnimations).toBe(false)
    expect(data!.features.frameGroups).toBe(false)
  })

  it('should parse custom metadata-controller and attribute-server', () => {
    const text = [
      'DatSpr',
      '  metadata-controller: canary',
      '  attribute-server: tfs0.3.6'
    ].join('\n')

    const data = parseOtfi(text)
    expect(data).not.toBeNull()
    expect(data!.features.metadataController).toBe('canary')
    expect(data!.features.attributeServer).toBe('tfs0.3.6')
  })

  it('should handle large sprite sizes', () => {
    const text = ['DatSpr', '  sprite-size: 64', '  sprite-data-size: 16384'].join('\n')

    const data = parseOtfi(text)
    expect(data).not.toBeNull()
    expect(data!.spriteSize).toBe(64)
    expect(data!.spriteDataSize).toBe(16384)
  })

  it('should handle DatSpr with no children', () => {
    const data = parseOtfi('DatSpr')
    expect(data).not.toBeNull()
    expect(data!.features.extended).toBe(false)
    expect(data!.features.metadataController).toBe('default')
    expect(data!.features.attributeServer).toBe('tfs1.4')
  })

  it('should handle null values (~)', () => {
    const text = ['DatSpr', '  metadata-file: ~', '  sprites-file: ~'].join('\n')

    const data = parseOtfi(text)
    expect(data).not.toBeNull()
    expect(data!.metadataFile).toBeNull()
    expect(data!.spritesFile).toBeNull()
  })

  it('should handle non-numeric sprite-size gracefully', () => {
    const text = ['DatSpr', '  sprite-size: abc'].join('\n')

    const data = parseOtfi(text)
    expect(data).not.toBeNull()
    expect(data!.spriteSize).toBe(0)
  })

  it('should handle extra whitespace', () => {
    const text = ['DatSpr', '  extended:   true  ', '  transparency:  false  '].join('\n')

    const data = parseOtfi(text)
    expect(data).not.toBeNull()
    expect(data!.features.extended).toBe(true)
    expect(data!.features.transparency).toBe(false)
  })

  it('should handle Windows-style line endings (CRLF)', () => {
    const text = 'DatSpr\r\n  extended: true\r\n  transparency: false\r\n'

    const data = parseOtfi(text)
    expect(data).not.toBeNull()
    expect(data!.features.extended).toBe(true)
    expect(data!.features.transparency).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// writeOtfi
// ---------------------------------------------------------------------------

describe('writeOtfi', () => {
  it('should write a complete OTFI file', () => {
    const data = makeFullOtfiData()
    const text = writeOtfi(data)

    expect(text).toContain('DatSpr')
    expect(text).toContain('  extended: true')
    expect(text).toContain('  transparency: false')
    expect(text).toContain('  frame-durations: true')
    expect(text).toContain('  frame-groups: true')
    expect(text).toContain('  metadata-controller: default')
    expect(text).toContain('  attribute-server: tfs1.4')
    expect(text).toContain('  metadata-file: Tibia.dat')
    expect(text).toContain('  sprites-file: Tibia.spr')
    expect(text).toContain('  sprite-size: 32')
    expect(text).toContain('  sprite-data-size: 4096')
  })

  it('should omit metadata-file when null', () => {
    const data = createOtfiData()
    data.metadataFile = null
    const text = writeOtfi(data)
    expect(text).not.toContain('metadata-file')
  })

  it('should omit sprites-file when null', () => {
    const data = createOtfiData()
    data.spritesFile = null
    const text = writeOtfi(data)
    expect(text).not.toContain('sprites-file')
  })

  it('should omit sprite-size when 0', () => {
    const data = createOtfiData()
    data.spriteSize = 0
    data.spriteDataSize = 0
    const text = writeOtfi(data)
    expect(text).not.toContain('sprite-size')
    expect(text).not.toContain('sprite-data-size')
  })

  it('should write all features as false', () => {
    const data = createOtfiData()
    const text = writeOtfi(data)
    expect(text).toContain('  extended: false')
    expect(text).toContain('  transparency: false')
    expect(text).toContain('  frame-durations: false')
    expect(text).toContain('  frame-groups: false')
  })

  it('should use tfs1.4 when attributeServer is null', () => {
    const data = createOtfiData()
    data.features.attributeServer = null
    const text = writeOtfi(data)
    expect(text).toContain('  attribute-server: tfs1.4')
  })

  it('should start with DatSpr root tag', () => {
    const data = createOtfiData()
    const text = writeOtfi(data)
    expect(text.startsWith('DatSpr\n')).toBe(true)
  })

  it('should use 2-space indentation', () => {
    const data = createOtfiData()
    const text = writeOtfi(data)
    const lines = text.split('\n')
    // All lines after the first should start with exactly 2 spaces
    for (let i = 1; i < lines.length; i++) {
      expect(lines[i]).toMatch(/^ {2}\S/)
    }
  })
})

// ---------------------------------------------------------------------------
// Round-trip
// ---------------------------------------------------------------------------

describe('round-trip (parseOtfi -> writeOtfi -> parseOtfi)', () => {
  it('should preserve all fields', () => {
    const original = makeFullOtfiData()
    const text = writeOtfi(original)
    const parsed = parseOtfi(text)

    expect(parsed).not.toBeNull()
    expect(parsed!.features.extended).toBe(original.features.extended)
    expect(parsed!.features.transparency).toBe(original.features.transparency)
    expect(parsed!.features.improvedAnimations).toBe(original.features.improvedAnimations)
    expect(parsed!.features.frameGroups).toBe(original.features.frameGroups)
    expect(parsed!.features.metadataController).toBe(original.features.metadataController)
    expect(parsed!.features.attributeServer).toBe(original.features.attributeServer)
    expect(parsed!.metadataFile).toBe(original.metadataFile)
    expect(parsed!.spritesFile).toBe(original.spritesFile)
    expect(parsed!.spriteSize).toBe(original.spriteSize)
    expect(parsed!.spriteDataSize).toBe(original.spriteDataSize)
  })

  it('should preserve minimal data', () => {
    const original = createOtfiData()
    original.spriteSize = 0
    original.spriteDataSize = 0
    const text = writeOtfi(original)
    const parsed = parseOtfi(text)

    expect(parsed).not.toBeNull()
    expect(parsed!.features.extended).toBe(false)
    expect(parsed!.features.transparency).toBe(false)
    expect(parsed!.metadataFile).toBeNull()
    expect(parsed!.spritesFile).toBeNull()
  })

  it('should preserve custom attribute-server', () => {
    const original = createOtfiData()
    original.features.attributeServer = 'tfs0.3.6'
    const text = writeOtfi(original)
    const parsed = parseOtfi(text)

    expect(parsed).not.toBeNull()
    expect(parsed!.features.attributeServer).toBe('tfs0.3.6')
  })

  it('should round-trip text -> parse -> write -> parse consistently', () => {
    const text1 = makeFullOtfi()
    const data1 = parseOtfi(text1)!
    const text2 = writeOtfi(data1)
    const data2 = parseOtfi(text2)!

    expect(data2.features.extended).toBe(data1.features.extended)
    expect(data2.features.transparency).toBe(data1.features.transparency)
    expect(data2.features.improvedAnimations).toBe(data1.features.improvedAnimations)
    expect(data2.features.frameGroups).toBe(data1.features.frameGroups)
    expect(data2.features.metadataController).toBe(data1.features.metadataController)
    expect(data2.features.attributeServer).toBe(data1.features.attributeServer)
    expect(data2.metadataFile).toBe(data1.metadataFile)
    expect(data2.spritesFile).toBe(data1.spritesFile)
    expect(data2.spriteSize).toBe(data1.spriteSize)
    expect(data2.spriteDataSize).toBe(data1.spriteDataSize)
  })

  it('should preserve large sprite dimensions', () => {
    const original = createOtfiData()
    original.features.extended = true
    original.spriteSize = 64
    original.spriteDataSize = 16384
    const text = writeOtfi(original)
    const parsed = parseOtfi(text)

    expect(parsed).not.toBeNull()
    expect(parsed!.spriteSize).toBe(64)
    expect(parsed!.spriteDataSize).toBe(16384)
  })
})
