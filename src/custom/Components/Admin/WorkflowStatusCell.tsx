'use client'
// @/custom/Components/Admin/WorkflowStatusCell.tsx
//
// Cell component rendered in the admin list view for the `workflowStatus`
// field. Shows the current workflow phase as a colored pill so reviewers can
// scan the queue at a glance.
import React from 'react'
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

type Props = { cellData?: WorkflowStatus | null }

export const WorkflowStatusCell: React.FC<Props> = ({ cellData }) => {
  const status: WorkflowStatus = (cellData ?? 'draft') as WorkflowStatus
  const palette = COLORS[status] ?? COLORS.draft

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.2rem 0.6rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        lineHeight: 1.2,
        backgroundColor: palette.bg,
        color: palette.fg,
        border: `1px solid ${palette.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: '0.5rem',
          height: '0.5rem',
          borderRadius: '9999px',
          backgroundColor: palette.fg,
        }}
      />
      {WORKFLOW_STATUS_LABEL[status]}
    </span>
  )
}

export default WorkflowStatusCell
