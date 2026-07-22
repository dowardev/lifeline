export function useAppVersion(): {
  version: string
  label: string
  chipClass: 'alpha' | 'beta' | 'stable'
} {
  const version = __APP_VERSION__

  const isAlpha = version.includes('-alpha')
  const isBeta = !isAlpha && (version.startsWith('0.') || version.includes('-beta'))
  const isStable = !isAlpha && !isBeta

  const label = isStable ? `v${version}` : `${isAlpha ? 'ALPHA' : 'BETA'} v${version}`
  const chipClass = (isAlpha ? 'alpha' : isBeta ? 'beta' : 'stable') as 'alpha' | 'beta' | 'stable'

  return { version, label, chipClass }
}
