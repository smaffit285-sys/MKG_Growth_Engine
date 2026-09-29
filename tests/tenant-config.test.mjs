import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { URL } from 'node:url'
import { createBrand } from '../src/lib/brand.js'
import { oidcVerificationOptions } from '../api/website-intake.js'

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('tenant brand can be configured without changing source code', () => {
  const brand = createBrand({
    VITE_BRAND_BUSINESS_NAME: 'Edge Works',
    VITE_BRAND_SHORTHAND: 'EW',
    VITE_BRAND_OWNER_NAME: 'Alex',
    VITE_BRAND_PHONE_E164: '+15551234567',
    VITE_BRAND_WEBSITE_URL: 'https://edge.example/',
  })
  assert.equal(brand.businessName, 'Edge Works')
  assert.equal(brand.shorthand, 'EW')
  assert.equal(brand.ownerName, 'Alex')
  assert.equal(brand.phoneSms, '15551234567')
  assert.equal(brand.websiteUrl, 'https://edge.example')
})

test('website OIDC trust can be isolated per tenant', () => {
  const options = oidcVerificationOptions({
    VERCEL_OIDC_SCOPE: 'edge-team',
    VERCEL_OIDC_OWNER_ID: 'team_edge',
    WEBSITE_VERCEL_PROJECT_ID: 'prj_edge',
    WEBSITE_VERCEL_ENVIRONMENTS: 'production',
  })
  assert.deepEqual(options, {
    issuer: 'https://oidc.vercel.com/edge-team',
    audience: 'https://vercel.com/edge-team',
    ownerId: 'team_edge',
    projectId: 'prj_edge',
    environment: ['production'],
  })
})

test('the CRM repository contains no copied Astro public-site page', async () => {
  await assert.rejects(read('src/pages/index.astro'), /ENOENT/)
})

test('tenant deployment documentation preserves isolated customer data', async () => {
  const guide = await read('TENANT_DEPLOYMENT.md')
  assert.match(guide, /isolated deployment/i)
  assert.match(guide, /Never point two unrelated sharpeners at the same Firestore database/i)
  assert.match(guide, /legacy public routes/i)
})
