// @/collections/Posts/hooks/sendWorkflowEmails.ts
import type { CollectionAfterChangeHook } from 'payload'
import type { Post, User } from '@/payload-types'
import { WORKFLOW_STATUS_LABEL, type WorkflowStatus } from '../workflow/states'
import { getServerSideURL } from '@/utilities/getURL'

type NotifiableStatus = Exclude<WorkflowStatus, 'draft'>

// Which roles should be notified when a post enters a given workflow status.
// Admins receive every workflow notification so they can audit transitions.
const NOTIFY_ROLES: Record<NotifiableStatus, User['role'][]> = {
  'in-review': ['reviewer', 'admin'],
  'compliance-review': ['compliance-reviewer', 'admin'],
  approved: ['approver', 'admin'],
  published: ['approver', 'admin'],
}

const TRANSITION_HEADLINE: Record<NotifiableStatus, string> = {
  'in-review': 'A post has been submitted for review',
  'compliance-review': 'A post is ready for compliance review',
  approved: 'A post has been approved',
  published: 'A post has been published',
}

const renderEmail = ({
  recipient,
  post,
  newStatus,
  previousStatus,
  actor,
  adminUrl,
}: {
  recipient: User
  post: Post
  newStatus: NotifiableStatus
  previousStatus: WorkflowStatus
  actor: User | null
  adminUrl: string
}): { subject: string; html: string; text: string } => {
  const headline = TRANSITION_HEADLINE[newStatus]
  const newLabel = WORKFLOW_STATUS_LABEL[newStatus]
  const prevLabel = WORKFLOW_STATUS_LABEL[previousStatus]
  const actorName = actor?.name || actor?.email || 'A user'
  const postTitle = post.title || 'Untitled post'

  const subject = `[${newLabel}] ${postTitle}`

  const text = [
    `Hi ${recipient.name || recipient.email},`,
    '',
    `${headline}.`,
    '',
    `Post: ${postTitle}`,
    `Status: ${prevLabel} → ${newLabel}`,
    `Changed by: ${actorName}`,
    '',
    `Open in admin: ${adminUrl}`,
  ].join('\n')

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #111; line-height: 1.5;">
      <p>Hi ${escapeHtml(recipient.name || recipient.email)},</p>
      <p>${escapeHtml(headline)}.</p>
      <table style="border-collapse: collapse; margin: 16px 0;">
        <tbody>
          <tr>
            <td style="padding: 4px 12px 4px 0; color: #666;">Post</td>
            <td style="padding: 4px 0;"><strong>${escapeHtml(postTitle)}</strong></td>
          </tr>
          <tr>
            <td style="padding: 4px 12px 4px 0; color: #666;">Status</td>
            <td style="padding: 4px 0;">${escapeHtml(prevLabel)} &rarr; <strong>${escapeHtml(newLabel)}</strong></td>
          </tr>
          <tr>
            <td style="padding: 4px 12px 4px 0; color: #666;">Changed by</td>
            <td style="padding: 4px 0;">${escapeHtml(actorName)}</td>
          </tr>
        </tbody>
      </table>
      <p>
        <a href="${escapeHtml(adminUrl)}"
           style="display: inline-block; background: #111; color: #fff; padding: 10px 16px; border-radius: 6px; text-decoration: none;">
          Open in admin
        </a>
      </p>
    </div>
  `.trim()

  return { subject, html, text }
}

const escapeHtml = (input: string): string =>
  input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export const sendWorkflowEmails: CollectionAfterChangeHook<Post> = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  const { payload } = req

  // Only react to status transitions on existing posts. Newly created posts
  // start in "draft" and don't need a notification.
  if (operation !== 'update') return doc

  const newStatus = doc.workflowStatus as WorkflowStatus | undefined
  const prevStatus = previousDoc?.workflowStatus as WorkflowStatus | undefined

  if (!newStatus || newStatus === prevStatus) return doc
  if (!(newStatus in NOTIFY_ROLES)) return doc

  const targetStatus = newStatus as NotifiableStatus
  const rolesToNotify = NOTIFY_ROLES[targetStatus]

  // Skip silently when no email adapter is configured (e.g. local dev without
  // RESEND_API_KEY). Payload still exposes a default no-op sender, so we also
  // guard against environments where the API key is missing entirely.
  if (!process.env.RESEND_API_KEY) {
    payload.logger.info(
      `[workflow-email] Skipping notifications for "${doc.title}" — no email adapter configured.`,
    )
    return doc
  }

  try {
    const { docs: recipients } = await payload.find({
      collection: 'users',
      depth: 0,
      pagination: false,
      limit: 1000,
      where: {
        role: { in: rolesToNotify },
      },
      req,
    })

    if (recipients.length === 0) {
      payload.logger.info(
        `[workflow-email] No recipients found for status "${targetStatus}" on post "${doc.title}".`,
      )
      return doc
    }

    const actor = (req.user as User | null) ?? null
    const adminUrl = `${getServerSideURL()}/admin/collections/posts/${doc.id}`

    await Promise.allSettled(
      recipients.map(async (recipient) => {
        if (!recipient.email) return
        const { subject, html, text } = renderEmail({
          recipient,
          post: doc,
          newStatus: targetStatus,
          previousStatus: (prevStatus ?? 'draft') as WorkflowStatus,
          actor,
          adminUrl,
        })

        try {
          await payload.sendEmail({
            to: recipient.email,
            subject,
            html,
            text,
          })
          payload.logger.info(
            `[workflow-email] Sent "${targetStatus}" notification to ${recipient.email} for post ${doc.id}.`,
          )
        } catch (err) {
          payload.logger.error(
            `[workflow-email] Failed to send "${targetStatus}" email to ${recipient.email}: ${
              err instanceof Error ? err.message : String(err)
            }`,
          )
        }
      }),
    )
  } catch (err) {
    payload.logger.error(
      `[workflow-email] Failed to dispatch notifications for post ${doc.id}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    )
  }

  return doc
}
