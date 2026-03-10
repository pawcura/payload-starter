import Link from 'next/link'
import React from 'react'
import type { Media } from '@/payload-types'
import { isDoc } from '@/utilities/isDoc'

export const Logo = ({ logoColor, logoWhite, className }: { logoColor: Media; logoWhite: Media, className?: string }) => {
  if (!isDoc<Media>(logoColor) || !isDoc<Media>(logoWhite) || !logoColor.url || !logoWhite.url) {
    return null
  }
  return (
    <Link href={'/'} className={className}>
      <picture>
        <source srcSet={logoWhite.url!} media="(prefers-color-scheme: dark)" />
        <img
          src={logoColor.url!}
          alt={logoColor.alt || ''}
          width={logoColor.width!}
          height={logoColor.height!}
        />
      </picture>
    </Link>
  )
}
