'use client'
// @/custom/Components/Admin/WorkflowStatusField.tsx
//
// Replaces the default editable Select input for the `workflowStatus` field
// with a read-only colored badge. The field's value is still tracked in the
// form via useField (so submissions and our WorkflowActionButtons overrides
// continue to work), but there is no editable input — reviewers must use the
// action buttons to advance the workflow.
import React from 'react'
import { useField } from '@payloadcms/ui'
import {
  WORKFLOW_STATUS_LABEL,
  type WorkflowStatus,
} from '@/collections/Posts/workflow/states'

const COLORS: Record<WorkflowStatus, { bg: string; fg: string; border: string }> = {
  draft: { bg: '#f3f4f6', fg: '#374151', border: '#d1d5db' },
  'in-review': { bg: '#fef3c7', fg: '#92400e', border: '#fcd34d' },
  'compliance-review': { bg: '#dbeafe', fg: '#1e40af', border: '#93c5fd' },
  approved: { bg: '#dcfce7', fg: '#166534', border: '#86efac' },
  published: { bg: '#d1fae5', fg: '#065f46', border: '#34d399' },
}

export const WorkflowStatusField: React.FC = () => {
  // Subscribe to the field so the badge updates the moment the workflow
  // buttons fire submit({ overrides: { workflowStatus: ... } }).
  const { value } = useField<WorkflowStatus>({ path: 'workflowStatus' })
  const status: WorkflowStatus = (value ?? 'draft') as WorkflowStatus
  const palette = COLORS[status] ?? COLORS.draft

  return (
    <div className="field-type" style={{ marginBottom: 'var(--base, 1rem)' }}>
      <label
        className="field-label"
        style={{
          display: 'block',
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: '0.4rem',
          color: 'var(--theme-elevation-500)',
        }}
      >
        Workflow Status
      </label>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.3rem 0.7rem',
          borderRadius: '9999px',
          fontSize: '0.8rem',
          fontWeight: 600,
          lineHeight: 1.2,
          backgroundColor: palette.bg,
          color: palette.fg,
          border: `1px solid ${palette.border}`,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: '0.55rem',
            height: '0.55rem',
            borderRadius: '9999px',
            backgroundColor: palette.fg,
          }}
        />
        {WORKFLOW_STATUS_LABEL[status]}
      </span>
      <p
        style={{
          marginTop: '0.5rem',
          marginBottom: 0,
          fontSize: '0.75rem',
          lineHeight: 1.4,
          color: 'var(--theme-elevation-500)',
        }}
      >
        Status is set automatically by the workflow buttons (Submit for Review,
        Approve, Publish Now, etc.). It cannot be edited directly.
      </p>
    </div>
  )
}

export default WorkflowStatusField
