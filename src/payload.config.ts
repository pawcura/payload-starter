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
import { schedulePublishEndpoint } from './endpoints/schedulePublish'
import { importMarkdownEndpoint } from './endpoints/importMarkdown'
import { articlesListEndpoint, articleBySlugEndpoint } from './endpoints/articles'
import { Users } from './collections/Users/config'
import { Doctors } from './collections/Doctors/config'
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
    timezones: {
      // Node's ICU canonicalises `Asia/Kolkata` to `Asia/Calcutta`, so
      // `Intl.supportedValuesOf('timeZone')` (and Payload's validator) only
      // accepts `Asia/Calcutta`. Both refer to the same IANA zone (IST,
      // UTC+05:30); we just relabel it for the admin UI.
      supportedTimezones: ({ defaultTimezones }) => [
        ...defaultTimezones.filter((tz) => tz.value !== 'Asia/Calcutta'),
        { value: 'Asia/Calcutta', label: 'India Standard Time (IST)' },
      ],
      defaultTimezone: 'Asia/Calcutta',
    },
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
  collections: [Users, Doctors, Media, Pages, Posts, Categories],
  endpoints: [
    seedEndpoint,
    schedulePublishEndpoint,
    importMarkdownEndpoint,
    articlesListEndpoint,
    articleBySlugEndpoint,
  ],
  globals: [Settings, Navigation],
  jobs: {
    tasks: [
      {
        // Custom task fired by the /api/schedule-publish endpoint. At the
        // scheduled time it transitions the post's workflowStatus to
        // 'published' (and syncs _status) using the disableWorkflow context
        // flag so the role-gated transition check is bypassed for this
        // trusted server-side flow.
        slug: 'workflowSchedulePublish',
        inputSchema: [{ name: 'postId', type: 'text', required: true }],
        handler: async ({ input, req }) => {
          const { postId } = input as { postId: string }
          await req.payload.update({
            collection: 'posts',
            id: postId,
            context: { disableWorkflow: true },
            req,
            data: {
              workflowStatus: 'published',
              _status: 'published',
            },
          })
          return { output: {} }
        },
      },
    ],
  },
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
