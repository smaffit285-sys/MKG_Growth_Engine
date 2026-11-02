import { addDoc, collection, doc, onSnapshot, orderBy, query, runTransaction, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../lib/firebase'
import { BRAND } from '../lib/brand'
import { publicCase } from '../lib/publicCase.mjs'

const empty = { title: '', slug: '', knifeType: '', problem: '', workPerformed: '', result: '', location: '', serviceDate: '', beforeImage: '', afterImage: '' }
const labels = { title: 'Case study title', slug: 'URL slug', knifeType: 'Knife or tool type', problem: 'Condition before service', workPerformed: 'Work actually performed', result: 'Observed result', location: 'City only (optional)', serviceDate: 'Actual service date (optional)', beforeImage: 'Public before-image URL (optional)', afterImage: 'Public after-image URL (optional)' }

export default function ProofVault() {
  const { currentUser, userRole } = useAuth()
  const [params] = useSearchParams()
  const [assets, setAssets] = useState([])
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const canPublish = ['owner', 'admin'].includes(userRole)
  const canEdit = ['owner', 'admin', 'staff', 'marketing'].includes(userRole)
  useEffect(() => onSnapshot(query(collection(db, 'proofAssets'), orderBy('createdAt', 'desc')),
    snap => setAssets(snap.docs.map(d => ({ ...d.data(), id: d.id }))),
    () => setError('Unable to load proof records. Check your connection and staff access.')), [])

  function select(asset) {
    setEditing(asset); setForm(Object.fromEntries(Object.keys(empty).map(k => [k, asset[k] || ''])))
    setConsent(false); setError(''); setMessage('')
  }
  function reset() { setEditing(null); setForm(empty); setConsent(false); setMessage(''); setError('') }
  async function save(event) {
    event.preventDefault(); if (busy || !canEdit) return
    setBusy(true); setError(''); setMessage('')
    try {
      const payload = { ...form, type: 'before_after_photo', updatedAt: serverTimestamp(), updatedBy: currentUser.uid }
      if (editing) await updateDoc(doc(db, 'proofAssets', editing.id), payload)
      else {
        const ref = await addDoc(collection(db, 'proofAssets'), { ...payload, createdAt: serverTimestamp(), serviceRecordId: params.get('serviceId') || '', publicationStatus: 'draft' })
        setEditing({ ...payload, id: ref.id })
      }
      setMessage('Draft saved privately. Preview and confirm permission before publishing.')
    } catch { setError('Draft could not be saved. Please try again.') }
    finally { setBusy(false) }
  }
  async function publish() {
    if (busy || !canPublish || !editing || !consent) return
    setBusy(true); setError(''); setMessage('')
    try {
      const data = publicCase(form)
      // Reserve the slug to this draft so another case cannot be overwritten.
      await runTransaction(db, async tx => {
        const publicRef = doc(db, 'publishedProof', data.slug)
        const draftRef = doc(db, 'proofAssets', editing.id)
        const current = await tx.get(draftRef)
        const existing = await tx.get(publicRef)
        if (!current.exists()) throw new Error('Save the draft before publishing.')
        const previousSlug = current.data().publishedSlug
        if (existing.exists() && previousSlug !== data.slug) throw new Error('That URL slug is already published. Choose a different one.')
        tx.set(publicRef, { ...data, publicationStatus: 'published', publicationConsent: true })
        if (previousSlug && previousSlug !== data.slug) tx.delete(doc(db, 'publishedProof', previousSlug))
        tx.update(draftRef, { ...form, publishedSlug: data.slug, publicationStatus: 'published', permissionConfirmedBy: currentUser.uid, publishedAt: serverTimestamp() })
      })
      setEditing({ ...editing, publishedSlug: data.slug }); setConsent(false)
      setMessage('Published to the approved feed. The public website can display it after both deployments are enabled.')
    } catch (err) { setError(err.message || 'Publication failed. Please try again.') }
    finally { setBusy(false) }
  }
  async function retract(asset) {
    if (busy || !canPublish || !asset.publishedSlug) return
    setBusy(true); setError('')
    try {
      const batch = writeBatch(db)
      batch.delete(doc(db, 'publishedProof', asset.publishedSlug))
      batch.update(doc(db, 'proofAssets', asset.id), { publicationStatus: 'draft', publishedSlug: '', updatedAt: serverTimestamp() })
      await batch.commit(); if (editing?.id === asset.id) setEditing({ ...asset, publishedSlug: '' })
      setMessage('Removed from the public feed. Cached pages may take up to one minute to refresh.')
    } catch { setError('Could not retract this case. Please try again.') }
    finally { setBusy(false) }
  }
  return <main className="p-6 max-w-5xl space-y-6">
    <h1 className="text-2xl font-bold text-orange-400">Proof Vault</h1>
    <p className="text-zinc-300">Turn completed work into a factual case study. Drafts stay private. Only an owner or admin can publish the exact public preview below.</p>
    {params.get('serviceId') && <p className="text-cyan-300">New draft linked to a service record. Private customer details are not copied.</p>}
    {error && <p role="alert" className="text-red-300">{error}</p>}
    {message && <p role="status" className="text-cyan-300">{message}</p>}
    {canEdit && <form onSubmit={save} className="grid sm:grid-cols-2 gap-4 bg-zinc-900 p-5 rounded-xl">
      {Object.entries(labels).map(([key, label]) => <label key={key} className={['problem', 'workPerformed', 'result'].includes(key) ? 'sm:col-span-2' : ''}>
        <span className="block text-sm text-zinc-300 mb-1">{label}</span>
        {['problem', 'workPerformed', 'result'].includes(key)
          ? <textarea className="field w-full" rows={3} required value={form[key]} onChange={event => { setForm(f => ({ ...f, [key]: event.target.value })); setConsent(false) }} />
          : <input className="field w-full" type={key === 'serviceDate' ? 'date' : key.endsWith('Image') ? 'url' : 'text'} required={['title', 'slug', 'knifeType'].includes(key)} value={form[key]} onChange={event => { setForm(f => ({ ...f, [key]: event.target.value })); setConsent(false) }} />}
      </label>)}
      <p className="text-sm text-zinc-400 sm:col-span-2">Use only facts and images cleared for public display. Leave names, exact addresses, phone numbers, prices, and private notes out. Image URLs must be public HTTPS URLs without query strings.</p>
      <div className="flex gap-3 sm:col-span-2"><button disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Save private draft'}</button><button type="button" className="btn-secondary" onClick={reset}>New draft</button></div>
    </form>}
    {editing && <section aria-label="Public case study preview" className="bg-zinc-900 p-5 rounded-xl space-y-4">
      <h2 className="text-xl font-bold">Public preview: {form.title}</h2>
      <p>{form.knifeType}{form.location ? ` · ${form.location}` : ''}{form.serviceDate ? ` · ${form.serviceDate}` : ''}</p>
      {[['Condition', form.problem], ['Work performed', form.workPerformed], ['Observed result', form.result]].map(([label, text]) => <div key={label}><h3 className="text-cyan-300">{label}</h3><p className="whitespace-pre-line">{text}</p></div>)}
      <p className="break-all">Public URL: {BRAND.websiteUrl}/work/{form.slug}/</p>
      <p className="text-sm text-zinc-400">Images: {form.beforeImage || 'No before image'} · {form.afterImage || 'No after image'}</p>
      {canPublish && <><label className="flex items-start gap-2"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} /><span>I checked these facts and have permission to publish this exact text and these images.</span></label><button type="button" disabled={busy || !consent} onClick={publish} className="btn-primary disabled:opacity-40">Publish approved case study</button></>}
    </section>}
    <section className="space-y-3"><h2 className="text-xl font-semibold">Saved records</h2>{assets.length === 0 && <p>No proof records yet.</p>}{assets.map(asset => <article key={asset.id} className="bg-zinc-900 p-4 rounded-xl flex gap-3 flex-wrap items-center"><span className="flex-1">{asset.title} · {asset.publishedSlug ? 'Published' : 'Private draft'}</span><button type="button" className="btn-secondary" onClick={() => select(asset)}>Open</button>{canPublish && asset.publishedSlug && <button type="button" disabled={busy} onClick={() => retract(asset)} className="btn-secondary">Retract publication</button>}</article>)}</section>
  </main>
}
