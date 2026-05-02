# MKG Growth Engine — Pre-Deployment Checklist

## Objective
Ensure the system is operationally safe, brand-consistent, secure, and commercially usable before Vercel deployment.

---

# Critical Before Deployment

## 1. Firebase Core
- [ ] Firebase project created
- [ ] Firestore enabled
- [ ] Firebase Auth enabled (Email/Password)
- [ ] Admin user created
- [ ] Firestore security rules updated for new collections:
  - commercialAccounts
  - customerEvents
  - contentPipeline
  - proofAssets
  - trainingSessions
  - sharpeningSessions
  - invoices
- [ ] Public routes limited appropriately
- [ ] Twilio config set if SMS is required

---

## 2. Environment Variables
### Vercel
- [ ] `VITE_FIREBASE_API_KEY`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN`
- [ ] `VITE_FIREBASE_PROJECT_ID`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `VITE_FIREBASE_APP_ID`
- [ ] `VITE_TWILIO_NUMBER`

### Firebase Functions
- [ ] Twilio SID
- [ ] Twilio Auth Token
- [ ] Twilio From Number

---

## 3. UI Hardening
### Immediate Priority
- [ ] Mobile nav optimization
- [ ] Form validation improvements
- [ ] Error handling
- [ ] Success states
- [ ] Empty states
- [ ] Loading states
- [ ] Invoice branding
- [ ] Invoice tax/discount fields
- [ ] Invoice recurring templates
- [ ] Commercial proposal templates

---

## 4. Operational Readiness
- [ ] Test customer registration
- [ ] Test review flow
- [ ] Test UGC flow
- [ ] Test referral flow
- [ ] Test commercial account intake
- [ ] Test sharpening session logging
- [ ] Test invoice creation on mobile
- [ ] Test role permissions
- [ ] Test logout/login

---

## 5. Dashboard Priorities Before Public Reliance
- [ ] Dashboard KPI cards updated for new systems
- [ ] Commercial metrics
- [ ] Training metrics
- [ ] Content metrics
- [ ] Proof metrics
- [ ] Revenue metrics

---

## 6. Brand Readiness
- [ ] Domain stack configured:
  - miamiknifeguy.com
  - engine.miamiknifeguy.com
  - miamiknifeguy.club
- [ ] Public website links to engine routes
- [ ] Admin routes not publicly emphasized
- [ ] Logo consistency
- [ ] Visual polish
- [ ] SEO pages remain intact

---

## 7. Highest-Leverage Recommended Additions Before Deployment
### Build Next:
- [ ] Firestore rules expansion
- [ ] Dashboard overhaul
- [ ] Invoice PDF/export
- [ ] Stripe/Square integration
- [ ] Proposal generator
- [ ] Membership management dashboard
- [ ] Customer detail timeline integration
- [ ] Search/filter across all records
- [ ] Backup/export systems

---

## Launch Philosophy
Deploy when:
### Operationally useful > perfect

But do not deploy if:
### Security, brand confusion, or broken workflows could undermine trust.

---

## Immediate Best Path
### Recommended Sequence:
1. Firestore rules
2. Dashboard upgrade
3. Mobile polish
4. Invoice expansion
5. Deploy to `engine.miamiknifeguy.com`
6. Link selective public funnels from `miamiknifeguy.com`
