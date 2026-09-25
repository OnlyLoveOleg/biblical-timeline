<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const open = defineModel<boolean>({ required: true })
const dialog = ref<HTMLDialogElement | null>(null)

function sync(value: boolean) {
  const d = dialog.value
  if (!d) return
  if (value && !d.open) {
    if (typeof d.showModal === 'function') d.showModal()
    else d.setAttribute('open', '')
  } else if (!value && d.open) {
    if (typeof d.close === 'function') d.close()
    else d.removeAttribute('open')
  }
}

onMounted(() => sync(open.value))
watch(open, sync)

// Click on the backdrop (the dialog element itself) closes it.
function onClick(e: MouseEvent) {
  if (e.target === dialog.value) open.value = false
}
</script>

<template>
  <dialog ref="dialog" class="about" aria-labelledby="about-title" @close="open = false" @click="onClick">
    <div class="sheet">
      <h2 id="about-title">How dates are counted</h2>

      <p>
        Day 1 is the first day of creation. Every date is a whole number of days from that day, and the app converts it
        to a year, month and day with the cycles of the 364-day calendar in the Astronomical Book of 1 Enoch.
      </p>

      <table>
        <tbody>
          <tr>
            <th scope="row">Month</th>
            <td>30 days (31 for the third month of a season)</td>
          </tr>
          <tr>
            <th scope="row">Season</th>
            <td>30 + 30 + 31 = 91 days</td>
          </tr>
          <tr>
            <th scope="row">Year</th>
            <td>4 seasons × 91 days = 364 days, or 52 weeks</td>
          </tr>
        </tbody>
      </table>

      <h3>Where the numbers come from</h3>
      <p>
        Years follow the Masoretic genealogies and James Ussher’s 1650 chronology, counted as years elapsed since
        creation. Month and day are used only where the text gives them, such as the Flood, Passover and the Temple.
        Other events use month 1, day 1, so read those dates as “sometime this year”.
      </p>
      <p>
        The BC/AD year shown alongside the header comes from the same chronology: creation falls in 4004 BC, with no
        year zero, so the year right after 1 BC is AD 1. It moves with whichever event is focused.
      </p>

      <h3>What to keep in mind</h3>
      <p>
        A 364-day year is about a day and a quarter shorter than the solar year. These years drift against the real
        seasons, so the dates cannot be converted to modern calendar dates.
      </p>
      <p>
        Other chronologies, including the Septuagint, the Samaritan Pentateuch, the Book of Jubilees and secular
        scholarship, place the same events centuries or even millennia apart. To use a different scheme, edit
        <code>public/events.json</code>.
      </p>
      <p>
        Weekdays are not shown. In the Enochic tradition the year begins on the fourth day of the week, which does not
        match counting day 1 as the first day of creation.
      </p>

      <button type="button" class="close" @click="open = false">Close</button>
    </div>
  </dialog>
</template>

<style scoped>
.about {
  width: min(38rem, calc(100% - 2rem));
  max-height: calc(100dvh - 2rem);
  padding: 0;
  border: 1px solid var(--rule);
  background: #fff;
  color: var(--ink);
}
.about::backdrop {
  background: rgb(27 34 54 / 0.35);
}
.sheet {
  padding: 1.5rem 1.5rem 1.25rem;
}
h2 {
  margin: 0 0 0.75rem;
  font: 600 1.5rem/1.2 var(--serif);
}
h3 {
  margin: 1.5rem 0 0.35rem;
  font: 600 1.0625rem/1.3 var(--serif);
}
p {
  margin: 0 0 0.75rem;
  font: 1rem/1.6 var(--serif);
}
table {
  width: 100%;
  margin: 1rem 0 0;
  border-collapse: collapse;
  font-size: 0.9375rem;
}
th,
td {
  padding: 0.5rem 0;
  border-top: 1px solid var(--rule);
  text-align: left;
  vertical-align: top;
}
th {
  width: 5.5rem;
  font-weight: 600;
}
tr:last-child th,
tr:last-child td {
  border-bottom: 1px solid var(--rule);
}
code {
  font-size: 0.9em;
}
.close {
  margin-top: 0.75rem;
  padding: 0.55rem 1.1rem;
  border: 1px solid var(--accent);
  background: var(--accent);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
.close:hover {
  background: #1d33b0;
}
</style>
