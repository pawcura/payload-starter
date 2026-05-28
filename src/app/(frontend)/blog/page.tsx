// @/app/(frontend)/blog/page.tsx
import { type PaginatedDocs } from 'payload'
import type { Category, Page as PageType } from '@/payload-types'
import { PUBLIC_WORKFLOW_STATUSES } from '@/collections/Posts/workflow/states'
import React from 'react'
import { notFound } from 'next/navigation'
import { isDoc } from '@/utilities/isDoc'
import { Post } from '@/payload-types'
import { Card } from '@/components/Card'
import { CardContainer } from '@/components/CardContainer'
import { Header } from '@/components/Header'
import classes from './page.module.css'
import { Section } from '@/components/Section'
import { Container } from '@/components/Container'
import { PostPreview } from '@/components/PostPreview'
import { Pagination } from '@/components/Pagination'
import { CategoryFilter } from '@/components/CategoryFilter'
import type { Metadata } from 'next'
import { generateMeta } from '@/utilities/generateMeta'
import { unstable_cache } from 'next/cache'
import { getPayloadClient } from '@/utilities/getPayloadClient'
import { getCachedGlobal } from '@/utilities/getGlobals'

type Props = {
  searchParams: Promise<{
    page?: string
    category?: string
  }>
}

export async function generateMetadata(): Promise<Metadata> {
  const payload = await getPayloadClient()

  const doc = await payload
    .find({
      collection: 'pages',
      limit: 1,
      where: { slug: { equals: 'blog' } },
      populate: {
        media: {
          sizes: {
            og: true,
          },
        },
      },
    })
    .then((res) => res.docs[0])

  if (!doc) {
    return { title: 'Blog Not Found' }
  }

  const settings = await getCachedGlobal('settings')()

  return generateMeta({
    doc,
    settings,
  })
}

export default async function Page({ searchParams }: Props) {
  const { page: pageParam, category: categoryParam } = await searchParams
  const currentPage = Number(pageParam) || 1

  // we'll change this constant page to await our blog page query
  // const page = await queryBlogPage()

  // if (!page) {
  //   return notFound()
  // }

  // I'll do the same for categories
  // const categories = await queryAllCategories()

  // I'll skip to the featured blog first, then we'll finish up with all blogs
  // const featuredBlog = await queryFeaturedBlog()

  // then lastly all the individual blogs, which needs currentPage and categoryParam passed to it
  // const blogs = await queryBlogs(currentPage, categoryParam)

  // instead of running each of these individually, we can group these queries together using Promise all
  // this allows all these to run concurrently, which can speed up the page load
  const [page, categories, featuredBlog, blogs] = await Promise.all([
    queryBlogPage(),
    queryAllCategories(),
    queryFeaturedBlog(),
    queryBlogs(currentPage, categoryParam),
  ])

  if (!page) {
    return notFound()
  }

  const currentSearchParams: Record<string, string | undefined> = {
    category: categoryParam,
  }

  return (
    <>
      <Section>
        <Container>
          <Header as={'h1'} align={'left'} className={classes.pageTitle}>
            {page.title}
          </Header>
          {/* I don't expect us to not have a featured post, but we should still handle the fallback */}
          <div>
            {(featuredBlog || blogs.docs.length > 0) && (
              <>
                <Header align={'left'} className={classes.featuredTitle}>
                  {featuredBlog ? 'Featured Post' : 'Latest Post'}
                </Header>
                {isDoc<Post>(featuredBlog ? featuredBlog : blogs.docs[0]) && (
                  <PostPreview
                    post={featuredBlog ? featuredBlog : blogs.docs[0]}
                    variant="featured"
                    showLink={true}
                    imageSize="fullSize"
                  />
                )}
              </>
            )}
          </div>
        </Container>
      </Section>
      {blogs.docs.length > 1 && (
        <Section backgroundColor={'secondary'}>
          <Container>
            <div>
              <Header>More Posts</Header>
              <CategoryFilter categories={categories.docs} currentCategory={categoryParam} />
              <CardContainer>
                {blogs.docs
                  .filter((post) => !post.featured)
                  .map((post) => (
                    <Card key={post.id} {...post} />
                  ))}
              </CardContainer>
              <Pagination
                totalPages={blogs.totalPages}
                currentPage={currentPage}
                hasPrev={blogs.hasPrevPage}
                hasNext={blogs.hasNextPage}
                searchParams={currentSearchParams}
              />
            </div>
          </Container>
        </Section>
      )}
    </>
  )
}

// we'll do this the same way we did in the other unstable cache
// just copy and paste the constant from above
const queryBlogPage = unstable_cache(async () => {
  const payload = await getPayloadClient()
  const page = await payload.find({
    collection: 'pages',
    limit: 1,
    where: {
      slug: {
        equals: 'blog',
      },
    },
    populate: {
      media: {
        sizes: {
          og: true,
        },
      },
    },
    select: {
      title: true,
      meta: true,
      featuredImage: true,
    },
  })
  return page.docs?.[0] || null
  // we'll cast this just as we did in the other unstable cache
}) as () => Promise<PageType | null>

// then again for the categories
const queryAllCategories = unstable_cache(async () => {
  const payload = await getPayloadClient()
  // we'll return our awaited categories from the payload find
  return await payload.find({
    collection: 'categories',
    limit: 0,
    select: {
      name: true,
      slug: true,
      relatedPosts: true,
    },
    populate: {
      posts: {
        slug: true,
        title: true,
        featured: true,
      },
    },
  })
  // we need to do this again for our categories, but this time as a set of PaginatedDocs
  // make sure Category imports as a type
}) as () => Promise<PaginatedDocs<Category>>

// and again for the featured blog
const queryFeaturedBlog = unstable_cache(
  async () => {
    const payload = await getPayloadClient()
    const featuredBlog = await payload.find({
      collection: 'posts',
      limit: 1,
      where: {
        and: [
          { featured: { equals: true } },
          { _status: { equals: 'published' } },
          { workflowStatus: { in: PUBLIC_WORKFLOW_STATUSES } },
        ],
      },
      populate: {
        categories: {
          name: true,
        },
        media: {
          sizes: {
            fullSize: true,
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
    })
    return featuredBlog.docs?.[0] || null
    // again for our featured blog, but as a single Post
  },
  [],
  {
    tags: ['blog'],
  },
) as () => Promise<Post | null>

// then finally for all our blogs, which needs a few arguments
const queryBlogs = unstable_cache(
  async (currentPage, categoryParam) => {
    const payload = await getPayloadClient()
    // we'll return our awaited blogs using payload find
    // you can do this as a constant if you'd like, but I'm trying to not
    // repeat myself
    return await payload.find({
      collection: 'posts',
      limit: 8,
      page: currentPage,
      where: {
        and: [
          { _status: { equals: 'published' } },
          { workflowStatus: { in: PUBLIC_WORKFLOW_STATUSES } },
          ...(categoryParam
            ? [{ 'categories.slug': { equals: categoryParam } }]
            : []),
        ],
      },
      populate: {
        categories: {
          name: true,
          slug: true,
        },
        media: {
          sizes: {
            fullSize: true,
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
  // for the blogs, we'll want a way to revalidate all of our blogs wherever they're located. we can do that by passing in tags
  // but first, unstable cache needs something called key parts, which we can skip by including an empty array
  [],
  {
    tags: ['blog'],
    // then finally for our blogs by passing in our arguments and the promise of paginated posts
  },
) as (currentPage: number, categoryParam?: string) => Promise<PaginatedDocs<Post>>
