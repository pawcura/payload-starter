# Payload Starter

A production-ready starter template built with [Payload CMS](https://payloadcms.com), Next.js, MongoDB, and S3-compatible storage.

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/PLACEHOLDER)

## Features

- **Payload CMS 3** with Next.js App Router
- **Pages** with configurable block-based layouts (Hero, Text, Text & Image, Cards)
- **Blog** with categories, featured posts, pagination, and related posts
- **SEO** fields with auto-generated meta tags, Open Graph, sitemaps, and canonical URLs
- **S3 storage** for media with automatic image resizing and blur placeholders
- **Dark mode** support via CSS `light-dark()` with semantic design tokens
- **Seed script** to populate initial content in one click from the admin dashboard
- **Responsive** navigation with mobile menu, focus trapping, and keyboard support

## One-Click Deploy (Railway)

Click the **Deploy on Railway** button above. Railway will provision:

- A MongoDB database
- An S3-compatible object storage bucket
- The Next.js + Payload application

After deployment, visit `/admin` to create your first user, then click **Seed Database** on the dashboard to populate sample content.

## Local Development

### Prerequisites

- Node.js 18.20+ or 20.9+
- pnpm 9 or 10
- MongoDB (local or remote)
- An S3-compatible bucket (Cloudflare R2, AWS S3, MinIO, etc.)

### Setup

```bash
# Clone the repo
git clone <your-repo-url>
cd payload-starter

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
```

Fill in your `.env` values (see [Environment Variables](#environment-variables)), then:

```bash
pnpm dev
```

Visit `http://localhost:3000/admin` to create your first user.

## Seeding the Database

The starter includes a seed script that populates your database with sample content so the site works out of the box. Without seeding, the homepage shows a "Go to Admin Panel" message and the blog returns a 404 (it requires a page with slug `blog`).

### Option 1: One-Click Seed (Recommended)

1. Visit `/admin` and create your first user
2. On the dashboard, click **Seed Database with Sample Content**
3. This creates: a Home page, Blog page, sample blog post, category, navigation links, and site settings

### Option 2: Manual Setup

Create the following manually from the admin panel:

1. A **Home** page with slug `home` — this is your homepage
2. A **Blog** page with slug `blog` — this is your blog index
3. At least one **Media** upload for featured images
4. Update **Settings** (globals) with your site name and description
5. Update **Navigation** (globals) with links to your pages

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URI` | Yes | MongoDB connection string |
| `PAYLOAD_SECRET` | Yes | Secret key for Payload authentication |
| `NEXT_PUBLIC_SERVER_URL` | Yes | Public URL of your site (e.g. `https://yourdomain.com`) |
| `SITE_NAME` | No | Site name used in meta tags and admin (default: `Payload Starter`) |
| `SITE_DESCRIPTION` | No | Default site description for meta tags |
| `NEXT_PUBLIC_COPYRIGHT_HOLDER` | No | Name shown in footer copyright |
| `S3_API` | Yes | S3 endpoint URL |
| `S3_BUCKET` | Yes | S3 bucket name |
| `S3_ACCESS_KEY_ID` | Yes | S3 access key |
| `S3_SECRET_ACCESS_KEY` | Yes | S3 secret key |
| `S3_PUBLIC_URL` | No | Public CDN URL for media (e.g. `https://your-bucket.r2.dev`). If not set, media is served through the app via `/api/media/file/` |
| `RESEND_API_KEY` | No | Resend API key — email features are disabled if not set |
| `EMAIL_FROM_ADDRESS` | No | Sender email address (default: `noreply@example.com`) |
| `EMAIL_FROM_NAME` | No | Sender name (default: value of `SITE_NAME`) |

## Switching from Railway Buckets to Cloudflare R2

Railway provides S3-compatible storage out of the box. If you'd like to use Cloudflare R2 instead:

1. Create an R2 bucket in your Cloudflare dashboard
2. Under **R2 > Manage R2 API Tokens**, create a token with read/write access
3. Under your bucket's **Settings > Public Access**, enable public access and note the public URL
4. Update your environment variables:

```env
S3_API=https://<account-id>.r2.cloudflarestorage.com
S3_BUCKET=your-r2-bucket-name
S3_ACCESS_KEY_ID=your-r2-access-key
S3_SECRET_ACCESS_KEY=your-r2-secret-key
S3_PUBLIC_URL=https://pub-<hash>.r2.dev
```

5. Redeploy your application

> **Note:** Existing media uploaded to Railway's bucket will not be migrated automatically. Upload new media after switching.

## Email (Optional)

Email features (password reset, etc.) use [Resend](https://resend.com). To enable:

1. Create a Resend account and get an API key
2. Verify your sending domain in Resend
3. Set the environment variables:

```env
RESEND_API_KEY=re_xxxxx
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME=My Site
```

If `RESEND_API_KEY` is not set, the app runs normally without email functionality.

## Block Preview Images

The admin block picker shows preview thumbnails stored in `public/blocks/`. You can replace these with your own 480x320 `.webp` images to match your design:

- `public/blocks/hero-block-480x320.webp`
- `public/blocks/text-block-480x320.webp`
- `public/blocks/textandmedia-block-480x320.webp`
- `public/blocks/cards-block-480x320.webp`

## Project Structure

```
src/
├── app/
│   ├── (frontend)/          # Public-facing Next.js pages
│   │   ├── [slug]/          # Dynamic pages (home, about, etc.)
│   │   └── blog/            # Blog index and post pages
│   └── (payload)/           # Payload admin panel
├── blocks/                  # Block configs and components
├── collections/             # Payload collection configs
├── components/              # Shared React components
├── custom/                  # Custom admin components
├── fields/                  # Reusable field configs (SEO)
├── globals/                 # Payload global configs
├── seed/                    # Database seed endpoint
└── utilities/               # Helper functions
```

## License

MIT
