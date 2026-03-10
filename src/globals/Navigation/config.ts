import {GlobalConfig} from 'payload'
import { revalidateGlobal } from '@/globals/hooks/revalidateGlobal'

export const Navigation: GlobalConfig = {
  slug: 'nav',
  hooks: {
    afterChange: [
      revalidateGlobal
    ]
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      admin: {
        components: {
          RowLabel: {
            path: '@/custom/label/Component.tsx#ArrayRowLabel'
          }
        }
      },
      labels: {
        singular: 'Navigation Link',
        plural: 'Navigation Links',
      },
      fields: [
        {
          type: 'relationship',
          name: 'link',
          relationTo: 'pages',
          required: true,
          admin: {
            appearance: 'drawer',
          }
        },
      ],
    }
  ]
}