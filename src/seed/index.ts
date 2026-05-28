import type { Endpoint } from 'payload'
import path from 'path'
import fs from 'fs'

export const seedEndpoint: Endpoint = {
  path: '/seed',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ message: 'You must be logged in to seed the database.' }, { status: 401 })
    }

    const payload = req.payload

    // Check if already seeded
    const existingPages = await payload.find({
      collection: 'pages',
      limit: 1,
      req,
    })

    if (existingPages.totalDocs > 0) {
      return Response.json({
        message: 'Database already has content. Delete existing pages first if you want to re-seed.',
      })
    }

    try {
      // Upload default image
      const imagePath = path.resolve(process.cwd(), 'public/default-og.png')
      const imageBuffer = fs.readFileSync(imagePath)

      const media = await payload.create({
        collection: 'media',
        data: {
          alt: 'Default placeholder image',
        },
        file: {
          data: imageBuffer,
          name: 'seed-image.png',
          mimetype: 'image/png',
          size: imageBuffer.length,
        },
        req,
      })

      // Create category
      const category = await payload.create({
        collection: 'categories',
        data: {
          name: 'General',
        },
        req,
      })

      // Create home page
      const homePage = await payload.create({
        collection: 'pages',
        data: {
          title: 'Home',
          slug: 'home',
          featuredImage: media.id,
          _status: 'published',
          blocks: [
            {
              blockType: 'hero',
              title: 'Welcome to Your New Site',
              showHeroImage: false,
            },
          ],
        },
        req,
      })

      // Create blog page
      const blogPage = await payload.create({
        collection: 'pages',
        data: {
          title: 'Blog',
          slug: 'blog',
          featuredImage: media.id,
          _status: 'published',
          blocks: [],
        },
        req,
      })

      // Create a sample blog post. We push it all the way through the
      // editorial workflow ("published") and pass the disableWorkflow
      // context flag so the seed isn't blocked by role-based transition
      // validation in workflowTransition.ts.
      await payload.create({
        collection: 'posts',
        context: { disableWorkflow: true },
        data: {
          title: 'Your First Post',
          slug: 'your-first-post',
          summary: 'This is a sample blog post created by the seed script. Feel free to edit or delete it.',
          featured: true,
          date: new Date().toISOString(),
          author: req.user.id,
          categories: [category.id],
          featuredImage: media.id,
          workflowStatus: 'published',
          _status: 'published',
          body: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      text: 'Welcome to your new Payload CMS site! This is a sample post to get you started. You can edit this post or create new ones from the admin panel.',
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 1,
                },
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      text: 'Head over to ',
                    },
                    {
                      type: 'text',
                      text: '/admin',
                      format: 1,
                    },
                    {
                      type: 'text',
                      text: ' to manage your content, upload media, and customize your site settings.',
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              version: 1,
            },
          },
        },
        req,
      })

      // Update Settings global
      await payload.updateGlobal({
        slug: 'settings',
        data: {
          siteName: process.env.SITE_NAME || 'Payload Starter',
          siteDescription: process.env.SITE_DESCRIPTION || 'A Payload CMS starter template.',
        },
        req,
      })

      // Update Navigation global
      await payload.updateGlobal({
        slug: 'nav',
        data: {
          navItems: [
            { link: homePage.id },
            { link: blogPage.id },
          ],
        },
        req,
      })

      return Response.json({ message: 'Database seeded successfully! Refreshing...' })
    } catch (error) {
      payload.logger.error({ msg: 'Seed failed', err: error })
      return Response.json(
        { message: `Seed failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 },
      )
    }
  },
}
