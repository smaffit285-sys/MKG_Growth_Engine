function configured(env, key, fallback) {
  const value = String(env?.[key] || '').trim()
  return value || fallback
}

function digits(value) {
  return String(value || '').replace(/\D/g, '')
}

export function createBrand(env = {}) {
  const websiteUrl = configured(env, 'VITE_BRAND_WEBSITE_URL', 'https://www.miamiknifeguy.com').replace(/\/+$/, '')
  const phoneE164 = configured(env, 'VITE_BRAND_PHONE_E164', '+13059095773')
  return Object.freeze({
    businessName: configured(env, 'VITE_BRAND_BUSINESS_NAME', 'Miami Knife Guy'),
    shorthand: configured(env, 'VITE_BRAND_SHORTHAND', 'MKG'),
    ownerName: configured(env, 'VITE_BRAND_OWNER_NAME', 'Sean'),
    phoneDisplay: configured(env, 'VITE_BRAND_PHONE_DISPLAY', '305-909-5773'),
    phoneSms: digits(phoneE164),
    phoneE164,
    website: configured(env, 'VITE_BRAND_WEBSITE', 'www.miamiknifeguy.com'),
    websiteUrl,
    email: configured(env, 'VITE_BRAND_EMAIL', 'miamiknifeguy@gmail.com'),
    tagline: configured(env, 'VITE_BRAND_TAGLINE', 'On the cutting edge since 2009'),
    socialHandle: configured(env, 'VITE_BRAND_SOCIAL_HANDLE', '@MiamiKnifeGuy'),
    reviewRequest: configured(env, 'VITE_BRAND_REVIEW_REQUEST', 'If the service earned it, an honest Google review is always appreciated.'),
  })
}

export const BRAND = createBrand(import.meta.env)
export const MKG_BRAND = BRAND
