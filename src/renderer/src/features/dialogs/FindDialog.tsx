/**
 * Find/search dialog for browsing and filtering things and sprites.
 * Ported from legacy FindWindow.mxml.
 *
 * Two tabs: Things (search by category, name, properties, patterns)
 * and Sprites (search by unused/empty state).
 * Results displayed in a scrollable list with navigation.
 */

import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Modal,
  DialogButton,
  FieldGroup,
  SelectField,
  CheckboxField,
  NumberInputField,
  TextInputField
} from '../../components/Modal'
import { ThingCategory } from '../../types/things'
import type { ThingType } from '../../types/things'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FindThingFilters {
  category: ThingCategory
  name: string
  noName: boolean
  // Patterns
  width: number
  height: number
  exactSize: number
  layers: number
  patternX: number
  patternY: number
  patternZ: number
  frames: number
  frameGroups: number
  // Properties (boolean flags)
  properties: Record<string, boolean>
}

export interface FindSpriteFilters {
  unusedSprites: boolean
  emptySprites: boolean
}

export type FindThingResult = ThingType[]
export type FindSpriteResult = number[]

export interface FindDialogProps {
  open: boolean
  onClose: () => void
  onFindThings?: (filters: FindThingFilters) => void
  onFindSprites?: (filters: FindSpriteFilters) => void
  onSelectThing?: (id: number, category: ThingCategory) => void
  onSelectSprite?: (id: number) => void
  thingResults?: ThingType[]
  spriteResults?: number[]
  isSearching?: boolean
}

// ---------------------------------------------------------------------------
// Property definitions for the filter checkboxes
// ---------------------------------------------------------------------------

interface PropertyDef {
  key: string
  label: string
}

const THING_PROPERTIES: PropertyDef[] = [
  { key: 'isGround', label: 'Ground' },
  { key: 'isGroundBorder', label: 'Ground Border' },
  { key: 'isOnBottom', label: 'On Bottom' },
  { key: 'isOnTop', label: 'On Top' },
  { key: 'isContainer', label: 'Container' },
  { key: 'stackable', label: 'Stackable' },
  { key: 'forceUse', label: 'Force Use' },
  { key: 'multiUse', label: 'Multi Use' },
  { key: 'hasCharges', label: 'Has Charges' },
  { key: 'writable', label: 'Writable' },
  { key: 'writableOnce', label: 'Writable Once' },
  { key: 'isFluidContainer', label: 'Fluid Container' },
  { key: 'isFluid', label: 'Fluid' },
  { key: 'isUnpassable', label: 'Unpassable' },
  { key: 'isUnmoveable', label: 'Unmoveable' },
  { key: 'blockMissile', label: 'Block Missile' },
  { key: 'blockPathfind', label: 'Block Pathfind' },
  { key: 'noMoveAnimation', label: 'No Move Animation' },
  { key: 'pickupable', label: 'Pickupable' },
  { key: 'hangable', label: 'Hangable' },
  { key: 'isVertical', label: 'Vertical' },
  { key: 'isHorizontal', label: 'Horizontal' },
  { key: 'rotatable', label: 'Rotatable' },
  { key: 'hasLight', label: 'Has Light' },
  { key: 'dontHide', label: "Don't Hide" },
  { key: 'isTranslucent', label: 'Translucent' },
  { key: 'hasOffset', label: 'Has Offset' },
  { key: 'hasElevation', label: 'Has Elevation' },
  { key: 'isLyingObject', label: 'Lying Object' },
  { key: 'animateAlways', label: 'Animate Always' },
  { key: 'miniMap', label: 'Minimap' },
  { key: 'isLensHelp', label: 'Lens Help' },
  { key: 'isFullGround', label: 'Full Ground' },
  { key: 'ignoreLook', label: 'Ignore Look' },
  { key: 'cloth', label: 'Cloth' },
  { key: 'isMarketItem', label: 'Market Item' },
  { key: 'hasDefaultAction', label: 'Default Action' },
  { key: 'usable', label: 'Usable' },
  { key: 'wrappable', label: 'Wrappable' },
  { key: 'unwrappable', label: 'Unwrappable' },
  { key: 'topEffect', label: 'Top Effect' },
  { key: 'floorChange', label: 'Floor Change' }
]

const CATEGORY_OPTIONS = [
  { value: ThingCategory.ITEM, label: 'Items' },
  { value: ThingCategory.OUTFIT, label: 'Outfits' },
  { value: ThingCategory.EFFECT, label: 'Effects' },
  { value: ThingCategory.MISSILE, label: 'Missiles' }
]

// ---------------------------------------------------------------------------
// Default filter factories
// ---------------------------------------------------------------------------

function createDefaultThingFilters(): FindThingFilters {
  const properties: Record<string, boolean> = {}
  for (const prop of THING_PROPERTIES) {
    properties[prop.key] = false
  }
  return {
    category: ThingCategory.ITEM,
    name: '',
    noName: false,
    width: 0,
    height: 0,
    exactSize: 0,
    layers: 0,
    patternX: 0,
    patternY: 0,
    patternZ: 0,
    frames: 0,
    frameGroups: 0,
    properties
  }
}

function createDefaultSpriteFilters(): FindSpriteFilters {
  return {
    unusedSprites: false,
    emptySprites: false
  }
}

// ---------------------------------------------------------------------------
// FindDialog
// ---------------------------------------------------------------------------

type FindTab = 'things' | 'sprites'

export function FindDialog({
  open,
  onClose,
  onFindThings,
  onFindSprites,
  onSelectThing,
  onSelectSprite,
  thingResults = [],
  spriteResults = [],
  isSearching = false
}: FindDialogProps): React.JSX.Element {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<FindTab>('things')
  const [thingFilters, setThingFilters] = useState<FindThingFilters>(createDefaultThingFilters)
  const [spriteFilters, setSpriteFilters] = useState<FindSpriteFilters>(createDefaultSpriteFilters)
  const [selectedResultIndex, setSelectedResultIndex] = useState<number>(-1)

  const handleFind = useCallback(() => {
    setSelectedResultIndex(-1)
    if (activeTab === 'things') {
      onFindThings?.(thingFilters)
    } else {
      onFindSprites?.(spriteFilters)
    }
  }, [activeTab, thingFilters, spriteFilters, onFindThings, onFindSprites])

  const handleSelect = useCallback(() => {
    if (
      activeTab === 'things' &&
      selectedResultIndex >= 0 &&
      selectedResultIndex < thingResults.length
    ) {
      const thing = thingResults[selectedResultIndex]
      onSelectThing?.(thing.id, thing.category)
    } else if (
      activeTab === 'sprites' &&
      selectedResultIndex >= 0 &&
      selectedResultIndex < spriteResults.length
    ) {
      onSelectSprite?.(spriteResults[selectedResultIndex])
    }
  }, [activeTab, selectedResultIndex, thingResults, spriteResults, onSelectThing, onSelectSprite])

  const updateThingFilter = useCallback(
    <K extends keyof FindThingFilters>(key: K, value: FindThingFilters[K]) => {
      setThingFilters((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const toggleProperty = useCallback((key: string) => {
    setThingFilters((prev) => ({
      ...prev,
      properties: { ...prev.properties, [key]: !prev.properties[key] }
    }))
  }, [])

  const handleReset = useCallback(() => {
    if (activeTab === 'things') {
      setThingFilters(createDefaultThingFilters())
    } else {
      setSpriteFilters(createDefaultSpriteFilters())
    }
    setSelectedResultIndex(-1)
  }, [activeTab])

  // Split properties into two columns
  const [leftProps, rightProps] = useMemo(() => {
    const mid = Math.ceil(THING_PROPERTIES.length / 2)
    return [THING_PROPERTIES.slice(0, mid), THING_PROPERTIES.slice(mid)]
  }, [])

  const hasResults = activeTab === 'things' ? thingResults.length > 0 : spriteResults.length > 0
  const resultCount = activeTab === 'things' ? thingResults.length : spriteResults.length
  const canSelect = selectedResultIndex >= 0

  return (
    <Modal
      title={t('labels.find')}
      open={open}
      onClose={onClose}
      width={720}
      footer={
        <>
          <DialogButton label="Reset" onClick={handleReset} />
          <DialogButton
            label={t('labels.find')}
            onClick={handleFind}
            primary
            disabled={isSearching}
          />
          <DialogButton
            label="Select"
            onClick={handleSelect}
            disabled={!canSelect || isSearching}
          />
          <DialogButton label={t('labels.close')} onClick={onClose} />
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {/* Tab bar */}
        <div className="flex border-b border-border">
          <button
            className={`px-4 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'things'
                ? 'border-b-2 border-accent text-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => {
              setActiveTab('things')
              setSelectedResultIndex(-1)
            }}
          >
            {t('labels.things')}
          </button>
          <button
            className={`px-4 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'sprites'
                ? 'border-b-2 border-accent text-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => {
              setActiveTab('sprites')
              setSelectedResultIndex(-1)
            }}
          >
            {t('labels.sprites')}
          </button>
        </div>

        {/* Things tab content */}
        {activeTab === 'things' && (
          <div className="flex flex-col gap-3">
            {/* Category + Name */}
            <div className="flex gap-3">
              <div className="flex-1">
                <SelectField
                  label="Category"
                  value={thingFilters.category}
                  onChange={(v) => updateThingFilter('category', v as ThingCategory)}
                  options={CATEGORY_OPTIONS}
                />
              </div>
              <div className="flex-1">
                <TextInputField
                  label={t('labels.name')}
                  value={thingFilters.name}
                  onChange={(v) => updateThingFilter('name', v)}
                  placeholder="Search by name..."
                />
              </div>
            </div>
            <CheckboxField
              label="Find objects without name"
              checked={thingFilters.noName}
              onChange={(v) => updateThingFilter('noName', v)}
            />

            {/* Patterns */}
            <FieldGroup label="Patterns">
              <div className="grid grid-cols-4 gap-2">
                <NumberInputField
                  label="Width"
                  value={thingFilters.width}
                  onChange={(v) => updateThingFilter('width', v)}
                  min={0}
                  max={255}
                />
                <NumberInputField
                  label="Height"
                  value={thingFilters.height}
                  onChange={(v) => updateThingFilter('height', v)}
                  min={0}
                  max={255}
                />
                <NumberInputField
                  label="Exact Size"
                  value={thingFilters.exactSize}
                  onChange={(v) => updateThingFilter('exactSize', v)}
                  min={0}
                  max={255}
                />
                <NumberInputField
                  label="Layers"
                  value={thingFilters.layers}
                  onChange={(v) => updateThingFilter('layers', v)}
                  min={0}
                  max={255}
                />
                <NumberInputField
                  label="Pattern X"
                  value={thingFilters.patternX}
                  onChange={(v) => updateThingFilter('patternX', v)}
                  min={0}
                  max={255}
                />
                <NumberInputField
                  label="Pattern Y"
                  value={thingFilters.patternY}
                  onChange={(v) => updateThingFilter('patternY', v)}
                  min={0}
                  max={255}
                />
                <NumberInputField
                  label="Pattern Z"
                  value={thingFilters.patternZ}
                  onChange={(v) => updateThingFilter('patternZ', v)}
                  min={0}
                  max={255}
                />
                <NumberInputField
                  label="Frames"
                  value={thingFilters.frames}
                  onChange={(v) => updateThingFilter('frames', v)}
                  min={0}
                  max={255}
                />
                <NumberInputField
                  label="Groups"
                  value={thingFilters.frameGroups}
                  onChange={(v) => updateThingFilter('frameGroups', v)}
                  min={0}
                  max={255}
                />
              </div>
            </FieldGroup>

            {/* Properties */}
            <FieldGroup label="Properties">
              <div className="flex gap-4">
                <div className="flex flex-1 flex-col gap-1">
                  {leftProps.map((prop) => (
                    <CheckboxField
                      key={prop.key}
                      label={prop.label}
                      checked={thingFilters.properties[prop.key] ?? false}
                      onChange={() => toggleProperty(prop.key)}
                    />
                  ))}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  {rightProps.map((prop) => (
                    <CheckboxField
                      key={prop.key}
                      label={prop.label}
                      checked={thingFilters.properties[prop.key] ?? false}
                      onChange={() => toggleProperty(prop.key)}
                    />
                  ))}
                </div>
              </div>
            </FieldGroup>
          </div>
        )}

        {/* Sprites tab content */}
        {activeTab === 'sprites' && (
          <div className="flex flex-col gap-3">
            <FieldGroup label="Filters">
              <div className="flex flex-col gap-2">
                <CheckboxField
                  label="Find unused sprites"
                  checked={spriteFilters.unusedSprites}
                  onChange={(v) => setSpriteFilters((prev) => ({ ...prev, unusedSprites: v }))}
                />
                <CheckboxField
                  label="Find empty sprites"
                  checked={spriteFilters.emptySprites}
                  onChange={(v) => setSpriteFilters((prev) => ({ ...prev, emptySprites: v }))}
                />
              </div>
            </FieldGroup>
          </div>
        )}

        {/* Results */}
        <FieldGroup label={`${t('labels.result')} (${resultCount} ${t('labels.found')})`}>
          <div className="max-h-[200px] min-h-[120px] overflow-y-auto rounded border border-border bg-bg-secondary">
            {!hasResults ? (
              <p className="p-3 text-center text-xs text-text-secondary">
                {isSearching ? 'Searching...' : 'No results. Click Find to search.'}
              </p>
            ) : activeTab === 'things' ? (
              thingResults.map((thing, i) => (
                <div
                  key={`${thing.category}-${thing.id}`}
                  className={`cursor-pointer px-3 py-1.5 text-xs transition-colors ${
                    i === selectedResultIndex
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-bg-tertiary'
                  }`}
                  onClick={() => setSelectedResultIndex(i)}
                  onDoubleClick={() => {
                    onSelectThing?.(thing.id, thing.category)
                  }}
                >
                  <span className="font-medium">#{thing.id}</span>
                  {(thing.marketName || thing.name) && (
                    <span className="ml-2">{thing.marketName || thing.name}</span>
                  )}
                </div>
              ))
            ) : (
              spriteResults.map((spriteId, i) => (
                <div
                  key={spriteId}
                  className={`cursor-pointer px-3 py-1.5 text-xs transition-colors ${
                    i === selectedResultIndex
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-bg-tertiary'
                  }`}
                  onClick={() => setSelectedResultIndex(i)}
                  onDoubleClick={() => {
                    onSelectSprite?.(spriteId)
                  }}
                >
                  Sprite #{spriteId}
                </div>
              ))
            )}
          </div>
        </FieldGroup>
      </div>
    </Modal>
  )
}
