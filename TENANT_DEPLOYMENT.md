# Sharpener Growth Engine tenant deployment

Each customer must receive an isolated deployment, Vercel project, Firebase project, authentication user set, Resend resource, and environment configuration. Never point two unrelated sharpeners at the same Firestore database.

## Provisioning checklist

1. Create a dedicated Firebase project and enable Firestore, Authentication, and Storage as required by the public workflows.
2. Create a dedicated Vercel project from this repository.
3. Configure every value in `.env.example`; use the customer's brand, owner contact details, public website, and Vercel project identifiers.
4. Establish Vercel OIDC workload identity for the Growth Engine project. Grant only the Firestore permissions required by `api/website-intake.js`.
5. Set `WEBSITE_VERCEL_PROJECT_ID` to the customer's public website project. Do not reuse another tenant's project ID.
6. Connect a dedicated Resend resource and verify the customer's sending domain. Set the notification sender and recipients explicitly.
7. Create the first owner/admin account and corresponding `staffUsers/{uid}` role document.
8. Deploy and verify Firestore rules, Storage rules, Firebase Functions, and the Vercel application.

## Acceptance checks

- `npm ci`, `npm run lint`, `npm test`, and `npm run build` pass.
- The login page shows the tenant brand and only authorized staff can open protected routes.
- Public registration, referral, review, and UGC workflows write only to the tenant's Firebase project.
- The public website's form, booking, and chatbot handoffs reach `/api/website-intake` with valid Vercel OIDC.
- A new intake creates one CRM customer and one event; replaying the same event ID creates no duplicate.
- Exactly one lead notification email is delivered from the verified tenant domain.
- Invoice SMS/email content, referral URLs, owner alerts, and Firebase Function replies use the tenant configuration.
- No secrets appear in the client bundle or in variables prefixed with `VITE_`.

## Security boundary

The current legacy public routes (`/register`, `/r/:code`, `/review`, and `/ugc-submit`) still use direct client-side Firebase access. Their rules must remain compatible until those flows are migrated to validated, rate-limited server endpoints. Do not claim hardened multi-tenant SaaS isolation from a shared database; deploy one Firebase project per customer until that migration is complete.
