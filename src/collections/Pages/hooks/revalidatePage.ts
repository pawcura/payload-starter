// @/collections/Pages/hooks/revalidatePage.ts
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidatePath } from 'next/cache'
import type { Page } from '@/payload-types'

const getPath = (slug: string | null | undefined): string | null => {
  if (!slug || typeof slug !== 'string') return null
  return slug === 'home' ? '/' : `/${slug}`
}

export const updatePage: CollectionAfterChangeHook<Page> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  // Skip when Payload is in the middle of an internal call we explicitly opt out of
  if (context?.disableRevalidate) return doc

  // Only revalidate when the doc is (or just became) published.
  // This prevents draft autosaves on brand-new docs (which often have no slug yet)
  // from calling revalidatePath('/undefined') during admin render.
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

  return doc
}

export const deletePage: CollectionAfterDeleteHook<Page> = ({ doc, req: { context } }) => {
  if (context?.disableRevalidate) return doc

  const path = getPath(doc?.slug)
  if (path) revalidatePath(path)

  return doc
}
