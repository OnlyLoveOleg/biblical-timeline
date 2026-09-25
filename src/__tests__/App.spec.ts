import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App.vue'

const sample = [
  { date: 1, title: 'First', summary: 'One.', source: 'Genesis 1:1' },
  { date: 400, title: 'Second', summary: 'Two.', source: 'Genesis 5:3' },
  { date: 800, title: 'Third', summary: 'Three.', source: 'Genesis 6:1' },
]

function mockFetch(impl: () => Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn(impl))
}

beforeEach(() => {
  // jsdom has no layout; the component must cope without matchMedia / scrollTo.
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0))
})
afterEach(() => vi.unstubAllGlobals())

describe('App', () => {
  it('loads events from the local JSON file and focuses the first one', async () => {
    mockFetch(async () => new Response(JSON.stringify(sample)))
    const wrapper = mount(App, { attachTo: document.body })
    expect(wrapper.text()).toContain('Loading events')

    await flushPromises()

    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/events\.json$/))
    const items = wrapper.findAll('.event')
    expect(items).toHaveLength(3)
    expect(items[0]!.classes()).toContain('is-focused')
    expect(items[1]!.classes()).not.toContain('is-focused')
    expect(wrapper.find('.readout').text()).toContain('Year 1')
    wrapper.unmount()
  })

  it('moves the highlight with the Later button, the arrow keys and a click', async () => {
    mockFetch(async () => new Response(JSON.stringify(sample)))
    const wrapper = mount(App, { attachTo: document.body })
    await flushPromises()
    const focusedTitle = () => wrapper.find('.event.is-focused .title').text()

    await wrapper.findAll('button.step')[1]!.trigger('click') // Later
    expect(focusedTitle()).toBe('Second')
    expect(wrapper.find('.readout').text()).toContain('Year 2') // day 400 falls in year 2

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    await flushPromises()
    expect(focusedTitle()).toBe('Third')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }))
    await flushPromises()
    expect(focusedTitle()).toBe('First')

    await wrapper.findAll('.event')[2]!.trigger('click')
    expect(focusedTitle()).toBe('Third')
    wrapper.unmount()
  })

  it('shows an error with a retry when the file cannot be loaded', async () => {
    mockFetch(async () => new Response('missing', { status: 404, statusText: 'Not Found' }))
    const wrapper = mount(App, { attachTo: document.body })
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toContain('could not be loaded')
    expect(wrapper.find('[role="alert"]').text()).toContain('404')
    expect(wrapper.find('.track').exists()).toBe(false)
    wrapper.unmount()
  })

  it('tells the user when entries were skipped', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockFetch(async () => new Response(JSON.stringify([...sample, { date: -3, title: 'Bad', summary: 'x', source: 'y' }])))
    const wrapper = mount(App, { attachTo: document.body })
    await flushPromises()
    expect(wrapper.findAll('.event')).toHaveLength(3)
    expect(wrapper.find('.notice').text()).toContain('1 entry was skipped')
    wrapper.unmount()
  })
})
