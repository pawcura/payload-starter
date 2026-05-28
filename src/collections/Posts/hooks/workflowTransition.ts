// @/collections/Posts/hooks/workflowTransition.ts
import type { CollectionBeforeChangeHook } from 'payload'
import type { Post, User } from '@/payload-types'
import { schemaHash } from '@/utils/schemaHash'
import {
  canTransition,
  WORKFLOW_STATUS_LABEL,
  type WorkflowStatus,
} from '../workflow/states'

// Guard the workflow:
//   - validate role-gated transitions on update
//   - force a brand-new post to land in "draft"
//   - keep Payload's built-in _status in sync so only fully-published posts
//     are returned by queries that filter on _status === 'published'.
//   - block "approved -> published" unless the SEO -> Schema JSON-LD has
//     been verified (the hash stored at verify time matches the current
//     schema hash). The verification flow lives in the
//     VerifySchemaButton admin component and writes
//     `meta.schemaVerifiedHash`.
export const workflowTransition: CollectionBeforeChangeHook<Post> = async ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  const user = req.user as (User & { collection: 'users' }) | null
  const incomingStatus = (data.workflowStatus ?? 'draft') as WorkflowStatus

  // Escape hatch for trusted server-side flows (seed scripts, migrations).
  // Set `context: { disableWorkflow: true }` on a payload operation to
  // bypass role validation while still keeping _status in sync.
  const bypassWorkflow = Boolean(req.context?.disableWorkflow)

  if (operation === 'create') {
    // Authors (and everyone else) must start a post in "draft". Admins and
    // trusted server flows may bootstrap a post in any state.
    if (!bypassWorkflow && user?.role !== 'admin' && incomingStatus !== 'draft') {
      throw new Error('New posts must start in the "Draft" stage.')
    }

    data.workflowStatus = incomingStatus
    data._status = incomingStatus === 'published' ? 'published' : 'draft'
    return data
  }

  // update / autosave -----------------------------------------------------
  const previousStatus = ((originalDoc?.workflowStatus as WorkflowStatus | undefined) ??
    'draft') as WorkflowStatus

  // Autosave fires on every keystroke; if the status didn't actually change
  // we don't need to re-validate the transition or surface an error to the
  // author just because their role can't move the post forward.
  if (!bypassWorkflow && incomingStatus !== previousStatus) {
    if (!canTransition(user?.role, previousStatus, incomingStatus)) {
      throw new Error(
        `Your role is not allowed to move this post from "${WORKFLOW_STATUS_LABEL[previousStatus]}" to "${WORKFLOW_STATUS_LABEL[incomingStatus]}".`,
      )
    }
  }

  // Publish gate: any move into "published" (from anywhere) requires the
  // schema JSON-LD to be present AND verified. We recompute the hash on
  // the current schema and compare against `meta.schemaVerifiedHash`,
  // which the VerifySchemaButton writes when it accepts a payload. Any
  // edit to the schema produces a new hash and naturally invalidates the
  // stamp, so editors are forced to re-verify after every change.
  if (
    !bypassWorkflow &&
    incomingStatus === 'published' &&
    previousStatus !== 'published'
  ) {
    const meta = {
      ...(originalDoc?.meta ?? {}),
      ...((data.meta ?? {}) as Partial<NonNullable<Post['meta']>>),
    }
    const schema = meta.schema
    const verifiedHash = meta.schemaVerifiedHash ?? null

    if (schema === null || schema === undefined || schema === '') {
      throw new Error(
        'Cannot publish: this post has no schema.org JSON-LD on the SEO tab. Add a schema and click "Verify Schema" before publishing.',
      )
    }

    const currentHash = await schemaHash(schema)
    if (!verifiedHash || verifiedHash !== currentHash) {
      throw new Error(
        'Cannot publish: the schema has not been verified, or it changed since verification. Open the SEO tab and click "Verify Schema".',
      )
    }
  }

  data.workflowStatus = incomingStatus
  // _status is what Payload uses to gate published-vs-draft queries. We
  // override it here so a post is only ever publicly visible when the
  // approver has explicitly moved the workflow to "published".
  data._status = incomingStatus === 'published' ? 'published' : 'draft'

  return data
}
