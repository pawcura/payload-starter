import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { s3Storage } from '@payloadcms/storage-s3'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { resendAdapter } from '@payloadcms/email-resend'

import { seedEndpoint } from './seed'
import { Users } from './collections/Users/config'
import { Media } from './collections/Media/config'
import { Pages } from '@/collections/Pages/config'
import { Posts } from '@/collections/Posts/config'
import { Settings } from '@/globals/Settings/config'
import { Navigation } from '@/globals/Navigation/config'
import { Categories } from '@/collections/Categories/config'
import { Hero } from '@/blocks/Hero/config'
import { TextAndImage } from '@/blocks/TextAndImage/config'
import { Cards } from '@/blocks/Cards/config'
import { Text } from '@/blocks/Text/config'
import { getServerSideURL } from '@/utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const siteName = process.env.SITE_NAME || 'Payload Starter'
const siteDescription = process.env.SITE_DESCRIPTION || 'A Payload CMS starter template.'

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ` - ${siteName}`,
      description: siteDescription,
      openGraph: {
        description: siteDescription,
        images: [
          {
            url: '/default-og.png',
          },
        ],
      },
      icons: [
        {
          url: '/pe-icon.png',
          type: 'image/png',
          sizes: '64x64',
        },
        {
          url: '/pe-icon-reverse.png',
          type: 'image/png',
          sizes: '64x64',
          media: '(prefers-color-scheme: dark)',
        },
      ],
    },
    components: {
      beforeDashboard: ['@/custom/Components/Admin/SetupGuide.tsx#SetupGuide'],
      graphics: {
        Logo: '@/custom/Components/Admin/Logo.tsx',
        Icon: '@/custom/Components/Admin/Icon.tsx',
      },
    },
  },
  defaultDepth: 2,
  blocks: [Hero, TextAndImage, Cards, Text],
  collections: [Users, Media, Pages, Posts, Categories],
  endpoints: [seedEndpoint],
  globals: [Settings, Navigation],
  ...(process.env.RESEND_API_KEY
    ? {
        email: resendAdapter({
          apiKey: process.env.RESEND_API_KEY,
          defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@example.com',
          defaultFromName: process.env.EMAIL_FROM_NAME || siteName,
        }),
      }
    : {}),
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  sharp,
  plugins: [
    s3Storage({
      collections: {
        media: {
          ...(process.env.S3_PUBLIC_URL
            ? {
                generateFileURL: ({ filename }) =>
                  `${process.env.S3_PUBLIC_URL}/${filename}`,
              }
            : {}),
        },
      },
      bucket: process.env.S3_BUCKET!,
      config: {
        endpoint: process.env.S3_API,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },
        region: process.env.S3_DEFAULT_REGION || 'auto',
        forcePathStyle: true,
      },
    }),
    seoPlugin({
      generateTitle: ({ doc }) => doc.title,
      generateDescription: ({ doc, collectionSlug }) => {
        if (collectionSlug === 'posts') return doc?.summary
        if (collectionSlug === 'pages') return doc?.title
        return siteDescription
      },
      generateURL: ({ doc, collectionSlug }) => {
        const isHome = doc.slug === 'home'
        return `${getServerSideURL()}${collectionSlug === 'pages' ? '' : `/${collectionSlug}`}/${isHome ? '' : doc.slug}`
      },
      generateImage: ({ doc }) => doc.featuredImage,
    }),
  ],
})
