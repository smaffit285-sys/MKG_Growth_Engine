# Deployment URL Strategy

## Current Preferred Domain

Primary public brand domain:
```txt
miamiknifeguy.com
```

Secondary owned domain:
```txt
miamiknifeguy.club
```

---

## Recommended Near-Term Structure

Because `miamiknifeguy.com` is the main customer-facing brand domain, the Growth Engine should avoid taking over the entire root site unless the public website is also being migrated into this same React app.

Recommended structure:

```txt
https://miamiknifeguy.com/              Public website
https://miamiknifeguy.com/register      Customer capture
https://miamiknifeguy.com/review        Review submission
https://miamiknifeguy.com/ugc-submit    UGC submission
https://miamiknifeguy.com/free-sharpening Public offer funnel
https://miamiknifeguy.com/r/:code       Referral landing
```

Internal admin/operator routes:

```txt
https://miamiknifeguy.com/login
https://miamiknifeguy.com/dashboard
https://miamiknifeguy.com/customers
https://miamiknifeguy.com/commercial
https://miamiknifeguy.com/timeline
https://miamiknifeguy.com/sessions
https://miamiknifeguy.com/content
https://miamiknifeguy.com/proof
https://miamiknifeguy.com/training
https://miamiknifeguy.com/invoices
```

---

## Safer Alternative

If the current public website is already deployed separately, the Growth Engine should be deployed on a subdomain instead:

```txt
https://engine.miamiknifeguy.com
```

or

```txt
https://app.miamiknifeguy.com
```

Then customer-facing operational funnels could be:

```txt
https://app.miamiknifeguy.com/register
https://app.miamiknifeguy.com/review
https://app.miamiknifeguy.com/ugc-submit
https://app.miamiknifeguy.com/free-sharpening
```

This avoids conflicts with the current marketing website.

---

## Possible Use of miamiknifeguy.club

`miamiknifeguy.club` may be useful later for:
- VIP sharpening club
- member portal
- community offers
- events/workshops
- loyalty campaigns

Recommended future use:

```txt
https://miamiknifeguy.club
```

as the membership/community layer, not the main admin engine.

---

## Important Deployment Notes

The current `vercel.json` rewrites all routes to `index.html`, which is correct for a Vite/React single-page app.

However, if this project is deployed directly onto the root of `miamiknifeguy.com`, it will replace or conflict with any existing website also using that root domain.

Before connecting the root domain, decide whether:

1. This Growth Engine app is becoming the entire public website and admin app, or
2. The existing website remains separate and the Growth Engine uses a subdomain.

Recommended near-term choice:

```txt
engine.miamiknifeguy.com
```

Then later, selected customer-facing routes can be linked from the public website.
