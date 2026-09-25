<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import AboutDialog from '@/components/AboutDialog.vue'
import FocusReadout from '@/components/FocusReadout.vue'
import OverviewRuler from '@/components/OverviewRuler.vue'
import TimelineTrack from '@/components/TimelineTrack.vue'
import { loadEvents } from '@/lib/loadEvents'
import type { TimelineEvent } from '@/types'

/** The events live in public/events.json and are fetched when the app starts. */
const EVENTS_URL = `${import.meta.env.BASE_URL}events.json`

const status = ref<'loading' | 'ready' | 'error'>('loading')
const errorMessage = ref('')
const events = shallowRef<TimelineEvent[]>([])
const skipped = ref(0)
const focused = ref(0)
const aboutOpen = ref(false)

const current = computed(() => events.value[focused.value])
const hasEvents = computed(() => status.value === 'ready' && events.value.length > 0)

async function load() {
  status.value = 'loading'
  try {
    const result = await loadEvents(EVENTS_URL)
    events.value = result.events
    skipped.value = result.skipped
    focused.value = 0
    status.value = 'ready'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
    status.value = 'error'
  }
}

function moveTo(index: number) {
  focused.value = Math.min(events.value.length - 1, Math.max(0, index))
}

function onKeydown(e: KeyboardEvent) {
  if (aboutOpen.value || !hasEvents.value || e.altKey || e.ctrlKey || e.metaKey) return
  const target = e.target as HTMLElement | null
  if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return

  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
    case 'PageDown':
      moveTo(focused.value + 1)
      break
    case 'ArrowLeft':
    case 'ArrowUp':
    case 'PageUp':
      moveTo(focused.value - 1)
      break
    case 'Home':
      moveTo(0)
      break
    case 'End':
      moveTo(events.value.length - 1)
      break
    default:
      return
  }
  e.preventDefault()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  load()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="app">
    <header class="masthead">
      <div class="heading">
        <h1>Biblical timeline</h1>
        <p>Dates counted in the 364-day Enochian year</p>
      </div>
      <button type="button" class="about-link" @click="aboutOpen = true">How dates are counted</button>
      <FocusReadout v-if="current" :event="current" class="readout" />
    </header>

    <main class="stage">
      <p v-if="status === 'loading'" class="message" role="status">Loading events…</p>

      <div v-else-if="status === 'error'" class="message" role="alert">
        <p class="message-title">The events could not be loaded.</p>
        <p>{{ errorMessage }}</p>
        <p>Check that <code>public/events.json</code> exists and contains valid JSON, then try again.</p>
        <button type="button" class="step" @click="load">Try again</button>
      </div>

      <div v-else-if="events.length === 0" class="message" role="status">
        <p class="message-title">There are no events to show.</p>
        <p>
          <code>public/events.json</code> has no valid entries. Each event needs a whole-number
          <code>date</code> of 1 or more, plus a <code>title</code>, <code>summary</code> and <code>source</code>.
        </p>
      </div>

      <TimelineTrack v-else v-model="focused" :events="events" />
    </main>

    <p v-if="hasEvents && skipped > 0" class="notice" role="status">
      {{ skipped }} {{ skipped === 1 ? 'entry was' : 'entries were' }} skipped because of a missing field or an invalid
      date. The browser console lists them.
    </p>

    <footer v-if="hasEvents" class="controls">
      <button type="button" class="step" :disabled="focused <= 0" @click="moveTo(focused - 1)">Earlier</button>
      <OverviewRuler v-model="focused" :events="events" />
      <button type="button" class="step" :disabled="focused >= events.length - 1" @click="moveTo(focused + 1)">
        Later
      </button>
    </footer>

    <AboutDialog v-model="aboutOpen" />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background: var(--paper);
}

.masthead {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    'heading link'
    'readout readout';
  gap: 0.75rem 1rem;
  align-items: center;
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid var(--rule);
}
.heading {
  grid-area: heading;
  min-width: 0;
}
.heading h1 {
  margin: 0;
  font: 600 1.375rem/1.15 var(--serif);
  letter-spacing: -0.01em;
}
.heading p {
  margin: 0.2rem 0 0;
  font-size: 0.8125rem;
  color: var(--ink-soft);
}
.about-link {
  grid-area: link;
  padding: 0.25rem 0;
  border: 0;
  background: none;
  color: var(--accent);
  font-size: 0.875rem;
  text-decoration: underline;
  text-underline-offset: 0.2em;
  cursor: pointer;
}
.readout {
  grid-area: readout;
}

.stage {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}

.message {
  max-width: 34rem;
  margin: auto;
  padding: 2rem 1.25rem;
  font: 1.0625rem/1.6 var(--serif);
}
.message p {
  margin: 0 0 0.75rem;
}
.message-title {
  font-size: 1.25rem;
  font-weight: 600;
}
.message code,
.notice code {
  font-size: 0.9em;
}

.notice {
  margin: 0;
  padding: 0.5rem 1.25rem;
  border-top: 1px solid var(--rule);
  font-size: 0.8125rem;
  color: var(--ink-soft);
}

.controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1.25rem calc(0.5rem + env(safe-area-inset-bottom));
  border-top: 1px solid var(--rule);
}
.step {
  flex: none;
  padding: 0.45rem 0.9rem;
  border: 1px solid var(--rule);
  background: #fff;
  font-size: 0.875rem;
  cursor: pointer;
}
.step:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}
.step:disabled {
  color: var(--ink-soft);
  opacity: 0.45;
  cursor: default;
}

@media (min-width: 768px) {
  .masthead {
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    grid-template-areas: 'heading readout link';
    padding: 1.1rem 2rem;
  }
  .heading h1 {
    font-size: 1.625rem;
  }
  .about-link {
    justify-self: end;
  }
  .controls,
  .notice {
    padding-inline: 2rem;
  }
}
</style>
