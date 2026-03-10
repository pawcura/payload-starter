import { type CollectionConfig, slugField } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
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
      on: 'category',
      name: 'relatedPosts'
    }
  ],
}
