import type {Block} from 'payload'

export const Text: Block = {
  slug: 'text',
  interfaceName: 'TextBlockProps',
  fields: [
    {
      name: 'header',
      type: 'text',
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
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
  ],
  imageURL: '/blocks/text-block-480x320.webp',
  imageAltText: 'Text Block Sample',
}