// @/collections/Posts/workflow/states.ts
// Single source of truth for the editorial workflow attached to every Post.
//
//   draft -> in-review -> compliance-review -> approved -> published
//
// A post is publicly visible only when workflowStatus === 'published'.

import type { User } from '@/payload-types'

export type WorkflowStatus =
  | 'draft'
  | 'in-review'
  | 'compliance-review'
  | 'approved'
  | 'published'

export type WorkflowRole = User['role']

export const WORKFLOW_STATUS_VALUES: WorkflowStatus[] = [
  'draft',
  'in-review',
  'compliance-review',
  'approved',
  'published',
]

export const WORKFLOW_STATUS_OPTIONS: { label: string; value: WorkflowStatus }[] = [
  { label: 'Draft', value: 'draft' },
  { label: 'Submitted for Review', value: 'in-review' },
  { label: 'Compliance Review', value: 'compliance-review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Published', value: 'published' },
]

export const WORKFLOW_STATUS_LABEL: Record<WorkflowStatus, string> = {
  draft: 'Draft',
  'in-review': 'Submitted for Review',
  'compliance-review': 'Compliance Review',
  approved: 'Approved',
  published: 'Published',
}

// Statuses that should appear on the public site. We keep "approved" private
// so the approver still needs to flip it to "published" to actually go live.
export const PUBLIC_WORKFLOW_STATUSES: WorkflowStatus[] = ['published']

// Allowed transitions per role. Admins bypass this map entirely.
// Each role can move the post forward to the listed status, and may also
// "kick back" the post to an earlier reviewer for revisions.
const TRANSITIONS: Record<WorkflowRole, Partial<Record<WorkflowStatus, WorkflowStatus[]>>> = {
  author: {
    draft: ['in-review'],
    'in-review': ['draft'], // author can withdraw their own submission
  },
  reviewer: {
    'in-review': ['compliance-review', 'draft'],
  },
  'compliance-reviewer': {
    'compliance-review': ['approved', 'in-review'],
  },
  approver: {
    approved: ['published', 'compliance-review'],
    published: ['approved'], // approver may unpublish back to approved
  },
  admin: {
    // populated below
  },
}

// Admins can move freely between any two states.
TRANSITIONS.admin = WORKFLOW_STATUS_VALUES.reduce(
  (acc, from) => {
    acc[from] = WORKFLOW_STATUS_VALUES.filter((s) => s !== from)
    return acc
  },
  {} as Partial<Record<WorkflowStatus, WorkflowStatus[]>>,
)

export const canTransition = (
  role: WorkflowRole | undefined,
  from: WorkflowStatus,
  to: WorkflowStatus,
): boolean => {
  if (from === to) return true
  if (!role) return false
  const allowed = TRANSITIONS[role]?.[from] ?? []
  return allowed.includes(to)
}

export const getAllowedNextStatuses = (
  role: WorkflowRole | undefined,
  from: WorkflowStatus,
): WorkflowStatus[] => {
  if (!role) return []
  return TRANSITIONS[role]?.[from] ?? []
}
