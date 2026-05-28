import { type CollectionConfig, slugField } from 'payload'

export const Doctors: CollectionConfig = {
  slug: 'doctors',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'specialty', 'updatedAt'],
    description:
      'Public-facing doctor profiles. Mirrors the user profile fields and adds medical credentials. Doctors do not log in — reference them from posts for medical-review attribution.',
  },
  defaultPopulate: {
    name: true,
    slug: true,
    profilePic: true,
    specialty: true,
    qualifications: true,
  },
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
      name: 'profilePic',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: {
        description: 'Optional profile picture for the doctor.',
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
      label: 'Medical Credentials',
      admin: {
        description: 'Professional details displayed alongside reviewed content.',
        initCollapsed: false,
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'specialty',
              type: 'text',
              label: 'Specialty',
              required: false,
              admin: {
                placeholder: 'e.g. Cardiology, Dermatology',
              },
            },
            {
              name: 'yearsOfExperience',
              type: 'number',
              label: 'Years of Experience',
              required: false,
              min: 0,
              admin: {
                step: 1,
              },
            },
          ],
        },
        {
          name: 'qualifications',
          type: 'textarea',
          label: 'Qualifications',
          required: false,
          admin: {
            description: 'Degrees, fellowships, certifications (one per line).',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'registrationNumber',
              type: 'text',
              label: 'Medical Registration Number',
              required: false,
              admin: {
                description: 'Council / board registration number, if applicable.',
              },
            },
            {
              name: 'hospitalAffiliation',
              type: 'text',
              label: 'Hospital / Clinic Affiliation',
              required: false,
            },
          ],
        },
      ],
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
                description: 'Email shown publicly on the doctor profile.',
              },
            },
          ],
        },
      ],
    },
  ],
}
