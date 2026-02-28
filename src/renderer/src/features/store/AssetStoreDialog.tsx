/**
 * Asset Store browser dialog.
 * Browses and imports assets from the remote GitHub repository.
 * Ported from legacy store/AssetStore.mxml + StoreAsset.as + StoreList.as.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, DialogButton, SelectField, FieldGroup } from '../../components/Modal'
import { useAppStore } from '../../stores'
import type { ThingData } from '../../types/things'
import {
  buildSpriteSheet,
  extractFrame,
  frameToImageData
} from '../../services/sprite-render'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORE_BASE_URL = 'https://raw.githubusercontent.com/ottools/open-assets/master'

const CATEGORY_KEYS = [
  { labelKey: 'labels.items', value: 'items' },
  { labelKey: 'labels.outfits', value: 'outfits' },
  { labelKey: 'labels.effects', value: 'effects' },
  { labelKey: 'labels.missiles', value: 'missiles' }
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AssetStoreDialogProps {
  open: boolean
  onClose: () => void
}

interface SubcategoryInfo {
  name: string
  folder: string
}

interface StoreAsset {
  name: string
  author: string
  url: string
  thingData: ThingData | null
  previewUrl: string | null
  loaded: boolean
  error: string | null
}

// ---------------------------------------------------------------------------
// Preview generation
// ---------------------------------------------------------------------------

function generatePreview(data: ThingData, category: string): string | null {
  const fg = data.thing.frameGroups[0]
  if (!fg) return null

  const allSprites = data.sprites
  const getPixels = (arrayIndex: number): Uint8Array | null => {
    const spriteId = fg.spriteIndex[arrayIndex]
    if (spriteId === undefined || spriteId === 0) return null
    for (const [, sprites] of allSprites) {
      for (const sd of sprites) {
        if (sd.id === spriteId && sd.pixels) return sd.pixels
      }
    }
    return null
  }

  const sheet = buildSpriteSheet(fg, getPixels)
  const patternX = category === 'outfits' ? 2 : 0
  const frame = extractFrame(sheet, fg, { frame: 0, patternX })
  const imageData = frameToImageData(frame)
  if (!imageData) return null

  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL()
}

// ---------------------------------------------------------------------------
// Asset tile component
// ---------------------------------------------------------------------------

function AssetTile({
  asset,
  canImport,
  onImport
}: {
  asset: StoreAsset
  canImport: boolean
  onImport: (data: ThingData) => void
}): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2 rounded border border-border bg-bg-tertiary p-2 transition-colors hover:bg-bg-hover">
      {/* Preview image or loading indicator */}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded border border-border-subtle bg-bg-primary">
        {!asset.loaded ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
        ) : asset.previewUrl ? (
          <img
            src={asset.previewUrl}
            alt={asset.name}
            className="h-16 w-16 object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <div className="text-xs text-text-muted">N/A</div>
        )}
      </div>

      {/* Name + author */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-bold text-text-primary">{asset.name}</span>
        <span className="truncate text-xs text-info">{asset.author}</span>
        {asset.error && (
          <span className="truncate text-xs text-error" title={asset.error}>
            Error loading
          </span>
        )}
      </div>

      {/* Import button */}
      <button
        className="shrink-0 rounded bg-bg-tertiary px-2 py-1 text-xs text-text-primary transition-colors hover:bg-bg-hover disabled:opacity-40"
        disabled={!asset.loaded || !asset.thingData || !canImport}
        onClick={() => asset.thingData && onImport(asset.thingData)}
        title={!canImport ? 'Load a project first' : 'Import this asset'}
      >
        {t('labels.import')}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main dialog
// ---------------------------------------------------------------------------

export function AssetStoreDialog({ open, onClose }: AssetStoreDialogProps): React.JSX.Element {
  const { t } = useTranslation()
  const clientInfo = useAppStore((s) => s.clientInfo)
  const addLog = useAppStore((s) => s.addLog)

  const [selectedCategory, setSelectedCategory] = useState('items')
  const [subcategories, setSubcategories] = useState<SubcategoryInfo[]>([])
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [assets, setAssets] = useState<StoreAsset[]>([])
  const [mainCatalogXml, setMainCatalogXml] = useState<Document | null>(null)
  const [loadingCatalog, setLoadingCatalog] = useState(false)
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cancelledRef = useRef(false)

  // -------------------------------------------------------------------------
  // Reset state on dialog open
  // -------------------------------------------------------------------------

  const resetState = useCallback(() => {
    cancelledRef.current = true
    setSelectedCategory('items')
    setSubcategories([])
    setSelectedSubcategory(null)
    setAssets([])
    setMainCatalogXml(null)
    setLoadingCatalog(false)
    setLoadingAssets(false)
    setError(null)
  }, [])

  // -------------------------------------------------------------------------
  // Load main catalog
  // -------------------------------------------------------------------------

  const loadMainCatalog = useCallback(async () => {
    setLoadingCatalog(true)
    setError(null)
    try {
      const response = await fetch(`${STORE_BASE_URL}/catalog.xml`, { cache: 'no-store' })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const text = await response.text()
      const parser = new DOMParser()
      const doc = parser.parseFromString(text, 'text/xml')
      const parseError = doc.querySelector('parsererror')
      if (parseError) throw new Error('Invalid XML catalog')
      setMainCatalogXml(doc)
    } catch (err) {
      setError(`Failed to load catalog: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoadingCatalog(false)
    }
  }, [])

  // -------------------------------------------------------------------------
  // Parse subcategories from main catalog
  // -------------------------------------------------------------------------

  const parseMainCatalog = useCallback((doc: Document, category: string) => {
    const catElement = doc.querySelector(`catalog > ${category}`)
    if (!catElement) {
      setSubcategories([])
      return
    }
    const cats: SubcategoryInfo[] = []
    for (const child of Array.from(catElement.children)) {
      if (child.tagName === 'category') {
        const name = child.getAttribute('name') ?? ''
        const folder = child.getAttribute('folder') ?? ''
        if (name && folder) cats.push({ name, folder })
      }
    }
    setSubcategories(cats)
    setSelectedSubcategory(null)
    setAssets([])
  }, [])

  // -------------------------------------------------------------------------
  // Load subcategory assets
  // -------------------------------------------------------------------------

  const loadSubcategory = useCallback(
    async (subcategoryFolder: string, category: string) => {
      cancelledRef.current = true
      // Allow pending operations to see cancellation
      await new Promise((r) => setTimeout(r, 0))
      cancelledRef.current = false

      setLoadingAssets(true)
      setAssets([])
      setError(null)

      try {
        const url = `${STORE_BASE_URL}/${category}/${subcategoryFolder}/catalog.xml`
        const response = await fetch(url, { cache: 'no-store' })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const text = await response.text()
        const parser = new DOMParser()
        const doc = parser.parseFromString(text, 'text/xml')
        const parseError = doc.querySelector('parsererror')
        if (parseError) throw new Error('Invalid subcategory catalog XML')

        const assetElements = doc.querySelectorAll('catalog > asset')
        const newAssets: StoreAsset[] = []
        for (const el of Array.from(assetElements)) {
          const name = el.querySelector('name')?.textContent ?? 'Unknown'
          const author = el.querySelector('author')?.textContent ?? 'Unknown'
          const file = el.querySelector('file')?.textContent ?? ''
          if (!file) continue
          const assetUrl = `${STORE_BASE_URL}/${category}/${subcategoryFolder}/${file}`
          newAssets.push({
            name,
            author,
            url: assetUrl,
            thingData: null,
            previewUrl: null,
            loaded: false,
            error: null
          })
        }
        setAssets(newAssets)

        // Sequential loading of each asset OBD
        for (let i = 0; i < newAssets.length; i++) {
          if (cancelledRef.current) return
          await loadSingleAsset(newAssets, i, category)
        }
      } catch (err) {
        setError(
          `Failed to load subcategory: ${err instanceof Error ? err.message : String(err)}`
        )
      } finally {
        setLoadingAssets(false)
      }
    },
    []
  )

  // -------------------------------------------------------------------------
  // Load a single asset OBD
  // -------------------------------------------------------------------------

  const loadSingleAsset = useCallback(
    async (assetList: StoreAsset[], index: number, category: string) => {
      const asset = assetList[index]
      try {
        const response = await fetch(asset.url, { cache: 'no-store', redirect: 'follow' })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const buffer = await response.arrayBuffer()

        const { workerService } = await import('../../workers/worker-service')
        const thingData = await workerService.decodeObd(new Uint8Array(buffer).buffer)

        const previewUrl = generatePreview(thingData, category)

        setAssets((prev) =>
          prev.map((a, i) =>
            i === index ? { ...a, thingData, previewUrl, loaded: true } : a
          )
        )
      } catch (err) {
        setAssets((prev) =>
          prev.map((a, i) =>
            i === index
              ? {
                  ...a,
                  loaded: true,
                  error: err instanceof Error ? err.message : String(err)
                }
              : a
          )
        )
      }
    },
    []
  )

  // -------------------------------------------------------------------------
  // Import asset to project
  // -------------------------------------------------------------------------

  const handleImport = useCallback(
    (thingData: ThingData) => {
      addLog('info', `Imported asset from Asset Store: ${thingData.thing.frameGroups.length} frame group(s)`)
      // TODO: Wire to ImportThingsCommand when available
    },
    [addLog]
  )

  // -------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------

  // On open: reset and load main catalog
  useEffect(() => {
    if (!open) return
    resetState()
    // Delay to ensure cancelledRef is reset
    const timer = setTimeout(() => {
      cancelledRef.current = false
      loadMainCatalog()
    }, 0)
    return () => clearTimeout(timer)
  }, [open, resetState, loadMainCatalog])

  // Parse subcategories when catalog or category changes
  useEffect(() => {
    if (!mainCatalogXml) return
    parseMainCatalog(mainCatalogXml, selectedCategory)
  }, [mainCatalogXml, selectedCategory, parseMainCatalog])

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleCategoryChange = useCallback((value: string) => {
    setSelectedCategory(value)
  }, [])

  const handleSubcategoryChange = useCallback(
    (value: string) => {
      if (!value) return
      setSelectedSubcategory(value)
      loadSubcategory(value, selectedCategory)
    },
    [selectedCategory, loadSubcategory]
  )

  // Cancel loading on close
  const handleClose = useCallback(() => {
    cancelledRef.current = true
    onClose()
  }, [onClose])

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const canImport = clientInfo?.loaded === true
  const loadedCount = assets.filter((a) => a.loaded).length
  const totalCount = assets.length

  const footer = (
    <div className="flex items-center justify-between">
      <span className="text-xs text-text-muted">
        {loadingAssets
          ? `Loading assets... (${loadedCount}/${totalCount})`
          : totalCount > 0
            ? `${totalCount} asset(s)`
            : ''}
      </span>
      <DialogButton label={t('labels.close')} onClick={handleClose} />
    </div>
  )

  return (
    <Modal title="Asset Store" open={open} onClose={handleClose} width={800} footer={footer}>
      <div className="flex flex-col gap-3">
        {/* Category and subcategory selectors */}
        <div className="flex gap-3">
          <div className="flex-1">
            <SelectField
              label={t('labels.category')}
              value={selectedCategory}
              onChange={handleCategoryChange}
              options={CATEGORY_KEYS.map((c) => ({ value: c.value, label: t(c.labelKey) }))}
            />
          </div>
          <div className="flex-1">
            <SelectField
              label="Subcategory"
              value={selectedSubcategory ?? ''}
              onChange={handleSubcategoryChange}
              disabled={loadingCatalog || subcategories.length === 0}
              options={[
                {
                  value: '',
                  label: loadingCatalog ? 'Loading...' : 'Select subcategory'
                },
                ...subcategories.map((s) => ({ value: s.folder, label: s.name }))
              ]}
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded border border-red-600 bg-red-900/30 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Assets grid */}
        <FieldGroup label="Assets">
          <div className="max-h-[420px] min-h-[200px] overflow-y-auto">
            {loadingCatalog ? (
              <div className="flex h-[200px] items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-text-muted border-t-accent" />
                  <span className="text-xs text-text-muted">Loading catalog...</span>
                </div>
              </div>
            ) : assets.length === 0 && !loadingAssets ? (
              <div className="flex h-[200px] items-center justify-center text-sm text-text-muted">
                {selectedSubcategory ? 'No assets found' : 'Select a subcategory to browse assets'}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {assets.map((asset, i) => (
                  <AssetTile
                    key={`${asset.url}-${i}`}
                    asset={asset}
                    canImport={canImport}
                    onImport={handleImport}
                  />
                ))}
              </div>
            )}
          </div>
        </FieldGroup>
      </div>
    </Modal>
  )
}
