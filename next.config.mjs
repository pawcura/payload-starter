import { withPayload } from '@payloadcms/next/withPayload'

const s3PublicUrl = process.env.S3_PUBLIC_URL || ''

const urls = s3PublicUrl
  ? [new URL(`${s3PublicUrl}/**`)]
  : []

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js config here
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
