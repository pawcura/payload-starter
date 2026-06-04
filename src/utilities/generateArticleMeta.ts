// @/utilities/generateArticleMeta.ts
import type { Metadata } from 'next'
import type { Post, Setting, User, Category } from '@/payload-types'
import { getServerSideURL } from './getURL'
import { generateMeta } from './generateMeta'
import { isDoc } from '@/utilities/isDoc'

// export a new constant called generateArticleMeta, which takes args
export const generateArticleMeta = async (args: {
  // this is only for our post
  post: Post
  // and we still need our settings
  settings: Setting
  // this also resolves to a Metadata object
}): Promise<Metadata> => {
  // destructure the args
  const { post, settings } = args
  const serverUrl = getServerSideURL()

  // Get the base metadata information from our generateMeta function
  const baseMeta = await generateMeta({
    doc: post,
    settings,
  })

  // and extract author name
  const authorName = isDoc<User>(post.populatedAuthor) ? post.populatedAuthor.name : undefined

  // then get the primary (first) category name
  const primaryCategory = Array.isArray(post.categories) ? post.categories[0] : undefined
  const categoryName = isDoc<Category>(primaryCategory) ? primaryCategory.name : undefined

  // now return the metadata object with the updated open graph properties from our article
  return {
    ...baseMeta,
    openGraph: {
      ...baseMeta.openGraph,
      type: 'article',
      url: `${serverUrl}/blog/${post.slug}`,
      ...(post.date && { publishedTime: post.date }),
      ...(post.updatedAt && { modifiedTime: post.updatedAt }),
      ...(authorName && { authors: [authorName] }),
      ...(categoryName && { section: categoryName }),
    },
    // you'll notice that twitter information is showing up even though we haven't defined it
    // Next.js automatically duplicates the information from open graph to the appropriate twitter options
  }
}
