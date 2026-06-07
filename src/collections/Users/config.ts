import { type CollectionConfig, slugField } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'email', 'role', 'updatedAt'],
  },
  defaultPopulate: {
    name: true,
    email: true,
    slug: true,
    profilePic: true,
    role: true,
    bio: true,
  },
  auth: true,
  fields: [
    {
      type: 'text',
      name: 'name',
      required: true,
    },
    slugField({
      useAsSlug: 'name',
    }),
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'author',
      options: [
        { label: 'Author', value: 'author' },
        { label: 'Reviewer', value: 'reviewer' },
        { label: 'Compliance Reviewer', value: 'compliance-reviewer' },
        { label: 'Approver', value: 'approver' },
        { label: 'Admin', value: 'admin' },
      ],
      admin: {
        description: 'Determines what the user is permitted to do across the workflow.',
      },
    },
    {
      name: 'profilePic',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: {
        description: 'Optional profile picture for the user.',
      },
    },
    {
      name: 'gender',
      type: 'select',
      required: false,
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
        { label: 'Non-binary', value: 'non-binary' },
        { label: 'Prefer not to say', value: 'prefer-not-to-say' },
      ],
    },
    {
      name: 'bio',
      type: 'textarea',
      required: false,
      admin: {
        description: 'A short biography to display on the public profile.',
      },
    },
    {
      type: 'collapsible',
      label: 'Social Media Profiles',
      admin: {
        description: 'Optional links shown on the public profile.',
        initCollapsed: true,
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'facebook',
              type: 'text',
              label: 'Facebook',
              required: false,
              admin: {
                placeholder: 'https://facebook.com/username',
              },
            },
            {
              name: 'instagram',
              type: 'text',
              label: 'Instagram',
              required: false,
              admin: {
                placeholder: 'https://instagram.com/username',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'twitter',
              type: 'text',
              label: 'X (Twitter)',
              required: false,
              admin: {
                placeholder: 'https://x.com/username',
              },
            },
            {
              name: 'publicEmail',
              type: 'email',
              label: 'Public Email',
              required: false,
              admin: {
                description: 'Email shown publicly. Separate from the login email.',
              },
            },
          ],
        },
      ],
    },
  ],
}
