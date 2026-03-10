import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
  },
  defaultPopulate: {
    name: true,
    email: true,
  },
  auth: true,
  fields: [
    {
      type: 'text',
      name: 'name',
      required: true,
    }
  ],
}
