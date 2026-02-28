/**
 * Frame Groups Converter dialog.
 * Converts outfits between single-group (legacy) and dual-group (idle + walking) formats.
 * Ported from legacy FrameGroupsConverterWindow.mxml + FrameGroupsConverter.as.
 */

import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, DialogButton, FieldGroup } from '../../components/Modal'
import { useAppStore, useEditorStore } from '../../stores'
import { ThingCategory } from '../../types/things'
import { clearThumbnailCache } from '../../hooks/use-sprite-thumbnail'
import { getDefaultDuration } from '../../types/settings'
import {
  convertFrameGroups,
  type ConvertFrameGroupsConfig,
  type ConvertFrameGroupsProgress,
  type ConvertFrameGroupsResult
} from './convert-frame-groups'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FrameGroupsConverterDialogProps {
  open: boolean
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Main dialog
// ---------------------------------------------------------------------------

export function FrameGroupsConverterDialog({
  open,
  onClose
}: FrameGroupsConverterDialogProps): React.JSX.Element {
  const { t } = useTranslation()
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState<ConvertFrameGroupsProgress | null>(null)
  const [result, setResult] = useState<ConvertFrameGroupsResult | null>(null)

  const [addFrameGroups, setAddFrameGroups] = useState(true)
  const [removeMounts, setRemoveMounts] = useState(false)

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
    // Default: if client already has frame groups, offer to remove; otherwise offer to add
    setAddFrameGroups(!(clientInfo?.features.frameGroups ?? false))
    setRemoveMounts(false)
  }
  prevOpenRef.current = open

  // Mounts checkbox only enabled for version >= 870
  const mountsAvailable = (clientInfo?.clientVersion ?? 0) >= 870

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleStart = useCallback(async () => {
    const appState = useAppStore.getState()
    if (!appState.clientInfo?.loaded) return

    setIsRunning(true)
    setResult(null)
    setProgress({ step: 0, totalSteps: 3, label: 'Starting conversion...' })

    try {
      const settings = await window.api.settings.load()

      const config: ConvertFrameGroupsConfig = {
        addFrameGroups,
        removeMounts: !addFrameGroups && removeMounts,
        improvedAnimations: appState.clientInfo.features.improvedAnimations,
        defaultDuration: getDefaultDuration(settings, ThingCategory.OUTFIT)
      }

      const convertResult = await convertFrameGroups(
        appState.things.outfits,
        config,
        setProgress
      )

      if (convertResult.changed > 0) {
        // Clear editing data
        useEditorStore.getState().setEditingThingData(null)
        clearThumbnailCache()

        // Update outfits
        appState.setThings(ThingCategory.OUTFIT, convertResult.newOutfits)

        // Update features.frameGroups flag
        const newFeatures = { ...appState.clientInfo.features, frameGroups: addFrameGroups }
        const newClientInfo = { ...appState.clientInfo, features: newFeatures }
        appState.setClientInfo(newClientInfo)

        // Mark project as changed
        appState.setProjectChanged(true)
        window.api?.menu?.updateState({ clientChanged: true })

        addLog(
          'info',
          `Frame groups converted: ${convertResult.changed} outfits ${addFrameGroups ? 'gained' : 'lost'} frame groups`
        )
      } else {
        addLog('info', 'Frame groups conversion: no outfits changed')
      }

      setResult(convertResult)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      addLog('error', `Frame groups conversion failed: ${message}`)
    } finally {
      setIsRunning(false)
    }
  }, [addFrameGroups, removeMounts, addLog])

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
      title={t('labels.frameGroupsConverter')}
      open={open}
      onClose={handleClose}
      width={400}
      footer={footer}
      closeOnBackdrop={!isRunning}
    >
      <div className="flex flex-col gap-3">
        {/* Options */}
        <FieldGroup label={t('labels.options')}>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={addFrameGroups}
                onChange={(e) => setAddFrameGroups(e.target.checked)}
                disabled={isRunning}
                className="accent-accent"
              />
              <span className="text-text-primary">{t('thingType.addRemoveFrameGroups')}</span>
            </label>
            <span className="ml-5 text-[10px] text-text-secondary">
              {addFrameGroups
                ? 'Outfits with a single animation group will be split into idle + walking groups.'
                : 'Outfits with idle + walking groups will be merged into a single group.'}
            </span>

            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={removeMounts}
                onChange={(e) => setRemoveMounts(e.target.checked)}
                disabled={isRunning || addFrameGroups || !mountsAvailable}
                className="accent-accent"
              />
              <span
                className={
                  isRunning || addFrameGroups || !mountsAvailable
                    ? 'text-text-secondary opacity-50'
                    : 'text-text-primary'
                }
              >
                {t('thingType.removeMounts')}
              </span>
            </label>
          </div>
        </FieldGroup>

        {/* Results */}
        {result && (
          <FieldGroup label={t('labels.result')}>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Outfits changed:</span>
                <span className="font-medium text-text-primary">{result.changed}</span>
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
