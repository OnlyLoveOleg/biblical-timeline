# Biblical timeline in the Enochian calendar

An interactive timeline of the Bible built with Vue 3 (3.5), Vite 8 and TypeScript. Every date is a whole number of days counted from the first day of creation, and the app shows it as a year, month and day in the 364-day calendar of the Astronomical Book of 1 Enoch (1 Enoch 72–82).

- Events load from a local JSON file, `public/events.json`.
- White background.
- The timeline scrolls **horizontally on screens 768px wide and up** and **vertically below that**.
- The event nearest the middle of the screen is the **focused** event: its dot, date and text are highlighted, and the header shows its date and where it falls in the 364-day year.
- Navigate by scrolling, dragging, the mouse wheel, the arrow keys, Page Up and Page Down, Home and End, the Earlier and Later buttons, clicking a card, or clicking the ruler at the bottom.

## Run it

Requires Node 22.18+ or 24.12+.

```sh
npm install
npm run dev        # development server
npm test           # unit tests (Vitest)
npm run build      # type-check and production build into dist/
npm run preview    # serve the production build
```

The app fetches `events.json` at start-up, so it must be served over HTTP. Opening `dist/index.html` straight from disk will not load the events. If you deploy under a sub-path, set `base` in `vite.config.ts`.

## The calendar

| Unit | Length |
|---|---|
| Month | 30 days (the third month of each season has 31) |
| Season (quarter) | 30 + 30 + 31 = 91 days |
| Year | 4 seasons × 91 days = 364 days (52 weeks) |

Day 1 is year 1, month 1, day 1. Months are numbered 1 to 12 across the year, so the months of season 2 are 4, 5 and 6. There are no leap or intercalary days. The code is in `src/lib/enochCalendar.ts`.

## The data file

`public/events.json` is a list of events. Each has exactly these fields:

```json
{
  "date": 602831,
  "title": "The Flood begins",
  "summary": "In Noah’s 600th year, on the 17th day of the second month, …",
  "source": "Genesis 7:11–12"
}
```

`date` is a whole number of days, 1 or more. Events are sorted on load, so file order does not matter. Entries with a missing field or a bad date are skipped, listed in the browser console and counted in a notice at the bottom of the screen.

To work out `date` for a new event, use `toDay(year, month, day)` from `src/lib/enochCalendar.ts` (year counted from 1), or:

```
date = (year - 1) × 364 + monthStart + day
monthStart = 0, 30, 60, 91, 121, 151, 182, 212, 242, 273, 303, 333 for months 1 to 12
```

## Where the dates come from, and how far to trust them

The years follow the Masoretic genealogies and James Ussher’s *Annals of the World* (1650), counted as **years elapsed since creation**. Genealogical ages fix the years as far as Abraham. From there Ussher’s readings of the 430-year and 480-year notes (Exodus 12:40–41, 1 Kings 6:1) carry the count to Solomon’s Temple. Later dates rest on Ussher’s or conventional scholarly dates, which are less certain. New Testament dates use conventional dates converted with Ussher’s 4004 BC epoch.

- **Month and day** are used only where the text gives them. Elsewhere the date is month 1, day 1 (a placeholder), which means “this year” and nothing more. The table below marks which is which.
- **Genesis 7:24 and 8:3–4 count 150 days** from the start of the Flood to the ark resting. On this calendar the same span is **152 days**, because the third and sixth months have 31 days. Only 30-day months give exactly 150. The event summary says so.
- **A 364-day year is about 1.24 days shorter than the solar year.** Years here drift against the real seasons and cannot be converted to modern dates. Ancient sources that use this calendar do not agree on how to correct it.
- **Other chronologies place the same events differently.** The Septuagint and Samaritan Pentateuch add centuries before Abraham, the Book of Jubilees uses its own count, and secular scholarship differs by far more. To switch schemes, change the `date` values.
- **Weekdays are not shown.** In the Enochic and Jubilees tradition the year begins on the fourth day of the week, which does not match counting day 1 as the first day of creation.
- The Fall is placed on day 8 only so that it follows creation week. Genesis gives no date.

### Events in the shipped file

| `date` | Year, month, day | Event | Month and day |
|---:|---|---|---|
| 1 | 1, 1, 1 | Light: the first day | stated in the text |
| 2 | 1, 1, 2 | The vault of the sky | stated in the text |
| 3 | 1, 1, 3 | Land, seas and plants | stated in the text |
| 4 | 1, 1, 4 | Sun, moon and stars | stated in the text |
| 5 | 1, 1, 5 | Sea creatures and birds | stated in the text |
| 6 | 1, 1, 6 | Animals and humankind | stated in the text |
| 7 | 1, 1, 7 | The seventh day | stated in the text |
| 8 | 1, 1, 8 | The Fall and exile from Eden | placeholder (1/1) |
| 46,957 | 130, 1, 1 | Cain kills Abel | placeholder (1/1) |
| 47,321 | 131, 1, 1 | Seth is born | derived from the text |
| 338,521 | 931, 1, 1 | Adam dies | derived from the text |
| 359,269 | 988, 1, 1 | Enoch is taken | derived from the text |
| 384,385 | 1057, 1, 1 | Noah is born | derived from the text |
| 602,831 | 1657, 2, 17 | The Flood begins | stated in the text |
| 602,983 | 1657, 7, 17 | The ark rests on Ararat | stated in the text |
| 603,058 | 1657, 10, 1 | Mountaintops appear | stated in the text |
| 603,149 | 1658, 1, 1 | The waters dry up | stated in the text |
| 603,205 | 1658, 2, 27 | Noah leaves the ark | stated in the text |
| 639,549 | 1758, 1, 1 | Babel and the scattering of nations | placeholder (1/1) |
| 758,213 | 2084, 1, 1 | God calls Abram | placeholder (1/1) |
| 766,949 | 2108, 1, 1 | Sodom and Gomorrah are destroyed | derived from the text |
| 767,313 | 2109, 1, 1 | Isaac is born | derived from the text |
| 789,153 | 2169, 1, 1 | Jacob and Esau are born | derived from the text |
| 828,465 | 2277, 1, 1 | Joseph is sold into Egypt | derived from the text |
| 833,197 | 2290, 1, 1 | Joseph rises to power | derived from the text |
| 836,473 | 2299, 1, 1 | Jacob’s family moves to Egypt | derived from the text |
| 885,613 | 2434, 1, 1 | Moses is born | derived from the text |
| 914,746 | 2514, 1, 14 | The first Passover | stated in the text |
| 914,747 | 2514, 1, 15 | The Exodus | stated in the text |
| 914,793 | 2514, 3, 1 | Israel reaches Sinai | derived from the text |
| 915,097 | 2515, 1, 1 | The tabernacle is raised | stated in the text |
| 929,232 | 2553, 11, 1 | Moses’ farewell speeches | stated in the text |
| 929,302 | 2554, 1, 10 | Israel crosses the Jordan | stated in the text |
| 1,058,877 | 2910, 1, 1 | Saul is anointed king | placeholder (1/1) |
| 1,073,437 | 2950, 1, 1 | David becomes king | placeholder (1/1) |
| 1,075,985 | 2957, 1, 1 | David takes Jerusalem | placeholder (1/1) |
| 1,087,997 | 2990, 1, 1 | Solomon becomes king | placeholder (1/1) |
| 1,089,120 | 2993, 2, 2 | Work begins on the Temple | stated in the text |
| 1,092,190 | 3001, 7, 8 | The Temple is dedicated | derived from the text |
| 1,102,557 | 3030, 1, 1 | The kingdom divides | placeholder (1/1) |
| 1,195,013 | 3284, 1, 1 | Samaria falls to Assyria | placeholder (1/1) |
| 1,236,873 | 3399, 1, 1 | Daniel and others are taken to Babylon | placeholder (1/1) |
| 1,243,552 | 3417, 5, 7 | Jerusalem and the Temple are destroyed | stated in the text |
| 1,261,625 | 3467, 1, 1 | Babylon falls | placeholder (1/1) |
| 1,262,353 | 3469, 1, 1 | Cyrus decrees the return | placeholder (1/1) |
| 1,270,332 | 3490, 12, 3 | The second Temple is completed | stated in the text |
| 1,291,230 | 3548, 5, 1 | Ezra arrives in Jerusalem | stated in the text |
| 1,295,652 | 3560, 6, 25 | Nehemiah finishes the wall | stated in the text |
| 1,456,001 | 4001, 1, 1 | Jesus is born | placeholder (1/1) |
| 1,467,649 | 4033, 1, 1 | Jesus is baptized | placeholder (1/1) |
| 1,469,118 | 4037, 1, 14 | The crucifixion | derived from the text |
| 1,469,120 | 4037, 1, 16 | The resurrection | derived from the text |
| 1,469,169 | 4037, 3, 5 | Pentecost | derived from the text |
| 1,492,037 | 4100, 1, 1 | John’s vision on Patmos | placeholder (1/1) |

## Project layout

```
public/events.json            the events
src/App.vue                   loading, error and empty states, keyboard control, layout
src/components/
  TimelineTrack.vue           scroll container: horizontal or vertical, focus detection
  FocusReadout.vue            header readout of the focused date
  YearDial.vue                dial showing the focused day within the 364-day year
  OverviewRuler.vue           ruler across all events, proportional to elapsed time
  AboutDialog.vue             explanation of the calendar and its limits
src/lib/enochCalendar.ts      day number <-> year/season/month/day, formatting
src/lib/loadEvents.ts         fetch, validate, sort and decode events
src/__tests__/                calendar, data file and app tests
```

## Notes on the design

- **Spacing is by event, not by time.** Cards are evenly spaced and the gap between them is labelled (for example “600 years 46 days”). A true time scale would put the seven days of creation and the 4,000 years that follow on the same axis, which cannot be drawn usefully. The ruler at the bottom is proportional, so it shows the real distribution.
- **“Infinite” scroll** is implemented as a continuous free scroll with generous padding at both ends, so the first and last events can reach the centre. It does not load more content or wrap around, and all events are rendered at once. That is fine for a few hundred events. For thousands, virtualise the list.
- Motion respects `prefers-reduced-motion`, and the page stays white in dark mode.
