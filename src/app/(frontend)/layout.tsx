// @/app/(frontend)/layout.tsx
import { Metadata } from 'next'
import React from 'react'
import './styles.css'
import type { Media } from '@/payload-types'
import { isDoc } from '@/utilities/isDoc'
import { GoogleTagManager } from '@next/third-parties/google'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import { getCachedGlobal } from '@/utilities/getGlobals'

export async function generateMetadata(): Promise<Metadata> {
  let settings: Awaited<ReturnType<ReturnType<typeof getCachedGlobal<'settings'>>>> | null = null

  try {
    settings = await getCachedGlobal('settings')()
  } catch {
    // Settings global may not exist yet on first deploy
  }

  return {
    title: {
      default: settings?.siteName || process.env.SITE_NAME || 'Payload Starter',
      template: `%s | ${settings?.siteName || process.env.SITE_NAME || 'Payload Starter'}`,
    },
    description:
      settings?.siteDescription || process.env.SITE_DESCRIPTION || 'A Payload CMS starter template.',
    icons: [
      {
        url: '/pe-icon.png',
        type: 'image/png',
        sizes: '64x64',
      },
      {
        url: '/pe-icon-reverse.png',
        type: 'image/png',
        sizes: '64x64',
        media: '(prefers-color-scheme: dark)',
      },
    ],
  }
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  // the navigation and setting both need to populate relationships, so we should set depth to 1, which is the lowest
  // number we need to fetch the data
  let navigation: Awaited<ReturnType<ReturnType<typeof getCachedGlobal<'nav'>>>> | null = null
  let settings: Awaited<ReturnType<ReturnType<typeof getCachedGlobal<'settings'>>>> | null = null

  try {
    navigation = await getCachedGlobal('nav', 1)()
  } catch {
    // Navigation global may not exist yet on first deploy
  }

  try {
    settings = await getCachedGlobal('settings', 1)()
  } catch {
    // Settings global may not exist yet on first deploy
  }

  const { children } = props

  const navItems = navigation?.navItems

  return (
    <html lang="en">
      {settings?.gtmCode && <GoogleTagManager gtmId={settings.gtmCode} />}
      <body>
        {navigation && settings && isDoc<Media>(settings.logoColor) && isDoc<Media>(settings.logoWhite) && (
          <Navigation
            logoColor={settings.logoColor}
            logoWhite={settings.logoWhite}
            navItems={navItems}
          />
        )}
        <main>{children}</main>
        <Footer navItems={navItems} logoColor={settings?.logoColor} logoWhite={settings?.logoWhite} />
      </body>
    </html>
  )
}
