# Phase 3.2.4 — Payment Provider Integration Layer

## Objective
Transition from manual payment-link architecture to provider-backed payment execution while preserving multi-rail flexibility.

---

# Current State
## Live:
- Stripe link placeholders
- Cash App
- Venmo
- PayPal
- Cash
- Crypto
- QR code payment prep
- Invoice history
- Invoice search
- Reminder metadata

---

# Next Technical Integrations

## Stripe
### Use For:
- Card processing
- invoices
- subscriptions
- recurring B2B
- saved cards

### Environment Variables:
- VITE_STRIPE_PUBLISHABLE_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET

### Build:
- payment intent generation
- hosted checkout
- invoice payment links
- webhook payment reconciliation

---

## PayPal
### Use For:
- alternate consumer payments
- some commercial flexibility

### Environment Variables:
- VITE_PAYPAL_CLIENT_ID
- PAYPAL_SECRET

---

## Square
### Recommended Future:
Excellent for in-person + mobile + retail kiosk ecosystem.

---

# Cash App / Venmo
No deep native enterprise stack required initially.
Primary use:
- payment handles
- QR links
- customer convenience

---

# Crypto
### Best Use:
Optional luxury / international / future use.
### Important:
Prefer stablecoin options before broader token acceptance.

---

# New Collections Added
## paymentActions
Track:
- invoiceId
- provider
- actionType
- status
- externalReferenceId
- createdAt

## invoiceReminders
Track:
- invoiceId
- dueDate
- reminder cadence
- SMS/email state

---

# Dashboard Expansion Targets
## Revenue Intelligence:
- total invoiced
- collected revenue
- outstanding receivables
- overdue receivables
- payment method distribution
- average invoice value
- customer lifetime value
- B2B MRR

---

# Strategic Priority Order
## Immediate:
1. Stripe
2. Reminder automation
3. Revenue dashboard
4. Square
5. Native PayPal

---

# Strategic Principle
### Build real payment infrastructure without sacrificing optionality.

Your advantage is not one processor.
Your advantage is payment flexibility + operational coherence.
