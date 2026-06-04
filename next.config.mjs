import { withPayload } from '@payloadcms/next/withPayload'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const s3PublicUrl = process.env.S3_PUBLIC_URL || ''

const urls = s3PublicUrl
  ? [new URL(`${s3PublicUrl}/**`)]
  : []

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root so Next.js doesn't pick up stray lockfiles in parent dirs
  outputFileTracingRoot: __dirname,
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  images: {
    remotePatterns: urls
  }
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
