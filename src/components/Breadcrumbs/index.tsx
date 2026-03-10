// @/components/Breadcrumbs/index.tsx
import React from 'react'
import Link from 'next/link'
import { getServerSideURL } from '@/utilities/getURL'
import classes from './index.module.css'
import { Container } from '@/components/Container'

// we'll start by defining our BreadcrumbItem interface
interface BreadcrumbItem {
  label: string
  href?: string
}

// and assigning it as an array to our items in BreadcrumbsProps
interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

// then we can pass our items into our Breadcrumbs component
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  // get the server URL
  const serverUrl = getServerSideURL()

  // let's generate the json we need for the breadcrumbs schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    // we can loop through our items and create a ListItem for each one
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href && { item: `${serverUrl}${item.href}` }),
    })),
  }

  // now let's return our breadcrumbs component
  return (
    // we'll group these in a fragment
    <>
      {/* then pass in our json as a script tag with dangerouslySetInnerHTML,
      we don't need to use a Next.js Script component because we're not using any client-side logic
       or external scripts */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* now we can render our breadcrumbs in a wrapper div */}
      <div className={classes.wrapper}>
        {/* we'll use our Container component to keep our breadcrumbs in line with the rest of our content */}
        <Container>
          {/* now we'll use a nav element with an aria-label to describe the breadcrumbs to screen readers */}
          <nav aria-label="Breadcrumb" className={classes.breadcrumbs}>
            {/* we'll render our breadcrumbs as a list */}
            <ol className={classes.list}>
              {/* and map over our items to render each breadcrumb */}
              {items.map((item, index) => (
                <li key={index} className={classes.item}>
                  {/* if the item has a link, we'll render a link */}
                  {item.href ? (
                    <Link href={item.href} className={classes.link}>
                      {item.label}
                    </Link>
                  ) : (
                    //   otherwise, we'll render a span with the current class
                    <span className={classes.current} aria-current="page">
                      {item.label}
                    </span>
                  )}
                  {/* we'll render a separator between breadcrumbs unless it's the last one */}
                  {index < items.length - 1 && (
                    <span className={classes.separator} aria-hidden="true">
                      /
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </Container>
      </div>
    </>
  )
}
