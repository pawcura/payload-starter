import type { CollectionBeforeOperationHook } from 'payload'

export const changeFilename: CollectionBeforeOperationHook = ({ req: {file}, operation }) => {
  const slugify = (str: string) => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[\s-]+/g, '-') // Replace spaces and hyphens with single hyphen
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
  }
  if ((operation === 'create' || operation === 'update') && file) {
    file.name = slugify(file.name)
  }
}
