import { Media } from '@/payload-types'

export function getMediaSize(doc: Media, size?: keyof NonNullable<Media['sizes']>) {
  // if no size provided, return doc
  if (!size) return doc

  // if doc has sizes, return the requested size
  if (doc.sizes) {
    switch (size) {
      case 'og':
        return doc.sizes.og || doc
      case 'thumbnail':
        return doc.sizes.thumbnail || doc
      case 'card':
        return doc.sizes.card || doc
      case 'fullSize':
        return doc.sizes.fullSize || doc
      default:
        return doc
    }
    // else return the document
  } else {
    return doc
  }
}