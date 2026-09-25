// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import { fromDay, toDay } from '@/lib/enochCalendar'
import { loadEvents, parseEvents } from '@/lib/loadEvents'

const file = fileURLToPath(new URL('../../public/events.json', import.meta.url))
const raw: unknown = JSON.parse(readFileSync(file, 'utf8'))

describe('public/events.json', () => {
  const { events, skipped } = parseEvents(raw)

  it('is a list of valid events with nothing skipped', () => {
    expect(Array.isArray(raw)).toBe(true)
    expect(events.length).toBeGreaterThan(30)
    expect(skipped).toBe(0)
    expect(events.length).toBe((raw as unknown[]).length)
  })

  it('gives every event exactly the four expected fields', () => {
    for (const e of raw as Record<string, unknown>[]) {
      expect(Object.keys(e).sort()).toEqual(['date', 'source', 'summary', 'title'])
      expect(Number.isInteger(e.date)).toBe(true)
    }
  })

  it('starts on day 1, the first day of creation, and has unique dates', () => {
    expect(events[0]?.date).toBe(1)
    expect(events[0]?.title).toMatch(/first day/i)
    expect(new Set(events.map((e) => e.date)).size).toBe(events.length)
  })

  it('is stored in chronological order', () => {
    const dates = (raw as { date: number }[]).map((e) => e.date)
    expect(dates).toEqual([...dates].sort((a, b) => a - b))
  })

  it('places the creation week on days 1 to 7', () => {
    expect(events.slice(0, 7).map((e) => e.date)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(events[6]?.title).toMatch(/seventh day/i)
  })

  it('matches the dated flood account in Genesis', () => {
    const byTitle = (t: string) => events.find((e) => e.title === t)!
    const flood = byTitle('The Flood begins')
    const ark = byTitle('The ark rests on Ararat')
    const leaves = byTitle('Noah leaves the ark')

    expect(flood.date).toBe(toDay(1657, 2, 17)) // Genesis 7:11
    expect(ark.date).toBe(toDay(1657, 7, 17)) // Genesis 8:4
    expect(leaves.date).toBe(toDay(1658, 2, 27)) // Genesis 8:14
    expect(leaves.date - flood.date).toBe(374) // one 364-day year and ten days

    // Genesis counts 150 days from the flood to the ark, but on a 364-day calendar with 31-day
    // third and sixth months the same span is 152. Only 30-day months give 150. See README.
    expect(ark.date - flood.date).toBe(152)
  })

  it('keeps Passover, the Exodus and the Jordan crossing on their stated days', () => {
    const d = (t: string) => fromDay(events.find((e) => e.title === t)!.date)
    expect(d('The first Passover')).toMatchObject({ month: 1, dayOfMonth: 14 })
    expect(d('The Exodus')).toMatchObject({ month: 1, dayOfMonth: 15 })
    expect(d('Israel crosses the Jordan')).toMatchObject({ month: 1, dayOfMonth: 10 })
    expect(d('The second Temple is completed')).toMatchObject({ month: 12, dayOfMonth: 3 })
  })

  it('decodes each date and computes the gap to the previous event', () => {
    events.forEach((e, i) => {
      expect(e.cal.day).toBe(e.date)
      const prev = events[i - 1]
      expect(e.gap).toBe(prev ? e.date - prev.date : null)
    })
  })
})

describe('parseEvents', () => {
  const good = { date: 5, title: 'T', summary: 'S', source: 'Genesis 1' }

  it('sorts by date', () => {
    const { events } = parseEvents([{ ...good, date: 30 }, { ...good, date: 2 }])
    expect(events.map((e) => e.date)).toEqual([2, 30])
  })

  it('skips entries with a missing field or a bad date, and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { events, skipped } = parseEvents([
      good,
      { ...good, date: 0 },
      { ...good, date: 1.5 },
      { ...good, date: '7' },
      { ...good, title: '' },
      { date: 9, title: 'x', summary: 'y' },
      null,
    ])
    expect(events).toHaveLength(1)
    expect(skipped).toBe(6)
    expect(warn).toHaveBeenCalledTimes(6)
    warn.mockRestore()
  })

  it('rejects a file that is not a list', () => {
    expect(() => parseEvents({ events: [] })).toThrow(/list of events/)
  })
})

describe('loadEvents', () => {
  it('reports an HTTP error', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 404, statusText: 'Not Found' })) as typeof fetch
    await expect(loadEvents('/events.json', fetchImpl)).rejects.toThrow(/404/)
  })

  it('reports invalid JSON', async () => {
    const fetchImpl = (async () => new Response('{oops')) as typeof fetch
    await expect(loadEvents('/events.json', fetchImpl)).rejects.toThrow(/not valid JSON/)
  })
})
