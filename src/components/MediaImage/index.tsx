import Image from 'next/image'
import type { Media } from '@/payload-types'
import { getMediaSize } from '@/utilities/getMediaSize'
import classes from './index.module.css'

// we'll set up our media image props to keep the component clean
type MediaImageProps = {
  image: Media
  size?: keyof NonNullable<Media['sizes']>
  flex?: boolean
  className?: string
}

export function MediaImage({ image, size, flex, className, ...rest }: MediaImageProps & React.HTMLAttributes<HTMLDivElement>) {
  // since we're adding flex conditionally, I want to make sure that I don't add extra whitespace or
  // unnecessary "undefined" class names. We can do this by filtering out falsy values in an array of classes.
  const classNames = [classes.imageWrapper, flex && classes.flex, className]
    .filter(Boolean)
    .join(' ')
  const src = getMediaSize(image, size).url!
  // skip Next.js image optimization for images served through Payload's file proxy
  // (used when no S3 public CDN URL is configured)
  const isProxied = src.startsWith('/api/')
  return (
    // then pass in the processed class names into the outer div
    <div className={classNames} {...rest}>
      {/* remove the size strings and replace them with the size prop */}
      <Image
        src={src}
        alt={image.alt || ''}
        width={getMediaSize(image, size).width!}
        height={getMediaSize(image, size).height!}
        blurDataURL={image.blurDataUrl!}
        placeholder="blur"
        unoptimized={isProxied}
      />
    </div>
  )
}
