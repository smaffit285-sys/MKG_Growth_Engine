import { useMemo, useState } from 'react'
import { PackageSearch, Search } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { SERVICE_ITEM_PRESETS, formatLineItemRate, serviceItemFromPreset } from '../lib/serviceMath'

export default function ProductCatalog() {
  const [search, setSearch] = useState('')
  const products = useMemo(() => SERVICE_ITEM_PRESETS.filter(item => item.label.toLowerCase().includes(search.toLowerCase())), [search])

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-4 md:p-7 lg:p-9">
      <PageHeader eyebrow="Reference" title="Product catalogue" description="The services and default rates configured for this sharpening business. Catalogue names, pricing, descriptions, and categories are tenant-customizable." />
      <label className="surface-card flex items-center gap-3 p-4">
        <Search size={20} className="text-cyan-300" />
        <span className="sr-only">Search catalogue</span>
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search services or products" className="w-full bg-transparent text-white outline-none placeholder:text-slate-600" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map(product => {
          const item = serviceItemFromPreset(product.type)
          return <article key={product.type} className="surface-card p-5"><PackageSearch className="text-pink-300" /><h2 className="mt-4 text-lg font-semibold text-white">{product.label}</h2><p className="mt-1 text-sm text-slate-400">Charged per {product.unit} · {formatLineItemRate(item)}</p><p className="mt-3 text-xs uppercase tracking-wider text-slate-600">{product.type.replaceAll('_', ' ')}</p></article>
        })}
      </div>
    </div>
  )
}
