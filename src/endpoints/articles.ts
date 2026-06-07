// @/endpoints/articles.ts
//
// GET /api/articles
// GET /api/articles/:slug
//
// Returns a "brief" view of published Posts (a.k.a. Articles) for use by
// headless consumers that render listing cards / related-post widgets and
// don't need the full Lexical body. Compared to the canonical /api/posts
// response, this endpoint:
//
//   - drops the heavy Lexical `body` from the wire payload,
//   - flattens `author`, `featuredImage`, `categories` and `meta` into the
//     small set of fields actually used on a card,
//   - computes a server-side `readTime` (in minutes) so consumers don't need
//     to walk the Lexical AST themselves.
//
// Auth follows the same gate as the Posts collection: a signed-in admin user
// is allowed, otherwise the caller must present `CMS_READ_API_KEY` via
// `Authorization: Bearer ...` or `X-CMS-Read-Key`. Drafts and not-yet-public
// workflow states are never returned.

import type { Endpoint, PaginatedDocs, Where } from 'payload'

import type { Category, Media, Post, User } from '@/payload-types'
import { PUBLIC_WORKFLOW_STATUSES } from '@/collections/Posts/workflow/states'
import { canReadCmsContent } from '@/utilities/cmsReadApiKey'

const WORDS_PER_MINUTE = 200
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 100

type BriefMedia = {
  id: string
  url: string | null
  alt: string | null
  width: number | null
  height: number | null
  blurDataUrl: string | null
}

type BriefCategory = {
  id: string
  name: string | null
  slug: string | null
}

type BriefAuthor = {
  id: string | null
  name: string | null
  avatar: string | null
  role: string | null
  bio: string | null
}

type BriefArticle = {
  id: string
  slug: string
  title: string
  summary: string | null
  date: string | null
  updatedAt: string
  createdAt: string
  featured: boolean
  readTime: number
  author: BriefAuthor
  category: BriefCategory | null
  categories: BriefCategory[]
  featuredImage: BriefMedia | null
  meta: {
    title: string | null
    description: string | null
  } | null
}

const jsonError = (message: string, status: number) => Response.json({ error: message }, { status })

const isObject = <T extends object>(v: unknown): v is T => Boolean(v) && typeof v === 'object'

const toMedia = (m: Post['featuredImage'] | null | undefined): BriefMedia | null => {
  if (!isObject<Media>(m)) return null
  return {
    id: m.id,
    url: m.url ?? null,
    alt: m.alt ?? null,
    width: m.width ?? null,
    height: m.height ?? null,
    blurDataUrl: m.blurDataUrl ?? null,
  }
}

const toCategory = (c: string | Category): BriefCategory | null => {
  if (!isObject<Category>(c)) return null
  return {
    id: c.id,
    name: c.name ?? null,
    slug: c.slug ?? null,
  }
}

const toAuthor = (post: Post): BriefAuthor => {
  // Headless callers (CMS_READ_API_KEY) can't read the Users collection, so
  // `post.author` is just the ID string. Fall back to `populatedAuthor`,
  // which the Posts `afterRead` hook fills with a public-safe subset
  // regardless of caller access.
  const user = isObject<User>(post.author) ? post.author : null
  const populated = post.populatedAuthor ?? null
  const userAvatar = user && isObject<Media>(user.profilePic) ? (user.profilePic.url ?? null) : null

  return {
    id: user?.id ?? populated?.id ?? null,
    name: user?.name ?? populated?.name ?? null,
    avatar: userAvatar ?? populated?.profilePicUrl ?? null,
    role: user?.role ?? null,
    bio: user?.bio ?? populated?.bio ?? null,
  }
}

type LexicalChildNode = {
  type?: unknown
  text?: unknown
  children?: unknown
  [k: string]: unknown
}

const extractText = (node: LexicalChildNode): string => {
  if (typeof node.text === 'string') return node.text
  if (!Array.isArray(node.children)) return ''
  return (node.children as LexicalChildNode[]).map(extractText).join(' ')
}

const estimateReadTime = (post: Post): number => {
  const root = post.body?.root as { children?: LexicalChildNode[] } | undefined
  const children = root?.children
  if (!Array.isArray(children) || children.length === 0) return 1
  const words = children.map(extractText).join(' ').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))
}

const toBriefArticle = (post: Post): BriefArticle => {
  const categories = (post.categories ?? [])
    .map(toCategory)
    .filter((c): c is BriefCategory => c !== null)

  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    summary: post.summary ?? null,
    date: post.date ?? null,
    updatedAt: post.updatedAt,
    createdAt: post.createdAt,
    featured: Boolean(post.featured),
    readTime: estimateReadTime(post),
    author: toAuthor(post),
    category: categories[0] ?? null,
    categories,
    featuredImage: toMedia(post.featuredImage),
    meta: post.meta
      ? {
          title: post.meta.title ?? null,
          description: post.meta.description ?? null,
        }
      : null,
  }
}

const parseInt = (raw: string | null, fallback: number): number => {
  if (!raw) return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

const parseBool = (raw: string | null): boolean | null => {
  if (raw === null) return null
  const v = raw.trim().toLowerCase()
  if (v === '1' || v === 'true' || v === 'yes') return true
  if (v === '0' || v === 'false' || v === 'no') return false
  return null
}

// Selecting `body: false` keeps the local API from serialising the Lexical
// state we don't need on the wire. We still pull it via a follow-up read for
// readTime computation only when callers ask for it (cheap path by default).
const briefSelect = {
  slug: true,
  title: true,
  summary: true,
  date: true,
  updatedAt: true,
  createdAt: true,
  featured: true,
  workflowStatus: true,
  author: true,
  populatedAuthor: true,
  categories: true,
  featuredImage: true,
  meta: true,
  // We need body to compute readTime. Drop from output, not from the fetch.
  body: true,
} as const

const buildPublishedWhere = (extra?: Where): Where => {
  const base: Where = {
    and: [
      { _status: { equals: 'published' } },
      { workflowStatus: { in: PUBLIC_WORKFLOW_STATUSES } },
    ],
  }
  if (!extra) return base
  return { and: [...(base.and as Where[]), extra] }
}

export const articlesListEndpoint: Endpoint = {
  path: '/articles',
  method: 'get',
  handler: async (req) => {
    if (!canReadCmsContent(req)) {
      return jsonError('Unauthorized.', 401)
    }
    const params = req.searchParams ?? new URL(req.url ?? 'http://localhost').searchParams

    const requestedLimit = parseInt(params.get('limit'), DEFAULT_LIMIT)
    const limit = Math.min(Math.max(1, requestedLimit), MAX_LIMIT)
    const page = Math.max(1, parseInt(params.get('page'), 1))
    const sort = params.get('sort')?.trim() || '-date'
    const slug = params.get('slug')?.trim() || null
    const categorySlug = params.get('category')?.trim() || null
    const featured = parseBool(params.get('featured'))
    const search = params.get('q')?.trim() || null

    const filters: Where[] = []
    if (slug) filters.push({ slug: { equals: slug } })
    if (categorySlug) filters.push({ 'categories.slug': { equals: categorySlug } })
    if (featured !== null) filters.push({ featured: { equals: featured } })
    if (search) {
      filters.push({
        or: [{ title: { like: search } }, { summary: { like: search } }],
      })
    }

    const where = buildPublishedWhere(
      filters.length === 1 ? filters[0] : filters.length > 1 ? { and: filters } : undefined,
    )

    try {
      const result = (await req.payload.find({
        collection: 'posts',
        depth: 2,
        limit,
        page,
        sort,
        where,
        select: briefSelect,
        req,
      })) as PaginatedDocs<Post>

      return Response.json({
        docs: result.docs.map(toBriefArticle),
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        page: result.page ?? page,
        limit: result.limit ?? limit,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      })
    } catch (err) {
      req.payload.logger.error({ err }, 'GET /api/articles failed')
      return jsonError('Failed to load articles.', 500)
    }
  },
}

export const articleBySlugEndpoint: Endpoint = {
  path: '/articles/:slug',
  method: 'get',
  handler: async (req) => {
    if (!canReadCmsContent(req)) {
      return jsonError('Unauthorized.', 401)
    }

    const slug = typeof req.routeParams?.slug === 'string' ? req.routeParams.slug : null
    if (!slug) return jsonError('`slug` is required.', 400)

    try {
      const result = (await req.payload.find({
        collection: 'posts',
        depth: 2,
        limit: 1,
        where: buildPublishedWhere({ slug: { equals: slug } }),
        select: briefSelect,
        req,
      })) as PaginatedDocs<Post>

      const doc = result.docs[0]
      if (!doc) return jsonError('Article not found.', 404)

      return Response.json(toBriefArticle(doc))
    } catch (err) {
      req.payload.logger.error({ err, slug }, 'GET /api/articles/:slug failed')
      return jsonError('Failed to load article.', 500)
    }
  },
}
