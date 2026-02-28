/**
 * Frame Durations Optimizer dialog.
 * Batch-updates frame durations for items, outfits, and effects.
 * Ported from legacy FrameDurationsOptimizerWindow.mxml + FrameDurationsOptimizer.as.
 */

import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, DialogButton, FieldGroup } from '../../components/Modal'
import { useAppStore, useEditorStore } from '../../stores'
import { ThingCategory } from '../../types/things'
import { clearThumbnailCache } from '../../hooks/use-sprite-thumbnail'
import {
  optimizeFrameDurations,
  type CategoryDurationConfig,
  type OptimizeDurationsConfig,
  type OptimizeDurationsProgress,
  type OptimizeDurationsResult
} from './optimize-frame-durations'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FrameDurationsOptimizerDialogProps {
  open: boolean
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Category duration group sub-component
// ---------------------------------------------------------------------------

interface CategoryGroupProps {
  label: string
  config: CategoryDurationConfig
  onChange: (config: CategoryDurationConfig) => void
  disabled: boolean
}

function CategoryGroup({
  label,
  config,
  onChange,
  disabled
}: CategoryGroupProps): React.JSX.Element {
  const handleEnabledChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...config, enabled: e.target.checked })
    },
    [config, onChange]
  )

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Math.max(0, Math.min(1000, Number(e.target.value) || 0))
      const newMin = value
      const newMax = Math.max(value, config.maximum)
      onChange({ ...config, minimum: newMin, maximum: newMax })
    },
    [config, onChange]
  )

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Math.max(0, Math.min(1000, Number(e.target.value) || 0))
      const newMax = value
      const newMin = Math.min(value, config.minimum)
      onChange({ ...config, minimum: newMin, maximum: newMax })
    },
    [config, onChange]
  )

  return (
    <FieldGroup label={label}>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={handleEnabledChange}
            disabled={disabled}
            className="accent-accent"
          />
          <span className="text-text-primary">Enable</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 text-xs">
            <span className="text-text-secondary w-12">Min:</span>
            <input
              type="number"
              value={config.minimum}
              onChange={handleMinChange}
              disabled={disabled || !config.enabled}
              min={0}
              max={1000}
              className="h-6 w-20 rounded border border-border bg-bg-secondary px-2 text-xs text-text-primary disabled:opacity-50"
            />
          </label>
          <label className="flex items-center gap-2 text-xs">
            <span className="text-text-secondary w-12">Max:</span>
            <input
              type="number"
              value={config.maximum}
              onChange={handleMaxChange}
              disabled={disabled || !config.enabled}
              min={0}
              max={1000}
              className="h-6 w-20 rounded border border-border bg-bg-secondary px-2 text-xs text-text-primary disabled:opacity-50"
            />
          </label>
        </div>
      </div>
    </FieldGroup>
  )
}

// ---------------------------------------------------------------------------
// Main dialog
// ---------------------------------------------------------------------------

export function FrameDurationsOptimizerDialog({
  open,
  onClose
}: FrameDurationsOptimizerDialogProps): React.JSX.Element {
  const { t } = useTranslation()
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState<OptimizeDurationsProgress | null>(null)
  const [result, setResult] = useState<OptimizeDurationsResult | null>(null)

  const [itemsConfig, setItemsConfig] = useState<CategoryDurationConfig>({
    enabled: false,
    minimum: 500,
    maximum: 500
  })
  const [outfitsConfig, setOutfitsConfig] = useState<CategoryDurationConfig>({
    enabled: false,
    minimum: 300,
    maximum: 300
  })
  const [effectsConfig, setEffectsConfig] = useState<CategoryDurationConfig>({
    enabled: false,
    minimum: 100,
    maximum: 100
  })

  const clientInfo = useAppStore((s) => s.clientInfo)
  const addLog = useAppStore((s) => s.addLog)

  // -------------------------------------------------------------------------
  // Reset on open
  // -------------------------------------------------------------------------

  const prevOpenRef = React.useRef(false)
  if (open && !prevOpenRef.current) {
    setIsRunning(false)
    setProgress(null)
    setResult(null)
    // Load defaults from settings asynchronously
    if (window.api?.settings?.load) {
      window.api.settings.load().then((settings) => {
        setItemsConfig({
          enabled: false,
          minimum: settings.itemsDuration,
          maximum: settings.itemsDuration
        })
        setOutfitsConfig({
          enabled: false,
          minimum: settings.outfitsDuration,
          maximum: settings.outfitsDuration
        })
        setEffectsConfig({
          enabled: false,
          minimum: settings.effectsDuration,
          maximum: settings.effectsDuration
        })
      })
    }
  }
  prevOpenRef.current = open

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleStart = useCallback(async () => {
    const appState = useAppStore.getState()

    if (!appState.clientInfo?.loaded) return
    if (!itemsConfig.enabled && !outfitsConfig.enabled && !effectsConfig.enabled) return

    setIsRunning(true)
    setResult(null)
    setProgress({ step: 0, totalSteps: 5, label: 'Starting optimization...' })

    try {
      const config: OptimizeDurationsConfig = {
        items: itemsConfig,
        outfits: outfitsConfig,
        effects: effectsConfig
      }

      const optimizeResult = await optimizeFrameDurations(
        {
          items: appState.things.items,
          outfits: appState.things.outfits,
          effects: appState.things.effects
        },
        config,
        setProgress
      )

      if (optimizeResult.totalChanged > 0) {
        // Clear editing data (durations changed)
        useEditorStore.getState().setEditingThingData(null)

        // Clear thumbnail cache
        clearThumbnailCache()

        // Update things
        appState.setThings(ThingCategory.ITEM, optimizeResult.newThings.items)
        appState.setThings(ThingCategory.OUTFIT, optimizeResult.newThings.outfits)
        appState.setThings(ThingCategory.EFFECT, optimizeResult.newThings.effects)

        // Mark project as changed
        appState.setProjectChanged(true)
        window.api?.menu?.updateState({ clientChanged: true })

        addLog(
          'info',
          `Frame durations optimized: ${optimizeResult.totalChanged} objects changed (items: ${optimizeResult.itemsChanged}, outfits: ${optimizeResult.outfitsChanged}, effects: ${optimizeResult.effectsChanged})`
        )
      } else {
        addLog('info', 'Frame durations optimization: no objects changed')
      }

      setResult(optimizeResult)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      addLog('error', `Frame durations optimization failed: ${message}`)
    } finally {
      setIsRunning(false)
    }
  }, [addLog, itemsConfig, outfitsConfig, effectsConfig])

  const handleClose = useCallback(() => {
    if (!isRunning) onClose()
  }, [isRunning, onClose])

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const hasAnyEnabled = itemsConfig.enabled || outfitsConfig.enabled || effectsConfig.enabled
  const progressPercent = progress ? Math.round((progress.step / progress.totalSteps) * 100) : 0

  const footer = (
    <div className="flex w-full items-center justify-between">
      <DialogButton
        label={t('labels.start')}
        onClick={handleStart}
        disabled={isRunning || !clientInfo?.loaded || !hasAnyEnabled}
        primary
      />
      <DialogButton label={t('labels.close')} onClick={handleClose} disabled={isRunning} />
    </div>
  )

  return (
    <Modal
      title={t('labels.frameDurationsOptimizer')}
      open={open}
      onClose={handleClose}
      width={400}
      footer={footer}
      closeOnBackdrop={!isRunning}
    >
      <div className="flex flex-col gap-3">
        {/* Category config groups */}
        <CategoryGroup
          label={t('labels.items')}
          config={itemsConfig}
          onChange={setItemsConfig}
          disabled={isRunning}
        />
        <CategoryGroup
          label={t('labels.outfits')}
          config={outfitsConfig}
          onChange={setOutfitsConfig}
          disabled={isRunning}
        />
        <CategoryGroup
          label={t('labels.effects')}
          config={effectsConfig}
          onChange={setEffectsConfig}
          disabled={isRunning}
        />

        {/* Results */}
        {result && (
          <FieldGroup label={t('labels.result')}>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Items changed:</span>
                <span className="font-medium text-text-primary">{result.itemsChanged}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Outfits changed:</span>
                <span className="font-medium text-text-primary">{result.outfitsChanged}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Effects changed:</span>
                <span className="font-medium text-text-primary">{result.effectsChanged}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-border pt-1 mt-1">
                <span className="text-text-secondary">Total changed:</span>
                <span className="font-medium text-text-primary">{result.totalChanged}</span>
              </div>
            </div>
          </FieldGroup>
        )}

        {/* Progress */}
        <FieldGroup label={t('labels.progress')}>
          <div className="flex flex-col gap-2">
            <div className="h-5 w-full overflow-hidden rounded border border-border bg-bg-secondary">
              <div
                className="h-full bg-accent transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs text-text-secondary">
              {progress?.label ?? (clientInfo?.loaded ? 'Ready' : 'No project loaded')}
            </span>
          </div>
        </FieldGroup>
      </div>
    </Modal>
  )
}
