import type { CollectionConfig } from 'payload'
import {changeFilename} from './hooks/changeFilename'
import { generateBlurData } from './hooks/generateBlurData'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  defaultPopulate: {
    url: true,
    filename: true,
    width: true,
    height: true,
    alt: true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'blurDataUrl',
      type: 'text',
      label: 'Blur Data URL',
      admin: {
        description: 'Placeholder blurred image. Automatically generated.',
        readOnly: true,
      },
    },
  ],
  upload: {
    disableLocalStorage: true,
    mimeTypes: ['image/*'],
    formatOptions: {
      format: 'webp',
    },
    imageSizes: [
      {
        name: 'thumbnail',
        width: 320,
        height: 180,
        admin: {
          disableListFilter: true,
          disableGroupBy: true,
          disableListColumn: true,
        },
      },
      {
        name: 'card',
        width: 640,
        height: 360,
        admin: {
          disableListFilter: true,
          disableGroupBy: true,
          disableListColumn: true,
        },
      },
      {
        name: 'fullSize',
        width: 1280,
        height: 720,
        admin: {
          disableListFilter: true,
          disableGroupBy: true,
          disableListColumn: true,
        },
      },
      {
        // open graph doesn't support webp, so I'll include a png
        name: 'og',
        width: 1920,
        height: 1080,
        formatOptions: {
          format: 'png',
          options: {
            quality: 80,
          },
        },
        admin: {
          disableListFilter: true,
          disableGroupBy: true,
          disableListColumn: true,
        },
      },
    ],
    adminThumbnail: 'thumbnail',
  },
  hooks: {
    beforeOperation: [
      changeFilename,
    ],
    beforeChange: [
      generateBlurData
    ],
  },
}
