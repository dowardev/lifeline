import { describe, it, expect } from 'vitest'
import { packIntoEscritorios, canFitInEscritorio } from '@/store/widgetStore'
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
    escritorio: p.escritorio,
  }
}

describe('packIntoEscritorios', () => {
  it('packs two side-by-side w:6 widgets into one escritorio', () => {
    const widgets = [
      makeWidget({ id: 'a', w: 6, h: 8, order: 0 }),
      makeWidget({ id: 'b', w: 6, h: 8, order: 1 }),
    ]
    const result = packIntoEscritorios({ widgets, breakpoint: 'lg', rowsPerEscritorio: 10 })
    expect(result.length).toBe(1)
    expect(result[0].length).toBe(2)
  })

  it('sends wakatime to the next escritorio when calendar is 100% width', () => {
    const widgets = [
      makeWidget({ id: 'cal', w: 12, h: 8, order: 0 }),
      makeWidget({ id: 'waka', w: 6, h: 8, order: 1 }),
    ]
    const result = packIntoEscritorios({ widgets, breakpoint: 'lg', rowsPerEscritorio: 10 })
    expect(result.length).toBe(2)
    expect(result[0][0].id).toBe('cal')
    expect(result[1][0].id).toBe('waka')
  })

  it('opens a new escritorio when the current one is full', () => {
    const widgets = [
      makeWidget({ id: 'a', w: 6, h: 8, order: 0 }),
      makeWidget({ id: 'b', w: 6, h: 8, order: 1 }),
      makeWidget({ id: 'c', w: 6, h: 8, order: 2 }),
    ]
    const result = packIntoEscritorios({ widgets, breakpoint: 'lg', rowsPerEscritorio: 10 })
    expect(result.length).toBe(2)
    expect(result[0].map((w) => w.id).sort()).toEqual(['a', 'b'])
    expect(result[1].map((w) => w.id)).toEqual(['c'])
  })

  it('packs one widget per escritorio on mobile', () => {
    const widgets = [
      makeWidget({ id: 'a', w: 12, h: 8, order: 0 }),
      makeWidget({ id: 'b', w: 12, h: 8, order: 1 }),
    ]
    const result = packIntoEscritorios({
      widgets,
      breakpoint: 'md',
      rowsPerEscritorio: 8,
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
    const result = packIntoEscritorios({ widgets, breakpoint: 'lg', rowsPerEscritorio: 10 })
    expect(result.length).toBe(1)
    const a = result[0].find((w) => w.id === 'a')!
    expect(a.x.lg).toBe(6)
    expect(a.y.lg).toBe(0)
  })
})
    describe('packIntoEscritorios with pinned escritorio', () => {
      it('keeps a widget pinned to its assigned escritorio', () => {
        const widgets = [
          makeWidget({ id: 'cal', w: 12, h: 8, order: 0 }),
          makeWidget({ id: 'waka', w: 6, h: 8, order: 1, escritorio: 2 }),
        ]
        const result = packIntoEscritorios({ widgets, breakpoint: 'lg', rowsPerEscritorio: 10 })
        expect(result.length).toBe(3) // e0, e1 (empty), e2
        expect(result[0][0].id).toBe('cal')
        expect(result[2][0].id).toBe('waka')
      })

      it('keeps pinned widgets in place and packs unpinned ones', () => {
        const widgets = [
          makeWidget({ id: 'a', w: 6, h: 8, order: 0, escritorio: 0 }),
          makeWidget({ id: 'b', w: 6, h: 8, order: 1, escritorio: 1 }),
          makeWidget({ id: 'c', w: 6, h: 8, order: 2 }),
        ]
        const result = packIntoEscritorios({ widgets, breakpoint: 'lg', rowsPerEscritorio: 10 })
        expect(result[0].some((w) => w.id === 'a')).toBe(true)
        expect(result[1].some((w) => w.id === 'b')).toBe(true)
        expect(result.flat().map((w) => w.id).sort()).toEqual(['a', 'b', 'c'])
      })
    })

    describe('canFitInEscritorio', () => {
      const calHalf = makeWidget({ id: 'calHalf', w: 6, h: 8, order: 0 })
      const calFull = makeWidget({ id: 'calFull', w: 12, h: 8, order: 0 })
      const waka = makeWidget({ id: 'waka', w: 6, h: 8, order: 1 })

      it('returns true when the target escritorio has room', () => {
        const escritorios = packIntoEscritorios({ widgets: [calHalf], breakpoint: 'lg', rowsPerEscritorio: 10 })
        expect(escritorios.length).toBe(1)
        expect(
          canFitInEscritorio({
            widget: waka,
            targetIndex: 0,
            escritorios,
            breakpoint: 'lg',
            rowsPerEscritorio: 10,
          }),
        ).toBe(true)
      })

      it('returns false when the target escritorio is full', () => {
        const escritorios = packIntoEscritorios({ widgets: [calFull], breakpoint: 'lg', rowsPerEscritorio: 10 })
        expect(
          canFitInEscritorio({
            widget: waka,
            targetIndex: 0,
            escritorios,
            breakpoint: 'lg',
            rowsPerEscritorio: 10,
          }),
        ).toBe(false)
      })

      it('returns true for an empty target (new escritorio)', () => {
        const escritorios = packIntoEscritorios({ widgets: [calHalf], breakpoint: 'lg', rowsPerEscritorio: 10 })
        expect(
          canFitInEscritorio({
            widget: waka,
            targetIndex: 1,
            escritorios,
            breakpoint: 'lg',
            rowsPerEscritorio: 10,
          }),
        ).toBe(true)
      })
    })
