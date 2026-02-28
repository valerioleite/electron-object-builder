/**
 * Sprites Optimizer dialog.
 * Detects and removes empty, duplicate, and unused sprites with reindexing.
 * Ported from legacy SpritesOptimizerWindow.mxml + SpritesOptimizer.as.
 */

import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, DialogButton, FieldGroup } from '../../components/Modal'
import { useAppStore, useEditorStore, useSpriteStore } from '../../stores'
import { ThingCategory } from '../../types/things'
import { clearThumbnailCache } from '../../hooks/use-sprite-thumbnail'
import { optimizeSprites, type OptimizeProgress, type OptimizeResult } from './optimize-sprites'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SpritesOptimizerDialogProps {
  open: boolean
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Main dialog
// ---------------------------------------------------------------------------

export function SpritesOptimizerDialog({
  open,
  onClose
}: SpritesOptimizerDialogProps): React.JSX.Element {
  const { t } = useTranslation()
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState<OptimizeProgress | null>(null)
  const [result, setResult] = useState<OptimizeResult | null>(null)
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
  }
  prevOpenRef.current = open

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleStart = useCallback(async () => {
    const appState = useAppStore.getState()
    const spriteState = useSpriteStore.getState()

    if (!appState.clientInfo?.loaded) return

    setIsRunning(true)
    setResult(null)
    setProgress({ step: 0, totalSteps: 7, label: 'Starting optimization...' })

    try {
      const optimizeResult = await optimizeSprites(
        spriteState.getAllSprites(),
        {
          items: appState.things.items,
          outfits: appState.things.outfits,
          effects: appState.things.effects,
          missiles: appState.things.missiles
        },
        appState.spriteCount,
        setProgress
      )

      if (optimizeResult.removedCount > 0) {
        // Clear editing data (sprite IDs changed)
        useEditorStore.getState().setEditingThingData(null)

        // Clear thumbnail cache
        clearThumbnailCache()

        // Update sprites
        spriteState.loadSprites(optimizeResult.newSprites)

        // Update things for each category
        appState.setThings(ThingCategory.ITEM, optimizeResult.newThings.items)
        appState.setThings(ThingCategory.OUTFIT, optimizeResult.newThings.outfits)
        appState.setThings(ThingCategory.EFFECT, optimizeResult.newThings.effects)
        appState.setThings(ThingCategory.MISSILE, optimizeResult.newThings.missiles)

        // Update sprite count and clientInfo
        appState.setSpriteCount(optimizeResult.newMaxSpriteId)
        if (appState.clientInfo) {
          appState.setClientInfo({
            ...appState.clientInfo,
            maxSpriteId: optimizeResult.newMaxSpriteId
          })
        }

        // Mark project as changed
        appState.setProjectChanged(true)
        window.api?.menu?.updateState({ clientChanged: true })

        addLog(
          'info',
          `Sprites optimized: removed ${optimizeResult.removedCount} sprites (${optimizeResult.oldCount} \u2192 ${optimizeResult.newCount})`
        )
      } else {
        addLog('info', 'Sprites optimization: no sprites to remove')
      }

      setResult(optimizeResult)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      addLog('error', `Sprites optimization failed: ${message}`)
    } finally {
      setIsRunning(false)
    }
  }, [addLog])

  const handleClose = useCallback(() => {
    if (!isRunning) onClose()
  }, [isRunning, onClose])

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const progressPercent = progress ? Math.round((progress.step / progress.totalSteps) * 100) : 0

  const footer = (
    <div className="flex w-full items-center justify-between">
      <DialogButton
        label={t('labels.start')}
        onClick={handleStart}
        disabled={isRunning || !clientInfo?.loaded}
        primary
      />
      <DialogButton label={t('labels.close')} onClick={handleClose} disabled={isRunning} />
    </div>
  )

  return (
    <Modal
      title={t('labels.spritesOptimizer')}
      open={open}
      onClose={handleClose}
      width={400}
      footer={footer}
      closeOnBackdrop={!isRunning}
    >
      <div className="flex flex-col gap-3">
        {/* Results */}
        <FieldGroup label={t('labels.result')}>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-text-secondary">{t('labels.removedSprites')}:</span>
              <span className="font-medium text-text-primary">{result?.removedCount ?? 0}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-secondary">{t('labels.oldSpriteCount')}:</span>
              <span className="text-text-primary">{result?.oldCount ?? 0}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-secondary">{t('labels.newSpriteCount')}:</span>
              <span className="text-text-primary">{result?.newCount ?? 0}</span>
            </div>
          </div>
        </FieldGroup>

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
