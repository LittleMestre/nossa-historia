// Geometria pura da linha do tempo em espiral (sem React).
// d = índice do item − foco animado (fracionário). d < 0 = passado (abaixo), d > 0 = futuro (acima).

export interface SpiralConfig {
  radius: number // raio da hélice em px
  angleStep: number // radianos por item
  pitch: number // deslocamento vertical por item (px)
  window: number // quantos itens renderizar de cada lado do foco
  minScale: number
}

export const DESKTOP_SPIRAL: SpiralConfig = {
  radius: 420,
  angleStep: Math.PI / 4,
  pitch: 70,
  window: 6,
  minScale: 0.35,
}

export const MOBILE_SPIRAL: SpiralConfig = {
  radius: 170,
  angleStep: Math.PI / 3.2,
  pitch: 56,
  window: 3,
  minScale: 0.4,
}

export interface SpiralTransform {
  x: number
  y: number
  z: number
  angle: number
  scale: number
  opacity: number
  saturation: number
  blur: number
  zIndex: number
  depth: number // 0 = frente, 1 = fundo da hélice
}

export function spiralTransform(
  d: number,
  config: SpiralConfig,
): SpiralTransform {
  const angle = d * config.angleStep
  const x = Math.sin(angle) * config.radius
  const z = (Math.cos(angle) - 1) * config.radius // 0 na frente, −2R atrás
  const y = -d * config.pitch // futuro sobe
  const depth = Math.min(1, -z / (2 * config.radius))
  const distance = Math.abs(d)
  const fade = Math.max(0, 1 - distance / (config.window + 0.5))
  const scale = Math.max(
    config.minScale,
    (1 - depth * 0.45) * (1 - Math.min(distance, 4) * 0.08),
  )
  const opacity = clamp((1 - depth * 0.55) * fade, 0, 1)
  const saturation = clamp(1 - depth * 0.8 - distance * 0.06, 0.15, 1)
  const blur = Math.min(3, depth * 2.5 + Math.max(0, distance - 1) * 0.3)
  const zIndex = Math.round(1000 + z) - Math.round(distance * 2)
  return { x, y, z, angle, scale, opacity, saturation, blur, zIndex, depth }
}

export function visibleRange(focus: number, count: number, window: number) {
  if (count === 0) return [0, -1] as const
  const start = Math.max(0, Math.floor(focus - window))
  const end = Math.min(count - 1, Math.ceil(focus + window))
  return [start, end] as const
}

/** Interpolação exponencial suave em direção ao alvo, independente do frame rate. */
export function approach(
  current: number,
  target: number,
  dtMs: number,
  halfLifeMs = 140,
) {
  const k = 1 - Math.pow(0.5, dtMs / halfLifeMs)
  const next = current + (target - current) * k
  return Math.abs(target - next) < 0.001 ? target : next
}

/** Converte arraste horizontal em deslocamento de índices (para a esquerda = futuro). */
export function dragToOffset(dx: number, pxPerItem: number) {
  return -dx / pxPerItem
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v))
}
