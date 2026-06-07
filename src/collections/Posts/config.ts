// @/collections/Posts/config.ts
import { type CollectionConfig, type Where, slugField } from 'payload'
import { SEOField } from '@/fields/seo/config'
import { Post } from '@/payload-types'
import { deletePost, updatePost } from './hooks/revalidatePost'
import { populateAuthor } from './hooks/populateAuthor'
import { workflowTransition } from './hooks/workflowTransition'
import { sendWorkflowEmails } from './hooks/sendWorkflowEmails'
import { postsBodyEditor } from './bodyEditor'
import { canReadCmsContent } from '@/utilities/cmsReadApiKey'
import {
  PUBLIC_WORKFLOW_STATUSES,
  WORKFLOW_STATUS_OPTIONS,
  type WorkflowStatus,
} from './workflow/states'

const publishedPostsWhere: Where = {
  and: [{ _status: { equals: 'published' } }, { workflowStatus: { in: PUBLIC_WORKFLOW_STATUSES } }],
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    // Logged-in admin users see all posts; headless clients must send
    // CMS_READ_API_KEY via `Authorization: Bearer` or `X-CMS-Read-Key`.
    read: ({ req }) => {
      debugger
      if (req.user) return true
      if (!canReadCmsContent(req)) return false
      return publishedPostsWhere
    },
  },
  admin: {
    useAsTitle: 'title',
    hideAPIURL: process.env.NODE_ENV !== 'development',
    defaultColumns: ['title', 'workflowStatus', 'author', 'date', 'updatedAt'],
    components: {
      edit: {
        // Replace Payload's built-in "Publish Changes" button with our
        // role-aware workflow transition buttons.
        PublishButton: '@/custom/Components/Admin/WorkflowActionButtons.tsx#WorkflowActionButtons',
      },
    },
  },
  versions: {
    drafts: {
      autosave: {
        interval: 375,
      },
      schedulePublish: true,
    },
    maxPerDoc: 25,
  },
  defaultPopulate: {
    slug: true,
    title: true,
    workflowStatus: true,
  },
  hooks: {
    beforeChange: [workflowTransition],
    afterChange: [updatePost, sendWorkflowEmails],
    afterDelete: [deletePost],
    afterRead: [populateAuthor],
  },
  fields: [
    slugField({ useAsSlug: 'title' }),
    {
      name: 'workflowStatus',
      type: 'select',
      required: true,
      defaultValue: 'draft' satisfies WorkflowStatus,
      options: WORKFLOW_STATUS_OPTIONS,
      admin: {
        position: 'sidebar',
        // readOnly hides the default select input from every admin role.
        // The value can still be set via the API (which is what the
        // WorkflowActionButtons component does on transition), and the
        // beforeChange hook is the real authority on which transitions
        // are legal.
        readOnly: true,
        description:
          'Editorial workflow: Draft → Submitted for Review → Compliance Review → Approved → Published. Status changes only via the workflow action buttons.',
        components: {
          // Replace the default Select input with a colored read-only badge
          // so the field is purely informational in the edit view.
          Field: '@/custom/Components/Admin/WorkflowStatusField.tsx#WorkflowStatusField',
          Cell: '@/custom/Components/Admin/WorkflowStatusCell.tsx#WorkflowStatusCell',
        },
      },
      access: {
        // The field is read-only in the UI, but the API must still accept
        // updates so the workflow buttons can drive transitions. The
        // beforeChange hook validates role-gated transitions and rejects
        // illegal moves (including direct REST API calls).
        update: ({ req: { user } }) => Boolean(user),
      },
    },
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
              timezone: true,
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
              name: 'categories',
              label: 'Categories',
              relationTo: 'categories',
              hasMany: true,
              admin: {
                description:
                  'Add one or more categories. Drag to reorder — the first category is treated as the primary category.',
              },
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
                update: () => false,
              },
              fields: [
                { type: 'text', name: 'id' },
                { type: 'text', name: 'name' },
                { type: 'text', name: 'slug' },
                { type: 'textarea', name: 'bio' },
                // Resolved relative URL of the author's profile picture
                // (e.g. `/api/media/file/avatar.jpg`). Headless consumers
                // can prepend CMS_URL to render it without needing read
                // access to the Users / Media collections.
                { type: 'text', name: 'profilePicUrl' },
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
              // Renders the "Import Markdown" button + drawer above the body
              // field. The component dispatches updates to `title`, `summary`,
              // `body`, `meta.title` and `meta.description` after the server
              // converts the pasted markdown into a Lexical editor state.
              name: 'importMarkdown',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/custom/Components/Admin/ImportMarkdownButton.tsx#ImportMarkdownButton',
                },
              },
            },
            {
              type: 'richText',
              name: 'body',
              required: true,
              editor: postsBodyEditor,
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
