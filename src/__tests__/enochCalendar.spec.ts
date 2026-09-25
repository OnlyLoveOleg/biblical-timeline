import { describe, expect, it } from 'vitest'
import {
  CREATION_BC_YEAR,
  DAYS_PER_SEASON,
  DAYS_PER_YEAR,
  formatDate,
  formatHistoricalYear,
  formatSpan,
  fromDay,
  monthLength,
  toDay,
  toHistoricalYear,
} from '@/lib/enochCalendar'

describe('Enochian calendar cycles', () => {
  it('has 30/30/31-day months, 91-day seasons and a 364-day year', () => {
    expect([1, 2, 3].map(monthLength)).toEqual([30, 30, 31])
    expect([4, 5, 6].map(monthLength)).toEqual([30, 30, 31])
    expect([10, 11, 12].map(monthLength)).toEqual([30, 30, 31])
    expect(30 + 30 + 31).toBe(DAYS_PER_SEASON)
    expect(DAYS_PER_SEASON * 4).toBe(DAYS_PER_YEAR)
    expect(DAYS_PER_YEAR).toBe(364)
  })

  it('starts on year 1, month 1, day 1', () => {
    expect(fromDay(1)).toMatchObject({ year: 1, season: 1, month: 1, dayOfMonth: 1, dayOfYear: 1 })
  })

  it('turns over at every month, season and year boundary', () => {
    const at = (day: number) => {
      const d = fromDay(day)
      return [d.year, d.season, d.month, d.dayOfMonth]
    }
    expect(at(30)).toEqual([1, 1, 1, 30])
    expect(at(31)).toEqual([1, 1, 2, 1])
    expect(at(60)).toEqual([1, 1, 2, 30])
    expect(at(61)).toEqual([1, 1, 3, 1])
    expect(at(91)).toEqual([1, 1, 3, 31]) // the 91st day is the 31st day of the third month
    expect(at(92)).toEqual([1, 2, 4, 1])
    expect(at(182)).toEqual([1, 2, 6, 31]) // two seasons = 182 days
    expect(at(183)).toEqual([1, 3, 7, 1])
    expect(at(273)).toEqual([1, 3, 9, 31])
    expect(at(274)).toEqual([1, 4, 10, 1])
    expect(at(364)).toEqual([1, 4, 12, 31])
    expect(at(365)).toEqual([2, 1, 1, 1])
  })

  it('round-trips every day of the first three years', () => {
    for (let day = 1; day <= DAYS_PER_YEAR * 3; day++) {
      const d = fromDay(day)
      expect(toDay(d.year, d.month, d.dayOfMonth)).toBe(day)
    }
  })

  it('has exactly 52 weeks a year, so a date always falls on the same weekday', () => {
    expect(DAYS_PER_YEAR % 7).toBe(0)
    expect(DAYS_PER_YEAR / 7).toBe(52)
  })

  it('rejects impossible dates', () => {
    expect(() => fromDay(0)).toThrow(RangeError)
    expect(() => fromDay(1.5)).toThrow(RangeError)
    expect(() => toDay(1, 1, 31)).toThrow(RangeError) // months 1 and 2 have 30 days
    expect(() => toDay(1, 3, 32)).toThrow(RangeError)
    expect(() => toDay(1, 13, 1)).toThrow(RangeError)
    expect(() => toDay(0, 1, 1)).toThrow(RangeError)
  })
})

describe('BC/AD conversion (Ussher epoch)', () => {
  it('has no year zero: the creation year is 1 BC and the next year is AD 1', () => {
    expect(toHistoricalYear(CREATION_BC_YEAR)).toEqual({ era: 'BC', year: 1 })
    expect(toHistoricalYear(CREATION_BC_YEAR + 1)).toEqual({ era: 'AD', year: 1 })
  })

  it('puts Anno Mundi year 1 (creation) at 4004 BC', () => {
    expect(toHistoricalYear(1)).toEqual({ era: 'BC', year: CREATION_BC_YEAR })
    expect(formatHistoricalYear(1)).toBe('4,004 BC')
  })

  it('matches the dates already used for events.json', () => {
    expect(formatHistoricalYear(1657)).toBe('2,348 BC') // the Flood
    expect(formatHistoricalYear(4001)).toBe('4 BC') // Jesus is born, per Ussher
    expect(toHistoricalYear(4037)).toEqual({ era: 'AD', year: 33 }) // the crucifixion, per this app
  })

  it('rejects a year below 1', () => {
    expect(() => toHistoricalYear(0)).toThrow(RangeError)
  })
})

describe('formatting', () => {
  it('formats a date', () => {
    expect(formatDate(fromDay(toDay(1657, 2, 27)))).toBe('Year 1657, month 2, day 27')
  })

  it('formats spans in whole years and days', () => {
    expect(formatSpan(1)).toBe('1 day')
    expect(formatSpan(6)).toBe('6 days')
    expect(formatSpan(364)).toBe('1 year')
    expect(formatSpan(374)).toBe('1 year 10 days')
    expect(formatSpan(130 * 364)).toBe('130 years')
  })
})
