/**
 * The 364-day calendar of the Astronomical Book of Enoch (1 Enoch 72–82).
 *
 *   month  = 30 days (the third month of each season has 31)
 *   season = 30 + 30 + 31 = 91 days
 *   year   = 4 seasons    = 364 days = 52 weeks
 *
 * Day 1 is the first day of creation: year 1, month 1, day 1.
 * There are no leap days or intercalary days, so every year is exactly 364 days.
 */

export const DAYS_PER_SEASON = 91
export const SEASONS_PER_YEAR = 4
export const DAYS_PER_YEAR = DAYS_PER_SEASON * SEASONS_PER_YEAR // 364
export const MONTHS_PER_SEASON = 3
export const MONTHS_PER_YEAR = MONTHS_PER_SEASON * SEASONS_PER_YEAR // 12

/** Month lengths inside every season. */
export const MONTH_LENGTHS_IN_SEASON = [30, 30, 31] as const

/** Zero-based day of the year on which each of the 12 months starts. */
export const MONTH_START_OFFSETS: readonly number[] = Array.from({ length: MONTHS_PER_YEAR }, (_, m) => {
  const season = Math.floor(m / MONTHS_PER_SEASON)
  const inSeason = m % MONTHS_PER_SEASON
  let offset = season * DAYS_PER_SEASON
  for (let i = 0; i < inSeason; i++) offset += MONTH_LENGTHS_IN_SEASON[i]!
  return offset
})

export interface EnochDate {
  /** Days from creation, starting at 1. */
  day: number
  /** 1-based year. */
  year: number
  /** 1 to 4. */
  season: number
  /** 1 to 12, counted across the whole year. */
  month: number
  /** 1 to 31. */
  dayOfMonth: number
  /** 1 to 364. */
  dayOfYear: number
  /** 1 to 91. */
  dayOfSeason: number
}

export function isValidDay(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1
}

/** Number of days in a month of the year (1 to 12). */
export function monthLength(month: number): number {
  if (!Number.isInteger(month) || month < 1 || month > MONTHS_PER_YEAR) {
    throw new RangeError(`Month must be an integer from 1 to ${MONTHS_PER_YEAR}, got ${month}`)
  }
  return MONTH_LENGTHS_IN_SEASON[(month - 1) % MONTHS_PER_SEASON]!
}

/** Convert a day count (1 = first day of creation) to a year, season, month and day. */
export function fromDay(day: number): EnochDate {
  if (!isValidDay(day)) {
    throw new RangeError(`Day must be a positive integer, got ${day}`)
  }
  const zero = day - 1
  const year = Math.floor(zero / DAYS_PER_YEAR) + 1
  const dayOfYear0 = zero % DAYS_PER_YEAR
  const season = Math.floor(dayOfYear0 / DAYS_PER_SEASON) + 1

  // Walk the twelve months rather than dividing, because the third month of each season is longer.
  let month = MONTHS_PER_YEAR
  for (let m = 0; m < MONTHS_PER_YEAR; m++) {
    const next = MONTH_START_OFFSETS[m + 1] ?? DAYS_PER_YEAR
    if (dayOfYear0 < next) {
      month = m + 1
      break
    }
  }

  return {
    day,
    year,
    season,
    month,
    dayOfMonth: dayOfYear0 - MONTH_START_OFFSETS[month - 1]! + 1,
    dayOfYear: dayOfYear0 + 1,
    dayOfSeason: (dayOfYear0 % DAYS_PER_SEASON) + 1,
  }
}

/** Inverse of {@link fromDay}. Use this to work out the `date` value for a new event. */
export function toDay(year: number, month: number, dayOfMonth: number): number {
  if (!Number.isInteger(year) || year < 1) {
    throw new RangeError(`Year must be an integer of 1 or more, got ${year}`)
  }
  const length = monthLength(month)
  if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > length) {
    throw new RangeError(`Day of month must be an integer from 1 to ${length} for month ${month}, got ${dayOfMonth}`)
  }
  return (year - 1) * DAYS_PER_YEAR + MONTH_START_OFFSETS[month - 1]! + dayOfMonth
}

/** "Year 1657, month 2, day 27" */
export function formatDate(date: EnochDate): string {
  return `Year ${date.year}, month ${date.month}, day ${date.dayOfMonth}`
}

/** A length of time in whole years and days, e.g. "130 years", "1 year 10 days", "6 days". */
export function formatSpan(days: number): string {
  const years = Math.floor(days / DAYS_PER_YEAR)
  const rest = days % DAYS_PER_YEAR
  const parts: string[] = []
  if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`)
  if (rest > 0 || years === 0) parts.push(`${rest} ${rest === 1 ? 'day' : 'days'}`)
  return parts.join(' ')
}

const numberFormat = new Intl.NumberFormat('en')

/** "603,349" */
export function formatCount(value: number): string {
  return numberFormat.format(value)
}

/**
 * James Ussher's traditional epoch: Anno Mundi 1 (the year of creation) is 4004 BC.
 * This is the same chronology used to date the events in public/events.json, so the two
 * stay consistent. Other chronologies place creation thousands of years earlier or later.
 */
export const CREATION_BC_YEAR = 4004

export interface HistoricalYear {
  era: 'BC' | 'AD'
  /** Always 1 or more. */
  year: number
}

/**
 * Convert an Anno Mundi year (EnochDate.year, 1-based) to a BC/AD year on Ussher's chronology.
 * There is no year zero: Anno Mundi CREATION_BC_YEAR is 1 BC and the following year is AD 1.
 */
export function toHistoricalYear(annoMundiYear: number): HistoricalYear {
  if (!Number.isInteger(annoMundiYear) || annoMundiYear < 1) {
    throw new RangeError(`Year must be an integer of 1 or more, got ${annoMundiYear}`)
  }
  if (annoMundiYear <= CREATION_BC_YEAR) {
    return { era: 'BC', year: CREATION_BC_YEAR - annoMundiYear + 1 }
  }
  return { era: 'AD', year: annoMundiYear - CREATION_BC_YEAR }
}

/** "2348 BC" or "AD 33" */
export function formatHistoricalYear(annoMundiYear: number): string {
  const { era, year } = toHistoricalYear(annoMundiYear)
  return era === 'BC' ? `${formatCount(year)} BC` : `AD ${formatCount(year)}`
}
