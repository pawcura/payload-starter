import GraphicClient from './index.client'
import { Media } from '@/payload-types'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { isDoc } from '@/utilities/isDoc'

export const Logo = async () => {
  const settings = await getCachedGlobal('settings', 1, {
    logoColor: true,
    logoWhite: true,
  })()

  if (!settings) return null
  if (!isDoc<Media>(settings.logoColor) || !isDoc<Media>(settings.logoWhite)) {
    return null
  }

  return (
    <GraphicClient
      graphicColor={settings.logoColor}
      graphicWhite={settings.logoWhite}
    />
  )
}

export default Logo
