// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>

export function getAllTimeZonesNames(): { names: string[] } {
  try {
    return { names: (Intl as any).supportedValuesOf('timeZone') || [] }
  } catch {
    return { names: [] }
  }
}

export async function copyToClipboard(params: { text: string }): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(params.text)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = params.text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    return true
  }
}

export default { getAllTimeZonesNames, copyToClipboard }
