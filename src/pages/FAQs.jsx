import PageHeader from '../components/PageHeader'

const questions = [
  ['Which path should I choose?', 'Use Non-commercial for household, individual, mail-in, and one-off customers. Use Commercial for restaurants, hotels, caterers, clubs, and recurring knife fleets.'],
  ['Where do I create a quote or service record?', 'Open the Launchpad and choose Start quote or service. Select an existing customer or create a new one, add line items, then save.'],
  ['Can I create both consumer and commercial invoices?', 'Yes. The invoice builder supports B2C and B2B invoices, custom line items, discounts, payment status, recurring cadence, payment links, QR codes, text, email, and print/PDF.'],
  ['Can the catalogue and pricing be changed?', 'Yes. Services, names, descriptions, price schedules, payment methods, and invoice templates can be configured for each sharpening business.'],
  ['Where are referrals and review requests?', 'Use the one-tap Launchpad tiles or the Grow section in navigation. Customer profiles also retain referral, reward, review, and service history.'],
  ['Can this look like another company’s brand?', 'Yes. Graphics, app icon, layout, colors, typography, terminology, pages, content, offers, and workflows can all be customized for the subscribing sharpener.'],
  ['How do I put it on my phone?', 'Open the site in Safari on iPhone or iPad and choose Add to Home Screen. On Android, open it in Chrome and choose Install app or Add to Home screen. The icon opens directly to the Launchpad.'],
]

export default function FAQs() {
  return <div className="mx-auto max-w-[1000px] space-y-6 p-4 md:p-7 lg:p-9"><PageHeader eyebrow="Help" title="Frequently asked questions" description="Quick answers for operators using the Growth Engine." /><div className="space-y-3">{questions.map(([question, answer]) => <details key={question} className="surface-card group p-5"><summary className="cursor-pointer list-none pr-8 text-base font-semibold text-white">{question}</summary><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">{answer}</p></details>)}</div></div>
}
