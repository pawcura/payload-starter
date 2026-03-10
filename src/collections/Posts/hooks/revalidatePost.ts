// @/collections/Posts/hooks/revalidatePost.ts
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'
import type { Post } from '@/payload-types'

export const updatePost: CollectionAfterChangeHook<Post> = ({ doc, req: { payload } }) => {
  // we'll update the path to include blog and get rid of the home check
  const path = `/blog/${doc.slug}`
  payload.logger.info(`Revalidating path: ${path}`)
  revalidatePath(path)
  // then we can use revalidate tag, which will affect all blog posts to keep our data fresh everywhere
  revalidateTag('blog')
}

export const deletePost: CollectionAfterDeleteHook<Post> = ({ doc }) => {
  // then we'll do something similar for our delete hook
  const path = `/blog/${doc.slug}`
  revalidatePath(path)
  revalidateTag('blog')
}
