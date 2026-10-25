// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

/**
 * LBDS-305 - WCAG contrast helper for the calendar picker's source
 * indicator.
 *
 * The indicator paints the source color (the one the user chose for
 * the calendar account) as its background, so the foreground has to be
 * derived from it. Picking by contrast RATIO (not by a luminance
 * threshold) is what makes the result provably readable: for any
 * background, the better of black/white is the one with the larger
 * ratio, and that choice is always at least 4.5:1 (WCAG AA for the
 * indicator's size).
 *
 * Formulas follow WCAG 2.1:
 *   relative luminance  L = 0.2126*R + 0.7152*G + 0.0722*B
 *   contrast ratio      (L_lighter + 0.05) / (L_darker + 0.05)
 */

/** Foreground used on a light background. */
export const DARK_FOREGROUND = '#000';

/** Foreground used on a dark background. */
export const LIGHT_FOREGROUND = '#fff';

/**
 * The backdrop the indicator is painted over when the source color is
 * translucent. The picker sits on the app's light surface, so a
 * translucent source color is composited over white before the
 * contrast is computed. Ignoring the alpha would overestimate the
 * contrast of a translucent color and could pick an unreadable
 * foreground.
 */
const BACKDROP: [number, number, number] = [255, 255, 255];

/**
 * Parse a CSS color string (hex, rgb, rgba) into an [r, g, b] tuple
 * with components in the 0..255 range. Returns null when the string
 * cannot be parsed.
 */
function parseColor(color: string): [number, number, number] | null {
  const trimmed = color.trim();

  const hexMatch = trimmed.match(/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
  if (hexMatch) {
    const hex = hexMatch[1];
    if (hex.length === 3 || hex.length === 4) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
      ];
    }
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }

  const rgbMatch = trimmed.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+))?\s*\)$/i,
  );
  if (rgbMatch) {
    return [
      Math.min(255, Math.max(0, parseInt(rgbMatch[1], 10))),
      Math.min(255, Math.max(0, parseInt(rgbMatch[2], 10))),
      Math.min(255, Math.max(0, parseInt(rgbMatch[3], 10))),
    ];
  }

  return null;
}

/**
 * The alpha channel of a CSS color, 0..1. Colors without an explicit
 * alpha are fully opaque.
 */
function parseAlpha(color: string): number {
  const trimmed = color.trim();

  const hexMatch = trimmed.match(/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
  if (hexMatch) {
    const hex = hexMatch[1];
    if (hex.length === 4) {
      return parseInt(hex[3] + hex[3], 16) / 255;
    }
    if (hex.length === 8) {
      return parseInt(hex.slice(6, 8), 16) / 255;
    }
    return 1;
  }

  const rgbMatch = trimmed.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+))?\s*\)$/i,
  );
  if (rgbMatch && rgbMatch[4] !== undefined) {
    return Math.min(1, Math.max(0, parseFloat(rgbMatch[4])));
  }

  return 1;
}

/**
 * Composite a translucent color over the backdrop, returning the
 * effective opaque color.
 */
function flattenOverBackdrop(rgb: [number, number, number], alpha: number): [number, number, number] {
  if (alpha >= 1) {
    return rgb;
  }
  return [
    Math.round(rgb[0] * alpha + BACKDROP[0] * (1 - alpha)),
    Math.round(rgb[1] * alpha + BACKDROP[1] * (1 - alpha)),
    Math.round(rgb[2] * alpha + BACKDROP[2] * (1 - alpha)),
  ];
}

/**
 * Compute the WCAG relative luminance of an sRGB color (0..1 scale).
 */
export function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb;
  const toLinear = (c: number): number => {
    const c8 = c / 255;
    return c8 <= 0.03928 ? c8 / 12.92 : Math.pow((c8 + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * WCAG contrast ratio between two relative luminances. Always >= 1.
 */
export function contrastRatio(a: number, b: number): number {
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * The effective (opaque) color of a CSS color string, as it is
 * actually painted over the light backdrop.
 */
export function effectiveColor(color: string): [number, number, number] {
  const parsed = parseColor(color);
  if (!parsed) {
    return BACKDROP;
  }
  return flattenOverBackdrop(parsed, parseAlpha(color));
}

/**
 * Pick the readable foreground color for the given background.
 *
 * Returns DARK_FOREGROUND ('#000') or LIGHT_FOREGROUND ('#fff'),
 * whichever has the higher WCAG contrast ratio against the background.
 * Unparseable colors fall back to the dark foreground.
 */
export function pickForegroundColor(backgroundColor: string): string {
  const parsed = parseColor(backgroundColor);
  if (!parsed) {
    return DARK_FOREGROUND;
  }

  const luminance = relativeLuminance(flattenOverBackdrop(parsed, parseAlpha(backgroundColor)));
  const againstDark = contrastRatio(luminance, relativeLuminance([0, 0, 0]));
  const againstLight = contrastRatio(luminance, relativeLuminance([255, 255, 255]));

  return againstDark >= againstLight ? DARK_FOREGROUND : LIGHT_FOREGROUND;
}

/**
 * The WCAG contrast ratio the picked foreground achieves against the
 * given background. Exposed so the guarantee can be asserted in tests
 * instead of hardcoding expected foregrounds.
 */
export function foregroundContrastRatio(backgroundColor: string): number {
  const parsed = parseColor(backgroundColor);
  if (!parsed) {
    return contrastRatio(relativeLuminance([0, 0, 0]), relativeLuminance([255, 255, 255]));
  }
  const luminance = relativeLuminance(flattenOverBackdrop(parsed, parseAlpha(backgroundColor)));
  const picked = pickForegroundColor(backgroundColor);
  const foregroundLuminance =
    picked === DARK_FOREGROUND ? relativeLuminance([0, 0, 0]) : relativeLuminance([255, 255, 255]);
  return contrastRatio(luminance, foregroundLuminance);
}
