/**
 * Import thing dialog for loading .obd files into the project.
 * Ported from legacy ImportThingWindow.mxml.
 *
 * Allows browsing for .obd files, shows a preview of the content
 * (type, version), and confirms import.
 */

import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Modal,
  DialogButton,
  BrowseField,
  FieldGroup,
  InfoRow,
  RadioField
} from '../../components/Modal'
import type { ThingData } from '../../types/things'
import { ThingCategory } from '../../types/things'
import { VERSIONS } from '../../data'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ImportAction = 'add' | 'replace'

export interface ImportThingResult {
  filePath: string
  thingData: ThingData
  action: ImportAction
}

export interface ImportThingDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (result: ImportThingResult) => void
  canReplace?: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCategoryLabel(category: string): string {
  switch (category) {
    case ThingCategory.ITEM:
      return 'Item'
    case ThingCategory.OUTFIT:
      return 'Outfit'
    case ThingCategory.EFFECT:
      return 'Effect'
    case ThingCategory.MISSILE:
      return 'Missile'
    default:
      return category
  }
}

function getVersionLabel(clientVersion: number): string {
  const ver = VERSIONS.find((v) => v.value === clientVersion)
  return ver ? `v${ver.valueStr}` : `v${clientVersion}`
}

// ---------------------------------------------------------------------------
// ImportThingDialog
// ---------------------------------------------------------------------------

export function ImportThingDialog({
  open,
  onClose,
  onConfirm,
  canReplace = false
}: ImportThingDialogProps): React.JSX.Element {
  const { t } = useTranslation()
  const [filePath, setFilePath] = useState('')
  const [thingData, setThingData] = useState<ThingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<ImportAction>('add')

  // Reset state on open
  useEffect(() => {
    if (open) {
      setFilePath('')
      setThingData(null)
      setLoading(false)
      setError(null)
      setAction('add')
    }
  }, [open])

  const handleBrowse = useCallback(async () => {
    if (!window.api?.file) return
    const result = await window.api.file.showOpenDialog({
      title: 'Select OBD File',
      filters: [{ name: 'Object Builder Data', extensions: ['obd'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return

    const selectedPath = result.filePaths[0]
    setFilePath(selectedPath)
    setError(null)
    setLoading(true)

    try {
      // Read the binary file
      const buffer = await window.api.file.readBinary(selectedPath)

      // Decode the OBD file via Web Worker (offloads LZMA decompression)
      const { workerService } = await import('../../workers/worker-service')
      const data = await workerService.decodeObd(new Uint8Array(buffer).buffer)
      setThingData(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to read OBD file'
      setError(message)
      setThingData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleConfirm = useCallback(() => {
    if (!thingData) return
    onConfirm({ filePath, thingData, action })
    onClose()
  }, [filePath, thingData, action, onConfirm, onClose])

  const isValid = thingData !== null && !loading

  return (
    <Modal
      title={t('controls.importObject')}
      open={open}
      onClose={onClose}
      width={420}
      footer={
        <>
          <DialogButton
            label={t('labels.import')}
            onClick={handleConfirm}
            primary
            disabled={!isValid}
          />
          <DialogButton label={t('labels.cancel')} onClick={onClose} />
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {/* File selection */}
        <BrowseField
          label="File"
          value={filePath}
          onBrowse={handleBrowse}
          placeholder="Select .obd file..."
        />

        {/* Preview */}
        <FieldGroup label={t('labels.preview')}>
          {loading && <p className="text-xs text-text-secondary">Loading...</p>}

          {error && <p className="text-xs text-error">{error}</p>}

          {!loading && !error && !thingData && (
            <p className="text-xs text-text-secondary">Select a file to preview.</p>
          )}

          {thingData && !loading && (
            <div className="flex flex-col gap-1">
              <InfoRow
                label={t('labels.type')}
                value={getCategoryLabel(thingData.thing.category)}
              />
              <InfoRow
                label={t('labels.version')}
                value={getVersionLabel(thingData.clientVersion)}
              />
              <InfoRow
                label="OBD Version"
                value={
                  thingData.obdVersion === 0
                    ? 'v1.0'
                    : `v${(thingData.obdVersion / 100).toFixed(1)}`
                }
              />
              {thingData.thing.marketName && (
                <InfoRow label={t('labels.name')} value={thingData.thing.marketName} />
              )}
              {thingData.thing.name && !thingData.thing.marketName && (
                <InfoRow label={t('labels.name')} value={thingData.thing.name} />
              )}
              <InfoRow
                label={t('labels.sprites')}
                value={(() => {
                  let count = 0
                  thingData.sprites.forEach((arr) => {
                    count += arr.length
                  })
                  return count
                })()}
              />
            </div>
          )}
        </FieldGroup>

        {/* Import action */}
        <FieldGroup label="Action">
          <div className="flex gap-4">
            <RadioField
              label={t('labels.add')}
              name="import-action"
              value="add"
              checked={action === 'add'}
              onChange={(v) => setAction(v as ImportAction)}
            />
            <RadioField
              label={t('labels.replace')}
              name="import-action"
              value="replace"
              checked={action === 'replace'}
              onChange={(v) => setAction(v as ImportAction)}
              disabled={!canReplace}
            />
          </div>
        </FieldGroup>
      </div>
    </Modal>
  )
}
