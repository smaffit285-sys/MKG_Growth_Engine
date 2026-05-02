import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { useEffect, useMemo, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { db } from '../lib/firebase'
import {
  COLLECTIONS,
  INVOICE_STATUS,
  INVOICE_TYPES,
  LINE_ITEM_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
} from '../lib/schema'

const TEMPLATES = {
  consumerBasic: [{ description: 'Knife sharpening', type: LINE_ITEM_TYPES.SHARPENING, qty: 1, unitPrice: 20 }],
  consumerTenKnife: [
    { description: 'Knife sharpening bundle', type: LINE_ITEM_TYPES.SHARPENING, qty: 10, unitPrice: 20 },
    { description: 'Pickup and delivery within service radius', type: LINE_ITEM_TYPES.PICKUP_DELIVERY, qty: 1, unitPrice: 0 },
  ],
  commercialMonthly: [
    { description: 'Monthly commercial sharpening service', type: LINE_ITEM_TYPES.SHARPENING, qty: 1, unitPrice: 0 },
    { description: 'Pickup and delivery included', type: LINE_ITEM_TYPES.PICKUP_DELIVERY, qty: 1, unitPrice: 0 },
  ],
  rush: [{ description: 'Expedited turnaround', type: LINE_ITEM_TYPES.RUSH, qty: 1, unitPrice: 25 }],
}

const DEFAULT_PAYMENT_OPTIONS = {
  [PAYMENT_METHODS.STRIPE]: { enabled: true, label: 'Stripe', value: '', instructions: 'Pay securely by card using the payment link.' },
  [PAYMENT_METHODS.CASH_APP]: { enabled: true, label: 'Cash App', value: '', instructions: 'Send payment via Cash App and include the invoice/customer name in the note.' },
  [PAYMENT_METHODS.VENMO]: { enabled: true, label: 'Venmo', value: '', instructions: 'Send payment via Venmo and include the invoice/customer name in the note.' },
  [PAYMENT_METHODS.PAYPAL]: { enabled: true, label: 'PayPal', value: '', instructions: 'Pay through PayPal using the link or handle provided.' },
  [PAYMENT_METHODS.CASH]: { enabled: true, label: 'Cash', value: 'Accepted in person', instructions: 'Cash accepted at pickup, delivery, market, or service handoff.' },
  [PAYMENT_METHODS.CRYPTO]: { enabled: false, label: 'Crypto', value: '', instructions: 'Crypto accepted by prior arrangement. Confirm network and wallet before sending.' },
}

const emptyItem = { description: '', type: LINE_ITEM_TYPES.SHARPENING, qty: 1, unitPrice: 0 }

export default function Invoices() {
  const [invoiceType, setInvoiceType] = useState(INVOICE_TYPES.B2C)
  const [status, setStatus] = useState(INVOICE_STATUS.DRAFT)
  const [paymentStatus, setPaymentStatus] = useState(PAYMENT_STATUS.UNPAID)
  const [customerName, setCustomerName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [taxRate, setTaxRate] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [primaryPaymentMethod, setPrimaryPaymentMethod] = useState(PAYMENT_METHODS.STRIPE)
  const [paymentOptions, setPaymentOptions] = useState(DEFAULT_PAYMENT_OPTIONS)
  const [amountPaid, setAmountPaid] = useState(0)
  const [recurring, setRecurring] = useState(false)
  const [recurringCadence, setRecurringCadence] = useState('monthly')
  const [signatureName, setSignatureName] = useState('')
  const [items, setItems] = useState([emptyItem])
  const [saved, setSaved] = useState(false)
  const [invoiceHistory, setInvoiceHistory] = useState([])
  const [invoiceSearch, setInvoiceSearch] = useState('')

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.INVOICES), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => setInvoiceHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [])

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.unitPrice || 0)), 0)
    const discount = Math.min(Number(discountAmount || 0), subtotal)
    const taxable = Math.max(subtotal - discount, 0)
    const tax = taxable * (Number(taxRate || 0) / 100)
    const total = taxable + tax
    const balanceDue = Math.max(total - Number(amountPaid || 0), 0)
    return { subtotal, discount, taxable, tax, total, balanceDue }
  }, [items, taxRate, discountAmount, amountPaid])

  const enabledPaymentOptions = useMemo(() => Object.entries(paymentOptions).filter(([, option]) => option.enabled), [paymentOptions])
  const qrValue = paymentOptions[primaryPaymentMethod]?.value || invoiceTextFallback()

  const invoiceText = useMemo(() => {
    const billTo = invoiceType === INVOICE_TYPES.B2B ? businessName || customerName : customerName
    const primary = paymentOptions[primaryPaymentMethod]
    const paymentLine = primary?.value ? `${primary.label}: ${primary.value}` : `${primary?.label || 'Payment'} details available on invoice.`
    return `Miami Knife Guy invoice for ${billTo || 'customer'} — total $${totals.total.toFixed(2)}, balance due $${totals.balanceDue.toFixed(2)}. Preferred payment: ${paymentLine}`
  }, [invoiceType, businessName, customerName, totals.total, totals.balanceDue, paymentOptions, primaryPaymentMethod])

  const filteredInvoices = useMemo(() => {
    const term = invoiceSearch.toLowerCase()
    return invoiceHistory.filter(inv => [inv.invoiceNumber, inv.customerName, inv.businessName, inv.customerPhone, inv.customerEmail, inv.status, inv.paymentStatus].filter(Boolean).join(' ').toLowerCase().includes(term)).slice(0, 25)
  }, [invoiceHistory, invoiceSearch])

  function invoiceTextFallback() {
    return `Miami Knife Guy invoice balance due: $${totals.balanceDue.toFixed(2)}`
  }

  function updateItem(index, field, value) {
    const copy = [...items]
    copy[index] = { ...copy[index], [field]: value }
    setItems(copy)
  }

  function updatePaymentOption(method, field, value) {
    setPaymentOptions(prev => ({ ...prev, [method]: { ...prev[method], [field]: value } }))
  }

  function addItem() { setItems([...items, { ...emptyItem, type: LINE_ITEM_TYPES.OTHER }]) }
  function removeItem(index) { setItems(items.length === 1 ? [emptyItem] : items.filter((_, i) => i !== index)) }
  function applyTemplate(templateName) { setItems(TEMPLATES[templateName].map(item => ({ ...item }))); if (templateName === 'commercialMonthly') { setInvoiceType(INVOICE_TYPES.B2B); setRecurring(true); setRecurringCadence('monthly') } }
  function duplicateInvoice() { setStatus(INVOICE_STATUS.DRAFT); setPaymentStatus(PAYMENT_STATUS.UNPAID); setAmountPaid(0); setSaved(false) }
  function printInvoice() { window.print() }

  function loadInvoice(inv) {
    setInvoiceType(inv.invoiceType || INVOICE_TYPES.B2C)
    setStatus(INVOICE_STATUS.DRAFT)
    setPaymentStatus(PAYMENT_STATUS.UNPAID)
    setCustomerName(inv.customerName || '')
    setBusinessName(inv.businessName || '')
    setCustomerPhone(inv.customerPhone || '')
    setCustomerEmail(inv.customerEmail || '')
    setDueDate(inv.dueDate || '')
    setNotes(inv.notes || '')
    setTaxRate(inv.taxRate || 0)
    setDiscountAmount(inv.discountAmount || 0)
    setPrimaryPaymentMethod(inv.primaryPaymentMethod || PAYMENT_METHODS.STRIPE)
    setPaymentOptions(inv.paymentOptions || DEFAULT_PAYMENT_OPTIONS)
    setAmountPaid(0)
    setRecurring(Boolean(inv.recurring))
    setRecurringCadence(inv.recurringCadence || 'monthly')
    setSignatureName('')
    setItems(inv.items?.length ? inv.items : [emptyItem])
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
      amountPaid: Number(amountPaid || 0),
      balanceDue: totals.balanceDue,
      status,
      paymentStatus,
      primaryPaymentMethod,
      paymentOptions,
      recurring,
      recurringCadence: recurring ? recurringCadence : null,
      signatureName,
      providerIntegrationStatus: 'manual_links_ready_api_pending',
      reminderStatus: 'not_scheduled',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const smsHref = `sms:${customerPhone || ''}?&body=${encodeURIComponent(invoiceText)}`
  const emailHref = `mailto:${customerEmail || ''}?subject=${encodeURIComponent('Miami Knife Guy Invoice')}&body=${encodeURIComponent(invoiceText)}`

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 no-print">
        <div>
          <h1 className="text-2xl font-bold text-orange-400">Mobile Invoice Builder</h1>
          <p className="text-zinc-400 text-sm">Multi-rail invoicing with QR payment prep, history/search, print/PDF, SMS, email, and provider API placeholders.</p>
        </div>
        {saved && <div className="bg-green-500/20 text-green-400 rounded-xl px-3 py-2 text-sm">Invoice saved</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4 no-print">
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <h2 className="text-orange-400 font-semibold">Invoice Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Invoice Type"><select value={invoiceType} onChange={e => setInvoiceType(e.target.value)} className="field"><option value="b2c">B2C</option><option value="b2b">B2B</option></select></Field>
              <Field label="Invoice Status"><select value={status} onChange={e => setStatus(e.target.value)} className="field">{Object.values(INVOICE_STATUS).map(s => <option key={s}>{s}</option>)}</select></Field>
              <Field label="Payment Status"><select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} className="field">{Object.values(PAYMENT_STATUS).map(s => <option key={s}>{s}</option>)}</select></Field>
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
            {items.map((item, i) => <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2"><div className="flex justify-between items-center"><h3 className="text-zinc-300 text-sm font-medium">Line Item {i + 1}</h3><button onClick={() => removeItem(i)} className="text-red-400 text-xs">Remove</button></div><input placeholder="Description" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} className="field w-full" /><select value={item.type} onChange={e => updateItem(i, 'type', e.target.value)} className="field w-full">{Object.values(LINE_ITEM_TYPES).map(type => <option key={type}>{type}</option>)}</select><div className="grid grid-cols-2 gap-2"><input type="number" placeholder="Qty" value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)} className="field" /><input type="number" placeholder="Unit Price" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} className="field" /></div></div>)}
          </section>

          <button onClick={addItem} className="w-full bg-zinc-800 hover:bg-zinc-700 rounded-xl py-3 text-white">+ Add Line Item</button>

          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <h2 className="text-orange-400 font-semibold">Totals, Terms & Signature</h2>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Discount $"><input type="number" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} className="field" /></Field>
              <Field label="Tax %"><input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} className="field" /></Field>
              <Field label="Amount Paid"><input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} className="field" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3"><label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} />Recurring</label><Field label="Cadence"><select value={recurringCadence} onChange={e => setRecurringCadence(e.target.value)} className="field"><option>weekly</option><option>biweekly</option><option>monthly</option><option>quarterly</option></select></Field></div>
            <Field label="Accepted By / Signature Name"><input value={signatureName} onChange={e => setSignatureName(e.target.value)} className="field" /></Field>
            <Field label="Notes"><textarea value={notes} onChange={e => setNotes(e.target.value)} className="field min-h-24" /></Field>
          </section>

          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <h2 className="text-orange-400 font-semibold">Payment Options</h2>
            <Field label="Preferred Method"><select value={primaryPaymentMethod} onChange={e => setPrimaryPaymentMethod(e.target.value)} className="field">{Object.values(PAYMENT_METHODS).map(method => <option key={method} value={method}>{method}</option>)}</select></Field>
            <div className="space-y-3">
              {Object.entries(paymentOptions).map(([method, option]) => (
                <div key={method} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2">
                  <label className="flex items-center gap-2 text-sm text-white"><input type="checkbox" checked={option.enabled} onChange={e => updatePaymentOption(method, 'enabled', e.target.checked)} />{option.label}</label>
                  {option.enabled && <><input value={option.value} onChange={e => updatePaymentOption(method, 'value', e.target.value)} placeholder="Handle, link, wallet, or instructions" className="field w-full" /><textarea value={option.instructions} onChange={e => updatePaymentOption(method, 'instructions', e.target.value)} className="field min-h-16 w-full" /></>}
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-2">
            <a href={smsHref} className="text-center bg-zinc-800 rounded-xl py-3 text-white">Text Invoice</a>
            <a href={emailHref} className="text-center bg-zinc-800 rounded-xl py-3 text-white">Email Invoice</a>
            <button onClick={printInvoice} className="bg-zinc-800 rounded-xl py-3 text-white">Print / PDF</button>
            <button onClick={duplicateInvoice} className="bg-zinc-800 rounded-xl py-3 text-white">Duplicate</button>
            <button onClick={saveInvoice} className="col-span-2 bg-orange-500 hover:bg-orange-600 rounded-xl py-3 text-white font-semibold">Save Invoice</button>
          </div>

          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <h2 className="text-orange-400 font-semibold">Invoice History</h2>
            <input value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)} placeholder="Search invoices" className="field w-full" />
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredInvoices.map(inv => <button key={inv.id} onClick={() => loadInvoice(inv)} className="w-full text-left bg-zinc-950 border border-zinc-800 rounded-xl p-3 hover:border-orange-500"><div className="flex justify-between gap-3"><span className="text-white font-medium">{inv.businessName || inv.customerName || inv.invoiceNumber}</span><span className="text-orange-400">${Number(inv.total || 0).toFixed(2)}</span></div><p className="text-xs text-zinc-500">{inv.invoiceNumber} • {inv.status} • {inv.paymentStatus}</p></button>)}
            </div>
          </section>
        </div>

        <InvoicePreview invoiceType={invoiceType} customerName={customerName} businessName={businessName} customerPhone={customerPhone} customerEmail={customerEmail} dueDate={dueDate} items={items} totals={totals} notes={notes} status={status} paymentStatus={paymentStatus} paymentOptions={enabledPaymentOptions} primaryPaymentMethod={primaryPaymentMethod} recurring={recurring} recurringCadence={recurringCadence} signatureName={signatureName} qrValue={qrValue} />
      </div>
    </div>
  )
}

function Field({ label, children }) { return <label className="block"><span className="text-xs text-zinc-400">{label}</span>{children}</label> }
function TemplateButton({ label, onClick }) { return <button type="button" onClick={onClick} className="bg-zinc-800 hover:bg-zinc-700 rounded-xl px-3 py-2 text-sm text-white">{label}</button> }

function InvoicePreview({ invoiceType, customerName, businessName, customerPhone, customerEmail, dueDate, items, totals, notes, status, paymentStatus, paymentOptions, primaryPaymentMethod, recurring, recurringCadence, signatureName, qrValue }) {
  return <div className="print-area bg-white text-zinc-950 rounded-2xl p-5 h-fit sticky top-4"><div className="flex justify-between gap-4 border-b pb-4"><div><h2 className="text-2xl font-black tracking-tight">MIAMI KNIFE GUY</h2><p className="text-sm text-zinc-600">Premium Knife Care • Commercial Sharpening • Workshops</p></div><div className="text-right"><p className="text-xs uppercase text-zinc-500">Invoice</p><p className="font-bold">{status}</p><p className="text-xs text-zinc-600">Payment: {paymentStatus}</p></div></div><div className="grid grid-cols-2 gap-4 py-4 text-sm"><div><p className="text-zinc-500">Bill To</p><p className="font-semibold">{invoiceType === INVOICE_TYPES.B2B ? businessName || 'Business Name' : customerName || 'Customer Name'}</p>{invoiceType === INVOICE_TYPES.B2B && <p>{customerName}</p>}<p>{customerPhone}</p><p>{customerEmail}</p></div><div className="text-right"><p className="text-zinc-500">Due Date</p><p>{dueDate || 'Upon receipt'}</p>{recurring && <p className="mt-2 text-zinc-600">Recurring: {recurringCadence}</p>}</div></div><div className="border rounded-xl overflow-hidden text-sm"><div className="grid grid-cols-12 bg-zinc-100 font-semibold p-2"><div className="col-span-6">Item</div><div className="col-span-2 text-right">Qty</div><div className="col-span-2 text-right">Rate</div><div className="col-span-2 text-right">Total</div></div>{items.map((item, i) => <div key={i} className="grid grid-cols-12 p-2 border-t"><div className="col-span-6">{item.description || 'Service'}</div><div className="col-span-2 text-right">{item.qty}</div><div className="col-span-2 text-right">${Number(item.unitPrice || 0).toFixed(2)}</div><div className="col-span-2 text-right">${(Number(item.qty || 0) * Number(item.unitPrice || 0)).toFixed(2)}</div></div>)}</div><div className="mt-4 ml-auto max-w-xs space-y-1 text-sm"><Row label="Subtotal" value={totals.subtotal} /><Row label="Discount" value={-totals.discount} /><Row label="Tax" value={totals.tax} /><Row label="Paid" value={-Number(totals.total - totals.balanceDue || 0)} /><div className="flex justify-between border-t pt-2 text-lg font-black"><span>Balance Due</span><span>${totals.balanceDue.toFixed(2)}</span></div></div>{paymentOptions.length > 0 && <div className="mt-4 p-3 bg-zinc-100 rounded-xl text-sm"><p className="font-semibold">Payment Options</p><div className="space-y-2 mt-2">{paymentOptions.map(([method, option]) => <div key={method} className={method === primaryPaymentMethod ? 'border-l-4 border-orange-500 pl-2' : ''}><p className="font-semibold">{option.label}{method === primaryPaymentMethod ? ' — Preferred' : ''}</p>{option.value && <p className="break-all">{option.value}</p>}<p className="text-zinc-600">{option.instructions}</p></div>)}</div><div className="mt-4 flex justify-center"><QRCodeCanvas value={qrValue || 'Miami Knife Guy'} size={132} /></div><p className="text-center text-xs text-zinc-500 mt-2">Scan for preferred payment details</p></div>}{notes && <div className="mt-4 text-sm"><p className="font-semibold">Notes</p><p className="text-zinc-600 whitespace-pre-wrap">{notes}</p></div>}<div className="mt-8 border-t pt-4 text-sm"><p className="text-zinc-500">Accepted By</p><p className="font-semibold min-h-6">{signatureName || '____________________________'}</p></div></div>
}
function Row({ label, value }) { return <div className="flex justify-between"><span>{label}</span><span>${Number(value || 0).toFixed(2)}</span></div> }
