// @/components/Footer/index.tsx
// make sure these import for us
import type { Nav, Page, Media, Setting } from '@/payload-types'
import { isDoc } from '@/utilities/isDoc'
import Link from 'next/link'
import { Logo } from '@/components/Navigation/Logo'
// import our classes from the css module
import classes from './index.module.css'

// let's start with the props we need for our Footer. We'll pick the navItems from the Nav type and
// logoColor and logoWhite from the Setting type
type FooterProps = Partial<Pick<Nav, 'navItems'> & Pick<Setting, 'logoColor' | 'logoWhite'>>
// all these imported for me, so be sure that your IDE imports them as well

// in our Footer constant, we'll pull out the navItems, logoColor, and logoWhite from the FooterProps
export const Footer = ({ navItems, logoColor, logoWhite }: FooterProps) => {
  // and let's start adjusting the footer component
  return (
    // add the classes we initialized to each element
    <footer className={classes.footer}>
      <div className={classes.content}>
        {/* we'll move our isDoc check here and then import our logo component we created for the Nav */}
        {isDoc<Media>(logoColor) && isDoc<Media>(logoWhite) && (
          <Logo className={classes.logo} logoColor={logoColor} logoWhite={logoWhite} />
        )}
        {navItems && navItems.length > 0 && (
          // we'll add an accessibility label to our footer nav
          <nav className={classes.nav} aria-label="Footer navigation">
            {/* and our navItems don't change */}
            {navItems.map((item) => {
              const link = item.link
              if (isDoc<Page>(link)) {
                return (
                  <Link
                    key={link.id}
                    href={link.slug === 'home' ? '/' : `/${link.slug}`}
                    className={classes.navLink}
                    role={'menuitem'}
                  >
                    {link.title}
                  </Link>
                )
              }
              return null
            })}
          </nav>
        )}
        {/* and neither does our copyright information */}
        <p className={classes.copyright}>
          © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_COPYRIGHT_HOLDER || 'My Site'}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
