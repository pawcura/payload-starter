// @/components/PostNavigation/index.tsx
import React from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import classes from './index.module.css'

type PostLink = {
  slug: string
  title: string
} | null

type PostNavigationProps = {
  previousPost: PostLink
  nextPost: PostLink
}

export const PostNavigation: React.FC<PostNavigationProps> = ({ previousPost, nextPost }) => {
  if (!previousPost && !nextPost) return null

  return (
    <nav aria-label="Post navigation" className={classes.nav}>
      <div className={classes.inner}>
        {previousPost ? (
          <Link
            href={`/blog/${previousPost.slug}`}
            className={`${classes.link} ${classes.prev}`}
            aria-label={`Previous post: ${previousPost.title}`}
          >
            <ChevronLeft size={16} aria-hidden="true" />
            <span className={classes.linkContent}>
              <span className={classes.label}>Previous Post</span>
              <span className={classes.title}>{previousPost.title}</span>
            </span>
          </Link>
        ) : (
          <span />
        )}

        {nextPost ? (
          <Link
            href={`/blog/${nextPost.slug}`}
            className={`${classes.link} ${classes.next}`}
            aria-label={`Next post: ${nextPost.title}`}
          >
            <span className={classes.linkContent}>
              <span className={classes.label}>Next Post</span>
              <span className={classes.title}>{nextPost.title}</span>
            </span>
            <ChevronRight size={16} aria-hidden="true" />
          </Link>
        ) : (
          <span />
        )}
      </div>
    </nav>
  )
}
