import { Check, Palette } from 'lucide-react'
import PageHeader from '../components/PageHeader'

const modules = ['CRM and customer timeline', 'Consumer and commercial workflows', 'Quotes, service records, and custom invoices', 'Referrals, rewards, reviews, and UGC', 'Chatbot and website lead capture', 'Content, proof, follow-up, and performance dashboards']

export default function ProductOffer() {
  return <div className="mx-auto max-w-[1100px] space-y-6 p-4 md:p-7 lg:p-9"><PageHeader eyebrow="Standalone product" title="The Growth Engine for knife sharpeners" description="A configurable operating system that turns inquiries, service work, reputation, and follow-up into measurable growth." /><section className="surface-card p-6 md:p-8"><div className="metric-icon metric-icon-pink"><Palette size={25} /></div><h2 className="mt-5 text-2xl font-bold text-white">Built around the sharpener—not the other way around</h2><p className="mt-3 max-w-3xl leading-7 text-slate-300">Every deployment can be adapted to the customer’s operation. Graphics, layout, colors, typography, app icon, navigation, terminology, content, service catalogue, prices, invoice templates, offers, forms, automations, and customer journeys are customizable to the user’s needs.</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{modules.map(module => <div key={module} className="flex items-start gap-3 rounded-xl border border-sky-100/10 bg-slate-950/40 p-4"><Check size={19} className="mt-0.5 shrink-0 text-emerald-300" /><span className="text-sm text-slate-300">{module}</span></div>)}</div></section></div>
}
