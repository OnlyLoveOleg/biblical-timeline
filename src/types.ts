import type { EnochDate } from '@/lib/enochCalendar'

/** One entry exactly as it appears in public/events.json. */
export interface BibleEvent {
  /** Days from the first day of creation. Day 1 is the first day of creation. */
  date: number
  title: string
  summary: string
  /** Scripture reference(s) or other source for the event. */
  source: string
}

/** An event after loading: sorted, with its Enochian date decoded. */
export interface TimelineEvent extends BibleEvent {
  cal: EnochDate
  /** Days since the previous event, or null for the first event or a same-day event. */
  gap: number | null
}
