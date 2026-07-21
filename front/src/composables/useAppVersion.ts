export function useAppVersion(): {
  version: string
  isAlpha: boolean
  isBeta: boolean
  isStable: boolean
  label: string
  chipClass: string
} {
  const version = __APP_VERSION__

  const isAlpha = version.includes('-alpha')
  const isBeta = !isAlpha && (version.startsWith('0.') || version.includes('-beta'))
  const isStable = !isAlpha && !isBeta

  const label = isStable ? `v${version}` : `${isAlpha ? 'ALPHA' : 'BETA'} v${version}`
  const chipClass = isAlpha ? 'alpha' : isBeta ? 'beta' : 'stable'

  return { version, isAlpha, isBeta, isStable, label, chipClass }
}
