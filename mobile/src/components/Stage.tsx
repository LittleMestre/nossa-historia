import { useState, useEffect } from 'react'
import { View, Text, Pressable, useWindowDimensions } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useReducedMotion,
  withTiming,
  cancelAnimation,
  type SharedValue,
} from 'react-native-reanimated'
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler'
import { scheduleOnRN } from 'react-native-worklets'
import { router } from 'expo-router'
import {
  MOBILE_SPIRAL,
  spiralTransform,
  visibleRange,
} from '@/lib/spiral-model'
import { eventDate, type Event, type Photo } from '@/lib/model'
import { usePalette } from './ui'
import { Mosaic } from './Photo'
export type Moment = {
  id: string
  title: string
  year: number
  date: string
  event?: Event
  photos: Photo[]
  order: number
}
export function Chip({
  label,
  onPress,
  selected = false,
  disabled = false,
}: {
  label: string
  onPress: () => void
  selected?: boolean
  disabled?: boolean
}) {
  const c = usePalette()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        minHeight: 40,
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: selected ? c.accent : c.card,
        borderWidth: 1,
        borderColor: selected ? c.accent : c.border,
        borderRadius: 14,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <Text style={{ fontWeight: '600', color: selected ? c.bg : c.ink }}>
        {label}
      </Text>
    </Pressable>
  )
}
function FloatingCard({
  item,
  index,
  focus,
  position,
  width,
  height,
  spiral,
  reduce,
  select,
}: {
  item: Moment
  index: number
  focus: number
  position: SharedValue<number>
  width: number
  height: number
  spiral: boolean
  reduce: boolean
  select: () => void
}) {
  const c = usePalette()
  const front = index === focus
  const cardWidth = Math.min(265, width * 0.67),
    cardHeight = 166
  const style = useAnimatedStyle(() => {
    const d = index - position.value
    const point = spiralTransform(d, {
      ...MOBILE_SPIRAL,
      radius: width * 0.38,
      pitch: height * 0.22,
    })
    return {
      zIndex: spiral ? point.zIndex : 100 - Math.round(Math.abs(d) * 10),
      opacity: spiral
        ? Math.max(0.18, point.opacity)
        : Math.max(0.4, 1 - Math.abs(d) * 0.3),
      transform: [
        { perspective: 850 },
        { translateX: spiral ? point.x : d * (cardWidth + 14) },
        { translateY: spiral ? point.y : 0 },
        { scale: spiral ? point.scale : 1 },
        {
          rotateY:
            (spiral && !reduce ? Math.sin(point.angle) * -22 : 0) + 'deg',
        },
      ],
    }
  })
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: (height - cardHeight) / 2,
          left: (width - cardWidth) / 2,
          width: cardWidth,
          height: cardHeight,
        },
        style,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.title + (front ? ' · abrir' : ' · selecionar')}
        onPress={select}
        style={{
          flex: 1,
          borderWidth: front ? 2 : 1,
          borderColor: front ? c.warm : c.border,
          backgroundColor: c.card,
          borderRadius: 15,
          padding: 10,
          gap: 4,
          justifyContent: 'center',
        }}
      >
        {item.event ? (
          <Mosaic photos={item.photos} height={66} />
        ) : (
          <Text style={{ fontSize: 33, color: c.warm }}>◎</Text>
        )}
        <Text numberOfLines={1} style={{ color: c.muted, fontSize: 12 }}>
          {item.date}
        </Text>
        <Text
          numberOfLines={2}
          style={{ color: c.ink, fontSize: 19, fontFamily: 'serif' }}
        >
          {item.title}
        </Text>
      </Pressable>
    </Animated.View>
  )
}
export function Stage({
  items,
  initial,
  spiral,
}: {
  items: Moment[]
  initial: string
  spiral: boolean
}) {
  const [focus, setFocus] = useState(
    Math.max(
      0,
      items.findIndex((i) => i.id === initial),
    ),
  )
  const pos = useSharedValue(focus),
    origin = useSharedValue(focus),
    reduce = useReducedMotion()
  const c = usePalette(),
    screen = useWindowDimensions()
  const width = Math.max(160, screen.width - 44),
    height = spiral ? Math.max(268, Math.min(435, screen.height * 0.47)) : 232
  const step = spiral ? width * 0.36 : width * 0.62
  const last = items.length - 1
  useEffect(() => {
    pos.set(reduce ? focus : withTiming(focus, { duration: 230 }))
  }, [focus, pos, reduce])
  const pan = usePanGesture({
    activeOffsetX: [-10, 10],
    failOffsetY: [-20, 20],
    onActivate: () => {
      'worklet'
      cancelAnimation(pos)
      origin.set(pos.get())
    },
    onUpdate: (e) => {
      'worklet'
      if (!reduce)
        pos.set(
          Math.min(
            last,
            Math.max(
              0,
              origin.value +
                Math.min(1.4, Math.max(-1.4, -e.translationX / step)),
            ),
          ),
        )
    },
    onDeactivate: (e) => {
      'worklet'
      const direction =
        Math.abs(e.velocityX) > 480
          ? -Math.sign(e.velocityX)
          : Math.round(-e.translationX / step)
      const target = Math.min(
        last,
        Math.max(
          0,
          Math.round(origin.value) + Math.min(1, Math.max(-1, direction)),
        ),
      )
      pos.set(reduce ? target : withTiming(target, { duration: 220 }))
      scheduleOnRN(setFocus, target)
    },
  })
  const [start, end] = visibleRange(
    focus,
    items.length,
    screen.width < 360 ? 2 : 3,
  )
  const current = items[focus]
  if (!current) return null
  return (
    <>
      <GestureDetector gesture={pan}>
        <View
          style={{
            width,
            height,
            overflow: 'hidden',
            borderRadius: 20,
            backgroundColor: c.soft,
            marginVertical: 10,
          }}
        >
          {spiral ? (
            Array.from({ length: 77 }, (_, i) => {
              const d = (i - 38) / 12
              return (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    left:
                      width / 2 +
                      Math.sin(d * MOBILE_SPIRAL.angleStep) * width * 0.38,
                    top: height / 2 - d * height * 0.22,
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: c.warm,
                    opacity: 0.65,
                  }}
                />
              )
            })
          ) : (
            <View
              style={{
                position: 'absolute',
                top: height * 0.88,
                left: 0,
                right: 0,
                height: 2,
                backgroundColor: c.warm,
                flexDirection: 'row',
                justifyContent: 'space-around',
              }}
            >
              {Array.from({ length: 11 }, (_, i) => (
                <View
                  key={i}
                  style={{ height: 9, width: 1, backgroundColor: c.warm }}
                />
              ))}
            </View>
          )}
          <Text
            style={{
              position: 'absolute',
              left: 10,
              top: 8,
              color: c.muted,
              fontSize: 11,
            }}
          >
            {spiral ? '↑ FUTURO' : '← PASSADO'}
          </Text>
          <Text
            style={{
              position: 'absolute',
              right: 10,
              bottom: 6,
              color: c.muted,
              fontSize: 11,
            }}
          >
            {spiral ? '↓ PASSADO' : 'FUTURO →'}
          </Text>
          {items.slice(start, end + 1).map((item, i) => (
            <FloatingCard
              key={item.id}
              item={item}
              index={start + i}
              {...{ focus, position: pos, width, height, spiral, reduce }}
              select={() => {
                if (start + i !== focus) setFocus(start + i)
                else if (item.event) router.push(`/event/${item.id}`)
              }}
            />
          ))}
        </View>
      </GestureDetector>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 6,
          justifyContent: 'center',
        }}
      >
        <Chip
          label="‹ Anterior"
          disabled={!focus}
          onPress={() => setFocus(focus - 1)}
        />
        <Chip
          label="Hoje"
          onPress={() => setFocus(items.findIndex((i) => i.id === 'today'))}
        />
        <Chip
          label="Próximo ›"
          disabled={focus === last}
          onPress={() => setFocus(focus + 1)}
        />
      </View>
      {current.event && (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/event/${current.id}`)}
          style={{ alignItems: 'center', padding: 14 }}
        >
          <Text style={{ color: c.accent, fontWeight: '700' }}>
            Abrir acontecimento →
          </Text>
        </Pressable>
      )}
    </>
  )
}
export function datedMoment(e: Event, photos: Photo[]): Moment {
  return {
    id: e.id,
    event: e,
    title: e.title,
    date: eventDate(e),
    year: e.start_year!,
    order:
      e.start_year! * 10000 + (e.start_month ?? 0) * 100 + (e.start_day ?? 0),
    photos: photos.filter((p) => p.event_id === e.id).slice(0, 4),
  }
}
