import type {Block} from 'payload'

export const TextAndImage: Block = {
  slug: 'textAndImage',
  interfaceName: 'TextAndImageBlockProps',
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
      name: 'layout',
      type: 'radio',
      options: [
        { value: 'left', label: 'Text on Left' },
        { value: 'right', label: 'Text on Right' },
      ],
      defaultValue: 'right',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
    },
  ],
  imageURL: '/blocks/textandmedia-block-480x320.webp',
  imageAltText: 'Text and Image Block Sample',
}