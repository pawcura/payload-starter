'use client'
// @/custom/Components/Admin/WorkflowActionButtons.tsx
//
// Replaces Payload's default "Publish Changes" button. For any given post
// there is exactly ONE forward workflow action visible at a time, driven by
// the post's current `workflowStatus`:
//
//   draft              -> "Submit for Review"
//   in-review          -> "Move to Compliance Review"
//   compliance-review  -> "Move to Approved"
//   approved           -> "Move to Published"  (+ optional "Schedule Publish")
//   published          -> no button (terminal state)
//
// The button is only rendered when the signed-in user's role is allowed to
// perform that specific transition (validated against the same
// `canTransition` graph the server-side beforeChange hook enforces).
// Kick-back / unpublish actions are intentionally not surfaced here.
import React, { useCallback, useMemo, useState } from 'react'
import { Button, toast, useAuth, useDocumentInfo, useForm } from '@payloadcms/ui'
import type { User } from '@/payload-types'
import {
  canTransition,
  type WorkflowStatus,
} from '@/collections/Posts/workflow/states'

const FORWARD_ACTION: Partial<
  Record<WorkflowStatus, { to: WorkflowStatus; label: string }>
> = {
  draft: { to: 'in-review', label: 'Submit for Review' },
  'in-review': { to: 'compliance-review', label: 'Move to Compliance Review' },
  'compliance-review': { to: 'approved', label: 'Move to Approved' },
  approved: { to: 'published', label: 'Move to Published' },
}

type AuthUser = (User & { collection: 'users' }) | null | undefined

export const WorkflowActionButtons: React.FC = () => {
  const { user } = useAuth() as { user: AuthUser }
  const { submit, getData } = useForm()
  const { id } = useDocumentInfo()

  const [pending, setPending] = useState<string | null>(null)
  const [showScheduler, setShowScheduler] = useState(false)
  const [scheduleAt, setScheduleAt] = useState('')

  const role = user?.role
  const data = getData() as { workflowStatus?: WorkflowStatus } | null
  const currentStatus: WorkflowStatus = data?.workflowStatus ?? 'draft'

  // The single forward action for this workflowStatus (or `null` if the
  // status is terminal, e.g. `published`).
  const forward = useMemo(() => FORWARD_ACTION[currentStatus] ?? null, [currentStatus])

  // Only render the button when this user's role is permitted to perform
  // the transition. This keeps the UI and the server-side `beforeChange`
  // hook in lockstep (same canTransition graph).
  const canDoForward = forward
    ? canTransition(role, currentStatus, forward.to)
    : false

  const handleTransition = useCallback(
    async (next: WorkflowStatus) => {
      setPending(`transition:${next}`)
      try {
        await submit({ overrides: { workflowStatus: next } })
      } catch (err) {
        // Payload surfaces validation errors via toast already, but ensure
        // anything else (e.g. our hook throwing) is visible too.
        toast.error(err instanceof Error ? err.message : 'Could not save changes.')
      } finally {
        setPending(null)
      }
    },
    [submit],
  )

  const handleSchedulePublish = useCallback(async () => {
    if (!id) return
    if (!scheduleAt) {
      toast.error('Pick a date and time to schedule the publish.')
      return
    }
    const isoDate = new Date(scheduleAt).toISOString()
    if (new Date(isoDate).getTime() <= Date.now()) {
      toast.error('Scheduled time must be in the future.')
      return
    }

    setPending('schedule')
    try {
      const res = await fetch('/api/schedule-publish', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: String(id), date: isoDate }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || `Schedule failed (${res.status})`)
      }
      toast.success(`Publish scheduled for ${new Date(isoDate).toLocaleString()}`)
      setShowScheduler(false)
      setScheduleAt('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not schedule publish.')
    } finally {
      setPending(null)
    }
  }, [id, scheduleAt])

  // Brand-new posts: hand off to Payload's autosave/save-draft until the
  // doc actually exists. Once it's saved we can drive the workflow.
  if (!id) return null
  if (!role) return null

  const canSchedulePublish =
    (role === 'approver' || role === 'admin') &&
    currentStatus === 'approved' &&
    canTransition(role, 'approved', 'published')

  // Nothing to do: either the post is in a terminal state (`published`) or
  // the signed-in user's role isn't allowed to advance from the current
  // workflowStatus. Render nothing rather than a disabled button.
  if (!forward || !canDoForward) {
    if (!canSchedulePublish) return null
  }

  const forwardBusy = forward ? pending === `transition:${forward.to}` : false

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        minWidth: '14rem',
      }}
    >
      {forward && canDoForward && (
        <Button
          type="button"
          buttonStyle="primary"
          size="medium"
          disabled={pending !== null}
          onClick={() => handleTransition(forward.to)}
        >
          {forwardBusy ? 'Saving…' : forward.label}
        </Button>
      )}

      {canSchedulePublish && (
        <>
          {!showScheduler ? (
            <Button
              type="button"
              buttonStyle="secondary"
              size="medium"
              disabled={pending !== null}
              onClick={() => setShowScheduler(true)}
            >
              Schedule Publish
            </Button>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                padding: '0.6rem',
                border: '1px solid var(--theme-elevation-150, #d1d5db)',
                borderRadius: 'var(--style-radius-m, 4px)',
                background: 'var(--theme-elevation-50, #f9fafb)',
              }}
            >
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Schedule publish for
              </label>
              <input
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                disabled={pending !== null}
                style={{
                  padding: '0.35rem 0.5rem',
                  borderRadius: 'var(--style-radius-s, 3px)',
                  border: '1px solid var(--theme-elevation-200, #d1d5db)',
                  fontSize: '0.85rem',
                }}
              />
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <Button
                  type="button"
                  buttonStyle="primary"
                  size="small"
                  disabled={pending !== null || !scheduleAt}
                  onClick={handleSchedulePublish}
                >
                  {pending === 'schedule' ? 'Scheduling…' : 'Confirm Schedule'}
                </Button>
                <Button
                  type="button"
                  buttonStyle="secondary"
                  size="small"
                  disabled={pending !== null}
                  onClick={() => {
                    setShowScheduler(false)
                    setScheduleAt('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default WorkflowActionButtons
