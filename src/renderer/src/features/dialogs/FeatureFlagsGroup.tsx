/**
 * Shared component for feature flag checkboxes.
 * Used by Create, Open, Compile, and Merge dialogs.
 */

import React from 'react'
import { FieldGroup, CheckboxField } from '../../components/Modal'
import type { FeatureFlags } from './useFeatureFlags'
import { isFeatureForced } from './useFeatureFlags'

interface FeatureFlagsGroupProps {
  flags: FeatureFlags
  versionValue: number
  onFlagChange: (key: keyof FeatureFlags, value: boolean) => void
}

export function FeatureFlagsGroup({
  flags,
  versionValue,
  onFlagChange
}: FeatureFlagsGroupProps): React.JSX.Element {
  const forced = isFeatureForced(versionValue)

  return (
    <FieldGroup label="Options">
      <div className="grid grid-cols-2 gap-2">
        <CheckboxField
          label="Extended"
          checked={flags.extended}
          onChange={(v) => onFlagChange('extended', v)}
          disabled={forced.extended}
        />
        <CheckboxField
          label="Transparency"
          checked={flags.transparency}
          onChange={(v) => onFlagChange('transparency', v)}
        />
        <CheckboxField
          label="Improved Animations"
          checked={flags.improvedAnimations}
          onChange={(v) => onFlagChange('improvedAnimations', v)}
          disabled={forced.improvedAnimations}
        />
        <CheckboxField
          label="Frame Groups"
          checked={flags.frameGroups}
          onChange={(v) => onFlagChange('frameGroups', v)}
          disabled={forced.frameGroups}
        />
      </div>
    </FieldGroup>
  )
}
