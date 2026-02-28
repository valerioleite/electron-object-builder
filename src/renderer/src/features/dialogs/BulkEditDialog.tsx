/**
 * Bulk edit dialog for batch-modifying properties of multiple objects.
 * Ported from legacy BulkEditWindow.mxml.
 *
 * Two tabs:
 * - Properties: boolean property toggles, animation settings, animation duration
 * - Attributes: item attributes editor in bulk mode (placeholder for Step 9.1)
 *
 * Category-aware: shows different property groups depending on
 * Item / Outfit / Effect / Missile.
 */

import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Modal,
  DialogButton,
  FieldGroup,
  CheckboxField,
  SelectField,
  NumberInputField
} from '../../components/Modal'
import { ThingCategory } from '../../types/things'
import { AttributesEditor } from '../editor/AttributesEditor'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BulkPropertyChange {
  property: string
  value?: boolean
  minDuration?: number
  maxDuration?: number
  frameGroupTarget?: number
  animationMode?: number
  frameStrategy?: number
}

export interface BulkEditResult {
  properties: BulkPropertyChange[]
}

export interface BulkEditDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (result: BulkEditResult) => void
  selectedIds: number[]
  category: ThingCategory
  otbLoaded?: boolean
}

// ---------------------------------------------------------------------------
// Property definitions per category
// ---------------------------------------------------------------------------

interface PropertyDef {
  key: string
  label: string
}

const GROUND_PROPERTIES: PropertyDef[] = [
  { key: 'isGround', label: 'Ground' },
  { key: 'isGroundBorder', label: 'Ground Border' },
  { key: 'isOnBottom', label: 'On Bottom' },
  { key: 'isOnTop', label: 'On Top' },
  { key: 'isFullGround', label: 'Full Ground' }
]

const ITEM_PROPERTIES: PropertyDef[] = [
  { key: 'isContainer', label: 'Container' },
  { key: 'stackable', label: 'Stackable' },
  { key: 'forceUse', label: 'Force Use' },
  { key: 'multiUse', label: 'Multi Use' },
  { key: 'isFluidContainer', label: 'Fluid Container' },
  { key: 'isFluid', label: 'Fluid' },
  { key: 'isUnpassable', label: 'Unpassable' },
  { key: 'isUnmoveable', label: 'Unmovable' },
  { key: 'blockMissile', label: 'Block Missile' },
  { key: 'blockPathfind', label: 'Block Pathfinder' },
  { key: 'pickupable', label: 'Pickupable' },
  { key: 'hangable', label: 'Hangable' },
  { key: 'isVertical', label: 'Vertical Wall' },
  { key: 'isHorizontal', label: 'Horizontal Wall' },
  { key: 'rotatable', label: 'Rotatable' },
  { key: 'dontHide', label: "Don't Hide" },
  { key: 'isTranslucent', label: 'Translucent' },
  { key: 'isLyingObject', label: 'Lying Object' },
  { key: 'ignoreLook', label: 'Ignore Look' },
  { key: 'hasCharges', label: 'Has Charges' },
  { key: 'noMoveAnimation', label: 'No Move Animation' },
  { key: 'usable', label: 'Usable' },
  { key: 'animateAlways', label: 'Animate Always' },
  { key: 'writable', label: 'Writable' },
  { key: 'writableOnce', label: 'Writable Once' },
  { key: 'floorChange', label: 'Floor Change' },
  { key: 'wrappable', label: 'Wrappable' },
  { key: 'unwrappable', label: 'Unwrappable' }
]

const OUTFIT_PROPERTIES: PropertyDef[] = [{ key: 'animateAlways', label: 'Animate Always' }]

const EFFECT_PROPERTIES: PropertyDef[] = [{ key: 'topEffect', label: 'Top Effect' }]

// ---------------------------------------------------------------------------
// Animation mode / frame strategy options
// ---------------------------------------------------------------------------

// Animation mode / frame strategy / frame group target options are built inside the
// component via useMemo so they can use translated labels from t().

// ---------------------------------------------------------------------------
// BulkPropertyRow - reusable row with "Change" checkbox + value checkbox
// ---------------------------------------------------------------------------

interface BulkPropertyRowProps {
  label: string
  isChanged: boolean
  value: boolean
  onChangedToggle: (checked: boolean) => void
  onValueToggle: (checked: boolean) => void
}

function BulkPropertyRow({
  label,
  isChanged,
  value,
  onChangedToggle,
  onValueToggle
}: BulkPropertyRowProps): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2 py-[1px]">
      <label className="flex cursor-pointer items-center gap-1 text-[11px] text-text-secondary">
        <input
          type="checkbox"
          checked={isChanged}
          onChange={(e) => onChangedToggle(e.target.checked)}
          className="accent-accent h-3 w-3"
        />
        {t('labels.change')}
      </label>
      <label
        className={`flex cursor-pointer items-center gap-1 text-[11px] ${
          isChanged ? 'text-text-primary' : 'text-text-secondary/50'
        }`}
      >
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onValueToggle(e.target.checked)}
          disabled={!isChanged}
          className="accent-accent h-3 w-3"
        />
        {label}
      </label>
    </div>
  )
}

// ---------------------------------------------------------------------------
// BulkEditDialog
// ---------------------------------------------------------------------------

export function BulkEditDialog({
  open,
  onClose,
  onConfirm,
  selectedIds,
  category,
  otbLoaded = false
}: BulkEditDialogProps): React.JSX.Element {
  const { t } = useTranslation()
  // Tab state
  const [activeTab, setActiveTab] = useState<'properties' | 'attributes'>('properties')

  // Property toggle states: Record<propertyKey, { changed: boolean, value: boolean }>
  const [propertyStates, setPropertyStates] = useState<
    Record<string, { changed: boolean; value: boolean }>
  >({})

  // Animation settings
  const [changeAnimationMode, setChangeAnimationMode] = useState(false)
  const [animationMode, setAnimationMode] = useState(0)
  const [changeFrameStrategy, setChangeFrameStrategy] = useState(false)
  const [frameStrategy, setFrameStrategy] = useState(0)

  // Animation duration
  const [changeDuration, setChangeDuration] = useState(false)
  const [minDuration, setMinDuration] = useState(100)
  const [maxDuration, setMaxDuration] = useState(100)
  const [frameGroupTarget, setFrameGroupTarget] = useState(-1)

  // Attributes tab state
  const [clearAttributes, setClearAttributes] = useState(true)
  const [preserveNamePlural, setPreserveNamePlural] = useState(true)
  const [bulkAttributes, setBulkAttributes] = useState<Record<string, string> | null>(null)

  const showAnimationSettings = category !== ThingCategory.MISSILE
  const showAttributesTab = category === ThingCategory.ITEM && otbLoaded

  const animationModeOptions = useMemo(
    () => [
      { value: '0', label: t('labels.asynchronous') },
      { value: '1', label: t('labels.synchronous') }
    ],
    [t]
  )

  const frameStrategyOptions = useMemo(
    () => [
      { value: '0', label: t('labels.loop') },
      { value: '1', label: t('labels.pingPong') }
    ],
    [t]
  )

  const frameGroupTargetOptions = useMemo(
    () => [
      { value: '-1', label: 'All Groups' },
      { value: '0', label: 'Idle' },
      { value: '1', label: 'Walking' }
    ],
    []
  )

  // Reset state on open (render-time state adjustment)
  const [prevOpen, setPrevOpen] = useState(false)
  if (open && !prevOpen) {
    setActiveTab('properties')
    setPropertyStates({})
    setChangeAnimationMode(false)
    setAnimationMode(0)
    setChangeFrameStrategy(false)
    setFrameStrategy(0)
    setChangeDuration(false)
    setMinDuration(100)
    setMaxDuration(100)
    setFrameGroupTarget(-1)
    setClearAttributes(true)
    setPreserveNamePlural(true)
    setBulkAttributes(null)
  }
  if (open !== prevOpen) {
    setPrevOpen(open)
  }

  // Property state helpers
  const getPropertyState = useCallback(
    (key: string) => propertyStates[key] ?? { changed: false, value: false },
    [propertyStates]
  )

  const setPropertyChanged = useCallback((key: string, changed: boolean) => {
    setPropertyStates((prev) => ({
      ...prev,
      [key]: { changed, value: prev[key]?.value ?? false }
    }))
  }, [])

  const setPropertyValue = useCallback((key: string, value: boolean) => {
    setPropertyStates((prev) => ({
      ...prev,
      [key]: { changed: prev[key]?.changed ?? false, value }
    }))
  }, [])

  // Check if there are any changes to apply
  const hasChanges = useMemo(() => {
    const hasPropertyChanges = Object.values(propertyStates).some((s) => s.changed)
    return hasPropertyChanges || changeAnimationMode || changeFrameStrategy || changeDuration
  }, [propertyStates, changeAnimationMode, changeFrameStrategy, changeDuration])

  // Collect changed properties and confirm
  const handleConfirm = useCallback(() => {
    const changes: BulkPropertyChange[] = []

    // Boolean property changes
    for (const [key, state] of Object.entries(propertyStates)) {
      if (state.changed) {
        changes.push({ property: key, value: state.value })
      }
    }

    // Animation duration
    if (changeDuration) {
      changes.push({
        property: '_bulkDuration',
        minDuration,
        maxDuration,
        frameGroupTarget: category === ThingCategory.OUTFIT ? frameGroupTarget : -1
      })
    }

    // Animation mode
    if (changeAnimationMode) {
      changes.push({
        property: '_bulkAnimationMode',
        animationMode
      })
    }

    // Frame strategy
    if (changeFrameStrategy) {
      changes.push({
        property: '_bulkFrameStrategy',
        frameStrategy
      })
    }

    onConfirm({ properties: changes })
    onClose()
  }, [
    propertyStates,
    changeDuration,
    minDuration,
    maxDuration,
    frameGroupTarget,
    changeAnimationMode,
    animationMode,
    changeFrameStrategy,
    frameStrategy,
    category,
    onConfirm,
    onClose
  ])

  return (
    <Modal
      title={t('labels.bulkPropertyEditor')}
      open={open}
      onClose={onClose}
      width={900}
      footer={
        <>
          <DialogButton
            label={t('labels.applyChanges')}
            onClick={handleConfirm}
            primary
            disabled={!hasChanges}
          />
          <DialogButton label={t('labels.cancel')} onClick={onClose} />
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold text-text-primary">
            {t('labels.itemsSelected', { 0: selectedIds.length })}
          </p>
          <p className="text-[11px] text-text-secondary">
            Check &quot;{t('labels.change')}&quot; next to properties you want to modify, then set
            the desired value.
          </p>
        </div>

        <div className="border-t border-border" />

        {/* Tab bar */}
        <div className="flex gap-0 border-b border-border">
          <button
            className={`px-4 py-1.5 text-xs ${
              activeTab === 'properties'
                ? 'border-b-2 border-accent text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => setActiveTab('properties')}
          >
            Properties
          </button>
          {showAttributesTab && (
            <button
              className={`px-4 py-1.5 text-xs ${
                activeTab === 'attributes'
                  ? 'border-b-2 border-accent text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              onClick={() => setActiveTab('attributes')}
            >
              Attributes
            </button>
          )}
        </div>

        {/* Tab content */}
        <div className="max-h-[460px] overflow-y-auto pr-1">
          {activeTab === 'properties' && (
            <div className="flex flex-col gap-3">
              {/* Category-specific property groups */}
              {category === ThingCategory.ITEM && (
                <>
                  <FieldGroup label={t('labels.groundProperties')}>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-0">
                      {GROUND_PROPERTIES.map((prop) => {
                        const state = getPropertyState(prop.key)
                        return (
                          <BulkPropertyRow
                            key={prop.key}
                            label={prop.label}
                            isChanged={state.changed}
                            value={state.value}
                            onChangedToggle={(c) => setPropertyChanged(prop.key, c)}
                            onValueToggle={(v) => setPropertyValue(prop.key, v)}
                          />
                        )
                      })}
                    </div>
                  </FieldGroup>

                  <FieldGroup label={t('labels.othersProperties')}>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-0">
                      {ITEM_PROPERTIES.map((prop) => {
                        const state = getPropertyState(prop.key)
                        return (
                          <BulkPropertyRow
                            key={prop.key}
                            label={prop.label}
                            isChanged={state.changed}
                            value={state.value}
                            onChangedToggle={(c) => setPropertyChanged(prop.key, c)}
                            onValueToggle={(v) => setPropertyValue(prop.key, v)}
                          />
                        )
                      })}
                    </div>
                  </FieldGroup>
                </>
              )}

              {category === ThingCategory.OUTFIT && (
                <FieldGroup label="Properties">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-0">
                    {OUTFIT_PROPERTIES.map((prop) => {
                      const state = getPropertyState(prop.key)
                      return (
                        <BulkPropertyRow
                          key={prop.key}
                          label={prop.label}
                          isChanged={state.changed}
                          value={state.value}
                          onChangedToggle={(c) => setPropertyChanged(prop.key, c)}
                          onValueToggle={(v) => setPropertyValue(prop.key, v)}
                        />
                      )
                    })}
                  </div>
                </FieldGroup>
              )}

              {category === ThingCategory.EFFECT && (
                <FieldGroup label="Properties">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-0">
                    {EFFECT_PROPERTIES.map((prop) => {
                      const state = getPropertyState(prop.key)
                      return (
                        <BulkPropertyRow
                          key={prop.key}
                          label={prop.label}
                          isChanged={state.changed}
                          value={state.value}
                          onChangedToggle={(c) => setPropertyChanged(prop.key, c)}
                          onValueToggle={(v) => setPropertyValue(prop.key, v)}
                        />
                      )
                    })}
                  </div>
                </FieldGroup>
              )}

              {category === ThingCategory.MISSILE && (
                <FieldGroup label="Properties">
                  <p className="text-xs text-text-secondary">{t('labels.noPropertiesAvailable')}</p>
                </FieldGroup>
              )}

              {/* Animation Settings (excludes missiles) */}
              {showAnimationSettings && (
                <>
                  <FieldGroup label={t('labels.animationSettings')}>
                    <div className="flex flex-col gap-2">
                      {/* Animation Mode */}
                      <div className="flex items-center gap-3">
                        <label className="flex cursor-pointer items-center gap-1 text-[11px] text-text-secondary">
                          <input
                            type="checkbox"
                            checked={changeAnimationMode}
                            onChange={(e) => setChangeAnimationMode(e.target.checked)}
                            className="accent-accent h-3 w-3"
                          />
                          {t('labels.change')}
                        </label>
                        <span className="w-[130px] text-xs text-text-primary">
                          {t('labels.animationMode')}:
                        </span>
                        <SelectField
                          label=""
                          value={String(animationMode)}
                          onChange={(v) => setAnimationMode(Number(v))}
                          options={animationModeOptions}
                          disabled={!changeAnimationMode}
                        />
                      </div>

                      {/* Frame Strategy */}
                      <div className="flex items-center gap-3">
                        <label className="flex cursor-pointer items-center gap-1 text-[11px] text-text-secondary">
                          <input
                            type="checkbox"
                            checked={changeFrameStrategy}
                            onChange={(e) => setChangeFrameStrategy(e.target.checked)}
                            className="accent-accent h-3 w-3"
                          />
                          {t('labels.change')}
                        </label>
                        <span className="w-[130px] text-xs text-text-primary">
                          {t('labels.frameStrategy')}:
                        </span>
                        <SelectField
                          label=""
                          value={String(frameStrategy)}
                          onChange={(v) => setFrameStrategy(Number(v))}
                          options={frameStrategyOptions}
                          disabled={!changeFrameStrategy}
                        />
                      </div>
                    </div>
                  </FieldGroup>

                  {/* Animation Duration */}
                  <FieldGroup label={t('labels.animationDuration')}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <label className="flex cursor-pointer items-center gap-1 text-[11px] text-text-secondary">
                          <input
                            type="checkbox"
                            checked={changeDuration}
                            onChange={(e) => setChangeDuration(e.target.checked)}
                            className="accent-accent h-3 w-3"
                          />
                          {t('labels.change')}
                        </label>
                        <span className="text-xs text-text-primary">
                          {t('labels.setForAllFrames')}
                        </span>
                        {category === ThingCategory.OUTFIT && (
                          <SelectField
                            label=""
                            value={String(frameGroupTarget)}
                            onChange={(v) => setFrameGroupTarget(Number(v))}
                            options={frameGroupTargetOptions}
                            disabled={!changeDuration}
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-3 pl-5">
                        <NumberInputField
                          label={`${t('labels.minimumDuration')}:`}
                          value={minDuration}
                          onChange={setMinDuration}
                          min={0}
                          max={10000}
                          step={10}
                          disabled={!changeDuration}
                        />
                        <span className="text-xs text-text-secondary">ms</span>
                      </div>

                      <div className="flex items-center gap-3 pl-5">
                        <NumberInputField
                          label={`${t('labels.maximumDuration')}:`}
                          value={maxDuration}
                          onChange={setMaxDuration}
                          min={0}
                          max={10000}
                          step={10}
                          disabled={!changeDuration}
                        />
                        <span className="text-xs text-text-secondary">ms</span>
                      </div>
                    </div>
                  </FieldGroup>
                </>
              )}
            </div>
          )}

          {activeTab === 'attributes' && showAttributesTab && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <CheckboxField
                  label="Clear existing attributes"
                  checked={clearAttributes}
                  onChange={setClearAttributes}
                />
                {clearAttributes && (
                  <CheckboxField
                    label="Preserve Name and Plural"
                    checked={preserveNamePlural}
                    onChange={setPreserveNamePlural}
                  />
                )}
              </div>

              <FieldGroup label="Attributes to Apply">
                <AttributesEditor
                  xmlAttributes={bulkAttributes}
                  onChange={setBulkAttributes}
                  bulkMode
                />
              </FieldGroup>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
