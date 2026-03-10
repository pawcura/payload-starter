import type { Block } from 'payload'

export const Hero: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlockProps',
  imageURL: '/blocks/hero-block-480x320.webp',
  imageAltText: 'Sample hero block',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'primaryCTA',
          label: 'Primary CTA',
          type: 'relationship',
          relationTo: 'pages',
          admin: {
            width: '50%',
          },
        },
        {
          name: 'secondaryCTA',
          label: 'Secondary CTA',
          type: 'relationship',
          relationTo: 'pages',
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      type: 'checkbox',
      name: 'showHeroImage',
      defaultValue: false,
    },
    {
      type: 'upload',
      name: 'heroImage',
      relationTo: 'media',
      admin: {
        condition: (_, siblingData) => siblingData.showHeroImage,
      },
    },
  ],
}
