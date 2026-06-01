import { useEffect, useMemo, useState } from 'react'
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, updateDoc, doc } from 'firebase/firestore'
import { useSearchParams } from 'react-router-dom'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { MKG_BRAND } from '../lib/brand'
import {
  COLLECTIONS,
  DISCOUNT_TYPES,
  EVENT_TYPES,
  INVOICE_STATUS,
  INVOICE_TYPES,
  LINE_ITEM_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  REVIEW_STATUS,
  SERVICE_STATUS,
} from '../lib/schema'
import {
  calculateServiceTotals,
  contactDisplayName,
  customerDisplayName,
  emptyServiceItem,
  serviceItemFromPreset,
  SERVICE_ITEM_PRESETS,
} from '../lib/serviceMath'

const emptyCustomerForm = {
  businessName: '',
  contactName: '',
  phone: '',
  email: '',
  address: '',
  preferredPricing: '',
  referralSource: '',
  notes: '',
}

const emptyServiceForm = {
  serviceDate: new Date().toISOString().slice(0, 10),
  status: SERVICE_STATUS.COMPLETE,
  lineItems: [{ ...emptyServiceItem }],
  discountType: DISCOUNT_TYPES.FLAT,
  discountValue: 0,
  roundDown: true,
  amountPaid: 0,
  paymentStatus: PAYMENT_STATUS.UNPAID,
  paymentMethod: PAYMENT_METHODS.CASH,
  reviewStatus: REVIEW_STATUS.NOT_REQUESTED,
  nextFollowUpDate: '',
  bladeCount: '',
  grinderSetCount: '',
  repairs: '',
  serviceNotes: '',
  duplicatedFromServiceId: null,
}

function currency(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

function dateLabel(value) {
  if (!value) return 'No date'
  const date = value.toDate ? value.toDate() : new Date(value)
  return Number.isNaN(date.getTime()) ? 'No date' : date.toLocaleDateString()
}

export default function ServiceDesk() {
  const [searchParams] = useSearchParams()
  const { currentUser } = useAuth()
  const [customers, setCustomers] = useState([])
  const [services, setServices] = useState([])
  const [selectedCustomerId, setSelectedCustomerId] = useState(searchParams.get('customer') || '')
  const [customerMode, setCustomerMode] = useState(searchParams.get('customer') ? 'existing' : 'existing')
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerForm, setCustomerForm] = useState(emptyCustomerForm)
  const [serviceForm, setServiceForm] = useState(emptyServiceForm)
  const [saving, setSaving] = useState(false)
  const [savedService, setSavedService] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.CUSTOMERS), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [])

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.SERVICE_RECORDS), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => setServices(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [])

  const selectedCustomer = customers.find(customer => customer.id === selectedCustomerId)

  const customerServices = useMemo(() => {
    if (!selectedCustomerId) return []
    return services.filter(service => service.customerId === selectedCustomerId)
  }, [services, selectedCustomerId])

  const filteredCustomers = useMemo(() => {
    const term = customerSearch.toLowerCase()
    return customers.filter(customer => {
      const haystack = [
        customerDisplayName(customer),
        contactDisplayName(customer),
        customer.phone,
        customer.email,
        customer.address,
      ].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(term)
    }).slice(0, 20)
  }, [customers, customerSearch])

  const totals = useMemo(() => {
    const baseTotals = calculateServiceTotals(serviceForm)
    return serviceForm.paymentStatus === PAYMENT_STATUS.PAID
      ? calculateServiceTotals({ ...serviceForm, amountPaid: baseTotals.total })
      : baseTotals
  }, [serviceForm])

  function resetService() {
    setServiceForm(emptyServiceForm)
    setSavedService(null)
    setError('')
  }

  function updateService(field, value) {
    setServiceForm(prev => ({ ...prev, [field]: value }))
  }

  function updateItem(index, field, value) {
    setServiceForm(prev => {
      const lineItems = [...prev.lineItems]
      lineItems[index] = { ...lineItems[index], [field]: value }
      return { ...prev, lineItems }
    })
  }

  function choosePreset(index, type) {
    setServiceForm(prev => {
      const lineItems = [...prev.lineItems]
      lineItems[index] = serviceItemFromPreset(type)
      return { ...prev, lineItems }
    })
  }

  function addLineItem(type) {
    setServiceForm(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, serviceItemFromPreset(type)],
    }))
  }

  function removeLineItem(index) {
    setServiceForm(prev => ({
      ...prev,
      lineItems: prev.lineItems.length === 1 ? [{ ...emptyServiceItem }] : prev.lineItems.filter((_, i) => i !== index),
    }))
  }

  function duplicateService(service) {
    setSelectedCustomerId(service.customerId || '')
    setCustomerMode('existing')
    setServiceForm({
      ...emptyServiceForm,
      serviceDate: new Date().toISOString().slice(0, 10),
      lineItems: service.lineItems?.length ? service.lineItems.map(item => ({ ...item })) : [{ ...emptyServiceItem }],
      discountType: service.discountType || DISCOUNT_TYPES.FLAT,
      discountValue: service.discountValue || 0,
      roundDown: Boolean(service.roundDown),
      paymentMethod: service.paymentMethod || PAYMENT_METHODS.CASH,
      serviceNotes: service.serviceNotes || '',
      bladeCount: service.bladeCount || '',
      grinderSetCount: service.grinderSetCount || '',
      repairs: service.repairs || '',
      nextFollowUpDate: service.nextFollowUpDate || '',
      duplicatedFromServiceId: service.id,
    })
    setSavedService(null)
  }

  async function createCustomerIfNeeded() {
    if (customerMode === 'existing') {
      if (!selectedCustomer) throw new Error('Select a customer first.')
      return selectedCustomer
    }

    if (!customerForm.businessName.trim() && !customerForm.contactName.trim()) {
      throw new Error('Add a business name or contact name.')
    }

    const nameParts = customerForm.contactName.trim().split(' ')
    const customerRef = await addDoc(collection(db, COLLECTIONS.CUSTOMERS), {
      ...customerForm,
      firstName: nameParts[0] || customerForm.businessName,
      lastName: nameParts.slice(1).join(' '),
      rewardsBalance: 0,
      totalReferrals: 0,
      completedReferrals: 0,
      membershipTier: 'standard',
      leadSource: customerForm.referralSource || 'field_service',
      reviewStatus: REVIEW_STATUS.NOT_REQUESTED,
      createdAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
      marketingConsent: true,
    })

    const customer = { id: customerRef.id, ...customerForm }
    setSelectedCustomerId(customerRef.id)
    return customer
  }

  async function saveService() {
    setSaving(true)
    setError('')
    setSavedService(null)

    try {
      const customer = await createCustomerIfNeeded()
      const unpaidTotals = calculateServiceTotals({ ...serviceForm, amountPaid: 0 })
      const paymentInput = serviceForm.paymentStatus === PAYMENT_STATUS.PAID
        ? { ...serviceForm, amountPaid: unpaidTotals.total }
        : serviceForm
      const finalTotals = calculateServiceTotals(paymentInput)
      const finalPaymentStatus = serviceForm.paymentStatus === PAYMENT_STATUS.PAID || finalTotals.balanceDue <= 0
        ? PAYMENT_STATUS.PAID
        : finalTotals.paymentStatus
      const displayName = customerDisplayName(customer)
      const contactName = contactDisplayName(customer)

      const servicePayload = {
        customerId: customer.id,
        businessName: customer.businessName || displayName,
        contactName,
        customerPhone: customer.phone || '',
        customerEmail: customer.email || '',
        customerAddress: customer.address || '',
        serviceDate: serviceForm.serviceDate,
        status: finalPaymentStatus === PAYMENT_STATUS.PAID ? SERVICE_STATUS.PAID : serviceForm.status,
        lineItems: serviceForm.lineItems,
        discountType: serviceForm.discountType,
        discountValue: Number(serviceForm.discountValue || 0),
        discountAmount: finalTotals.discountAmount,
        roundDown: serviceForm.roundDown,
        subtotal: finalTotals.subtotal,
        adjustedTotal: finalTotals.adjustedTotal,
        total: finalTotals.total,
        amountPaid: finalTotals.amountPaid,
        balanceDue: finalTotals.balanceDue,
        paymentStatus: finalPaymentStatus,
        paymentMethod: serviceForm.paymentMethod,
        reviewStatus: serviceForm.reviewStatus,
        reviewRequestedAt: serviceForm.reviewStatus === REVIEW_STATUS.REQUESTED ? serverTimestamp() : null,
        nextFollowUpDate: serviceForm.nextFollowUpDate,
        bladeCount: Number(serviceForm.bladeCount || 0),
        grinderSetCount: Number(serviceForm.grinderSetCount || 0),
        repairs: serviceForm.repairs,
        serviceNotes: serviceForm.serviceNotes,
        duplicatedFromServiceId: serviceForm.duplicatedFromServiceId,
        actorUserId: currentUser?.uid || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const serviceRef = await addDoc(collection(db, COLLECTIONS.SERVICE_RECORDS), servicePayload)
      const invoiceNumber = `MKG-${Date.now()}`
      const invoicePayload = {
        invoiceNumber,
        serviceRecordId: serviceRef.id,
        customerId: customer.id,
        invoiceType: customer.businessName ? INVOICE_TYPES.B2B : INVOICE_TYPES.B2C,
        customerName: contactName || displayName,
        businessName: customer.businessName || '',
        customerPhone: customer.phone || '',
        customerEmail: customer.email || '',
        dueDate: serviceForm.serviceDate,
        notes: serviceForm.serviceNotes,
        items: serviceForm.lineItems.map(item => ({
          description: item.description,
          type: LINE_ITEM_TYPES.SHARPENING,
          serviceType: item.type,
          qty: Number(item.qty || 0),
          unitPrice: Number(item.unitPrice || 0),
          unit: item.unit || '',
        })),
        subtotal: finalTotals.subtotal,
        discountType: serviceForm.discountType,
        discountValue: Number(serviceForm.discountValue || 0),
        discountAmount: finalTotals.discountAmount,
        roundDown: serviceForm.roundDown,
        taxRate: 0,
        taxAmount: 0,
        total: finalTotals.total,
        amountPaid: finalTotals.amountPaid,
        balanceDue: finalTotals.balanceDue,
        status: finalPaymentStatus === PAYMENT_STATUS.PAID ? INVOICE_STATUS.PAID : INVOICE_STATUS.SENT,
        paymentStatus: finalPaymentStatus,
        primaryPaymentMethod: serviceForm.paymentMethod,
        providerIntegrationStatus: 'field_service_manual',
        reminderStatus: serviceForm.nextFollowUpDate ? 'scheduled' : 'not_scheduled',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const invoiceRef = await addDoc(collection(db, COLLECTIONS.INVOICES), invoicePayload)
      await updateDoc(doc(db, COLLECTIONS.SERVICE_RECORDS, serviceRef.id), { invoiceId: invoiceRef.id, invoiceNumber })
      await updateDoc(doc(db, COLLECTIONS.CUSTOMERS, customer.id), {
        businessName: customer.businessName || '',
        contactName,
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        preferredPricing: customer.preferredPricing || '',
        reviewStatus: serviceForm.reviewStatus,
        nextFollowUpDate: serviceForm.nextFollowUpDate,
        lastServiceDate: serviceForm.serviceDate,
        lastInvoiceId: invoiceRef.id,
        lastActivity: serverTimestamp(),
      })
      await addDoc(collection(db, COLLECTIONS.CUSTOMER_EVENTS), {
        eventType: EVENT_TYPES.SHARPENING_COMPLETED,
        customerId: customer.id,
        actorUserId: currentUser?.uid || null,
        metadata: {
          serviceRecordId: serviceRef.id,
          invoiceId: invoiceRef.id,
          invoiceNumber,
          total: finalTotals.total,
          paymentStatus: finalPaymentStatus,
          reviewStatus: serviceForm.reviewStatus,
          nextFollowUpDate: serviceForm.nextFollowUpDate,
        },
        createdAt: serverTimestamp(),
      })

      setSavedService({ id: serviceRef.id, invoiceId: invoiceRef.id, invoiceNumber, ...servicePayload, ...invoicePayload })
      setCustomerMode('existing')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Unable to save service.')
    } finally {
      setSaving(false)
    }
  }

  const reviewHref = selectedCustomer?.referralCode ? `/review?code=${selectedCustomer.referralCode}` : '/review'
  const invoiceSms = savedService
    ? `${MKG_BRAND.businessName} invoice ${savedService.invoiceNumber}: total ${currency(savedService.total)}, balance due ${currency(savedService.balanceDue)}. ${MKG_BRAND.reviewRequest}`
    : ''

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-orange-400">Field Service Desk</h1>
          <p className="text-zinc-400 text-sm mt-1">Customer visit to service record, invoice, payment, review request, and next follow-up.</p>
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2">
          <button onClick={resetService} className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl px-4 py-2 text-sm">New Service</button>
          <a href="/dashboard" className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl px-4 py-2 text-sm text-center">Dashboard</a>
          {savedService && <a href={`/customer/${savedService.customerId}`} className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl px-4 py-2 text-sm text-center">Customer</a>}
          {savedService && <a href={`sms:${savedService.customerPhone || ''}?&body=${encodeURIComponent(invoiceSms)}`} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 py-2 text-sm text-center">Text Summary</a>}
        </div>
      </div>

      {error && <div className="bg-red-950/60 border border-red-500/40 text-red-300 rounded-xl p-3 text-sm">{error}</div>}
      {savedService && <div className="bg-green-950/60 border border-green-500/40 text-green-300 rounded-xl p-3 text-sm">Saved {savedService.invoiceNumber}. Balance due: {currency(savedService.balanceDue)}.</div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-orange-400 font-semibold">Customer</h2>
            <div className="flex bg-zinc-950 rounded-xl p-1 text-xs">
              <button onClick={() => setCustomerMode('existing')} className={`px-3 py-1.5 rounded-lg ${customerMode === 'existing' ? 'bg-orange-500 text-white' : 'text-zinc-400'}`}>Select</button>
              <button onClick={() => setCustomerMode('new')} className={`px-3 py-1.5 rounded-lg ${customerMode === 'new' ? 'bg-orange-500 text-white' : 'text-zinc-400'}`}>Create</button>
            </div>
          </div>

          {customerMode === 'existing' ? (
            <div className="space-y-3">
              <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="Search restaurant, chef, phone, email" className="field w-full" />
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredCustomers.map(customer => (
                  <button key={customer.id} onClick={() => setSelectedCustomerId(customer.id)} className={`w-full text-left border rounded-xl p-3 ${selectedCustomerId === customer.id ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}>
                    <div className="flex justify-between gap-3">
                      <span className="text-white font-medium">{customerDisplayName(customer)}</span>
                      {customer.nextFollowUpDate && <span className="text-xs text-cyan-300">{dateLabel(customer.nextFollowUpDate)}</span>}
                    </div>
                    <p className="text-xs text-zinc-500">{contactDisplayName(customer) || customer.phone || 'No contact'} {customer.phone ? `| ${customer.phone}` : ''}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Business / Restaurant"><input value={customerForm.businessName} onChange={e => setCustomerForm({ ...customerForm, businessName: e.target.value })} className="field" /></Field>
              <Field label="Contact Name"><input value={customerForm.contactName} onChange={e => setCustomerForm({ ...customerForm, contactName: e.target.value })} className="field" /></Field>
              <Field label="Phone"><input value={customerForm.phone} onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })} className="field" /></Field>
              <Field label="Email"><input value={customerForm.email} onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })} className="field" /></Field>
              <Field label="Address / Location"><input value={customerForm.address} onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })} className="field" /></Field>
              <Field label="Preferred Pricing"><input value={customerForm.preferredPricing} onChange={e => setCustomerForm({ ...customerForm, preferredPricing: e.target.value })} className="field" /></Field>
              <Field label="Referral Source"><input value={customerForm.referralSource} onChange={e => setCustomerForm({ ...customerForm, referralSource: e.target.value })} className="field" /></Field>
              <Field label="Notes"><input value={customerForm.notes} onChange={e => setCustomerForm({ ...customerForm, notes: e.target.value })} className="field" /></Field>
            </div>
          )}

          <div className="border-t border-zinc-800 pt-4">
            <h3 className="text-zinc-300 text-sm font-semibold mb-2">Duplicate Previous Service</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {customerServices.length === 0 ? (
                <p className="text-zinc-500 text-sm">Select a customer with service history to duplicate.</p>
              ) : customerServices.slice(0, 8).map(service => (
                <button key={service.id} onClick={() => duplicateService(service)} className="w-full text-left bg-zinc-950 border border-zinc-800 hover:border-orange-500 rounded-xl p-3">
                  <div className="flex justify-between gap-3">
                    <span className="text-white text-sm">{dateLabel(service.serviceDate)}</span>
                    <span className="text-orange-400 text-sm">{currency(service.total)}</span>
                  </div>
                  <p className="text-xs text-zinc-500">{service.lineItems?.length || 0} items | {service.paymentStatus || 'unpaid'} | {service.reviewStatus || 'not requested'}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="xl:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h2 className="text-orange-400 font-semibold">Service Record</h2>
            <div className="grid grid-cols-2 md:flex gap-2">
              {SERVICE_ITEM_PRESETS.slice(0, 4).map(preset => (
                <button key={preset.type} onClick={() => addLineItem(preset.type)} className="bg-zinc-800 hover:bg-zinc-700 rounded-xl px-3 py-2 text-xs text-white">{preset.label.split(' ')[0]}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Service Date"><input type="date" value={serviceForm.serviceDate} onChange={e => updateService('serviceDate', e.target.value)} className="field" /></Field>
            <Field label="Blade Count"><input type="number" value={serviceForm.bladeCount} onChange={e => updateService('bladeCount', e.target.value)} className="field" /></Field>
            <Field label="Grinder Sets"><input type="number" value={serviceForm.grinderSetCount} onChange={e => updateService('grinderSetCount', e.target.value)} className="field" /></Field>
            <Field label="Repairs"><input value={serviceForm.repairs} onChange={e => updateService('repairs', e.target.value)} className="field" /></Field>
          </div>

          <div className="space-y-3">
            {serviceForm.lineItems.map((item, index) => (
              <div key={index} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 space-y-3">
                <div className="flex justify-between gap-3">
                  <select value={item.type} onChange={e => choosePreset(index, e.target.value)} className="field max-w-sm">
                    {SERVICE_ITEM_PRESETS.map(preset => <option key={preset.type} value={preset.type}>{preset.label}</option>)}
                  </select>
                  <button onClick={() => removeLineItem(index)} className="text-red-400 text-xs px-2">Remove</button>
                </div>
                <input value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} className="field w-full" />
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Qty / Inches"><input type="number" value={item.qty} onChange={e => updateItem(index, 'qty', e.target.value)} className="field" /></Field>
                  <Field label="Rate"><input type="number" value={item.unitPrice} onChange={e => updateItem(index, 'unitPrice', e.target.value)} className="field" /></Field>
                  <Field label="Line Total"><div className="field bg-zinc-900 text-right">{currency(Number(item.qty || 0) * Number(item.unitPrice || 0))}</div></Field>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => addLineItem(SERVICE_ITEM_PRESETS[0].type)} className="w-full bg-zinc-800 hover:bg-zinc-700 rounded-xl py-3 text-white">Add Line Item</button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Discount Type"><select value={serviceForm.discountType} onChange={e => updateService('discountType', e.target.value)} className="field"><option value={DISCOUNT_TYPES.FLAT}>Flat dollars</option><option value={DISCOUNT_TYPES.PERCENT}>Percent</option></select></Field>
                <Field label="Discount"><input type="number" value={serviceForm.discountValue} onChange={e => updateService('discountValue', e.target.value)} className="field" /></Field>
                <Field label="Amount Paid"><input type="number" value={serviceForm.amountPaid} onChange={e => updateService('amountPaid', e.target.value)} className="field" /></Field>
                <Field label="Payment Method"><select value={serviceForm.paymentMethod} onChange={e => updateService('paymentMethod', e.target.value)} className="field">{Object.values(PAYMENT_METHODS).map(method => <option key={method} value={method}>{method}</option>)}</select></Field>
                <Field label="Payment Status"><select value={serviceForm.paymentStatus} onChange={e => updateService('paymentStatus', e.target.value)} className="field">{Object.values(PAYMENT_STATUS).map(status => <option key={status} value={status}>{status}</option>)}</select></Field>
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" checked={serviceForm.roundDown} onChange={e => updateService('roundDown', e.target.checked)} /> Round down to nearest dollar</label>
              <Field label="Review Status"><select value={serviceForm.reviewStatus} onChange={e => updateService('reviewStatus', e.target.value)} className="field">{Object.values(REVIEW_STATUS).map(status => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}</select></Field>
              <Field label="Next Follow-Up Date"><input type="date" value={serviceForm.nextFollowUpDate} onChange={e => updateService('nextFollowUpDate', e.target.value)} className="field" /></Field>
              <Field label="Service Notes"><textarea value={serviceForm.serviceNotes} onChange={e => updateService('serviceNotes', e.target.value)} className="field min-h-24" /></Field>
            </div>

            <InvoiceSummary customer={selectedCustomer || customerForm} serviceForm={serviceForm} totals={totals} reviewHref={reviewHref} />
          </div>

          <button disabled={saving} onClick={saveService} className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-900 rounded-xl py-3 text-white font-semibold">
            {saving ? 'Saving Service...' : 'Save Service + Invoice'}
          </button>
        </section>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return <label className="block"><span className="text-xs text-zinc-400">{label}</span>{children}</label>
}

function InvoiceSummary({ customer, serviceForm, totals, reviewHref }) {
  return (
    <div className="bg-white text-zinc-950 rounded-2xl p-5 space-y-4">
      <div className="flex justify-between gap-3 border-b pb-3">
        <div>
          <h3 className="text-xl font-black tracking-tight uppercase">{MKG_BRAND.businessName}</h3>
          <p className="text-xs text-zinc-600">{MKG_BRAND.tagline}</p>
          <p className="text-xs text-zinc-600">{MKG_BRAND.phoneDisplay} | {MKG_BRAND.website} | {MKG_BRAND.email}</p>
        </div>
        <div className="text-right text-sm">
          <p className="text-zinc-500 uppercase text-xs">Service Invoice</p>
          <p className="font-semibold">{serviceForm.serviceDate || 'Today'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-zinc-500">Bill To</p>
          <p className="font-semibold">{customerDisplayName(customer)}</p>
          <p>{contactDisplayName(customer)}</p>
          <p>{customer.phone}</p>
          <p>{customer.email}</p>
        </div>
        <div className="text-right">
          <p className="text-zinc-500">Review</p>
          <p className="capitalize">{serviceForm.reviewStatus.replace(/_/g, ' ')}</p>
          <a href={reviewHref} className="text-orange-700 text-xs">Review link</a>
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden text-sm">
        {serviceForm.lineItems.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 p-2 border-b last:border-b-0">
            <div className="col-span-6">{item.description || 'Service'}</div>
            <div className="col-span-2 text-right">{item.qty}</div>
            <div className="col-span-2 text-right">{currency(item.unitPrice)}</div>
            <div className="col-span-2 text-right">{currency(Number(item.qty || 0) * Number(item.unitPrice || 0))}</div>
          </div>
        ))}
      </div>

      <div className="ml-auto max-w-xs space-y-1 text-sm">
        <Row label="Subtotal" value={totals.subtotal} />
        <Row label="Discount" value={-totals.discountAmount} />
        <Row label="Adjusted" value={totals.adjustedTotal} />
        <Row label="Paid" value={-totals.amountPaid} />
        <div className="flex justify-between border-t pt-2 text-lg font-black"><span>Balance Due</span><span>{currency(totals.balanceDue)}</span></div>
      </div>

      <div className="bg-zinc-100 rounded-xl p-3 text-sm">
        <p className="font-semibold">Review Request</p>
        <p className="text-zinc-700">{MKG_BRAND.reviewRequest}</p>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return <div className="flex justify-between"><span>{label}</span><span>{currency(value)}</span></div>
}
