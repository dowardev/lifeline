import { describe, it, expect } from 'vitest'
import { packIntoScreens, canFitInScreen } from '@/store/widgetStore'
import type { WidgetInstance } from '@/store/widgetStore'

function makeWidget(
  p: Partial<WidgetInstance> & { id: string; w: number; h: number; order: number },
): WidgetInstance {
  return {
    id: p.id,
    widgetId: p.widgetId ?? p.id,
    x: { lg: p.x?.lg ?? 0, md: p.x?.md ?? 0 },
    y: { lg: p.y?.lg ?? 0, md: p.y?.md ?? 0 },
    w: { lg: p.w, md: p.w },
    h: { lg: p.h, md: p.h },
    order: p.order,
    props: p.props,
    screen: p.screen,
  }
}

describe('packIntoScreens', () => {
  it('packs two side-by-side w:6 widgets into one screen', () => {
    const widgets = [
      makeWidget({ id: 'a', w: 6, h: 8, order: 0 }),
      makeWidget({ id: 'b', w: 6, h: 8, order: 1 }),
    ]
    const result = packIntoScreens({ widgets, breakpoint: 'lg', rowsPerScreen: 10 })
    expect(result.length).toBe(1)
    expect(result[0].length).toBe(2)
  })

  it('sends wakatime to the next screen when calendar is 100% width', () => {
    const widgets = [
      makeWidget({ id: 'cal', w: 12, h: 8, order: 0 }),
      makeWidget({ id: 'waka', w: 6, h: 8, order: 1 }),
    ]
    const result = packIntoScreens({ widgets, breakpoint: 'lg', rowsPerScreen: 10 })
    expect(result.length).toBe(2)
    expect(result[0][0].id).toBe('cal')
    expect(result[1][0].id).toBe('waka')
  })

  it('opens a new screen when the current one is full', () => {
    const widgets = [
      makeWidget({ id: 'a', w: 6, h: 8, order: 0 }),
      makeWidget({ id: 'b', w: 6, h: 8, order: 1 }),
      makeWidget({ id: 'c', w: 6, h: 8, order: 2 }),
    ]
    const result = packIntoScreens({ widgets, breakpoint: 'lg', rowsPerScreen: 10 })
    expect(result.length).toBe(2)
    expect(result[0].map((w) => w.id).sort()).toEqual(['a', 'b'])
    expect(result[1].map((w) => w.id)).toEqual(['c'])
  })

  it('packs one widget per screen on mobile', () => {
    const widgets = [
      makeWidget({ id: 'a', w: 12, h: 8, order: 0 }),
      makeWidget({ id: 'b', w: 12, h: 8, order: 1 }),
    ]
    const result = packIntoScreens({
      widgets,
      breakpoint: 'md',
      rowsPerScreen: 8,
      mobileOnePerPage: true,
    })
    expect(result.length).toBe(2)
    expect(result[0].length).toBe(1)
    expect(result[1].length).toBe(1)
  })

  it('respects the current position when it still fits (keeps a drag)', () => {
    const widgets = [
      makeWidget({ id: 'a', w: 6, h: 8, order: 0, x: { lg: 6, md: 6 }, y: { lg: 0, md: 0 } }),
      makeWidget({ id: 'b', w: 6, h: 8, order: 1, x: { lg: 0, md: 0 }, y: { lg: 0, md: 0 } }),
    ]
    const result = packIntoScreens({ widgets, breakpoint: 'lg', rowsPerScreen: 10 })
    expect(result.length).toBe(1)
    const a = result[0].find((w) => w.id === 'a')!
    expect(a.x.lg).toBe(6)
    expect(a.y.lg).toBe(0)
  })
})
    describe('packIntoScreens with pinned screen', () => {
      it('keeps a widget pinned to its assigned screen', () => {
        const widgets = [
          makeWidget({ id: 'cal', w: 12, h: 8, order: 0 }),
          makeWidget({ id: 'waka', w: 6, h: 8, order: 1, screen: 2 }),
        ]
        const result = packIntoScreens({ widgets, breakpoint: 'lg', rowsPerScreen: 10 })
        expect(result.length).toBe(3) // e0, e1 (empty), e2
        expect(result[0][0].id).toBe('cal')
        expect(result[2][0].id).toBe('waka')
      })

      it('keeps pinned widgets in place and packs unpinned ones', () => {
        const widgets = [
          makeWidget({ id: 'a', w: 6, h: 8, order: 0, screen: 0 }),
          makeWidget({ id: 'b', w: 6, h: 8, order: 1, screen: 1 }),
          makeWidget({ id: 'c', w: 6, h: 8, order: 2 }),
        ]
        const result = packIntoScreens({ widgets, breakpoint: 'lg', rowsPerScreen: 10 })
        expect(result[0].some((w) => w.id === 'a')).toBe(true)
        expect(result[1].some((w) => w.id === 'b')).toBe(true)
        expect(result.flat().map((w) => w.id).sort()).toEqual(['a', 'b', 'c'])
      })
    })

    describe('canFitInScreen', () => {
      const calHalf = makeWidget({ id: 'calHalf', w: 6, h: 8, order: 0 })
      const calFull = makeWidget({ id: 'calFull', w: 12, h: 8, order: 0 })
      const waka = makeWidget({ id: 'waka', w: 6, h: 8, order: 1 })

      it('returns true when the target screen has room', () => {
        const screens = packIntoScreens({ widgets: [calHalf], breakpoint: 'lg', rowsPerScreen: 10 })
        expect(screens.length).toBe(1)
        expect(
          canFitInScreen({
            widget: waka,
            targetIndex: 0,
            screens,
            breakpoint: 'lg',
            rowsPerScreen: 10,
          }),
        ).toBe(true)
      })

      it('returns false when the target screen is full', () => {
        const screens = packIntoScreens({ widgets: [calFull], breakpoint: 'lg', rowsPerScreen: 10 })
        expect(
          canFitInScreen({
            widget: waka,
            targetIndex: 0,
            screens,
            breakpoint: 'lg',
            rowsPerScreen: 10,
          }),
        ).toBe(false)
      })

      it('returns true for an empty target (new screen)', () => {
        const screens = packIntoScreens({ widgets: [calHalf], breakpoint: 'lg', rowsPerScreen: 10 })
        expect(
          canFitInScreen({
            widget: waka,
            targetIndex: 1,
            screens,
            breakpoint: 'lg',
            rowsPerScreen: 10,
          }),
        ).toBe(true)
      })
    })
