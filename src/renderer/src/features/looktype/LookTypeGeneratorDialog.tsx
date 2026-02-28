/**
 * Look Type Generator dialog.
 * Generates outfit/item XML for clipboard with real-time preview.
 * Ported from legacy LookGenerator.mxml + BindableLookType.as.
 */

import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Modal,
  DialogButton,
  FieldGroup,
  NumberInputField,
  CheckboxField
} from '../../components/Modal'
import { HSIColorPicker } from '../preview/HSIColorPicker'
import { useAppStore } from '../../stores'
import { ThingCategory } from '../../types/things'
import type { ThingData } from '../../types/things'
import { FrameGroupType } from '../../types/animation'
import { SpriteRenderer } from '../sprites'
import { createOutfitData } from '../../services/sprite-render'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LookTypeGeneratorDialogProps {
  open: boolean
  onClose: () => void
}

interface LookTypeState {
  typeId: number
  asItem: boolean
  head: number
  body: number
  legs: number
  feet: number
  addons: number
  mount: number
  corpse: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createDefaultState(): LookTypeState {
  return {
    typeId: 0,
    asItem: false,
    head: 0,
    body: 0,
    legs: 0,
    feet: 0,
    addons: 0,
    mount: 0,
    corpse: 0
  }
}

function serializeLookType(state: LookTypeState): string {
  const { typeId, asItem, head, body, legs, feet, addons, mount, corpse } = state

  if (typeId === 0) return ''

  const attrs: string[] = []

  if (asItem) {
    attrs.push(`typeex="${typeId}"`)
  } else {
    attrs.push(`type="${typeId}"`)
  }

  if (head !== 0) attrs.push(`head="${head}"`)
  if (body !== 0) attrs.push(`body="${body}"`)
  if (legs !== 0) attrs.push(`legs="${legs}"`)
  if (feet !== 0) attrs.push(`feet="${feet}"`)
  if (addons !== 0) attrs.push(`addons="${addons}"`)
  if (mount !== 0) attrs.push(`mount="${mount}"`)
  if (corpse !== 0) attrs.push(`corpse="${corpse}"`)

  return `<look ${attrs.join(' ')}/>`
}

function parseLookTypeXml(xml: string): LookTypeState | null {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')
    const parseError = doc.querySelector('parsererror')
    if (parseError) return null

    const look = doc.querySelector('look')
    if (!look) return null

    const state = createDefaultState()

    const typeAttr = look.getAttribute('type')
    const typeexAttr = look.getAttribute('typeex')

    if (typeexAttr) {
      state.asItem = true
      state.typeId = parseInt(typeexAttr, 10) || 0
    } else if (typeAttr) {
      state.asItem = false
      state.typeId = parseInt(typeAttr, 10) || 0
    } else {
      return null
    }

    state.head = parseInt(look.getAttribute('head') ?? '0', 10) || 0
    state.body = parseInt(look.getAttribute('body') ?? '0', 10) || 0
    state.legs = parseInt(look.getAttribute('legs') ?? '0', 10) || 0
    state.feet = parseInt(look.getAttribute('feet') ?? '0', 10) || 0
    state.addons = parseInt(look.getAttribute('addons') ?? '0', 10) || 0
    state.mount = parseInt(look.getAttribute('mount') ?? '0', 10) || 0
    state.corpse = parseInt(look.getAttribute('corpse') ?? '0', 10) || 0

    return state
  } catch {
    return null
  }
}

function randomHSI(): number {
  return Math.floor(Math.random() * 133)
}

// ---------------------------------------------------------------------------
// Main dialog
// ---------------------------------------------------------------------------

export function LookTypeGeneratorDialog({
  open,
  onClose
}: LookTypeGeneratorDialogProps): React.JSX.Element {
  const { t } = useTranslation()
  const [state, setState] = useState<LookTypeState>(createDefaultState)
  const [pasteError, setPasteError] = useState<string | null>(null)
  const clientInfo = useAppStore((s) => s.clientInfo)
  const getThingById = useAppStore((s) => s.getThingById)
  const addLog = useAppStore((s) => s.addLog)

  // -------------------------------------------------------------------------
  // Reset on open
  // -------------------------------------------------------------------------

  const [prevOpen, setPrevOpen] = useState(false)
  if (open && !prevOpen) {
    setState(createDefaultState())
    setPasteError(null)
  }
  if (open !== prevOpen) {
    setPrevOpen(open)
  }

  // -------------------------------------------------------------------------
  // XML output
  // -------------------------------------------------------------------------

  const xmlOutput = useMemo(() => serializeLookType(state), [state])

  // -------------------------------------------------------------------------
  // Preview data
  // -------------------------------------------------------------------------

  const previewThingData = useMemo((): ThingData | null => {
    if (state.asItem || state.typeId === 0 || !clientInfo?.loaded) return null

    const thing = getThingById(ThingCategory.OUTFIT, state.typeId)
    if (!thing) return null

    return {
      obdVersion: 0,
      clientVersion: clientInfo.clientVersion,
      thing,
      sprites: new Map([[FrameGroupType.DEFAULT, []]]),
      xmlAttributes: null
    }
  }, [state.typeId, state.asItem, clientInfo, getThingById])

  const outfitData = useMemo(
    () => createOutfitData(state.head, state.body, state.legs, state.feet, state.addons),
    [state.head, state.body, state.legs, state.feet, state.addons]
  )

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const update = useCallback((patch: Partial<LookTypeState>) => {
    setState((prev) => ({ ...prev, ...patch }))
    setPasteError(null)
  }, [])

  const handleAsItemChange = useCallback((checked: boolean) => {
    setState((prev) => ({ ...prev, asItem: checked }))
    setPasteError(null)
  }, [])

  const handleCopy = useCallback(async () => {
    if (!xmlOutput) return
    try {
      await navigator.clipboard.writeText(xmlOutput)
      addLog('info', 'Look type XML copied to clipboard')
    } catch {
      addLog('error', 'Failed to copy to clipboard')
    }
  }, [xmlOutput, addLog])

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (!text.trim()) {
        setPasteError('Clipboard is empty.')
        return
      }
      const parsed = parseLookTypeXml(text.trim())
      if (!parsed) {
        setPasteError('Invalid XML.')
        return
      }
      setState(parsed)
      setPasteError(null)
    } catch {
      setPasteError('Failed to read clipboard.')
    }
  }, [])

  const handleRandomColors = useCallback(() => {
    update({
      head: randomHSI(),
      body: randomHSI(),
      legs: randomHSI(),
      feet: randomHSI()
    })
  }, [update])

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const footer = (
    <div className="flex w-full items-center justify-between">
      <div className="flex gap-2">
        <DialogButton label={t('labels.copy')} onClick={handleCopy} disabled={!xmlOutput} />
        <DialogButton label={t('labels.paste')} onClick={handlePaste} />
        <DialogButton label="Random" onClick={handleRandomColors} />
      </div>
      <DialogButton label={t('labels.close')} onClick={onClose} />
    </div>
  )

  return (
    <Modal
      title={t('labels.lookTypeGenerator')}
      open={open}
      onClose={onClose}
      width={600}
      footer={footer}
    >
      <div className="flex flex-col gap-3">
        {/* Preview + Controls layout */}
        <div className="flex gap-4">
          {/* Preview */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-[96px] w-[96px] shrink-0 items-center justify-center rounded border border-border bg-bg-input">
              {previewThingData ? (
                <SpriteRenderer
                  thingData={previewThingData}
                  frameGroupType={FrameGroupType.DEFAULT}
                  frame={0}
                  patternX={2}
                  outfitData={outfitData}
                  minSize={96}
                  showCheckerboard={true}
                />
              ) : (
                <span className="text-xs text-text-tertiary">
                  {state.asItem ? 'Item mode' : state.typeId === 0 ? 'No outfit' : 'Not found'}
                </span>
              )}
            </div>
            <span className="text-[10px] text-text-tertiary">{t('labels.preview')}</span>
          </div>

          {/* Controls */}
          <div className="flex flex-1 flex-col gap-3">
            {/* Type selector */}
            <FieldGroup label="Look Type">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <NumberInputField
                    label={state.asItem ? 'Item ID' : 'Outfit ID'}
                    value={state.typeId}
                    onChange={(v) => update({ typeId: v })}
                    min={0}
                    max={0xffffff}
                  />
                  <CheckboxField
                    label={t('labels.asItem')}
                    checked={state.asItem}
                    onChange={handleAsItemChange}
                  />
                </div>
              </div>
            </FieldGroup>

            {/* Colors */}
            <FieldGroup label="Colors">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="flex items-center gap-2">
                  <HSIColorPicker
                    label={t('labels.head')}
                    value={state.head}
                    onChange={(v) => update({ head: v })}
                  />
                  <input
                    type="number"
                    className="w-12 rounded border border-border bg-bg-input px-1 py-0.5 text-xs text-text-primary outline-none focus:border-accent"
                    value={state.head}
                    min={0}
                    max={132}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10)
                      if (!isNaN(v) && v >= 0 && v <= 132) update({ head: v })
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <HSIColorPicker
                    label={t('labels.body')}
                    value={state.body}
                    onChange={(v) => update({ body: v })}
                  />
                  <input
                    type="number"
                    className="w-12 rounded border border-border bg-bg-input px-1 py-0.5 text-xs text-text-primary outline-none focus:border-accent"
                    value={state.body}
                    min={0}
                    max={132}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10)
                      if (!isNaN(v) && v >= 0 && v <= 132) update({ body: v })
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <HSIColorPicker
                    label={t('labels.legs')}
                    value={state.legs}
                    onChange={(v) => update({ legs: v })}
                  />
                  <input
                    type="number"
                    className="w-12 rounded border border-border bg-bg-input px-1 py-0.5 text-xs text-text-primary outline-none focus:border-accent"
                    value={state.legs}
                    min={0}
                    max={132}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10)
                      if (!isNaN(v) && v >= 0 && v <= 132) update({ legs: v })
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <HSIColorPicker
                    label={t('labels.feet')}
                    value={state.feet}
                    onChange={(v) => update({ feet: v })}
                  />
                  <input
                    type="number"
                    className="w-12 rounded border border-border bg-bg-input px-1 py-0.5 text-xs text-text-primary outline-none focus:border-accent"
                    value={state.feet}
                    min={0}
                    max={132}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10)
                      if (!isNaN(v) && v >= 0 && v <= 132) update({ feet: v })
                    }}
                  />
                </div>
              </div>
            </FieldGroup>

            {/* Addons & Mount & Corpse */}
            <FieldGroup label="Extras">
              <div className="flex gap-4">
                <NumberInputField
                  label={t('labels.addons')}
                  value={state.addons}
                  onChange={(v) => update({ addons: v })}
                  min={0}
                  max={3}
                />
                <NumberInputField
                  label={t('labels.mount')}
                  value={state.mount}
                  onChange={(v) => update({ mount: v })}
                  min={0}
                  max={0xffffff}
                />
                <NumberInputField
                  label={t('labels.corpse')}
                  value={state.corpse}
                  onChange={(v) => update({ corpse: v })}
                  min={0}
                  max={0xffffff}
                />
              </div>
            </FieldGroup>
          </div>
        </div>

        {/* XML output */}
        <FieldGroup label="XML">
          <textarea
            className="h-[48px] w-full resize-none rounded border border-border bg-bg-input px-2 py-1 font-mono text-xs text-text-primary outline-none"
            value={pasteError ?? xmlOutput}
            readOnly
            style={pasteError ? { color: 'var(--color-error)' } : undefined}
          />
        </FieldGroup>
      </div>
    </Modal>
  )
}
