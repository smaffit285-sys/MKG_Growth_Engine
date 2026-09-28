import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { URL } from 'node:url'

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('installable app opens the touch launchpad with Android and Apple icon assets', async () => {
  const manifest = JSON.parse(await read('public/manifest.webmanifest'))
  const html = await read('index.html')
  assert.equal(manifest.start_url, '/launch')
  assert.equal(manifest.display, 'standalone')
  assert(manifest.icons.some(icon => icon.sizes === '192x192' && icon.type === 'image/png'))
  assert(manifest.icons.some(icon => icon.sizes === '512x512' && icon.type === 'image/png'))
  assert.match(html, /apple-touch-icon.*growth-engine-icon-180\.png/)
})

test('launchpad exposes both customer paths and the requested one-tap tools', async () => {
  const source = await read('src/pages/Launchpad.jsx')
  for (const label of ['Non-commercial', 'Commercial', 'Catalogue', 'Invoices', 'FAQs', 'Referrals', 'Reviews']) {
    assert.match(source, new RegExp(label, 'i'))
  }
  assert.match(source, /\/field\?path=consumer/)
  assert.match(source, /\/invoices\?type=b2b/)
})

test('standalone offer promises full white-label customization', async () => {
  const offer = await read('SHARPENER_GROWTH_ENGINE_OFFER.md')
  for (const term of ['Graphics', 'layout', 'colors', 'app icon', 'content', 'service catalogue', 'pricing', 'customer journeys']) {
    assert.match(offer, new RegExp(term, 'i'))
  }
  assert.match(offer, /standalone, white-label operating system/i)
})
