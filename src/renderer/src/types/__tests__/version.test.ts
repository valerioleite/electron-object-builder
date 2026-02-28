import { describe, it, expect } from 'vitest'
import {
  createVersion,
  cloneVersion,
  versionEquals,
  createClientFeatures,
  cloneClientFeatures,
  applyVersionDefaults,
  clientFeaturesDiffer
} from '../version'
import type { Version, ClientFeatures } from '../version'

// ---------------------------------------------------------------------------
// createVersion
// ---------------------------------------------------------------------------

describe('createVersion', () => {
  it('creates a version with all zeros and empty string', () => {
    const v = createVersion()
    expect(v.value).toBe(0)
    expect(v.valueStr).toBe('')
    expect(v.datSignature).toBe(0)
    expect(v.sprSignature).toBe(0)
    expect(v.otbVersion).toBe(0)
  })

  it('returns a new object each time', () => {
    const v1 = createVersion()
    const v2 = createVersion()
    expect(v1).not.toBe(v2)
  })
})

// ---------------------------------------------------------------------------
// cloneVersion
// ---------------------------------------------------------------------------

describe('cloneVersion', () => {
  it('creates a copy with identical field values', () => {
    const original: Version = {
      value: 1056,
      valueStr: '10.56',
      datSignature: 0x44b3b721,
      sprSignature: 0x57bdc5e4,
      otbVersion: 52
    }
    const cloned = cloneVersion(original)
    expect(cloned.value).toBe(1056)
    expect(cloned.valueStr).toBe('10.56')
    expect(cloned.datSignature).toBe(0x44b3b721)
    expect(cloned.sprSignature).toBe(0x57bdc5e4)
    expect(cloned.otbVersion).toBe(52)
  })

  it('returns a different object reference', () => {
    const original = createVersion()
    const cloned = cloneVersion(original)
    expect(cloned).not.toBe(original)
  })

  it('does not share mutations with the original', () => {
    const original: Version = {
      value: 1056,
      valueStr: '10.56',
      datSignature: 0x44b3b721,
      sprSignature: 0x57bdc5e4,
      otbVersion: 52
    }
    const cloned = cloneVersion(original)
    cloned.value = 999
    cloned.valueStr = 'modified'
    expect(original.value).toBe(1056)
    expect(original.valueStr).toBe('10.56')
  })

  it('clones a default version', () => {
    const original = createVersion()
    const cloned = cloneVersion(original)
    expect(cloned.value).toBe(0)
    expect(cloned.valueStr).toBe('')
    expect(cloned.datSignature).toBe(0)
    expect(cloned.sprSignature).toBe(0)
    expect(cloned.otbVersion).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// versionEquals
// ---------------------------------------------------------------------------

describe('versionEquals', () => {
  it('returns true for two identical versions', () => {
    const a: Version = {
      value: 1056,
      valueStr: '10.56',
      datSignature: 0x44b3b721,
      sprSignature: 0x57bdc5e4,
      otbVersion: 52
    }
    const b: Version = {
      value: 1056,
      valueStr: '10.56',
      datSignature: 0x44b3b721,
      sprSignature: 0x57bdc5e4,
      otbVersion: 52
    }
    expect(versionEquals(a, b)).toBe(true)
  })

  it('returns true for two default versions', () => {
    expect(versionEquals(createVersion(), createVersion())).toBe(true)
  })

  it('returns false when value differs', () => {
    const a = createVersion()
    const b = createVersion()
    a.value = 1056
    b.value = 960
    expect(versionEquals(a, b)).toBe(false)
  })

  it('returns false when valueStr differs', () => {
    const a = createVersion()
    const b = createVersion()
    a.valueStr = '10.56'
    b.valueStr = '9.60'
    expect(versionEquals(a, b)).toBe(false)
  })

  it('returns false when datSignature differs', () => {
    const a = createVersion()
    const b = createVersion()
    a.datSignature = 0x44b3b721
    b.datSignature = 0x12345678
    expect(versionEquals(a, b)).toBe(false)
  })

  it('returns false when sprSignature differs', () => {
    const a = createVersion()
    const b = createVersion()
    a.sprSignature = 0x57bdc5e4
    b.sprSignature = 0x12345678
    expect(versionEquals(a, b)).toBe(false)
  })

  it('returns false when otbVersion differs', () => {
    const a = createVersion()
    const b = createVersion()
    a.otbVersion = 52
    b.otbVersion = 10
    expect(versionEquals(a, b)).toBe(false)
  })

  it('returns true when comparing a version to itself', () => {
    const v: Version = {
      value: 800,
      valueStr: '8.00',
      datSignature: 0xaabbccdd,
      sprSignature: 0x11223344,
      otbVersion: 20
    }
    expect(versionEquals(v, v)).toBe(true)
  })

  it('returns false when only otbVersion differs among otherwise identical versions', () => {
    const a: Version = {
      value: 1056,
      valueStr: '10.56',
      datSignature: 0x44b3b721,
      sprSignature: 0x57bdc5e4,
      otbVersion: 52
    }
    const b: Version = { ...a, otbVersion: 53 }
    expect(versionEquals(a, b)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createClientFeatures
// ---------------------------------------------------------------------------

describe('createClientFeatures', () => {
  it('creates features with all default values', () => {
    const cf = createClientFeatures()
    expect(cf.extended).toBe(false)
    expect(cf.transparency).toBe(false)
    expect(cf.improvedAnimations).toBe(false)
    expect(cf.frameGroups).toBe(false)
    expect(cf.metadataController).toBe('default')
    expect(cf.attributeServer).toBeNull()
  })

  it('creates features with all true booleans', () => {
    const cf = createClientFeatures(true, true, true, true, 'custom', 'tfs1.4')
    expect(cf.extended).toBe(true)
    expect(cf.transparency).toBe(true)
    expect(cf.improvedAnimations).toBe(true)
    expect(cf.frameGroups).toBe(true)
    expect(cf.metadataController).toBe('custom')
    expect(cf.attributeServer).toBe('tfs1.4')
  })

  it('creates features with only extended set', () => {
    const cf = createClientFeatures(true)
    expect(cf.extended).toBe(true)
    expect(cf.transparency).toBe(false)
    expect(cf.improvedAnimations).toBe(false)
    expect(cf.frameGroups).toBe(false)
    expect(cf.metadataController).toBe('default')
    expect(cf.attributeServer).toBeNull()
  })

  it('creates features with custom metadataController and attributeServer', () => {
    const cf = createClientFeatures(false, false, false, false, 'myController', 'tfs1.6')
    expect(cf.metadataController).toBe('myController')
    expect(cf.attributeServer).toBe('tfs1.6')
  })

  it('returns a new object each time', () => {
    const cf1 = createClientFeatures()
    const cf2 = createClientFeatures()
    expect(cf1).not.toBe(cf2)
  })
})

// ---------------------------------------------------------------------------
// cloneClientFeatures
// ---------------------------------------------------------------------------

describe('cloneClientFeatures', () => {
  it('creates a copy with identical field values', () => {
    const original = createClientFeatures(true, true, true, true, 'custom', 'tfs1.4')
    const cloned = cloneClientFeatures(original)
    expect(cloned.extended).toBe(true)
    expect(cloned.transparency).toBe(true)
    expect(cloned.improvedAnimations).toBe(true)
    expect(cloned.frameGroups).toBe(true)
    expect(cloned.metadataController).toBe('custom')
    expect(cloned.attributeServer).toBe('tfs1.4')
  })

  it('returns a different object reference', () => {
    const original = createClientFeatures()
    const cloned = cloneClientFeatures(original)
    expect(cloned).not.toBe(original)
  })

  it('does not share mutations with the original', () => {
    const original = createClientFeatures(true, false, false, false, 'default', null)
    const cloned = cloneClientFeatures(original)
    cloned.extended = false
    cloned.metadataController = 'changed'
    expect(original.extended).toBe(true)
    expect(original.metadataController).toBe('default')
  })

  it('clones a default features object', () => {
    const original = createClientFeatures()
    const cloned = cloneClientFeatures(original)
    expect(cloned.extended).toBe(false)
    expect(cloned.transparency).toBe(false)
    expect(cloned.improvedAnimations).toBe(false)
    expect(cloned.frameGroups).toBe(false)
    expect(cloned.metadataController).toBe('default')
    expect(cloned.attributeServer).toBeNull()
  })

  it('preserves null attributeServer', () => {
    const original = createClientFeatures(false, false, false, false, 'default', null)
    const cloned = cloneClientFeatures(original)
    expect(cloned.attributeServer).toBeNull()
  })

  it('preserves non-null attributeServer', () => {
    const original = createClientFeatures(false, false, false, false, 'default', 'tfs0.3.6')
    const cloned = cloneClientFeatures(original)
    expect(cloned.attributeServer).toBe('tfs0.3.6')
  })
})

// ---------------------------------------------------------------------------
// applyVersionDefaults
// ---------------------------------------------------------------------------

describe('applyVersionDefaults', () => {
  it('does not modify features for version below 960', () => {
    const cf = createClientFeatures()
    applyVersionDefaults(cf, 740)
    expect(cf.extended).toBe(false)
    expect(cf.improvedAnimations).toBe(false)
    expect(cf.frameGroups).toBe(false)
  })

  it('enables extended for version 960', () => {
    const cf = createClientFeatures()
    applyVersionDefaults(cf, 960)
    expect(cf.extended).toBe(true)
    expect(cf.improvedAnimations).toBe(false)
    expect(cf.frameGroups).toBe(false)
  })

  it('enables extended for version 1000 (between 960 and 1050)', () => {
    const cf = createClientFeatures()
    applyVersionDefaults(cf, 1000)
    expect(cf.extended).toBe(true)
    expect(cf.improvedAnimations).toBe(false)
    expect(cf.frameGroups).toBe(false)
  })

  it('enables extended and improvedAnimations for version 1050', () => {
    const cf = createClientFeatures()
    applyVersionDefaults(cf, 1050)
    expect(cf.extended).toBe(true)
    expect(cf.improvedAnimations).toBe(true)
    expect(cf.frameGroups).toBe(false)
  })

  it('enables extended, improvedAnimations and frameGroups for version 1057', () => {
    const cf = createClientFeatures()
    applyVersionDefaults(cf, 1057)
    expect(cf.extended).toBe(true)
    expect(cf.improvedAnimations).toBe(true)
    expect(cf.frameGroups).toBe(true)
  })

  it('enables all three features for version 1100 (above 1057)', () => {
    const cf = createClientFeatures()
    applyVersionDefaults(cf, 1100)
    expect(cf.extended).toBe(true)
    expect(cf.improvedAnimations).toBe(true)
    expect(cf.frameGroups).toBe(true)
  })

  it('mutates the input object in place', () => {
    const cf = createClientFeatures()
    const returnValue = applyVersionDefaults(cf, 1057)
    expect(returnValue).toBeUndefined()
    expect(cf.extended).toBe(true)
  })

  it('does not modify transparency, metadataController, or attributeServer', () => {
    const cf = createClientFeatures(false, true, false, false, 'myCtrl', 'tfs1.6')
    applyVersionDefaults(cf, 1057)
    expect(cf.transparency).toBe(true)
    expect(cf.metadataController).toBe('myCtrl')
    expect(cf.attributeServer).toBe('tfs1.6')
  })

  it('does not disable features that are already true for low versions', () => {
    const cf = createClientFeatures(true, false, true, true, 'default', null)
    applyVersionDefaults(cf, 710)
    // applyVersionDefaults only sets to true, never to false
    expect(cf.extended).toBe(true)
    expect(cf.improvedAnimations).toBe(true)
    expect(cf.frameGroups).toBe(true)
  })

  it('handles version exactly at boundary 959 (just below 960)', () => {
    const cf = createClientFeatures()
    applyVersionDefaults(cf, 959)
    expect(cf.extended).toBe(false)
    expect(cf.improvedAnimations).toBe(false)
    expect(cf.frameGroups).toBe(false)
  })

  it('handles version exactly at boundary 1049 (just below 1050)', () => {
    const cf = createClientFeatures()
    applyVersionDefaults(cf, 1049)
    expect(cf.extended).toBe(true)
    expect(cf.improvedAnimations).toBe(false)
    expect(cf.frameGroups).toBe(false)
  })

  it('handles version exactly at boundary 1056 (just below 1057)', () => {
    const cf = createClientFeatures()
    applyVersionDefaults(cf, 1056)
    expect(cf.extended).toBe(true)
    expect(cf.improvedAnimations).toBe(true)
    expect(cf.frameGroups).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// clientFeaturesDiffer
// ---------------------------------------------------------------------------

describe('clientFeaturesDiffer', () => {
  it('returns false for two identical default features', () => {
    const a = createClientFeatures()
    const b = createClientFeatures()
    expect(clientFeaturesDiffer(a, b)).toBe(false)
  })

  it('returns false for two features with all fields identical', () => {
    const a = createClientFeatures(true, true, true, true, 'ctrl', 'tfs1.4')
    const b = createClientFeatures(true, true, true, true, 'ctrl', 'tfs1.4')
    expect(clientFeaturesDiffer(a, b)).toBe(false)
  })

  it('returns true when extended differs', () => {
    const a = createClientFeatures(true)
    const b = createClientFeatures(false)
    expect(clientFeaturesDiffer(a, b)).toBe(true)
  })

  it('returns true when transparency differs', () => {
    const a = createClientFeatures(false, true)
    const b = createClientFeatures(false, false)
    expect(clientFeaturesDiffer(a, b)).toBe(true)
  })

  it('returns true when improvedAnimations differs', () => {
    const a = createClientFeatures(false, false, true)
    const b = createClientFeatures(false, false, false)
    expect(clientFeaturesDiffer(a, b)).toBe(true)
  })

  it('does NOT consider frameGroups difference', () => {
    const a = createClientFeatures(false, false, false, true)
    const b = createClientFeatures(false, false, false, false)
    expect(clientFeaturesDiffer(a, b)).toBe(false)
  })

  it('returns true when metadataController differs', () => {
    const a = createClientFeatures(false, false, false, false, 'ctrl1')
    const b = createClientFeatures(false, false, false, false, 'ctrl2')
    expect(clientFeaturesDiffer(a, b)).toBe(true)
  })

  it('returns true when attributeServer differs', () => {
    const a = createClientFeatures(false, false, false, false, 'default', 'tfs1.4')
    const b = createClientFeatures(false, false, false, false, 'default', 'tfs1.6')
    expect(clientFeaturesDiffer(a, b)).toBe(true)
  })

  it('returns true when attributeServer is null vs non-null', () => {
    const a = createClientFeatures(false, false, false, false, 'default', null)
    const b = createClientFeatures(false, false, false, false, 'default', 'tfs1.4')
    expect(clientFeaturesDiffer(a, b)).toBe(true)
  })

  it('returns false when only frameGroups differs (frameGroups is excluded from comparison)', () => {
    const a: ClientFeatures = {
      extended: true,
      transparency: true,
      improvedAnimations: true,
      frameGroups: false,
      metadataController: 'default',
      attributeServer: 'tfs1.4'
    }
    const b: ClientFeatures = {
      extended: true,
      transparency: true,
      improvedAnimations: true,
      frameGroups: true,
      metadataController: 'default',
      attributeServer: 'tfs1.4'
    }
    expect(clientFeaturesDiffer(a, b)).toBe(false)
  })

  it('returns true when comparing a feature to itself is always false', () => {
    const cf = createClientFeatures(true, true, true, true, 'ctrl', 'tfs1.4')
    expect(clientFeaturesDiffer(cf, cf)).toBe(false)
  })

  it('detects multiple differences at once', () => {
    const a = createClientFeatures(true, true, true, false, 'ctrl1', 'tfs1.4')
    const b = createClientFeatures(false, false, false, false, 'ctrl2', 'tfs1.6')
    expect(clientFeaturesDiffer(a, b)).toBe(true)
  })
})
