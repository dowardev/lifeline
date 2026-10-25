// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { describe, it, expect } from 'vitest'
import {
  pickForegroundColor,
  foregroundContrastRatio,
  relativeLuminance,
  contrastRatio,
  effectiveColor,
  DARK_FOREGROUND,
  LIGHT_FOREGROUND,
} from '@/utils/colorContrast'

/**
 * LBDS-305 - the source indicator paints the source color (chosen by
 * the user) as its background, so the icon's foreground has to be
 * derived from it.
 *
 * The assertions are made on the CONTRAST RATIO the chosen foreground
 * achieves, not on a hardcoded foreground string: the guarantee the
 * indicator needs is WCAG AA (4.5:1), and that is the property that
 * must not regress.
 */
describe('pickForegroundColor', () => {
  const BACKGROUNDS = [
    '#3880ff', // Ionic primary blue
    '#4285f4', // Google blue
    '#ff8800', // CalDAV orange
    '#fff800', // bright yellow
    '#00ff00', // bright green
    '#8b0000', // dark red
    '#4b0082', // dark purple
    '#f00',
    '#0f0',
    '#00f',
    '#ffffff',
    '#000000',
    'rgb(56, 128, 255)',
    'rgb(255, 136, 0)',
    'rgba(56, 128, 255, 0.5)',
    'rgba(255, 136, 0, 0.8)',
  ]

  it('always reaches WCAG AA (4.5:1) against the background', () => {
    for (const background of BACKGROUNDS) {
      expect(
        foregroundContrastRatio(background),
        `contrast too low for ${background}`,
      ).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('picks one of the two foregrounds', () => {
    for (const background of BACKGROUNDS) {
      expect([DARK_FOREGROUND, LIGHT_FOREGROUND]).toContain(pickForegroundColor(background))
    }
  })

  it('returns dark text on a bright background', () => {
    expect(pickForegroundColor('#ffffff')).toBe(DARK_FOREGROUND)
    expect(pickForegroundColor('#fff800')).toBe(DARK_FOREGROUND)
    expect(pickForegroundColor('#00ff00')).toBe(DARK_FOREGROUND)
    expect(pickForegroundColor('#ff8800')).toBe(DARK_FOREGROUND)
  })

  it('returns light text on a dark background', () => {
    expect(pickForegroundColor('#000000')).toBe(LIGHT_FOREGROUND)
    expect(pickForegroundColor('#8b0000')).toBe(LIGHT_FOREGROUND)
    expect(pickForegroundColor('#4b0082')).toBe(LIGHT_FOREGROUND)
    expect(pickForegroundColor('#00f')).toBe(LIGHT_FOREGROUND)
  })

  it('picks the mathematically better foreground for mid-tone blues', () => {
    // #3880ff and #4285f4 are mid-tones: black reaches ~5.7:1 and
    // ~6:1 while white only reaches ~3.7:1 and ~3.5:1. White would
    // FAIL WCAG AA on these, so the helper must not return it.
    expect(pickForegroundColor('#3880ff')).toBe(DARK_FOREGROUND)
    expect(pickForegroundColor('#4285f4')).toBe(DARK_FOREGROUND)
    expect(foregroundContrastRatio('#3880ff')).toBeGreaterThan(4.5)
    expect(foregroundContrastRatio('#4285f4')).toBeGreaterThan(4.5)
  })

  it('handles short hex format', () => {
    expect(pickForegroundColor('#f00')).toBe(DARK_FOREGROUND)
    expect(pickForegroundColor('#0f0')).toBe(DARK_FOREGROUND)
    expect(pickForegroundColor('#00f')).toBe(LIGHT_FOREGROUND)
  })

  it('handles rgb() and rgba() formats', () => {
    expect(pickForegroundColor('rgb(56, 128, 255)')).toBe(DARK_FOREGROUND)
    expect(pickForegroundColor('rgb(255, 136, 0)')).toBe(DARK_FOREGROUND)
    expect(pickForegroundColor('rgb(255, 255, 0)')).toBe(DARK_FOREGROUND)
    expect(pickForegroundColor('rgba(56, 128, 255, 0.5)')).toBe(DARK_FOREGROUND)
    expect(pickForegroundColor('rgba(255, 136, 0, 0.8)')).toBe(DARK_FOREGROUND)
  })

  it('falls back to dark text for unparseable colors', () => {
    expect(pickForegroundColor('not-a-color')).toBe(DARK_FOREGROUND)
    expect(pickForegroundColor('')).toBe(DARK_FOREGROUND)
    expect(pickForegroundColor('transparent')).toBe(DARK_FOREGROUND)
  })

  it('computes luminance and contrast per WCAG', () => {
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 5)
    expect(relativeLuminance([0, 0, 0])).toBeCloseTo(0, 5)
    expect(contrastRatio(1, 0)).toBeCloseTo(21, 5)
    expect(contrastRatio(0.4, 0.4)).toBe(1)
  })

  it('flattens a translucent color over the light backdrop', () => {
    // Fully transparent black over white IS white -> dark text.
    expect(pickForegroundColor('rgba(0, 0, 0, 0)')).toBe(DARK_FOREGROUND)
    expect(foregroundContrastRatio('rgba(0, 0, 0, 0)')).toBeCloseTo(21, 5)

    // 8-digit hex alpha is honoured the same way.
    expect(pickForegroundColor('#00000000')).toBe(DARK_FOREGROUND)

    // A half-transparent dark color over white is still light enough
    // for dark text, and the ratio must reflect the composite.
    const half = foregroundContrastRatio('rgba(0, 0, 0, 0.5)')
    expect(half).toBeGreaterThanOrEqual(4.5)
    expect(half).toBeLessThan(21)
  })

  it('keeps an opaque color unaffected by the backdrop logic', () => {
    expect(pickForegroundColor('#3880ff')).toBe(pickForegroundColor('rgb(56, 128, 255)'))
    expect(foregroundContrastRatio('#3880ff')).toBeCloseTo(
      foregroundContrastRatio('rgb(56, 128, 255)'),
      5,
    )
  })

  it('exposes the effective (composited) color', () => {
    expect(effectiveColor('#ff8800')).toEqual([255, 136, 0])
    expect(effectiveColor('rgb(255, 136, 0)')).toEqual([255, 136, 0])
    // Fully transparent black over white composites to white.
    expect(effectiveColor('rgba(0, 0, 0, 0)')).toEqual([255, 255, 255])
  })
})
