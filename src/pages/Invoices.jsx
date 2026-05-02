import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { db } from '../lib/firebase'
import { COLLECTIONS, INVOICE_STATUS, INVOICE_TYPES, LINE_ITEM_TYPES } from '../lib/schema'

const TEMPLATES = {
  consumerBasic: [
    { description: 'Knife sharpening', type: LINE_ITEM_TYPES.SHARPENING, qty: 1, unitPrice: 20 },
  ],
  consumerTenKnife: [
    { description: 'Knife sharpening bundle', type: LINE_ITEM_TYPES.SHARPENING, qty: 10, unitPrice: 20 },
    { description: 'Pickup and delivery within service radius', type: LINE_ITEM_TYPES.PICKUP_DELIVERY, qty: 1, unitPrice: 0 },
  ],
  commercialMonthly: [
    { description: 'Monthly commercial sharpening service', type: LINE_ITEM_TYPES.SHARPENING, qty: 1, unitPrice: 0 },
    { description: 'Pickup and delivery included', type: LINE_ITEM_TYPES.PICKUP_DELIVERY, qty: 1, unitPrice: 0 },
  ],
  rush: [
    { description: 'Expedited turnaround', type: LINE_ITEM_TYPES.RUSH, qty: 1, unitPrice: 25 },
  ],
}

const emptyItem = { description: '', type: LINE_ITEM_TYPES.SHARPENING, qty: 1, unitPrice: 0 }

export default function Invoices() {
  const [invoiceType, setInvoiceType] = useState(INVOICE_TYPES.B2C)
  const [status, setStatus] = useState(INVOICE_STATUS.DRAFT)
  const [customerName, setCustomerName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [taxRate, setTaxRate] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [items, setItems] = useState([emptyItem])
  const [saved, setSaved] = useState(false)

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.unitPrice || 0)), 0)
    const discount = Math.min(Number(discountAmount || 0), subtotal)
    const taxable = Math.max(subtotal - discount, 0)
    const tax = taxable * (Number(taxRate || 0) / 100)
    const total = taxable + tax
    return { subtotal, discount, taxable, tax, total }
  }, [items, taxRate, discountAmount])

  function updateItem(index, field, value) {
    const copy = [...items]
    copy[index] = { ...copy[index], [field]: value }
    setItems(copy)
  }

  function addItem() {
    setItems([...items, { ...emptyItem, type: LINE_ITEM_TYPES.OTHER }])
  }

  function removeItem(index) {
    setItems(items.length === 1 ? [emptyItem] : items.filter((_, i) => i !== index))
  }

  function applyTemplate(templateName) {
    setItems(TEMPLATES[templateName].map(item => ({ ...item })))
    if (templateName === 'commercialMonthly') setInvoiceType(INVOICE_TYPES.B2B)
  }

  async function saveInvoice() {
    const invoiceNumber = `MKG-${Date.now()}`
    await addDoc(collection(db, COLLECTIONS.INVOICES), {
      invoiceNumber,
      invoiceType,
      customerName,
      businessName,
      customerPhone,
      customerEmail,
      dueDate,
      notes,
      items,
      subtotal: totals.subtotal,
      discountAmount: totals.discount,
      taxRate: Number(taxRate || 0),
      taxAmount: totals.tax,
      total: totals.total,
      status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-orange-400">Mobile Invoice Builder</h1>
          <p className="text-zinc-400 text-sm">Field-ready B2B/B2C invoicing for markets, commercial accounts, workshops, and memberships.</p>
        </div>
        {saved && <div className="bg-green-500/20 text-green-400 rounded-xl px-3 py-2 text-sm">Invoice saved</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <h2 className="text-orange-400 font-semibold">Invoice Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Invoice Type"><select value={invoiceType} onChange={e => setInvoiceType(e.target.value)} className="field"><option value="b2c">B2C</option><option value="b2b">B2B</option></select></Field>
              <Field label="Status"><select value={status} onChange={e => setStatus(e.target.value)} className="field">{Object.values(INVOICE_STATUS).map(s => <option key={s}>{s}</option>)}</select></Field>
              <Field label="Customer Name"><input value={customerName} onChange={e => setCustomerName(e.target.value)} className="field" /></Field>
              {invoiceType === INVOICE_TYPES.B2B && <Field label="Business Name"><input value={businessName} onChange={e => setBusinessName(e.target.value)} className="field" /></Field>}
              <Field label="Phone"><input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="field" /></Field>
              <Field label="Email"><input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="field" /></Field>
              <Field label="Due Date"><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="field" /></Field>
            </div>
          </section>

          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <h2 className="text-orange-400 font-semibold">Templates</h2>
            <div className="grid grid-cols-2 gap-2">
              <TemplateButton label="Single Knife" onClick={() => applyTemplate('consumerBasic')} />
              <TemplateButton label="10+ Pickup" onClick={() => applyTemplate('consumerTenKnife')} />
              <TemplateButton label="Monthly B2B" onClick={() => applyTemplate('commercialMonthly')} />
              <TemplateButton label="Rush Fee" onClick={() => setItems([...items, ...TEMPLATES.rush])} />
            </div>
          </section>

          <section className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center"><h3 className="text-zinc-300 text-sm font-medium">Line Item {i + 1}</h3><button onClick={() => removeItem(i)} className="text-red-400 text-xs">Remove</button></div>
                <input placeholder="Description" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} className="field w-full" />
                <select value={item.type} onChange={e => updateItem(i, 'type', e.target.value)} className="field w-full">{Object.values(LINE_ITEM_TYPES).map(type => <option key={type}>{type}</option>)}</select>
                <div className="grid grid-cols-2 gap-2"><input type="number" placeholder="Qty" value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)} className="field" /><input type="number" placeholder="Unit Price" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} className="field" /></div>
              </div>
            ))}
          </section>

          <button onClick={addItem} className="w-full bg-zinc-800 hover:bg-zinc-700 rounded-xl py-3 text-white">+ Add Line Item</button>

          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <h2 className="text-orange-400 font-semibold">Adjustments</h2>
            <div className="grid grid-cols-2 gap-3"><Field label="Discount $"><input type="number" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} className="field" /></Field><Field label="Tax %"><input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} className="field" /></Field></div>
            <Field label="Notes"><textarea value={notes} onChange={e => setNotes(e.target.value)} className="field min-h-24" /></Field>
          </section>

          <button onClick={saveInvoice} className="w-full bg-orange-500 hover:bg-orange-600 rounded-xl py-4 text-white font-semibold">Save Invoice</button>
        </div>

        <InvoicePreview invoiceType={invoiceType} customerName={customerName} businessName={businessName} customerPhone={customerPhone} customerEmail={customerEmail} dueDate={dueDate} items={items} totals={totals} notes={notes} status={status} />
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return <label className="block"><span className="text-xs text-zinc-400">{label}</span>{children}</label>
}

function TemplateButton({ label, onClick }) {
  return <button type="button" onClick={onClick} className="bg-zinc-800 hover:bg-zinc-700 rounded-xl px-3 py-2 text-sm text-white">{label}</button>
}

function InvoicePreview({ invoiceType, customerName, businessName, customerPhone, customerEmail, dueDate, items, totals, notes, status }) {
  return (
    <div className="bg-white text-zinc-950 rounded-2xl p-5 h-fit sticky top-4">
      <div className="flex justify-between gap-4 border-b pb-4">
        <div><h2 className="text-2xl font-black tracking-tight">MIAMI KNIFE GUY</h2><p className="text-sm text-zinc-600">Premium Knife Care • Commercial Sharpening • Workshops</p></div>
        <div className="text-right"><p className="text-xs uppercase text-zinc-500">Invoice</p><p className="font-bold">{status}</p></div>
      </div>
      <div className="grid grid-cols-2 gap-4 py-4 text-sm">
        <div><p className="text-zinc-500">Bill To</p><p className="font-semibold">{invoiceType === INVOICE_TYPES.B2B ? businessName || 'Business Name' : customerName || 'Customer Name'}</p>{invoiceType === INVOICE_TYPES.B2B && <p>{customerName}</p>}<p>{customerPhone}</p><p>{customerEmail}</p></div>
        <div className="text-right"><p className="text-zinc-500">Due Date</p><p>{dueDate || 'Upon receipt'}</p></div>
      </div>
      <div className="border rounded-xl overflow-hidden text-sm"><div className="grid grid-cols-12 bg-zinc-100 font-semibold p-2"><div className="col-span-6">Item</div><div className="col-span-2 text-right">Qty</div><div className="col-span-2 text-right">Rate</div><div className="col-span-2 text-right">Total</div></div>{items.map((item, i) => <div key={i} className="grid grid-cols-12 p-2 border-t"><div className="col-span-6">{item.description || 'Service'}</div><div className="col-span-2 text-right">{item.qty}</div><div className="col-span-2 text-right">${Number(item.unitPrice || 0).toFixed(2)}</div><div className="col-span-2 text-right">${(Number(item.qty || 0) * Number(item.unitPrice || 0)).toFixed(2)}</div></div>)}</div>
      <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm"><Row label="Subtotal" value={totals.subtotal} /><Row label="Discount" value={-totals.discount} /><Row label="Tax" value={totals.tax} /><div className="flex justify-between border-t pt-2 text-lg font-black"><span>Total</span><span>${totals.total.toFixed(2)}</span></div></div>
      {notes && <div className="mt-4 text-sm"><p className="font-semibold">Notes</p><p className="text-zinc-600 whitespace-pre-wrap">{notes}</p></div>}
    </div>
  )
}

function Row({ label, value }) {
  return <div className="flex justify-between"><span>{label}</span><span>${Number(value || 0).toFixed(2)}</span></div>
}
