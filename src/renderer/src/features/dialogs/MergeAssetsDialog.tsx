/**
 * Dialog for merging another project's files (File > Merge).
 * Ported from legacy MergeAssetsWindow.mxml.
 *
 * User selects a client folder, the dialog auto-detects DAT/SPR files
 * and version. Simpler than OpenAssetsDialog (no server items).
 */

import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, DialogButton, FieldGroup, BrowseField, InfoRow } from '../../components/Modal'
import { findVersionBySignatures } from '../../data/versions'
import { FeatureFlagsGroup } from './FeatureFlagsGroup'
import { useFeatureFlags, applyVersionDefaults } from './useFeatureFlags'
import type { Version } from '../../types/version'

interface MergeClientInfo {
  datFile: string
  sprFile: string
  datSignature: number
  sprSignature: number
  itemsCount: number
  outfitsCount: number
  effectsCount: number
  missilesCount: number
  spritesCount: number
  version: Version | null
}

export interface MergeAssetsResult {
  datFile: string
  sprFile: string
  version: Version
  extended: boolean
  transparency: boolean
  improvedAnimations: boolean
  frameGroups: boolean
}

interface MergeAssetsDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (result: MergeAssetsResult) => void
  lastMergeDirectory?: string | null
}

export function MergeAssetsDialog({
  open,
  onClose,
  onConfirm,
  lastMergeDirectory
}: MergeAssetsDialogProps): React.JSX.Element {
  const { t } = useTranslation()
  const [clientDirectory, setClientDirectory] = useState('')
  const [clientInfo, setClientInfo] = useState<MergeClientInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { flags, setFlag, setFlags } = useFeatureFlags()

  const handleBrowseClient = useCallback(async () => {
    if (!window.api?.file) return

    const result = await window.api.file.showDirectoryDialog({
      title: 'Select Client Folder to Merge',
      defaultPath: lastMergeDirectory ?? undefined
    })

    if (result.canceled || !result.directoryPath) return

    const dir = result.directoryPath
    setClientDirectory(dir)
    setError(null)
    setLoading(true)

    try {
      const discovery = await window.api.project.discoverClientFiles(dir)

      if (!discovery.datFile || !discovery.sprFile) {
        setError('No DAT/SPR files found in the selected folder.')
        setClientInfo(null)
        setLoading(false)
        return
      }

      const datBuffer = await window.api.file.readBinary(discovery.datFile)
      const sprBuffer = await window.api.file.readBinary(discovery.sprFile)

      const datView = new DataView(datBuffer)
      const datSignature = datView.getUint32(0, true)
      const maxItemId = datView.getUint16(4, true)
      const maxOutfitId = datView.getUint16(6, true)
      const maxEffectId = datView.getUint16(8, true)
      const maxMissileId = datView.getUint16(10, true)

      const sprView = new DataView(sprBuffer)
      const sprSignature = sprView.getUint32(0, true)

      const version = findVersionBySignatures(datSignature, sprSignature) ?? null
      const isExtended = version ? version.value >= 960 : false
      const spritesCount = isExtended ? sprView.getUint32(4, true) : sprView.getUint16(4, true)

      const info: MergeClientInfo = {
        datFile: discovery.datFile,
        sprFile: discovery.sprFile,
        datSignature,
        sprSignature,
        itemsCount: maxItemId,
        outfitsCount: maxOutfitId,
        effectsCount: maxEffectId,
        missilesCount: maxMissileId,
        spritesCount,
        version
      }

      setClientInfo(info)

      if (version) {
        setFlags(
          applyVersionDefaults(
            { extended: false, transparency: false, improvedAnimations: false, frameGroups: false },
            version.value
          )
        )
      }

      await window.api.recent.set('lastMergeDirectory', dir)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read client files.')
      setClientInfo(null)
    } finally {
      setLoading(false)
    }
  }, [lastMergeDirectory, setFlags])

  const canConfirm = clientInfo?.version != null && !loading

  const handleConfirm = useCallback(() => {
    if (!clientInfo?.version) return

    onConfirm({
      datFile: clientInfo.datFile,
      sprFile: clientInfo.sprFile,
      version: clientInfo.version,
      ...flags
    })
    onClose()
  }, [clientInfo, flags, onConfirm, onClose])

  const handleClose = useCallback(() => {
    setClientDirectory('')
    setClientInfo(null)
    setError(null)
    onClose()
  }, [onClose])

  return (
    <Modal
      title={t('controls.mergeClientFiles')}
      open={open}
      onClose={handleClose}
      width={480}
      footer={
        <>
          <DialogButton label={t('labels.cancel')} onClick={handleClose} />
          <DialogButton
            label={t('labels.confirm')}
            onClick={handleConfirm}
            primary
            disabled={!canConfirm}
          />
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {/* Client folder */}
        <FieldGroup label={t('controls.clientFolder')}>
          <BrowseField label="Folder" value={clientDirectory} onBrowse={handleBrowseClient} />
        </FieldGroup>

        {loading && (
          <div className="text-center text-xs text-text-secondary">Loading file info...</div>
        )}

        {error && <div className="rounded bg-red-900/30 px-3 py-2 text-xs text-error">{error}</div>}

        {clientInfo && (
          <>
            {/* Version info */}
            <FieldGroup label={t('labels.version')}>
              <InfoRow
                label={t('labels.version')}
                value={clientInfo.version?.valueStr ?? 'Unknown'}
              />
            </FieldGroup>

            {/* DAT info */}
            <FieldGroup label={t('labels.file') + ' DAT'}>
              <div className="grid grid-cols-2 gap-1">
                <InfoRow
                  label={t('labels.signature')}
                  value={'0x' + clientInfo.datSignature.toString(16).toUpperCase().padStart(8, '0')}
                />
                <InfoRow label={t('labels.items')} value={clientInfo.itemsCount} />
                <InfoRow label={t('labels.outfits')} value={clientInfo.outfitsCount} />
                <InfoRow label={t('labels.effects')} value={clientInfo.effectsCount} />
                <InfoRow label={t('labels.missiles')} value={clientInfo.missilesCount} />
              </div>
            </FieldGroup>

            {/* SPR info */}
            <FieldGroup label={t('labels.file') + ' SPR'}>
              <div className="grid grid-cols-2 gap-1">
                <InfoRow
                  label={t('labels.signature')}
                  value={'0x' + clientInfo.sprSignature.toString(16).toUpperCase().padStart(8, '0')}
                />
                <InfoRow label={t('labels.sprites')} value={clientInfo.spritesCount} />
              </div>
            </FieldGroup>

            {/* Feature flags */}
            <FeatureFlagsGroup
              flags={flags}
              versionValue={clientInfo.version?.value ?? 0}
              onFlagChange={setFlag}
            />
          </>
        )}
      </div>
    </Modal>
  )
}
