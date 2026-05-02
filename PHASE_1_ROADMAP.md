# MKG Growth Engine — Phase 1 Hardening Roadmap

## Objectives
Stabilize the platform into operational infrastructure for the full Miami Knife Guy ecosystem, with a primary emphasis on B2B trust, recurring commercial accounts, authority-building, and white-label readiness.

---

## Completed Foundation

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

## Ecosystem Context

MKG is not only a knife sharpening service. The platform must support a connected ecosystem:

### Core Brands / Offers
- Miami Knife Guy consumer and local authority brand
- Sharp After Dark B2B sharpening service for restaurants, hotels, yacht clubs, country clubs, and high-end caterers
- VIP sharpening club with tiered memberships and priority turnaround
- Commercial monthly sharpening accounts with pickup/delivery
- Knife sharpening and forging workshops
- Edge maintenance and knife care courses for commercial customers
- Ebook and knowledge-base funnel
- YouTube, Instagram, Facebook, podcast, and guest-appearance content channels
- Local market/event presence including Smorgasburg FTL and farmers markets
- Chef partnerships and chef-club expansion
- Sharpening tower upgrades for Perfect Edge systems
- Future user app with camera/AR education, knife assessment, knife selection guidance, user content, offers, and merch incentives
- Future SharpBot licensing
- Future white-labeled CRM, growth engine, marketing materials, and invoicing for sharpeners

---

## Phase 1 Priority Buildouts

### 1. Commercial Account Layer
Create first-class B2B account records:
```txt
commercialAccounts/{accountId}
  businessName
  accountType: restaurant | hotel | yacht_club | country_club | caterer | chef_partner | other
  decisionMaker
  contactName
  phone
  email
  address
  pickupDeliveryEligible
  serviceFrequency
  knivesEstimated
  monthlyValue
  accountStatus: prospect | trial | active | paused | lost
  trustStage: cold | introduced | sampled | proposal_sent | closed
  nextFollowUpAt
  source
  notes
```

### 2. Customer / Account Timeline Engine
Create:
```txt
customerEvents/{eventId}
```
Track:
- customer_created
- commercial_account_created
- market_lead_captured
- chef_partner_added
- sharpening_completed
- pickup_scheduled
- delivery_completed
- review_requested
- review_submitted
- referral_sent
- reward_issued
- ugc_uploaded
- sms_sent
- retention_campaign_triggered
- proposal_sent
- commercial_trial_completed
- membership_started
- workshop_interest_logged

### 3. Authority & Content Pipeline
Create:
```txt
contentPipeline/{contentId}
```
Track:
- channel: youtube | instagram | facebook | blog | ebook | podcast | press | short_form
- audience: chefs | home_cooks | restaurants | hotels | yacht_clubs | sharpeners | members
- stage: idea | scripted | filmed | edited | scheduled | published | repurposed
- authorityGoal: education | trust | proof | offer | founder_story | technical_expertise
- linkedOffer
- publishDate
- metrics

### 4. Reviews, Reputation & Proof Vault
Create:
```txt
proofAssets/{assetId}
```
Track:
- google_review
- yelp_review
- testimonial
- chef_quote
- before_after_photo
- event_photo
- workshop_photo
- press_mention
- podcast_appearance
- youtube_feature

### 5. Analytics Optimization
Move heavy dashboard calculations to:
```txt
analytics/dailyStats
analytics/monthlyStats
analytics/commercialPipeline
analytics/topAmbassadors
analytics/contentPerformance
analytics/reputationGrowth
```

---

## Automation Layer

Create Firebase Functions for:
- post-service review requests
- commercial follow-up reminders
- proposal follow-ups
- monthly account renewal reminders
- referral reward issuance
- inactivity retention campaigns
- membership renewal reminders
- UGC follow-up incentives
- market lead follow-up
- chef partnership follow-up
- course/workshop interest nurture

---

## Ecosystem Defensive Moat

The defensibility target is not only local sharpening volume. It is the combination of:

1. Recurring B2B accounts
2. Chef trust network
3. Local event presence
4. Reviews and proof assets
5. Educational authority
6. VIP membership retention
7. Proprietary CRM/workflow data
8. Technical sharpening-system upgrades
9. Future AR/user app engagement
10. Future white-label growth engine for sharpeners
11. SharpBot licensing opportunity

---

## Core KPI Targets

### B2B
- Commercial pipeline value
- Commercial close rate
- Average monthly account value
- Commercial retention rate
- Proposal-to-close rate
- Trial-to-recurring conversion rate

### Consumer / Community
- Customer LTV
- Repeat visit rate
- VIP membership conversion
- Event lead conversion
- Referral rate

### Authority / Reputation
- Google review count
- Yelp review count
- Review request conversion rate
- UGC conversion rate
- Content publishing cadence
- Content-to-lead conversion
- Chef partner count
- Press/podcast/YouTube appearances

### Platform / Future Licensing
- White-label lead interest
- Sharpener partner interest
- Feature requests from other sharpeners
- Operational workflows mature enough to package

---

## Strategic Goal
Transition from:
### Knife Sharpening Service

Into:
### B2B-First Knife Care Authority + Local Trust Brand + Sharpening Growth OS

Franchising is not a near-term focus. The near-term priority is proof, recurring commercial revenue, brand authority, and operational repeatability. Future scalability should preserve room for SharpBot licensing and white-labeled CRM/growth-engine opportunities.
