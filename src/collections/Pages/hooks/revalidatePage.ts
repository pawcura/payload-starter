// @/collections/Pages/hooks/revalidatePage.ts
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidatePath } from 'next/cache'
import type { Page } from '@/payload-types'

export const updatePage: CollectionAfterChangeHook<Page> = ({ doc, req: { payload } }) => {
  const path = doc.slug === 'home' ? '/' : `/${doc.slug}`
  payload.logger.info(`Revalidating path: ${path}`)
  revalidatePath(path)
}

export const deletePage: CollectionAfterDeleteHook<Page> = ({ doc }) => {
  const path = doc.slug === 'home' ? '/' : `/${doc.slug}`
  revalidatePath(path)
}
