// @/app/(frontend)/[slug]/page.tsx
import { Page as PageType } from '@/payload-types'
import React from 'react'
import { notFound } from 'next/navigation'
import { Blocks } from '@/blocks'
import type { Metadata } from 'next'
import { generateMeta } from '@/utilities/generateMeta'
import { unstable_cache } from 'next/cache'
import { getPayloadClient } from '@/utilities/getPayloadClient'
import { getCachedGlobal } from '@/utilities/getGlobals'


interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const {docs} = await payload.find({
    collection: 'pages',
    limit: 0,
    // we want blog to stay dynamic, though.
    where: {
      slug: {
        not_equals: 'blog',
      }
    }
  })

  return docs.map(doc => ({slug: doc.slug}))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // fetch the page
  const { slug } = await params
  const payload = await getPayloadClient()

  const doc = await payload
    .find({
      collection: 'pages',
      limit: 1,
      where: { slug: { equals: slug } },
      // we need the open graph image
      populate: {
        media: {
          sizes: {
            og: true,
          },
        },
      },
    })
    .then((res) => res.docs[0])

  // and return a fallback title if there is no document
  if (!doc) {
    return { title: 'Page Not Found' }
  }

  // get the settings
  const settings = await getCachedGlobal('settings')()


  // and generate the meta tags using our utility function
  return generateMeta({
    doc,
    settings,
  })
}

export default async function Page({params}: PageProps) {
  const {slug = 'home'} = await params

  const page = await queryPageBySlug({slug})

  if (!page) {
    // If this is the homepage and no page exists, show setup instructions
    if (slug === 'home') {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Welcome to Your New Site</h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.7, maxWidth: '500px', marginBottom: '2rem' }}>
            Your database is empty. Head to the admin panel to create your first user, then seed the
            database or start creating content.
          </p>
          <a
            href="/admin"
            style={{
              display: 'inline-block',
              padding: '12px 32px',
              background: 'light-dark(rgb(30, 30, 30), rgb(235, 235, 235))',
              color: 'light-dark(rgb(235, 235, 235), rgb(30, 30, 30))',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            Go to Admin Panel →
          </a>
        </div>
      )
    }
    return notFound()
  }

  return <Blocks blocks={page.blocks} />
}

const queryPageBySlug = unstable_cache(async ({ slug }: { slug: string }) => {

  const payload = await getPayloadClient()

  const page = await payload.find({
    collection: 'pages',
    limit: 1,
    where: {
      slug: {
        equals: slug,
      },
    },
    populate: {
      media: {
        alt: true,
        blurDataUrl: true,
        sizes: {
          fullSize: true,
          og: true,
          card: true,
        },
        filename: true,
        width: true,
        height: true,
        url: true,
      },
    },
    select: {
      createdAt: false,
      updatedAt: false,
      generateSlug: false,
    },
  })

  return page.docs?.[0] || null
}) as ({slug}: {slug: string}) => Promise<PageType | null>