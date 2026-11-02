# Local discovery rollout

This change preserves the Astro website and the separate React/Firebase Growth Engine.

## Deployment order

1. Review the website preview and approve the changes before merging, per README.md.
2. Deploy the Growth Engine branch. `/api/public-proof` uses the same existing Google Cloud workload identity configuration as `/api/website-intake`; no new service-account key is needed.
3. Deploy the Growth Engine `firestore.rules`. The new `publishedProof` collection permits writes only by explicit owner/admin entries in `staffUsers`. The UI's legacy owner fallback is not sufficient. Leave unrelated rules unchanged for this rollout.
4. Deploy Firebase Functions so the legacy `sendReviewApprovedSMS` message no longer promises review credit. The historical function name is retained so existing deployments are updated rather than orphaned. Historical rewards and customer balances are not changed.
5. Confirm GET `https://mkggrowthengine.vercel.app/api/public-proof` returns JSON `{ "version": 1, "cases": [] }` (or approved cases). It must never return HTML or customer records.
6. Set **server-only** `MKG_PUBLIC_PROOF_FEED_URL=https://mkggrowthengine.vercel.app/api/public-proof` on the website, then deploy the website. Do not use a PUBLIC_ prefix. Until this is configured, the website serves three checked-in examples from its existing public proof photographs.
7. Check `/work/`, one `/work/<slug>/` page, and `/work/sitemap.xml`. Publish a permission-cleared case from Growth Engine, verify its page and sitemap entry, then retract it and verify removal (up to 60 seconds for website cache). A configured feed failure returns HTTP 503; it does not silently serve revoked material.
8. Submit the existing sitemap and `/work/sitemap.xml` in Search Console and Bing Webmaster Tools. Verify indexed canonical URLs, AI visibility settings/reports where available, and the actual Business Profile booking destination.

## Evidence to collect from Sean

- Current portrait/workshop photo; no synthetic substitutes for actual work.
- Three to five jobs: before/after photos, knife/tool type, actual damage, work performed, outcome, optional city/date, and permission to publish. No precise customer address.
- Verify the public career totals and any named legacy testimonials with source links before expanding claims.
- Exact official social/listing URLs and current appointment/drop-off arrangements before adding profiles or addresses.
- Confirm current separate-equipment kosher/halal process before creating a detailed service article.

## Measurement

The website records optional self-reported discovery (ChatGPT, Google Search/Maps, Google AI/Gemini, other AI, referral, social, returning, other) with request details. UTMs and click IDs are remembered on landing before navigation. First landing path and referrer hostname are kept in sessionStorage and forwarded with the request, separately from anonymous analytics. These observations do not prove that a specific AI recommendation caused a booking.

Use confirmed bookings and completed revenue alongside inquiry counts. Profile edits, external listings, and partner recommendations need verified owner access; never buy or fabricate reviews or mentions.

## Validation limits

Local tests exercise form payloads, authenticated intake, deduplication and the review queue, public field filtering, feed failure behavior, static asset references, builds and links. Live Firebase rules, workload identity, owner role, function deployment, and production notifications must be verified after deployment; no production customer record or message was created by local tests.
