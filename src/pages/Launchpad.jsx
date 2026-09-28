import { Link } from 'react-router-dom'
import {
  Building2, CircleHelp, FileText, Gauge, House, Images, MessageSquareText,
  PackageSearch, Palette, ReceiptText, Scissors, UserRoundPlus, UsersRound,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'

const quickLinks = [
  { to: '/dashboard', label: 'Today', detail: 'Metrics and follow-ups', icon: Gauge },
  { to: '/catalog', label: 'Catalogue', detail: 'Services and configured prices', icon: PackageSearch },
  { to: '/invoices', label: 'Invoices', detail: 'Build, send, and collect', icon: ReceiptText },
  { to: '/customers', label: 'Customers', detail: 'Profiles and service history', icon: UsersRound },
  { to: '/referrals', label: 'Referrals', detail: 'Codes, rewards, and status', icon: UserRoundPlus },
  { to: '/reviews', label: 'Reviews', detail: 'Requests and approvals', icon: MessageSquareText },
  { to: '/ugc', label: 'Customer posts', detail: 'UGC and proof', icon: Images },
  { to: '/faq', label: 'FAQs', detail: 'Fast product guidance', icon: CircleHelp },
  { to: '/product', label: 'Customize', detail: 'White-label product options', icon: Palette },
]

function PathCard({ icon: Icon, eyebrow, title, description, primary, secondary }) {
  return (
    <section className="surface-card flex min-h-64 flex-col justify-between p-6">
      <div>
        <div className="metric-icon metric-icon-cyan"><Icon size={26} /></div>
        <p className="page-eyebrow mt-5">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold text-white">{title}</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{description}</p>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Link to={primary.to} className="btn-primary min-h-12 justify-center">{primary.label}</Link>
        <Link to={secondary.to} className="btn-secondary min-h-12 justify-center">{secondary.label}</Link>
      </div>
    </section>
  )
}

export default function Launchpad() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-4 md:p-7 lg:p-9">
      <PageHeader eyebrow="Touch dashboard" title="What do you need to do?" description="Choose the customer path first, or open any tool below with one tap." />

      <div className="grid gap-4 lg:grid-cols-2">
        <PathCard
          icon={House}
          eyebrow="Non-commercial"
          title="Home and individual customers"
          description="Prepare a quote or service record, create an invoice, and keep reviews, referrals, rewards, and follow-ups connected to the customer."
          primary={{ to: '/field?path=consumer', label: 'Start quote or service' }}
          secondary={{ to: '/invoices?type=b2c', label: 'Create consumer invoice' }}
        />
        <PathCard
          icon={Building2}
          eyebrow="Commercial"
          title="Restaurants and recurring accounts"
          description="Open the commercial pipeline, quote a knife fleet, create recurring invoices, and manage the next account-development step."
          primary={{ to: '/commercial', label: 'Open commercial accounts' }}
          secondary={{ to: '/invoices?type=b2b', label: 'Create commercial invoice' }}
        />
      </div>

      <section aria-labelledby="all-tools-title">
        <div className="section-heading"><div><p className="page-eyebrow">One-tap access</p><h2 id="all-tools-title">Tools</h2></div><Scissors className="text-cyan-300" /></div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {quickLinks.map(({ to, label, detail, icon: Icon }) => (
            <Link key={to} to={to} className="surface-card group min-h-36 p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/40">
              <Icon size={24} className="text-cyan-300" />
              <h3 className="mt-5 font-semibold text-white">{label}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
            </Link>
          ))}
        </div>
      </section>

      <p className="flex items-center gap-2 text-xs text-slate-500"><FileText size={15} />Install this web app on an Android, iPhone, iPad, or desktop to open directly to this launchpad.</p>
    </div>
  )
}
