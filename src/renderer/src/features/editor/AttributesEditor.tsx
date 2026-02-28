/**
 * AttributesEditor - Dynamic form for editing server item XML attributes.
 * Ported from legacy AS3: otlib/components/AttributesEditor.mxml
 *
 * Features:
 * - TFS version selector to load attribute definitions
 * - Basic info fields (article, name, plural, description)
 * - Active attributes with type-specific controls (boolean, number, string, enum, mixed)
 * - Add/remove attributes with category grouping and search
 * - Validation of values
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getAvailableServersWithLabels,
  loadServer,
  getAttributes,
  getCategories,
  getAttributesByCategory,
  getCurrentServer,
  searchAttributes
} from '../../services/item-attributes'
import type { ItemAttribute } from '../../types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AttributesEditorProps {
  /** Current XML attributes (key -> string value) */
  xmlAttributes: Record<string, string> | null
  /** Called when any attribute changes */
  onChange: (attrs: Record<string, string> | null) => void
  /** Initial TFS server name (default: 'tfs1.4') */
  initialServer?: string
  /** Bulk edit mode - hides basic info, shows bulk options */
  bulkMode?: boolean
  /** Disabled state */
  disabled?: boolean
}

// Basic attributes are always shown at the top (not in the dynamic list)
const BASIC_ATTRIBUTE_KEYS = ['article', 'name', 'plural', 'description']

const ARTICLE_OPTIONS = [
  { value: '', label: '(none)' },
  { value: 'a', label: 'a' },
  { value: 'an', label: 'an' }
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get an attribute definition by key from the current loaded attributes */
function findAttributeDef(key: string, allAttrs: ItemAttribute[]): ItemAttribute | null {
  for (const attr of allAttrs) {
    if (attr.key === key) return attr
    if (attr.attributes) {
      for (const child of attr.attributes) {
        if (child.key === key) return child
      }
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// AttributeRow - renders a single active attribute with type-specific control
// ---------------------------------------------------------------------------

interface AttributeRowProps {
  attrKey: string
  value: string
  def: ItemAttribute | null
  onChange: (key: string, value: string) => void
  onRemove: (key: string) => void
  disabled?: boolean
}

function AttributeRow({
  attrKey,
  value,
  def,
  onChange,
  onRemove,
  disabled = false
}: AttributeRowProps): React.JSX.Element {
  const type = def?.type ?? 'string'
  const values = def?.values ?? null

  return (
    <div className="flex items-center gap-2 py-[2px]" data-testid={`attr-row-${attrKey}`}>
      {/* Key label */}
      <span
        className="min-w-[120px] truncate text-[11px] text-text-primary"
        title={attrKey}
      >
        {attrKey}
      </span>

      {/* Type-specific control */}
      <div className="flex flex-1 items-center gap-1">
        {type === 'boolean' ? (
          <input
            type="checkbox"
            checked={value === '1' || value === 'true'}
            onChange={(e) => onChange(attrKey, e.target.checked ? '1' : '0')}
            disabled={disabled}
            className="accent-accent"
            data-testid={`attr-control-${attrKey}`}
          />
        ) : type === 'mixed' && values && values.length > 0 ? (
          /* Mixed: dropdown + text input */
          <>
            <select
              value={values.includes(value) ? value : ''}
              onChange={(e) => {
                if (e.target.value) onChange(attrKey, e.target.value)
              }}
              disabled={disabled}
              className="w-[100px] rounded border border-border bg-bg-primary px-1 py-0.5 text-[11px] text-text-primary disabled:opacity-40"
              data-testid={`attr-select-${attrKey}`}
            >
              <option value="">--</option>
              {values.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={values.includes(value) ? '' : value}
              onChange={(e) => onChange(attrKey, e.target.value)}
              disabled={disabled}
              placeholder="custom..."
              className="w-[60px] rounded border border-border bg-bg-primary px-1 py-0.5 text-[11px] text-text-primary disabled:opacity-40"
              data-testid={`attr-input-${attrKey}`}
            />
          </>
        ) : values && values.length > 0 ? (
          /* Enum: dropdown */
          <select
            value={value}
            onChange={(e) => onChange(attrKey, e.target.value)}
            disabled={disabled}
            className="w-[140px] rounded border border-border bg-bg-primary px-1 py-0.5 text-[11px] text-text-primary disabled:opacity-40"
            data-testid={`attr-control-${attrKey}`}
          >
            <option value="">--</option>
            {values.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        ) : type === 'number' ? (
          /* Number: numeric text input */
          <input
            type="text"
            value={value}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.\-]/g, '')
              onChange(attrKey, v)
            }}
            disabled={disabled}
            className="w-[140px] rounded border border-border bg-bg-primary px-1 py-0.5 text-[11px] text-text-primary disabled:opacity-40"
            data-testid={`attr-control-${attrKey}`}
          />
        ) : (
          /* String: text input (default) */
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(attrKey, e.target.value)}
            disabled={disabled}
            className="w-[140px] rounded border border-border bg-bg-primary px-1 py-0.5 text-[11px] text-text-primary disabled:opacity-40"
            data-testid={`attr-control-${attrKey}`}
          />
        )}
      </div>

      {/* Remove button */}
      <button
        onClick={() => onRemove(attrKey)}
        disabled={disabled}
        className="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-error transition-colors hover:bg-red-400/10 disabled:opacity-40"
        title={`Remove ${attrKey}`}
        data-testid={`attr-remove-${attrKey}`}
      >
        x
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AttributesEditor
// ---------------------------------------------------------------------------

export function AttributesEditor({
  xmlAttributes,
  onChange,
  initialServer = 'tfs1.4',
  bulkMode = false,
  disabled = false
}: AttributesEditorProps): React.JSX.Element {
  const { t } = useTranslation()
  // Server selection
  const [serverName, setServerName] = useState(initialServer)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // Load server on mount or when server changes
  useEffect(() => {
    loadServer(serverName)
  }, [serverName])

  // Available servers for dropdown
  const servers = useMemo(() => getAvailableServersWithLabels(), [])

  // All attributes for the current server
  const allAttrs = useMemo(() => {
    const current = getCurrentServer()
    if (current !== serverName) {
      loadServer(serverName)
    }
    return getAttributes() ?? []
  }, [serverName])

  // Categories for the current server
  const categories = useMemo(() => getCategories(), [serverName])

  // Current active attributes (from xmlAttributes prop)
  const activeKeys = useMemo(() => {
    if (!xmlAttributes) return new Set<string>()
    return new Set(Object.keys(xmlAttributes))
  }, [xmlAttributes])

  // Basic info values
  const article = xmlAttributes?.['article'] ?? ''
  const name = xmlAttributes?.['name'] ?? ''
  const plural = xmlAttributes?.['plural'] ?? ''
  const description = xmlAttributes?.['description'] ?? ''

  // Non-basic active attributes (sorted alphabetically)
  const activeNonBasicAttrs = useMemo(() => {
    if (!xmlAttributes) return []
    return Object.entries(xmlAttributes)
      .filter(([key]) => !BASIC_ATTRIBUTE_KEYS.includes(key))
      .sort(([a], [b]) => a.localeCompare(b))
  }, [xmlAttributes])

  // Available attributes (not yet active, filtered by search)
  const availableAttrs = useMemo(() => {
    if (searchTerm.trim()) {
      const results = searchAttributes(searchTerm)
      return results.filter(
        (attr) => !activeKeys.has(attr.key) && !BASIC_ATTRIBUTE_KEYS.includes(attr.key)
      )
    }
    return []
  }, [searchTerm, activeKeys])

  // Attributes by category (for category-based browsing)
  const attrsByCategory = useMemo(() => {
    const result: Record<string, ItemAttribute[]> = {}
    for (const cat of categories) {
      const attrs = getAttributesByCategory(cat).filter(
        (attr) => !activeKeys.has(attr.key) && !BASIC_ATTRIBUTE_KEYS.includes(attr.key)
      )
      if (attrs.length > 0) {
        result[cat] = attrs
      }
    }
    return result
  }, [categories, activeKeys])

  // Helper to update a single attribute value
  const handleAttributeChange = useCallback(
    (key: string, value: string) => {
      const newAttrs = { ...(xmlAttributes ?? {}) }
      newAttrs[key] = value
      onChange(newAttrs)
    },
    [xmlAttributes, onChange]
  )

  // Helper to remove an attribute
  const handleRemoveAttribute = useCallback(
    (key: string) => {
      if (!xmlAttributes) return
      const newAttrs = { ...xmlAttributes }
      delete newAttrs[key]
      onChange(Object.keys(newAttrs).length > 0 ? newAttrs : null)
    },
    [xmlAttributes, onChange]
  )

  // Helper to add a new attribute with default value
  const handleAddAttribute = useCallback(
    (attr: ItemAttribute) => {
      const newAttrs = { ...(xmlAttributes ?? {}) }
      // Default value based on type
      if (attr.type === 'boolean') {
        newAttrs[attr.key] = '0'
      } else if (attr.values && attr.values.length > 0) {
        newAttrs[attr.key] = attr.values[0]
      } else {
        newAttrs[attr.key] = ''
      }
      onChange(newAttrs)
    },
    [xmlAttributes, onChange]
  )

  // Handle server change
  const handleServerChange = useCallback((newServer: string) => {
    setServerName(newServer)
    setSearchTerm('')
    setExpandedCategory(null)
  }, [])

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto p-2" data-testid="attributes-editor">
      {/* TFS Server Selector */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-text-secondary">{t('labels.version')}:</span>
        <select
          value={serverName}
          onChange={(e) => handleServerChange(e.target.value)}
          disabled={disabled}
          className="rounded border border-border bg-bg-primary px-1.5 py-0.5 text-[11px] text-text-primary disabled:opacity-40"
          data-testid="server-selector"
        >
          {servers.map((s) => (
            <option key={s.server} value={s.server}>
              {s.displayName}
            </option>
          ))}
        </select>
      </div>

      {/* Basic Info Fields (not in bulk mode) */}
      {!bulkMode && (
        <fieldset className="rounded border border-border p-2" data-testid="basic-info">
          <legend className="px-1 text-[10px] font-medium uppercase tracking-wider text-text-secondary">
            {t('attributes.basicInformation')}
          </legend>
          <div className="flex flex-col gap-1.5">
            {/* Article */}
            <div className="flex items-center gap-2">
              <span className="min-w-[70px] text-[11px] text-text-secondary">Article:</span>
              <select
                value={article}
                onChange={(e) => handleAttributeChange('article', e.target.value)}
                disabled={disabled}
                className="w-[80px] rounded border border-border bg-bg-primary px-1 py-0.5 text-[11px] text-text-primary disabled:opacity-40"
                data-testid="basic-article"
              >
                {ARTICLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Name */}
            <div className="flex items-center gap-2">
              <span className="min-w-[70px] text-[11px] text-text-secondary">{t('labels.name')}:</span>
              <input
                type="text"
                value={name}
                onChange={(e) => handleAttributeChange('name', e.target.value)}
                disabled={disabled}
                className="flex-1 rounded border border-border bg-bg-primary px-1.5 py-0.5 text-[11px] text-text-primary disabled:opacity-40"
                data-testid="basic-name"
              />
            </div>

            {/* Plural */}
            <div className="flex items-center gap-2">
              <span className="min-w-[70px] text-[11px] text-text-secondary">Plural:</span>
              <input
                type="text"
                value={plural}
                onChange={(e) => handleAttributeChange('plural', e.target.value)}
                disabled={disabled}
                className="flex-1 rounded border border-border bg-bg-primary px-1.5 py-0.5 text-[11px] text-text-primary disabled:opacity-40"
                data-testid="basic-plural"
              />
            </div>

            {/* Description */}
            <div className="flex items-start gap-2">
              <span className="min-w-[70px] pt-0.5 text-[11px] text-text-secondary">
                Description:
              </span>
              <textarea
                value={description}
                onChange={(e) => handleAttributeChange('description', e.target.value)}
                disabled={disabled}
                rows={2}
                className="flex-1 resize-none rounded border border-border bg-bg-primary px-1.5 py-0.5 text-[11px] text-text-primary disabled:opacity-40"
                data-testid="basic-description"
              />
            </div>
          </div>
        </fieldset>
      )}

      {/* Active Attributes */}
      <fieldset className="rounded border border-border p-2" data-testid="active-attributes">
        <legend className="px-1 text-[10px] font-medium uppercase tracking-wider text-text-secondary">
          {t('attributes.itemAttributes')} ({activeNonBasicAttrs.length})
        </legend>
        {activeNonBasicAttrs.length === 0 ? (
          <p className="py-1 text-[11px] text-text-secondary">No attributes set.</p>
        ) : (
          <div className="flex flex-col">
            {activeNonBasicAttrs.map(([key, value]) => (
              <AttributeRow
                key={key}
                attrKey={key}
                value={value}
                def={findAttributeDef(key, allAttrs)}
                onChange={handleAttributeChange}
                onRemove={handleRemoveAttribute}
                disabled={disabled}
              />
            ))}
          </div>
        )}
      </fieldset>

      {/* Add Attribute Section */}
      <fieldset className="rounded border border-border p-2" data-testid="add-attributes">
        <legend className="px-1 text-[10px] font-medium uppercase tracking-wider text-text-secondary">
          {t('attributes.addAttributes')}
        </legend>

        {/* Search input */}
        <div className="mb-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={disabled}
            placeholder={t('labels.find') + '...'}
            className="w-full rounded border border-border bg-bg-primary px-1.5 py-0.5 text-[11px] text-text-primary placeholder:text-text-secondary/50 disabled:opacity-40"
            data-testid="attr-search"
          />
        </div>

        {/* Search results */}
        {searchTerm.trim() && (
          <div className="mb-2 max-h-[150px] overflow-y-auto" data-testid="search-results">
            {availableAttrs.length === 0 ? (
              <p className="py-1 text-[11px] text-text-secondary">No matching attributes.</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {availableAttrs.map((attr) => (
                  <button
                    key={attr.key}
                    onClick={() => handleAddAttribute(attr)}
                    disabled={disabled}
                    className="rounded border border-border bg-bg-input px-1.5 py-0.5 text-[10px] text-text-primary transition-colors hover:border-accent hover:bg-bg-tertiary disabled:opacity-40"
                    title={`${attr.key} (${attr.type})`}
                    data-testid={`add-btn-${attr.key}`}
                  >
                    + {attr.key}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category browsing (when not searching) */}
        {!searchTerm.trim() && (
          <div className="max-h-[200px] overflow-y-auto" data-testid="category-browser">
            {Object.entries(attrsByCategory).map(([cat, attrs]) => (
              <div key={cat} className="mb-1">
                <button
                  onClick={() =>
                    setExpandedCategory(expandedCategory === cat ? null : cat)
                  }
                  disabled={disabled}
                  className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[11px] font-medium text-text-primary transition-colors hover:bg-bg-tertiary disabled:opacity-40"
                  data-testid={`category-${cat}`}
                >
                  <span className="text-[10px] text-text-secondary">
                    {expandedCategory === cat ? '\u25BC' : '\u25B6'}
                  </span>
                  {cat} ({attrs.length})
                </button>
                {expandedCategory === cat && (
                  <div className="flex flex-wrap gap-1 pl-3 pt-1">
                    {attrs.map((attr) => (
                      <button
                        key={attr.key}
                        onClick={() => handleAddAttribute(attr)}
                        disabled={disabled}
                        className="rounded border border-border bg-bg-input px-1.5 py-0.5 text-[10px] text-text-primary transition-colors hover:border-accent hover:bg-bg-tertiary disabled:opacity-40"
                        title={`${attr.key} (${attr.type})`}
                        data-testid={`add-btn-${attr.key}`}
                      >
                        + {attr.key}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </fieldset>
    </div>
  )
}
