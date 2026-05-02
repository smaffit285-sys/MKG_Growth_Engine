# MKG Domain Stack Strategy

## Final Recommended Stack

### 1. Public Brand / SEO / Trust
```txt
https://miamiknifeguy.com
```

Purpose:
- Main public website
- SEO authority
- service pages
- Sharp After Dark positioning
- chef trust
- content hub
- ebook funnel
- workshop pages
- press/media credibility
- public conversion paths

Do not let internal admin tools dominate this root experience.

---

### 2. Growth Engine / Operations / Admin
```txt
https://engine.miamiknifeguy.com
```

Purpose:
- CRM
- customers
- commercial pipeline
- invoices
- reviews moderation
- UGC moderation
- training dashboard
- proof vault
- content pipeline
- sharpening sessions
- internal timeline
- operational analytics

Primary admin entry:
```txt
https://engine.miamiknifeguy.com/login
```

Primary dashboard:
```txt
https://engine.miamiknifeguy.com/dashboard
```

---

### 3. Membership / Community / Loyalty
```txt
https://miamiknifeguy.club
```

Purpose:
- VIP sharpening club
- member offers
- loyalty campaigns
- workshops
- member education
- exclusive drops
- community content
- future member portal

This should feel separate from admin infrastructure and more like a premium customer/member experience.

---

## Recommended Route Map

### Public Website Routes on `miamiknifeguy.com`
```txt
/                         Homepage
/sharp-after-dark          B2B commercial service
/services                  Consumer sharpening services
/vip                       VIP membership overview
/workshops                 Workshops and education
/ebook                     Ebook funnel
/content or /learn         Knowledge base / articles
/partners                  Chef and local partner proof
/contact                   Contact and quote request
```

### Engine Routes on `engine.miamiknifeguy.com`
```txt
/login
/dashboard
/customers
/customer/:id
/commercial
/timeline
/sessions
/content
/proof
/training
/invoices
/referrals
/rewards
/ugc
/reviews
/settings
```

### Customer-Facing Operational Routes on `engine.miamiknifeguy.com`
These can be linked from the public website or QR codes:
```txt
/register
/review
/ugc-submit
/free-sharpening
/r/:referralCode
```

Later, these can be replaced with branded public routes or embedded flows if needed.

---

## Vercel Setup Recommendation

Deploy the Growth Engine repo to:
```txt
engine.miamiknifeguy.com
```

Do not attach this repo to the root `miamiknifeguy.com` domain unless the public website is intentionally being migrated into this app.

DNS likely requires:
```txt
Type: CNAME
Name: engine
Value: cname.vercel-dns.com
```

Vercel will show the exact DNS target to use.

---

## Public Website Linking Strategy

The public website should link into the engine selectively:

```txt
Book / Register       -> https://engine.miamiknifeguy.com/register
Leave a Review        -> https://engine.miamiknifeguy.com/review
Submit UGC            -> https://engine.miamiknifeguy.com/ugc-submit
Referral Link         -> https://engine.miamiknifeguy.com/r/:code
Admin Login           -> https://engine.miamiknifeguy.com/login
```

Admin login should not be prominent in public navigation.

---

## Security Principle

Customer-facing brand pages should be public.
Internal operational pages should be protected by Firebase Auth and role-aware routing.

Before launch, confirm:
- Firebase Auth is active
- Firestore rules protect admin collections
- only intended public routes can write public submissions
- Vercel environment variables are set
- admin user exists

---

## Future Domain Use

### `miamiknifeguy.com`
Brand authority and public conversion.

### `engine.miamiknifeguy.com`
Business operating system.

### `miamiknifeguy.club`
VIP membership, community, and loyalty.

This structure supports growth without confusing public customers, staff operators, members, commercial clients, or future licensing partners.
