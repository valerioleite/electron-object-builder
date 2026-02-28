/**
 * Static list of available attribute server versions.
 * Ported from legacy config/attributes/ directory listing.
 */

export interface AttributeServer {
  id: string
  label: string
}

/** All available TFS attribute server versions. */
export const ATTRIBUTE_SERVERS: readonly AttributeServer[] = [
  { id: 'tfs0.3.6', label: 'TFS 0.3.6' },
  { id: 'tfs0.4', label: 'TFS 0.4' },
  { id: 'tfs0.5', label: 'TFS 0.5' },
  { id: 'tfs1.0', label: 'TFS 1.0' },
  { id: 'tfs1.1', label: 'TFS 1.1' },
  { id: 'tfs1.2', label: 'TFS 1.2' },
  { id: 'tfs1.4', label: 'TFS 1.4' },
  { id: 'tfs1.6', label: 'TFS 1.6' }
]

/** Default attribute server. */
export const DEFAULT_ATTRIBUTE_SERVER = 'tfs1.4'
