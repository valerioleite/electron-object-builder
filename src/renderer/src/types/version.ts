/**
 * Client version and feature types for OpenTibia.
 * Ported from legacy AS3: otlib/core/Version.as, otlib/core/ClientFeatures.as
 */

// ---------------------------------------------------------------------------
// Version
// ---------------------------------------------------------------------------

export interface Version {
  value: number
  valueStr: string
  datSignature: number
  sprSignature: number
  otbVersion: number
}

export function createVersion(): Version {
  return {
    value: 0,
    valueStr: '',
    datSignature: 0,
    sprSignature: 0,
    otbVersion: 0
  }
}

export function cloneVersion(v: Version): Version {
  return { ...v }
}

export function versionEquals(a: Version, b: Version): boolean {
  return (
    a.value === b.value &&
    a.valueStr === b.valueStr &&
    a.datSignature === b.datSignature &&
    a.sprSignature === b.sprSignature &&
    a.otbVersion === b.otbVersion
  )
}

// ---------------------------------------------------------------------------
// ClientFeatures
// ---------------------------------------------------------------------------

export interface ClientFeatures {
  extended: boolean
  transparency: boolean
  improvedAnimations: boolean
  frameGroups: boolean
  metadataController: string
  attributeServer: string | null
}

export function createClientFeatures(
  extended = false,
  transparency = false,
  improvedAnimations = false,
  frameGroups = false,
  metadataController = 'default',
  attributeServer: string | null = null
): ClientFeatures {
  return {
    extended,
    transparency,
    improvedAnimations,
    frameGroups,
    metadataController,
    attributeServer
  }
}

export function cloneClientFeatures(cf: ClientFeatures): ClientFeatures {
  return { ...cf }
}

/**
 * Applies version-based defaults for features.
 * v960+: extended; v1050+: improvedAnimations; v1057+: frameGroups.
 */
export function applyVersionDefaults(cf: ClientFeatures, versionValue: number): void {
  if (versionValue >= 960) cf.extended = true
  if (versionValue >= 1050) cf.improvedAnimations = true
  if (versionValue >= 1057) cf.frameGroups = true
}

export function clientFeaturesDiffer(a: ClientFeatures, b: ClientFeatures): boolean {
  return (
    a.extended !== b.extended ||
    a.transparency !== b.transparency ||
    a.improvedAnimations !== b.improvedAnimations ||
    a.metadataController !== b.metadataController ||
    a.attributeServer !== b.attributeServer
  )
}
