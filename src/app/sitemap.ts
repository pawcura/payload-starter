import type { MetadataRoute } from 'next'
import { getServerSideURL } from '@/utilities/getURL'
import { getPayloadClient } from '@/utilities/getPayloadClient'

// we'll export an async function to generate our sitemap using Next.js's MetadataRoute.Sitemap type
// this is a special function that generates a sitemap.xml file for us
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseURL = getServerSideURL()

  try {
    // let's initialize payload and get the base URL for our site
    const payload = await getPayloadClient()

    //  we'll need to fetch all pages and posts with addToSitemap enabled from our SEO field
    const pages = await payload.find({
      collection: 'pages',
      // we can access nested fields using dot notation as a string
      where: {
        'meta.addToSitemap': {
          equals: true,
        },
      },
      // limit: 0 fetches all pages
      limit: 0,
    })

    // then do the same thing for posts
    const posts = await payload.find({
      collection: 'posts',
      where: {
        'meta.addToSitemap': {
          equals: true,
        },
      },
      limit: 0,
    })

    // then we can map through our pages, and return an array of sitemap entries. the order of pages doesn't matter for SEO, so I don't care that the home page isn't first
    const pageEntries: MetadataRoute.Sitemap = pages.docs.map((page) => ({
      // Google and most other search engines don't care about anything other than the url and lastModified date
      // and lastModified date is only used if it's accurate. Luckily, Payload provides a way to track that accurately
      url: `${baseURL}/${
        // check the page to see if it's the home page and handle it accordingly
        page.slug === 'home' ? '' : page.slug
      }`,
      lastModified: new Date(page.updatedAt),
      // priority and changeFrequency don't matter
    }))

    // then do the same thing for your postEntries
    const postEntries: MetadataRoute.Sitemap = posts.docs.map((post) => ({
      url: `${baseURL}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
    }))

    // and finally return all your pages and posts
    return [...pageEntries, ...postEntries]
  } catch {
    // Return an empty sitemap if the database is not yet available
    return [{ url: baseURL }]
  }
}