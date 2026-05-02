import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { db } from '../lib/firebase'
import { COLLECTIONS, INVOICE_STATUS, INVOICE_TYPES, LINE_ITEM_TYPES } from '../lib/schema'

export default function Invoices() {
  const [invoiceType, setInvoiceType] = useState(INVOICE_TYPES.B2C)
  const [customerName, setCustomerName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [items, setItems] = useState([{ description: '', type: LINE_ITEM_TYPES.SHARPENING, qty: 1, unitPrice: 0 }])

  const total = useMemo(() => items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.unitPrice)), 0), [items])

  function updateItem(index, field, value) {
    const copy = [...items]
    copy[index][field] = value
    setItems(copy)
  }

  function addItem() {
    setItems([...items, { description: '', type: LINE_ITEM_TYPES.OTHER, qty: 1, unitPrice: 0 }])
  }

  async function saveInvoice() {
    await addDoc(collection(db, COLLECTIONS.INVOICES), {
      invoiceType,
      customerName,
      businessName,
      items,
      total,
      status: INVOICE_STATUS.DRAFT,
      createdAt: serverTimestamp(),
    })
    alert('Invoice saved')
  }

  return <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4"><h1 className="text-2xl font-bold text-orange-400">Mobile Invoice Builder</h1><div className="grid grid-cols-1 gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-4"><select value={invoiceType} onChange={e => setInvoiceType(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-white"><option value="b2c">B2C</option><option value="b2b">B2B</option></select><input placeholder="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-white" />{invoiceType === 'b2b' && <input placeholder="Business Name" value={businessName} onChange={e => setBusinessName(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-white" />}</div><div className="space-y-3">{items.map((item, i) => <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2"><input placeholder="Description" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-white" /><select value={item.type} onChange={e => updateItem(i, 'type', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-white">{Object.values(LINE_ITEM_TYPES).map(type => <option key={type}>{type}</option>)}</select><div className="grid grid-cols-2 gap-2"><input type="number" placeholder="Qty" value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-white" /><input type="number" placeholder="Unit Price" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-white" /></div></div>)}</div><button onClick={addItem} className="w-full bg-zinc-800 rounded-xl py-3 text-white">+ Add Line Item</button><div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex justify-between text-lg font-bold"><span>Total</span><span className="text-orange-400">${total.toFixed(2)}</span></div><button onClick={saveInvoice} className="w-full bg-orange-500 rounded-xl py-4 text-white font-semibold">Save Draft Invoice</button></div>
}
