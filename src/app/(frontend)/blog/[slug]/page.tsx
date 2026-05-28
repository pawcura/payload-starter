// @/app/(frontend)/blog/[slug]/page.tsx
import { PaginatedDocs } from 'payload'
import React from 'react'
import { notFound } from 'next/navigation'
import { isDoc } from '@/utilities/isDoc'
import { Post } from '@/payload-types'
import { Card } from '@/components/Card'
import { CardContainer } from '@/components/CardContainer'
import { RichText } from '@/components/RichText'
import { PostPreview } from '@/components/PostPreview'
import { Section } from '@/components/Section'
import { Container } from '@/components/Container'
import { Header } from '@/components/Header'
import classes from './page.module.css'
import { PostNavigation } from '@/components/PostNavigation'
import type { Metadata } from 'next'
import { generateArticleMeta } from '@/utilities/generateArticleMeta'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { unstable_cache } from 'next/cache'
import { getPayloadClient } from '@/utilities/getPayloadClient'
import { getCachedGlobal } from '@/utilities/getGlobals'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'posts',
    limit: 0,
    where: {
      _status: { equals: 'published' },
    },
  })

  return docs.map((doc) => ({ slug: doc.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayloadClient()

  const post = await payload
    .find({
      collection: 'posts',
      limit: 1,
      where: {
        and: [
          { slug: { equals: slug } },
          { _status: { equals: 'published' } },
        ],
      },
      populate: {
        media: {
          sizes: {
            og: true,
          },
        },
      },
    })
    .then((res) => res.docs[0])

  if (!post) {
    return { title: 'Post Not Found' }
  }

  const settings = await getCachedGlobal('settings')()

  return generateArticleMeta({ post, settings })
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params

  const post = await queryPost({ slug })

  if (!post) {
    return notFound()
  }

  const [relatedPosts, previousPost, nextPost] = await Promise.all([
    queryRelatedPosts({ post }),
    queryPreviousPost({ post }),
    queryNextPost({ post }),
  ])

  const { title } = post

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: title },
  ]

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />
      <Section>
        <Container>
          <Header as="h1" align={'left'} className={classes.blogHeader}>
            {title}
          </Header>
          {isDoc<Post>(post) && (
            <PostPreview post={post} variant="header" showLink={false} imageSize="fullSize" />
          )}
        </Container>
      </Section>
      <main>
        <article className={classes.article}>
          <RichText data={post.body} />
        </article>
      </main>
      <PostNavigation previousPost={previousPost} nextPost={nextPost} />
      {relatedPosts.docs.length > 0 && (
        <Section>
          <Container>
            <Header>Related Posts</Header>
            <CardContainer variant={'compact'}>
              {/* same thing here */}
              {relatedPosts.docs.map((post) => (
                <Card key={post.id} {...post} />
              ))}
            </CardContainer>
          </Container>
        </Section>
      )}
    </>
  )
}

const queryPost = unstable_cache(
  async ({ slug }) => {
    const payload = await getPayloadClient()
    const post = await payload.find({
      collection: 'posts',
      limit: 1,
      where: {
        and: [
          { slug: { equals: slug } },
          { _status: { equals: 'published' } },
        ],
      },
      populate: {
        categories: {
          name: true,
        },
        media: {
          sizes: {
            fullSize: true,
          },
          height: true,
          width: true,
          blurDataUrl: true,
          url: true,
          filename: true,
        },
      },
      select: {
        updatedAt: false,
        generateSlug: false,
      },
    })
    return post.docs?.[0] || null
  },
  [],
  {
    tags: ['blog'],
  },
) as ({ slug }: { slug: string }) => Promise<Post | null>

const queryRelatedPosts = unstable_cache(
  async ({ post }: { post: Pick<Post, 'slug' | 'categories'> }) => {
    const payload = await getPayloadClient()

    // Use the primary (first) category to find related posts.
    // For a hasMany relationship, `equals` matches any post that contains this category.
    const primaryCategory = Array.isArray(post.categories) ? post.categories[0] : undefined
    const primaryCategoryId =
      primaryCategory && typeof primaryCategory === 'object' ? primaryCategory.id : primaryCategory

    if (!primaryCategoryId) {
      return { docs: [], totalDocs: 0, totalPages: 0, page: 1, pagingCounter: 1, hasPrevPage: false, hasNextPage: false, prevPage: null, nextPage: null, limit: 4 } as unknown as PaginatedDocs<Post>
    }

    return await payload.find({
      collection: 'posts',
      limit: 4,
      where: {
        slug: {
          not_equals: post.slug,
        },
        categories: {
          equals: primaryCategoryId,
        },
        _status: {
          equals: 'published',
        },
      },
      populate: {
        categories: {
          name: true,
        },
        media: {
          sizes: {
            card: true,
          },
          height: true,
          width: true,
          blurDataUrl: true,
          url: true,
          filename: true,
        },
      },
      select: {
        createdAt: false,
        updatedAt: false,
        generateSlug: false,
      },
      sort: '-date',
    })
  },
  [],
  {
    tags: ['blog'],
  },
) as ({ post }: { post: Pick<Post, 'slug' | 'categories'> }) => Promise<PaginatedDocs<Post>>

const queryPreviousPost = unstable_cache(
  async ({ post }: { post: Pick<Post, 'slug' | 'categories' | 'date' | 'createdAt'> }) => {
    const payload = await getPayloadClient()
    const previousPost = await payload.find({
      collection: 'posts',
      limit: 1,
      where: {
        slug: {
          not_equals: post.slug,
        },
        _status: {
          equals: 'published',
        },
        or: [
          {
            date: {
              less_than: post.date,
            },
          },
          {
            and: [
              {
                date: {
                  equals: post.date,
                },
              },
              {
                createdAt: {
                  less_than: post.createdAt,
                },
              },
            ],
          },
        ],
      },
      sort: ['-date', '-createdAt'],
      select: {
        slug: true,
        title: true,
      },
    })
    return previousPost.docs?.[0] || null
  },
  [],
  {
    tags: ['blog'],
  },
) as ({
  post,
}: {
  post: Pick<Post, 'slug' | 'categories' | 'date' | 'createdAt'>
}) => Promise<Post | null>

const queryNextPost = unstable_cache(
  async ({ post }: { post: Pick<Post, 'slug' | 'categories' | 'date' | 'createdAt'> }) => {
    const payload = await getPayloadClient()
    const nextPost = await payload.find({
      collection: 'posts',
      limit: 1,
      where: {
        slug: {
          not_equals: post.slug,
        },
        _status: {
          equals: 'published',
        },
        or: [
          {
            date: {
              greater_than: post.date,
            },
          },
          {
            and: [
              {
                date: {
                  equals: post.date,
                },
              },
              {
                createdAt: {
                  greater_than: post.createdAt,
                },
              },
            ],
          },
        ],
      },
      sort: ['date', 'createdAt'],
      select: {
        slug: true,
        title: true,
      },
    })
    return nextPost.docs?.[0] || null
  },
  [],
  {
    tags: ['blog'],
  },
) as ({
  post,
}: {
  post: Pick<Post, 'slug' | 'categories' | 'date' | 'createdAt'>
}) => Promise<Post | null>
