import type { FieldHook } from 'payload'
import { getServerSideURL } from '@/utilities/getURL'

export const generateCanonical: FieldHook = ({
  data,
  value,
  previousValue,
  collection,
  originalDoc
}) => {
  const isHome = data?.slug === 'home'
  const url = getServerSideURL()
  const collectionSlug = collection?.slug !== 'pages' ? `/${collection?.slug}` : ''
  const path = isHome ? '/' : `${collectionSlug}/${data?.slug}`
  const defaultUrl = `${url}${path}`

  // If field is empty/undefined, always use default
  if (!value) {
    return defaultUrl
  }

  // If user manually changed the canonical URL, use their value
  if (previousValue !== value) {
    return value
  }

  // If slug changed AND the previous canonical was the auto-generated one, update it
  if (originalDoc?.slug !== data?.slug) {
    const previousPath = isHome ? '/' : `${collectionSlug}/${originalDoc?.slug}`
    const previousUrl = `${url}${previousPath}`

    // Only regenerate if the current value matches the old auto-generated URL
    // This means the user hasn't customized it
    if (value !== previousUrl) {
      return defaultUrl
    }
  }

  // Otherwise, keep the existing value unchanged
  return value
}