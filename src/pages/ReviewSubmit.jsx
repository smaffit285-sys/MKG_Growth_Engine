import { BRAND } from '../lib/brand'

export default function ReviewSubmit() {
  return <main className="public-shell"><section className="public-card space-y-5">
    <p className="page-eyebrow">{BRAND.businessName}</p>
    <h1 className="text-4xl font-bold text-white">Share your experience.</h1>
    <p className="text-gray-300">Your honest feedback helps other cooks choose their sharpener. Reviews are voluntary and are never exchanged for discounts or rewards.</p>
    <a className="btn-primary" href={`${BRAND.websiteUrl}/review/`}>Leave a review or send private feedback</a>
    <p className="text-gray-400 text-sm">Referral and repeat-customer rewards are separate from public reviews.</p>
  </section></main>
}
