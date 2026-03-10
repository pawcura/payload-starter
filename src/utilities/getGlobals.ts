// @/utilities/getGlobals.ts
// let's get our Config
import type { Config } from '@/payload-types'
// our unstable cache
import { unstable_cache } from 'next/cache'
// and our payload client helper
import { getPayloadClient } from '@/utilities/getPayloadClient'
import { select } from 'payload/shared'

// we'll define a type for our globals using the Config type
// this is pulling out all the keys from the globals object in our payload config
type Global = keyof Config['globals']

// then we'll define a function to get a global and allow a depth to be passed
// this way we can fetch deeply nested data if necessary. but, by default, depth will be 0
async function getGlobal<T extends Global>(
  slug: T,
  depth = 0,
  select?: Config['globalsSelect'][T],
) {
  // initialize payload
  const payload = await getPayloadClient()

  // then return an awaited findGlobal method on payload
  return await payload.findGlobal({
    slug,
    depth,
    select,
  })
}

// now we can handle the unstable cache function
// to do this we'll use what's called a function factory, the outer function will return the unstable cache function
// this allows us to generate reusable cached functions on demand, but it will require us to call it differently.
// we'll get to that in a minute
export const getCachedGlobal = <T extends Global>(slug: T, depth = 0, select?: Config['globalsSelect'][T]) =>
  // the inner function will be the unstable cache function we know and love
  // we'll use an async anonymous function to call getGlobal using the slug and depth
  unstable_cache(
    async () => getGlobal(slug, depth, select),
    // we'll use the slug for our key parts, which acts as a key or ID
    // if the key parts match a previous call, it returns the cached result instead of rerunning the function
    // it also prevents cache collisions. since we're using this for all of our globals, this ensure we don't return the
    // same cached data for our nav as we are our settings
    [
      slug,
      // to ensure we're making our cache key as specific as possible, let's also include the depth as a string
      String(depth),
      // as well as our select, if it exists.
      JSON.stringify(select ?? {}),
    ],
    // finally, we can assign a tag
    {
      tags: [`global_${slug}`],
    },
  )
