<script setup lang="ts">
import { computed } from 'vue'
import type { TimelineEvent } from '@/types'

const props = defineProps<{ events: TimelineEvent[] }>()
const focused = defineModel<number>({ required: true })

const firstDay = computed(() => props.events[0]?.date ?? 1)
const lastEvent = computed(() => props.events[props.events.length - 1])
const span = computed(() => Math.max(1, (lastEvent.value?.date ?? 1) - firstDay.value))

const ticks = computed(() =>
  props.events.map((event, index) => ({
    index,
    left: ((event.date - firstDay.value) / span.value) * 100,
  })),
)

const firstYear = computed(() => props.events[0]?.cal.year ?? 1)
const lastYear = computed(() => lastEvent.value?.cal.year ?? 1)

// Positions on the ruler are proportional to real elapsed days, so early events bunch together.
// Clicking jumps to whichever event is closest in time to the spot you clicked.
function onClick(e: MouseEvent) {
  const bar = e.currentTarget as HTMLElement
  const box = bar.getBoundingClientRect()
  if (box.width === 0 || props.events.length === 0) return
  const fraction = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width))
  const day = firstDay.value + fraction * span.value
  let best = 0
  let bestDistance = Infinity
  props.events.forEach((event, index) => {
    const distance = Math.abs(event.date - day)
    if (distance < bestDistance) {
      bestDistance = distance
      best = index
    }
  })
  focused.value = best
}
</script>

<template>
  <div class="ruler-wrap">
    <span class="end">Year {{ firstYear }}</span>
    <div class="ruler" title="Click to jump to a point in time" @click="onClick">
      <span class="line"></span>
      <span
        v-for="t in ticks"
        :key="t.index"
        class="tick"
        :class="{ 'tick--focused': t.index === focused }"
        :style="{ left: `${t.left}%` }"
      ></span>
    </div>
    <span class="end">Year {{ lastYear }}</span>
  </div>
</template>

<style scoped>
.ruler-wrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex: 1 1 auto;
}
.end {
  flex: none;
  font-size: 0.75rem;
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}
.ruler {
  position: relative;
  flex: 1 1 auto;
  height: 2.5rem;
  cursor: pointer;
  touch-action: manipulation;
}
.line {
  position: absolute;
  top: 50%;
  right: 0;
  left: 0;
  height: 2px;
  margin-top: -1px;
  background: var(--rule);
}
.tick {
  position: absolute;
  top: 50%;
  width: 2px;
  height: 0.75rem;
  margin: -0.375rem 0 0 -1px;
  background: var(--ink-soft);
  opacity: 0.55;
}
@media (max-width: 767.98px) {
  .end {
    display: none;
  }
}
.tick--focused {
  z-index: 1;
  width: 4px;
  height: 1.5rem;
  margin: -0.75rem 0 0 -2px;
  background: var(--accent);
  opacity: 1;
}
</style>
