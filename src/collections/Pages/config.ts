// @/collections/Pages/config.ts
import { type CollectionConfig, slugField } from 'payload'
import { SEOField } from '@/fields/seo/config'
import { deletePage, updatePage } from './hooks/revalidatePage'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
  },
  defaultPopulate: {
    slug: true,
    title: true,
  },
  hooks: {
    afterChange: [updatePage],
    afterDelete: [deletePage],
  },
  fields: [
    slugField({ useAsSlug: 'title' }),
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Information',
          fields: [
            {
              type: 'text',
              name: 'title',
              required: true,
            },
            {
              name: 'featuredImage',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
          ],
        },
        {
          label: 'Layout',
          fields: [
            {
              name: 'blocks',
              type: 'blocks',
              blocks: [],
              blockReferences: ['hero', 'textAndImage', 'cards', 'text'],
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            SEOField
          ],
        },
      ],
    },
  ],
}
