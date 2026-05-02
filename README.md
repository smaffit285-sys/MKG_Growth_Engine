# Miami Knife Guy — CRM Growth Engine

A full-stack CRM and growth-flywheel platform for Miami Knife Guy.  
Features: customer management, referral tracking, reward ledger, review moderation, UGC moderation, analytics dashboard, and public landing pages.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS + Recharts |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| SMS | Twilio (via Firebase Functions) |
| Hosting | Vercel (frontend) + Firebase Functions (backend) |

---

## Firebase Project Setup

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com) and create a new project (e.g. `mkg-growth-engine`).
2. Enable **Firestore Database** (start in production mode).
3. Enable **Authentication** → Email/Password provider.
4. Create your first admin user in Authentication → Users → Add user.
5. Enable **Firebase Functions** (requires Blaze pay-as-you-go plan).
6. Install Firebase CLI: `npm install -g firebase-tools`
7. Log in: `firebase login`
8. Initialize: `firebase init` (select Firestore, Functions, Hosting)
9. Deploy security rules: `firebase deploy --only firestore:rules`

---

## Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```bash
# Firebase Web SDK config (from Project Settings → Your apps → SDK setup)
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Twilio (displayed on Settings page, read-only in UI)
VITE_TWILIO_NUMBER=+13055550000
```

For Firebase Functions, also set the following via `firebase functions:config:set`:

```bash
firebase functions:config:set twilio.account_sid="ACxxx" twilio.auth_token="xxx" twilio.from="+13055550000"
```

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:5173
```

---

## Build for Production

```bash
npm run build
# Output in ./dist
```

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. Go to [https://vercel.com/new](https://vercel.com/new) and import the repo.
3. Set all `VITE_*` environment variables in Vercel project settings.
4. Framework preset: **Vite**. Build command: `npm run build`. Output: `dist`.
5. Click **Deploy**.

The `vercel.json` file at the root handles React Router rewrites automatically.

---

## Deploy Firebase Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

---

## Deploy Everything (Firestore Rules + Functions)

```bash
firebase deploy --only firestore:rules,functions
```

---

## Project Structure

```
MKG_Growth_Engine/
├── src/
│   ├── components/         # Layout, ProtectedRoute
│   ├── contexts/           # AuthContext
│   ├── lib/                # firebase.js
│   └── pages/
│       ├── Dashboard.jsx   # Analytics dashboard (Phase 6)
│       ├── Customers.jsx   # Customer list
│       ├── CustomerDetail.jsx
│       ├── CustomerCapture.jsx  # Public signup
│       ├── Referrals.jsx
│       ├── ReferralLanding.jsx  # Public /r/:code
│       ├── Rewards.jsx
│       ├── Reviews.jsx     # Moderation queue
│       ├── ReviewSubmit.jsx # Public review form
│       ├── UGC.jsx         # Moderation queue
│       ├── UGCSubmit.jsx   # Public UGC form
│       ├── FreeSharpening.jsx
│       ├── Login.jsx
│       └── Settings.jsx    # Admin settings (Phase 6)
├── functions/              # Firebase Functions (SMS, etc.)
├── firebase.json           # Firebase deploy config
├── firestore.rules         # Firestore security rules
├── vercel.json             # Vercel SPA rewrite
└── .env.example
```

---

## Firestore Collections

| Collection | Description |
|---|---|
| `customers/` | CRM customer records |
| `referrals/` | Referral events |
| `rewardLedger/` | Reward credits/redemptions |
| `reviewSubmissions/` | Customer review queue |
| `ugcSubmissions/` | User-generated content queue |
| `settings/` | App-level settings (owner phone, notifications) |

---

## License

Private — Miami Knife Guy internal use only.
