import { GlobalConfig } from 'payload'
import { revalidateGlobal } from '@/globals/hooks/revalidateGlobal'

export const Settings: GlobalConfig = {
  slug: 'settings',
  hooks: {
    afterChange: [revalidateGlobal],
  },
  fields: [
    {
      name: 'gtmCode',
      type: 'text',
      label: 'Google Tag Manager',
      admin: {
        description: 'Add your Google Tag Manager code (GTM-XXXXXX)',
      },
    },
    {
      name: 'siteName',
      type: 'text',
      required: true,
      defaultValue: process.env.SITE_NAME || 'Payload Starter',
    },
    {
      name: 'siteDescription',
      type: 'textarea',
      defaultValue: process.env.SITE_DESCRIPTION || 'A Payload CMS starter template.',
    },
    {
      name: 'iconColor',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'iconWhite',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'logoColor',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'logoWhite',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
