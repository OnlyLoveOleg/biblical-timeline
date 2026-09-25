<script setup lang="ts">
import YearDial from '@/components/YearDial.vue'
import { formatCount } from '@/lib/enochCalendar'
import type { TimelineEvent } from '@/types'

defineProps<{ event: TimelineEvent }>()
</script>

<template>
  <section class="readout" aria-label="Focused date">
    <div class="dial-wrap">
      <YearDial :cal="event.cal" />
    </div>
    <div class="text">
      <p class="year">Year {{ event.cal.year }}</p>
      <p class="detail">Month {{ event.cal.month }}, day {{ event.cal.dayOfMonth }}</p>
      <p class="count">Day {{ formatCount(event.cal.day) }} from creation</p>
    </div>
  </section>
</template>

<style scoped>
.readout {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.dial-wrap {
  flex: none;
  width: 4.5rem;
}
.text p {
  margin: 0;
}
.year {
  font-family: var(--serif);
  font-size: 1.75rem;
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.01em;
  color: var(--accent);
  font-variant-numeric: lining-nums tabular-nums;
}
.detail {
  margin-top: 0.15rem;
  font-size: 0.9375rem;
  font-variant-numeric: tabular-nums;
}
.count {
  margin-top: 0.1rem;
  font-size: 0.8125rem;
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}
@media (min-width: 768px) {
  .dial-wrap {
    width: 5.5rem;
  }
  .year {
    font-size: 2.125rem;
  }
}
</style>
