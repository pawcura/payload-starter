import type {Block} from 'payload'

export const Cards: Block = {
  slug: 'cards',
  interfaceName: 'CardsBlockProps',
  fields: [
    {
      name: 'header',
      type: 'text',
    },
    {
      name: 'backgroundColor',
      type: 'select',
      options: [
        { value: 'primary', label: 'Primary' },
        { value: 'secondary', label: 'Secondary' },
      ],
      defaultValue: 'primary',
    },
    {
      name: 'cardsArray',
      type: 'array',
      minRows: 2,
      maxRows: 4,
      admin: {
        components: {
          RowLabel: { path: '@/custom/label/Component.tsx#CardRowLabel' },
        },
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'body',
          type: 'richText',
          required: true,
        },
      ],
    },
  ],
  imageURL: '/blocks/cards-block-480x320.webp',
  imageAltText: 'Cards Block Sample',
}