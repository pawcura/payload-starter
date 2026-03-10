// @/components/Pagination/index.tsx
import React from 'react'
// let Link import for me
import Link from 'next/link'
import classes from './index.module.css'

// we'll create a type for our pagination props
type PaginationProps = {
  // total pages will come from our payload query
  totalPages: number
  // and the currentPage is defined in the page parameter we set up. it defaults to 1, so it should
  // never be null or undefined
  currentPage: number
  // then we'll pass in the current search params to we want to preserve
  searchParams?: Record<string, string | undefined>
  hasPrev: boolean
  hasNext: boolean
}

// building the URL for our pagination is simple, but it's extra logic that we should pull out into its own
// utility function. we're only using this here, so it doesn't make sense to create it elsewhere
function buildHref(
  page: number,
  searchParams?: Record<string, string | undefined>
  // this function returns a string, which is our URL with parameters
): string {
  // first initialize the parameters using the URLSearchParams class.
  const params = new URLSearchParams()
  // if we have search params, we'll loop through them and add them to params constant
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== 'page') {
        params.set(key, value)
      }
    })
  }
  // if the page is greater than 1, we'll add it to the search params
  if (page > 1) {
    params.set('page', String(page))
  }
  // otherwise if there is a query string, we'll return that.
  const queryString = params.toString()
  // check if I need to return the ?
  return queryString ? `?${queryString}` : '?'
}

// then we'll export our Pagination component as a function component with our PaginationProps
export const Pagination: React.FC<PaginationProps> = ({
  // pull out the totalPages and currentPage from our props as well as the searchParams
  totalPages,
  currentPage,
  searchParams,
  // the hasPrev and hasNext props are passed down from payload
  hasPrev,
  hasNext
}) => {
  // if there's only one page, return null. there are no links to navigate to
  if (totalPages <= 1) return null

  // Build page numbers array to display on the frontend
  const pages: number[] = []
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i)
  }

  // let's get started with displaying the pagination component. we'll add class names as we go
  return (
    // we'll use a nav element with an aria-label to describe the pagination to screen readers
    <nav aria-label="Pagination" className={classes.pagination}>
      {/* using an ordered list here makes this component more accessible by allowing keyboard navigation */}
      <ol className={classes.list}>
        {/* now we need to add the Previous and Next links, as well as the page numbers */}
        <li>
          {/* if there is a previous page, we'll render a link. otherwise, we'll render a span with the disabled class */}
          {/* we'll determine the link by using the helper function we created earlier */}
          {hasPrev ? (
            <Link
              href={buildHref(currentPage - 1, searchParams)}
              className={`${classes.link} ${classes.arrow}`}
              aria-label="Previous page"
            >
              Previous
            </Link>
          ) : (
            <span
              className={`${classes.link} ${classes.arrow} ${classes.disabled}`}
              aria-disabled="true"
            >
              Previous
            </span>
          )}
        </li>

        {/* we'll then create a span of clickable page numbers but disable the current page */}
        {pages.map((page) => (
          <li key={page}>
            {page === currentPage ? (
              <span className={`${classes.link} ${classes.active}`} aria-current="page">
                {page}
              </span>
            ) : (
              <Link
                href={buildHref(page, searchParams)}
                className={classes.link}
                aria-label={`Page ${page}`}
              >
                {page}
              </Link>
            )}
          </li>
        ))}

        {/* and lastly we'll render the Next link */}
        <li>
          {hasNext ? (
            <Link
              href={buildHref(currentPage + 1, searchParams)}
              className={`${classes.link} ${classes.arrow}`}
              aria-label="Next page"
            >
              Next
            </Link>
          ) : (
            <span
              className={`${classes.link} ${classes.arrow} ${classes.disabled}`}
              aria-disabled="true"
            >
              Next
            </span>
          )}
        </li>
      </ol>
    </nav>
  )
}

// now we can work on the styling