# Public Registration Link Strategy

## Primary Customer Registration Link

Use this as the clean public-facing registration link everywhere:

```txt
https://miamiknifeguy.com/register
```

This should be used on:
- QR codes
- business cards
- flyers
- market signage
- chef handouts
- receipts
- Instagram/Facebook bio links
- SMS follow-ups
- printed review/referral cards

---

## Current Live Engine Fallback

Until `miamiknifeguy.com/register` is routed to the Growth Engine, use the currently deployed engine route:

```txt
https://miamiknifeguy.club/register
```

or the current Vercel deployment URL with:

```txt
/register
```

---

## Recommended Domain Routing

### Public Website
```txt
https://miamiknifeguy.com
```

### Public Registration Funnel
```txt
https://miamiknifeguy.com/register
```

### Internal CRM / Growth Engine
```txt
https://engine.miamiknifeguy.com/login
```

---

## Implementation Options

### Option A — Same Vercel Project Handles Public Route
Point `miamiknifeguy.com/register` to this Growth Engine app.

### Option B — Existing Website Redirect
If `miamiknifeguy.com` is hosted by the separate website project, add a redirect there:

```txt
/register -> https://miamiknifeguy.club/register
```

Later replace fallback with:

```txt
/register -> https://engine.miamiknifeguy.com/register
```

---

## Strategic Principle
The public-facing link should always look simple:

```txt
miamiknifeguy.com/register
```

Even if the backend route eventually resolves to the Growth Engine subdomain.
