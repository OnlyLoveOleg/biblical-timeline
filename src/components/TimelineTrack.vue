<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { formatDate, formatSpan } from '@/lib/enochCalendar'
import type { TimelineEvent } from '@/types'

/** Horizontal from this width up (Tailwind's "md"); vertical below it. Keep in sync with the CSS. */
const HORIZONTAL_QUERY = '(min-width: 768px)'

const props = defineProps<{ events: TimelineEvent[] }>()
/** Index of the focused event. Set from outside to scroll to an event; updated here as the user scrolls. */
const focused = defineModel<number>({ required: true })

const track = ref<HTMLElement | null>(null)
const rail = ref<HTMLElement | null>(null)
const horizontal = ref(true)

let query: MediaQueryList | null = null
let programmatic = false // true while a scroll we started ourselves is running
let settleTimer: number | undefined
let frame = 0
let lastFromScroll = -1

function eventElements(): HTMLElement[] {
  if (!rail.value) return []
  return (Array.from(rail.value.children) as HTMLElement[]).filter((el) => el.classList.contains('event'))
}

function centerOf(el: HTMLElement): number {
  return horizontal.value ? el.offsetLeft + el.offsetWidth / 2 : el.offsetTop + el.offsetHeight / 2
}

function viewportCenter(): number {
  const t = track.value
  if (!t) return 0
  return horizontal.value ? t.scrollLeft + t.clientWidth / 2 : t.scrollTop + t.clientHeight / 2
}

function nearestIndex(): number {
  const mid = viewportCenter()
  let best = 0
  let bestDistance = Infinity
  eventElements().forEach((el, i) => {
    const distance = Math.abs(centerOf(el) - mid)
    if (distance < bestDistance) {
      bestDistance = distance
      best = i
    }
  })
  return best
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function armSettle(ms: number) {
  window.clearTimeout(settleTimer)
  settleTimer = window.setTimeout(() => {
    programmatic = false
    syncFromScroll() // covers a scroll the user interrupted before it reached its target
  }, ms)
}

function syncFromScroll() {
  const i = nearestIndex()
  if (i !== focused.value) {
    lastFromScroll = i
    focused.value = i
  }
}

function scrollToIndex(index: number, smooth: boolean) {
  const t = track.value
  const el = eventElements()[index]
  if (!t || !el) return
  const half = horizontal.value ? t.clientWidth / 2 : t.clientHeight / 2
  const target = Math.max(0, centerOf(el) - half)
  const current = horizontal.value ? t.scrollLeft : t.scrollTop
  if (Math.abs(target - current) < 1) return

  programmatic = true
  armSettle(250)
  const behavior: ScrollBehavior = smooth && !prefersReducedMotion() ? 'smooth' : 'auto'
  if (typeof t.scrollTo === 'function') {
    t.scrollTo(horizontal.value ? { left: target, behavior } : { top: target, behavior })
  } else if (horizontal.value) {
    t.scrollLeft = target
  } else {
    t.scrollTop = target
  }
}

function onScroll() {
  if (programmatic) {
    armSettle(120)
    return
  }
  if (frame) return
  frame = requestAnimationFrame(() => {
    frame = 0
    syncFromScroll()
  })
}

// A mouse wheel only scrolls vertically, so on the horizontal timeline turn it into a sideways scroll.
function onWheel(e: WheelEvent) {
  const t = track.value
  if (!t || !horizontal.value || e.ctrlKey || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
  e.preventDefault()
  t.scrollLeft += e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY
}

function onItemClick(index: number) {
  if (index === focused.value) scrollToIndex(index, true)
  else focused.value = index
}

watch(focused, (index) => {
  const fromScroll = index === lastFromScroll
  lastFromScroll = -1
  if (!fromScroll) scrollToIndex(index, true)
})

async function onQueryChange(e: MediaQueryListEvent) {
  horizontal.value = e.matches
  await nextTick()
  const t = track.value
  if (t) {
    t.scrollLeft = 0
    t.scrollTop = 0
  }
  scrollToIndex(focused.value, false)
}

onMounted(() => {
  if (typeof window.matchMedia === 'function') {
    query = window.matchMedia(HORIZONTAL_QUERY)
    horizontal.value = query.matches
    query.addEventListener('change', onQueryChange)
  }
  track.value?.addEventListener('wheel', onWheel, { passive: false })
  nextTick(() => scrollToIndex(focused.value, false))
})

onBeforeUnmount(() => {
  query?.removeEventListener('change', onQueryChange)
  track.value?.removeEventListener('wheel', onWheel)
  window.clearTimeout(settleTimer)
  cancelAnimationFrame(frame)
})
</script>

<template>
  <div
    ref="track"
    class="track"
    role="region"
    aria-label="Timeline of biblical events"
    tabindex="0"
    @scroll.passive="onScroll"
  >
    <ol ref="rail" class="rail">
      <template v-for="(ev, i) in props.events" :key="`${ev.date}-${i}`">
        <li v-if="ev.gap" class="gap-item" aria-hidden="true">
          <div class="axis"></div>
          <p class="gap-label">{{ formatSpan(ev.gap) }}<span class="gap-later"> later</span></p>
        </li>
        <li
          class="event"
          :class="{ 'is-focused': i === focused, 'is-first': i === 0, 'is-last': i === props.events.length - 1 }"
          :aria-current="i === focused ? 'true' : undefined"
          @click="onItemClick(i)"
        >
          <div class="axis" aria-hidden="true"><span class="dot"></span></div>
          <article class="body">
            <p class="date">
              {{ formatDate(ev.cal) }}
              <span v-if="ev.gap" class="sr-only">, {{ formatSpan(ev.gap) }} after the previous event</span>
            </p>
            <h2 class="title">{{ ev.title }}</h2>
            <p class="summary">{{ ev.summary }}</p>
            <p class="source">{{ ev.source }}</p>
          </article>
        </li>
      </template>
    </ol>
  </div>
</template>

<style scoped>
/* ---------- Small screens: a vertical timeline (the default) ---------- */
.track {
  --dot: 0.75rem;
  --dot-y: 0.6rem;
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--rule) transparent;
}
.track:focus-visible {
  outline-offset: -4px;
}
.rail {
  margin: 0;
  padding: 32dvh 1.25rem 40dvh;
  list-style: none;
}
.event,
.gap-item {
  display: grid;
  grid-template-columns: 1rem minmax(0, 1fr);
  column-gap: 1rem;
}
.event {
  cursor: pointer;
}
.axis {
  position: relative;
}
.axis::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  margin-left: -1px;
  background: var(--rule);
}
.event.is-first .axis::before {
  top: var(--dot-y);
}
.event.is-last .axis::before {
  bottom: calc(100% - var(--dot-y));
}
.dot {
  position: absolute;
  top: var(--dot-y);
  left: 50%;
  width: var(--dot);
  height: var(--dot);
  margin: calc(var(--dot) / -2) 0 0 calc(var(--dot) / -2);
  border: 2px solid var(--ink-soft);
  border-radius: 50%;
  background: #fff;
  transition:
    transform 0.25s,
    background-color 0.25s,
    border-color 0.25s,
    box-shadow 0.25s;
}
.gap-item {
  min-height: 3rem;
}
.gap-label {
  align-self: center;
  margin: 0;
  font-size: 0.8125rem;
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}
.body {
  min-width: 0;
  padding-bottom: 0.5rem;
}
.body::before {
  display: none;
}
.date {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.2rem;
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}
.title {
  margin: 0.15rem 0 0.35rem;
  font: 600 1.375rem/1.2 var(--serif);
  letter-spacing: -0.005em;
}
.summary {
  margin: 0;
  font: 1rem/1.6 var(--serif);
}
.source {
  margin: 0.5rem 0 0;
  font-size: 0.8125rem;
  color: var(--ink-soft);
  font-style: italic;
}
.title,
.summary {
  opacity: 0.68;
  transition: opacity 0.25s;
}

/* The focused event */
.is-focused .dot {
  border-color: var(--accent);
  background: var(--accent);
  transform: scale(1.35);
  box-shadow: 0 0 0 4px var(--accent-wash);
}
.is-focused .date {
  color: var(--accent);
  font-weight: 600;
}
.is-focused .title,
.is-focused .summary {
  opacity: 1;
}

/* ---------- Medium screens and up: a horizontal timeline ---------- */
@media (min-width: 768px) {
  .track {
    --axis-h: 3rem;
    --dot-x: 1.5rem;
    --gap-w: 7.5rem;
    display: flex;
    overflow-x: auto;
    overflow-y: auto;
    container-type: inline-size;
  }
  .rail {
    display: flex;
    align-items: flex-start;
    margin: auto 0; /* centres the row vertically when there is room */
    padding: 0 calc(50cqw - var(--card-w) / 2);
  }
  .event {
    display: block;
    flex: 0 0 var(--card-w);
    width: var(--card-w);
  }
  .gap-item {
    display: block;
    position: relative;
    flex: none;
    width: var(--gap-w);
    height: var(--axis-h);
    min-height: 0;
  }
  .gap-item .axis {
    position: absolute;
    inset: 0;
  }
  .event .axis {
    height: var(--axis-h);
  }
  .axis::before {
    top: 50%;
    right: 0;
    bottom: auto;
    left: 0;
    width: auto;
    height: 2px;
    margin: -1px 0 0;
  }
  .event.is-first .axis::before {
    top: 50%;
    left: var(--dot-x);
  }
  .event.is-last .axis::before {
    bottom: auto;
    right: calc(100% - var(--dot-x));
  }
  .dot {
    top: 50%;
    left: var(--dot-x);
  }
  .gap-label {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 0 0.5rem;
    background: #fff;
    font-size: 0.75rem;
    white-space: nowrap;
  }
  .gap-later {
    display: none;
  }
  .body {
    padding: 0.25rem 1.5rem 3rem calc(var(--dot-x) - var(--dot) / 2);
  }
  .body::before {
    display: block;
    width: 2.5rem;
    height: 3px;
    margin-bottom: 0.9rem;
    background: var(--rule);
    content: '';
    transition:
      width 0.3s,
      background-color 0.25s;
  }
  .is-focused .body::before {
    width: 4.5rem;
    background: var(--accent);
  }
  .date {
    line-height: 1.4;
  }
}
</style>
