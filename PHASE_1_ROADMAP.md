# MKG Growth Engine — Phase 1 Hardening Roadmap

## Objectives
Stabilize the platform into operational infrastructure before scaling marketing volume.

---

## Completed Foundation (This Update)

### Access Control Layer
- Centralized `roles.js`
- Permission matrix
- Role-aware auth context
- Permission-aware route protection

### New Firestore Collection
```txt
staffUsers/{uid}
  role: owner | admin | staff | marketing | readonly
  createdAt
  createdBy
```

---

## Next Priority Buildouts

### 1. Customer Timeline Engine
Create:
```txt
customerEvents/
```
Track:
- customer_created
- sharpening_completed
- review_submitted
- referral_sent
- reward_issued
- ugc_uploaded
- sms_sent
- retention_campaign_triggered

---

### 2. Automation Layer
Create Firebase Functions for:
- post-service review requests
- referral reward issuance
- inactivity retention campaigns
- birthday / seasonal promotions
- UGC follow-up incentives

---

### 3. Analytics Optimization
Move heavy dashboard calculations to:
```txt
analytics/dailyStats
analytics/monthlyStats
analytics/topAmbassadors
```

---

### 4. Defensive Brand Moat
Connect ecosystem:
- Website → lead capture
- Print collateral → QR funnel
- Ebook → authority + nurture
- CRM → retention
- Referral engine → acquisition
- Reviews/UGC → trust flywheel
- SMS → lifecycle automation

---

## Core KPI Targets
- Customer LTV
- Referral Rate
- Review Conversion Rate
- UGC Conversion Rate
- Repeat Visit Rate
- Reward Redemption Efficiency
- CAC by channel

---

## Strategic Goal
Transition from "knife sharpening business" into:
### Local Service Brand + Media Engine + Growth OS
