// @/endpoints/schedulePublish.ts
//
// Custom REST endpoint that lets approvers / admins queue a future publish
// for a single post. We can't let the client POST directly to /api/payload-jobs
// because the jobs collection is locked down by default. This endpoint
// validates the caller's role and then queues the `workflowSchedulePublish`
// task via the local jobs API.

import type { Endpoint } from 'payload'
import type { User } from '@/payload-types'

type Body = {
  postId?: unknown
  date?: unknown
}

const jsonError = (message: string, status: number) =>
  Response.json({ error: message }, { status })

export const schedulePublishEndpoint: Endpoint = {
  path: '/schedule-publish',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      return jsonError('You must be signed in to schedule a publish.', 401)
    }

    const role = (req.user as User).role
    if (role !== 'approver' && role !== 'admin') {
      return jsonError(
        'Only Approvers and Admins can schedule a publish.',
        403,
      )
    }

    let body: Body = {}
    try {
      // Payload's PayloadRequest exposes the raw web Request via req.json on
      // newer versions, otherwise we fall back to the underlying request.
      const maybeJson =
        typeof (req as unknown as { json?: () => Promise<Body> }).json === 'function'
          ? await (req as unknown as { json: () => Promise<Body> }).json()
          : await req.json?.()
      body = (maybeJson ?? {}) as Body
    } catch {
      body = {}
    }

    const postId = typeof body.postId === 'string' ? body.postId : null
    const dateStr = typeof body.date === 'string' ? body.date : null
    if (!postId || !dateStr) {
      return jsonError('postId and date are required.', 400)
    }

    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) {
      return jsonError('Invalid date.', 400)
    }
    if (date.getTime() <= Date.now()) {
      return jsonError('Scheduled time must be in the future.', 400)
    }

    // Make sure the post actually exists and is in the "approved" state.
    // We don't want to let an approver schedule a publish for a post that
    // hasn't been signed off by compliance yet.
    const post = await req.payload.findByID({
      collection: 'posts',
      id: postId,
      depth: 0,
      req,
      draft: true,
    })

    if (!post) return jsonError('Post not found.', 404)
    if (post.workflowStatus !== 'approved' && post.workflowStatus !== 'published') {
      return jsonError(
        'A post must be in the "Approved" state before it can be scheduled to publish.',
        409,
      )
    }

    await req.payload.jobs.queue({
      task: 'workflowSchedulePublish',
      input: { postId },
      waitUntil: date,
      req,
    })

    return Response.json({
      ok: true,
      scheduledFor: date.toISOString(),
    })
  },
}
