/**
 * About dialog showing application information.
 * Ported from legacy AboutWindow.mxml.
 *
 * Displays app name, version, copyright, license, and supporter links.
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, DialogButton } from '../../components/Modal'

interface AboutDialogProps {
  open: boolean
  onClose: () => void
}

const APP_NAME = 'Electron - Object Builder'
const APP_VERSION = '0.1.0'
const APP_COPYRIGHT = 'Copyright (c) 2026 Contributors'
const LICENSE_TEXT =
  'This software is licensed under the MIT License. ' +
  'Permission is hereby granted, free of charge, to any person obtaining a copy ' +
  'of this software and associated documentation files, to deal in the Software ' +
  'without restriction, including without limitation the rights to use, copy, modify, ' +
  'merge, publish, distribute, sublicense, and/or sell copies of the Software.'

export function AboutDialog({ open, onClose }: AboutDialogProps): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={400}
      footer={<DialogButton label={t('labels.close')} onClick={onClose} primary />}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        {/* App name and version */}
        <div>
          <h2 className="text-lg font-bold text-text-primary">{APP_NAME}</h2>
          <p className="text-sm text-text-secondary">
            {t('labels.version')} {APP_VERSION}
          </p>
        </div>

        {/* Copyright */}
        <p className="text-xs text-text-secondary">{APP_COPYRIGHT}</p>

        {/* License */}
        <p className="text-xs leading-relaxed text-text-secondary">{LICENSE_TEXT}</p>

        {/* Tech stack */}
        <p className="text-xs text-text-secondary/60">Built with Electron + React + TypeScript</p>
      </div>
    </Modal>
  )
}
