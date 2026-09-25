<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { DAYS_PER_YEAR, MONTH_START_OFFSETS, type EnochDate } from '@/lib/enochCalendar'

const props = defineProps<{ cal: EnochDate }>()

const CENTER = 60
const R_OUT = 56
const R_IN = 40
const SEASON_GAP_DEG = 2.4

function polar(radius: number, degrees: number): [number, number] {
  const a = ((degrees - 90) * Math.PI) / 180
  return [CENTER + radius * Math.cos(a), CENTER + radius * Math.sin(a)]
}

function ringSegment(startDeg: number, endDeg: number): string {
  const [x1, y1] = polar(R_OUT, startDeg)
  const [x2, y2] = polar(R_OUT, endDeg)
  const [x3, y3] = polar(R_IN, endDeg)
  const [x4, y4] = polar(R_IN, startDeg)
  const f = (n: number) => n.toFixed(2)
  return `M${f(x1)} ${f(y1)}A${R_OUT} ${R_OUT} 0 0 1 ${f(x2)} ${f(y2)}L${f(x3)} ${f(y3)}A${R_IN} ${R_IN} 0 0 0 ${f(x4)} ${f(y4)}Z`
}

// Four equal quarters: 91 of 364 days is exactly 90 degrees.
const seasons = [1, 2, 3, 4].map((n) => ({
  n,
  d: ringSegment((n - 1) * 90 + SEASON_GAP_DEG / 2, n * 90 - SEASON_GAP_DEG / 2),
}))

// Month boundaries inside a season (the season boundaries are already gaps).
const monthTicks = MONTH_START_OFFSETS.filter((_, m) => m % 3 !== 0).map((offset) => {
  const deg = (offset / DAYS_PER_YEAR) * 360
  const [x1, y1] = polar(R_IN, deg)
  const [x2, y2] = polar(R_OUT, deg)
  return { x1, y1, x2, y2 }
})

// The marker keeps a running angle so it always turns the short way round.
const targetAngle = computed(() => ((props.cal.dayOfYear - 0.5) / DAYS_PER_YEAR) * 360)
const angle = ref(targetAngle.value)
watch(targetAngle, (target) => {
  const current = ((angle.value % 360) + 360) % 360
  let delta = target - current
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360
  angle.value += delta
})

const label = computed(
  () => `Position in the year: season ${props.cal.season}, month ${props.cal.month}, day ${props.cal.dayOfMonth}`,
)
</script>

<template>
  <svg class="dial" viewBox="0 0 120 120" role="img" :aria-label="label">
    <path
      v-for="s in seasons"
      :key="s.n"
      :d="s.d"
      class="season"
      :class="{ 'season--active': s.n === cal.season }"
    />
    <line
      v-for="(t, i) in monthTicks"
      :key="i"
      :x1="t.x1"
      :y1="t.y1"
      :x2="t.x2"
      :y2="t.y2"
      class="tick"
    />
    <g class="marker" :style="{ transform: `rotate(${angle}deg)` }">
      <circle :cx="CENTER" :cy="CENTER - (R_IN + R_OUT) / 2" r="6.5" />
    </g>
    <text :x="CENTER" y="52" class="dial-caption" text-anchor="middle">season</text>
    <text :x="CENTER" y="80" class="dial-number" text-anchor="middle">{{ cal.season }}</text>
  </svg>
</template>

<style scoped>
.dial {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}
.season {
  fill: var(--wash);
  transition: fill 0.3s;
}
.season--active {
  fill: var(--accent-mid);
}
.tick {
  stroke: #fff;
  stroke-width: 1.4;
}
.marker {
  transform-origin: 60px 60px;
  transition: transform 0.45s cubic-bezier(0.3, 0.7, 0.2, 1);
}
.marker circle {
  fill: var(--accent);
  stroke: #fff;
  stroke-width: 2.5;
}
.dial-caption {
  font: 500 11px var(--sans);
  fill: var(--ink-soft);
}
.dial-number {
  font: 600 30px var(--serif);
  fill: var(--ink);
}
</style>
