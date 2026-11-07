import { describe, expect, it } from 'vitest'
import {
  DESKTOP_SPIRAL,
  approach,
  dragToOffset,
  spiralTransform,
  visibleRange,
} from '../../src/components/timeline/spiral-model'

describe('spiral geometry', () => {
  it('puts the focused item at the front, full size and opacity', () => {
    const t = spiralTransform(0, DESKTOP_SPIRAL)
    expect(t.x).toBeCloseTo(0)
    expect(t.z).toBeCloseTo(0)
    expect(t.scale).toBe(1)
    expect(t.opacity).toBe(1)
    expect(t.saturation).toBe(1)
  })

  it('places the past below and the future above', () => {
    expect(spiralTransform(-1, DESKTOP_SPIRAL).y).toBeGreaterThan(0)
    expect(spiralTransform(1, DESKTOP_SPIRAL).y).toBeLessThan(0)
  })

  it('pushes neighbours back in depth and shrinks/fades them progressively', () => {
    const a = spiralTransform(1, DESKTOP_SPIRAL)
    const b = spiralTransform(2, DESKTOP_SPIRAL)
    expect(a.z).toBeLessThan(0)
    expect(b.z).toBeLessThan(a.z)
    expect(b.scale).toBeLessThan(a.scale)
    expect(b.opacity).toBeLessThan(a.opacity)
    expect(a.zIndex).toBeGreaterThan(b.zIndex)
  })

  it('completes a full helix turn and keeps moving vertically', () => {
    const turn = (2 * Math.PI) / DESKTOP_SPIRAL.angleStep
    const t = spiralTransform(turn, DESKTOP_SPIRAL)
    expect(t.x).toBeCloseTo(0)
    expect(t.z).toBeCloseTo(0)
    expect(t.y).toBeCloseTo(-turn * DESKTOP_SPIRAL.pitch)
  })

  it('is continuous for fractional focus values', () => {
    const a = spiralTransform(0.5, DESKTOP_SPIRAL)
    const b = spiralTransform(0.51, DESKTOP_SPIRAL)
    expect(Math.abs(a.x - b.x)).toBeLessThan(10)
  })

  it('renders only a window around the focus', () => {
    expect(visibleRange(50, 200, 6)).toEqual([44, 56])
    expect(visibleRange(0, 3, 6)).toEqual([0, 2])
  })

  it('approaches the target smoothly and settles', () => {
    const v = approach(0, 1, 16)
    expect(v).toBeGreaterThan(0)
    expect(v).toBeLessThan(1)
    expect(approach(0.9995, 1, 16)).toBe(1)
  })

  it('dragging left advances toward the future', () => {
    expect(dragToOffset(-160, 160)).toBe(1)
  })
})
