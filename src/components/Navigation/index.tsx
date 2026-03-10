// @/components/Navigation/index.tsx
// we'll want to add some interactivity to our navigation component, so I'll make this a client component
'use client'

// this way we can use state, effect, and ref
import { useState, useEffect, useRef } from 'react'
// as well as the pathname
import { usePathname } from 'next/navigation'
import type { Nav, Page, Media, Setting } from '@/payload-types'
import { isDoc } from '@/utilities/isDoc'
import Link from 'next/link'
import classes from './index.module.css'
import { Logo } from './Logo'
import { Menu, X } from 'lucide-react'

export const Navigation = ({
  navItems,
  logoColor,
  logoWhite,
  siteName,
}: Pick<Nav, 'navItems'> & Partial<Pick<Setting, 'logoColor' | 'logoWhite'>> & { siteName?: string }) => {
  // let's initialize our state and refs, which will be used to control the menu
  const [menuOpen, setMenuOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  // we'll also store the pathname so we can close the menu on route change
  const pathname = usePathname()

  // we'll use the useEffect hook to close the menu when the pathname changes
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // we'll use another useEffect hook to handle body scroll lock, Escape key, and focus trapping
  // focus trapping will allow us to use the tab key to navigate the menu items when the menu is open
  // that means our tab key won't jump us all over the page when we just want to navigate the menu
  useEffect(() => {
    if (!menuOpen) {
      // we'll set the overflow attribute on the body element to an empty string when the menu is closed
      document.body.style.overflow = ''
      return
    }

    // if it's open, we'll lock the body scroll by setting the overflow attribute to hidden
    document.body.style.overflow = 'hidden'

    // now we can handle our escape key when on key press
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        return
      }

      // next up is focus trapping on Tab
      if (e.key === 'Tab' && navRef.current) {
        // we'll define what's focusable using a query selector
        const focusable = navRef.current.querySelectorAll<HTMLElement>(
          'a[href], button, [tabindex]:not([tabindex="-1"])',
        )
        // if nothing is focusable, we'll return nothing to break the if statement
        if (focusable.length === 0) return

        // let's store the first and last focusable elements
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        // now we'll check if the user is pressing the shift key and if the active element is the first element
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          // this will move focus to the last element
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          // and this will move focus to the first element
          first.focus()
        }
      }
    }

    // now we can add our event listener to the document to handle all our key presses
    document.addEventListener('keydown', handleKeyDown)

    // and we can clean up our event listener when the component unmounts
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
    // all this is dependent on the menuOpen state, so we'll add it to the dependency array
  }, [menuOpen])

  // next, let's setup the class names we'll need for our navigation
  // we'll discuss this in more detail later, but we can join all of our class names with a space
  // and remove any falsy values so our class name stays clean
  const navClassName = [classes.navigation, menuOpen && classes.menuOpen].filter(Boolean).join(' ')

  // now we can return our navigation component
  return (
    // starting with the nav element, which will have a ref and class name as well as an aria-label for accessibility
    <nav ref={navRef} className={navClassName} aria-label="Main navigation">
      {/* we can drop our logo component at the beginning of our nav */}
      {isDoc<Media>(logoColor) && isDoc<Media>(logoWhite) ? (
        <Logo className={classes.logo} logoWhite={logoWhite} logoColor={logoColor} />
      ) : (
        <Link href="/" className={classes.logo}>
          {siteName || 'Payload Starter'}
        </Link>
      )}
      {/* then our hamburger menu button */}
      <button
        className={classes.hamburger} // this will take the hamburger class
        onClick={() => setMenuOpen((prev) => !prev)} // and handle our menuOpen state
        aria-label={menuOpen ? 'Close menu' : 'Open menu'} // then we'll add an aria-label for accessibility
        aria-expanded={menuOpen} // and indicate if the menu is open or closed
      >
        {/* depending on state, we'll render either the menu icon or the close icon */}
        {/* we're going to use the Lucide React icons for these, so install that using pnpm add lucide-react */}
        <Menu className={classes.menuIcon} size={24} aria-hidden="true" />
        <X className={classes.closeIcon} size={24} aria-hidden="true" />
      </button>
      {/* now let's define our overlay */}
      <div className={classes.overlay} onClick={() => setMenuOpen(false)} aria-hidden="true" />
      {/* and then our nav link container with a role of menu */}
      <div className={classes.navLinkContainer} role="menu">
        {/* map through our navItems and render a link for each one */}
        {navItems?.map((item) => {
          // it's best to store each link in a variable
          const link = item.link
          // then check if the link is a document and if it is, render a link
          if (isDoc<Page>(link)) {
            return (
              <Link
                className={classes.navItem}
                key={link.id}
                href={`/${link.slug}`}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                {link.title}
              </Link>
            )
          }
        })}
      </div>
    </nav>
  )
}
