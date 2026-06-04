// @/collections/Posts/hooks/revalidatePost.ts
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'
import type { Post } from '@/payload-types'

const getPath = (slug: string | null | undefined): string | null => {
  if (!slug || typeof slug !== 'string') return null
  return `/blog/${slug}`
}

export const updatePost: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (context?.disableRevalidate) return doc

  // Only revalidate when the doc is (or just became) published.
  // Prevents draft autosaves on brand-new docs (which often have no slug yet)
  // from calling revalidatePath('/blog/undefined') during admin render.
  const isPublished = doc._status === 'published'
  const wasPublished = previousDoc?._status === 'published'
  if (!isPublished && !wasPublished) return doc

  const newPath = getPath(doc.slug)
  const oldPath = getPath(previousDoc?.slug)

  if (newPath) {
    payload.logger.info(`Revalidating path: ${newPath}`)
    revalidatePath(newPath)
  }

  // If the slug changed while published, revalidate the old path too
  if (oldPath && oldPath !== newPath) {
    payload.logger.info(`Revalidating old path: ${oldPath}`)
    revalidatePath(oldPath)
  }

  // Refresh any list/related queries that depend on blog data
  revalidateTag('blog')

  return doc
}

export const deletePost: CollectionAfterDeleteHook<Post> = ({ doc, req: { context } }) => {
  if (context?.disableRevalidate) return doc

  const path = getPath(doc?.slug)
  if (path) revalidatePath(path)
  revalidateTag('blog')

  return doc
}
