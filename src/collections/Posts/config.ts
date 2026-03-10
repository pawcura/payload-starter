// @/collections/Posts/config.ts
import { type CollectionConfig, slugField } from 'payload'
import { FixedToolbarFeature, lexicalEditor, BlocksFeature } from '@payloadcms/richtext-lexical'
import { SEOField } from '@/fields/seo/config'
import { Post } from '@/payload-types'
import { deletePost, updatePost } from './hooks/revalidatePost'
import { populateAuthor } from './hooks/populateAuthor'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    hideAPIURL: process.env.NODE_ENV !== 'development',
  },
  defaultPopulate: {
    slug: true,
    title: true,
  },
  hooks: {
    afterChange: [updatePost],
    afterDelete: [deletePost],
    afterRead: [populateAuthor],
  },
  fields: [
    slugField({ useAsSlug: 'title' }),
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Information',
          fields: [
            { type: 'text', name: 'title', required: true },
            { type: 'textarea', name: 'summary' },
            {
              type: 'checkbox',
              name: 'featured',
              label: 'Make Featured Post',
              admin: {
                components: {
                  Error: '@/custom/error/Component.tsx#CheckboxError',
                },
              },
              validate: async (value, { req: { payload }, siblingData }) => {
                const { totalDocs } = await payload.count({
                  collection: 'posts',
                  where: {
                    featured: {
                      equals: true,
                    },
                    slug: {
                      not_equals: (siblingData as Post).slug,
                    },
                  },
                })
                if (totalDocs && value === true) {
                  return 'Only one featured post is allowed'
                }
                return true
              },
            },
            {
              type: 'date',
              name: 'date',
              timezone: {
                supportedTimezones: [{ value: 'America/New_York', label: 'East Coast' }],
                defaultTimezone: 'America/New_York',
              },
              admin: {
                date: {
                  pickerAppearance: 'dayAndTime',
                },
              },
            },
            {
              type: 'relationship',
              name: 'author',
              relationTo: 'users',
              required: true,
            },
            {
              type: 'relationship',
              name: 'category',
              relationTo: 'categories',
            },
            {
              name: 'featuredImage',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
            {
              type: 'group',
              name: 'populatedAuthor',
              // we'll make sure this field remains hidden and disabled
              admin: { hidden: true, disabled: true },
              // and that it can't be updated
              access: {
                update: () => false
              },
              fields: [
                { type: 'text', name: 'id' },
                { type: 'text', name: 'name' },
              ],
              // we'll make this a virtual field, which will show up in our API at read time but is not store in the database
              virtual: true,
            },
          ],
        },
        {
          label: 'Content',
          fields: [
            {
              type: 'richText',
              name: 'body',
              required: true,
              editor: lexicalEditor({
                features: ({ defaultFeatures }) => [
                  ...defaultFeatures,
                  FixedToolbarFeature(),
                  BlocksFeature({
                    blocks: ['textAndImage', 'cards'],
                  }),
                ],
              }),
            },
          ],
        },
        {
          label: 'SEO',
          fields: [SEOField],
        },
      ],
    },
  ],
}
