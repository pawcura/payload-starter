import { type CollectionConfig, slugField } from 'payload'
import { canReadCmsContent } from '@/utilities/cmsReadApiKey'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    read: ({ req }) => canReadCmsContent(req),
  },
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      type: 'text',
      name: 'name',
    },
    slugField({
      useAsSlug: 'name',
    }),
    // we'll add a special presentational field — a join field — called relatedPosts
    {
      type: 'join',
      collection: 'posts',
      on: 'categories',
      name: 'relatedPosts'
    }
  ],
}
