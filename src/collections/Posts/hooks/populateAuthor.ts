// @/collections/Posts/hooks/populateAuthor.ts
import type { CollectionAfterReadHook } from 'payload'
import type { Media } from '@/payload-types'

// We deliberately denormalise a small, public-safe subset of the author User
// onto `post.populatedAuthor` so headless consumers (calling with
// CMS_READ_API_KEY rather than an authenticated cookie) get author display
// data without needing read access to the Users / Media collections.
//
// `depth: 1` is required so `profilePic` comes back as a populated Media doc
// (with `url`) instead of just an ID. `overrideAccess: true` bypasses the
// default auth-collection read restriction.
const isMedia = (v: unknown): v is Media =>
  Boolean(v) && typeof v === 'object' && 'url' in (v as Record<string, unknown>)

export const populateAuthor: CollectionAfterReadHook = async ({ doc, req, req: { payload } }) => {
  if (doc?.author) {
    try {
      const authorDoc = await payload.findByID({
        id: typeof doc.author === 'object' ? doc.author?.id : doc.author,
        collection: 'users',
        depth: 1,
        overrideAccess: true,
        req,
        select: {
          name: true,
          slug: true,
          bio: true,
          profilePic: true,
        },
      })

      if (authorDoc) {
        doc.populatedAuthor = {
          id: authorDoc.id,
          name: authorDoc.name,
          slug: authorDoc.slug ?? null,
          bio: authorDoc.bio ?? null,
          profilePicUrl: isMedia(authorDoc.profilePic) ? (authorDoc.profilePic.url ?? null) : null,
        }
      }
    } catch {
      // swallow error — author may have been deleted
    }
  }

  return doc
}
