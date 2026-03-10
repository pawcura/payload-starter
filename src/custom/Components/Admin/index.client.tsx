'use client'
import { useTheme } from '@payloadcms/ui'
import Image from 'next/image'
import type { Media } from '@/payload-types'

export default function Graphic({
  graphicColor,
  graphicWhite,
}: {
  graphicColor: Media
  graphicWhite: Media
}) {
  const { theme } = useTheme()
  const selectedGraphic = theme === 'light' ? graphicColor : graphicWhite

  if (!selectedGraphic.url) return null

  const { width, alt, height, url } = selectedGraphic as Media

  return <Image width={width!} height={height!} src={url!} alt={alt} />
}
