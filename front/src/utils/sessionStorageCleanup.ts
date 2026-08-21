// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>

export async function cleanupOrphanedPkceKeys(): Promise<void> {
  try {
    const allKeys: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith("@tu-org/sso-client:pkce:")) {
        allKeys.push(key)
      }
    }
    if (allKeys.length > 100) {
      await new Promise<void>((resolve) => {
        let i = 0
        const chunk = (): void => {
          const end = Math.min(i + 50, allKeys.length)
          for (; i < end; i++) {
            sessionStorage.removeItem(allKeys[i])
          }
          if (i < allKeys.length) {
            requestAnimationFrame(chunk)
          } else {
            resolve()
          }
        }
        chunk()
      })
    }
  } catch {
    // ignore
  }
}