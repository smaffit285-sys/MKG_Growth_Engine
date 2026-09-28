import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="public-shell">
      <div className="public-card text-center">
        <p className="page-eyebrow mb-3">404 · Wrong turn</p>
        <h1 className="font-['Barlow_Condensed'] text-6xl uppercase tracking-wide text-white">Nothing to sharpen here.</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm text-slate-400">This page moved, never existed, or the link has gone dull.</p>
        <Link to="/" className="btn-primary mt-7"><ArrowLeft size={18} /> Back to the Growth Engine</Link>
      </div>
    </div>
  )
}
