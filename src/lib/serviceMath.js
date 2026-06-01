import { DISCOUNT_TYPES, PAYMENT_STATUS, SERVICE_LINE_ITEM_TYPES } from './schema'

export const SERVICE_ITEM_PRESETS = [
  { label: 'Fine-edge sharpening by blade inch', type: SERVICE_LINE_ITEM_TYPES.FINE_EDGE_INCH, unit: 'blade inch', unitPrice: 2.5 },
  { label: 'Serrated sharpening by blade inch', type: SERVICE_LINE_ITEM_TYPES.SERRATED_INCH, unit: 'blade inch', unitPrice: 3 },
  { label: 'Japanese knife repair', type: SERVICE_LINE_ITEM_TYPES.JAPANESE_REPAIR, unit: 'repair', unitPrice: 18 },
  { label: 'Forged knife repair', type: SERVICE_LINE_ITEM_TYPES.FORGED_REPAIR, unit: 'repair', unitPrice: 14 },
  { label: 'Stamped knife repair', type: SERVICE_LINE_ITEM_TYPES.STAMPED_REPAIR, unit: 'repair', unitPrice: 10 },
  { label: 'Meat grinder blade set', type: SERVICE_LINE_ITEM_TYPES.GRINDER_SET, unit: 'set', unitPrice: 25 },
  { label: 'Custom line item', type: SERVICE_LINE_ITEM_TYPES.CUSTOM, unit: 'item', unitPrice: 0 },
]

export const emptyServiceItem = {
  description: 'Fine-edge sharpening by blade inch',
  type: SERVICE_LINE_ITEM_TYPES.FINE_EDGE_INCH,
  unit: 'blade inch',
  qty: 1,
  unitPrice: 2.5,
}

export function serviceItemFromPreset(type) {
  const preset = SERVICE_ITEM_PRESETS.find(item => item.type === type) || SERVICE_ITEM_PRESETS[0]
  return {
    description: preset.label,
    type: preset.type,
    unit: preset.unit,
    qty: 1,
    unitPrice: preset.unitPrice,
  }
}

export function calculateServiceTotals({ items = [], discountType = DISCOUNT_TYPES.FLAT, discountValue = 0, roundDown = false, amountPaid = 0 }) {
  const subtotal = items.reduce((sum, item) => {
    return sum + Number(item.qty || 0) * Number(item.unitPrice || 0)
  }, 0)
  const requestedDiscount = discountType === DISCOUNT_TYPES.PERCENT
    ? subtotal * (Number(discountValue || 0) / 100)
    : Number(discountValue || 0)
  const discountAmount = Math.min(Math.max(requestedDiscount, 0), subtotal)
  const adjustedTotal = Math.max(subtotal - discountAmount, 0)
  const roundedTotal = roundDown ? Math.floor(adjustedTotal) : adjustedTotal
  const paid = Math.min(Math.max(Number(amountPaid || 0), 0), roundedTotal)
  const balanceDue = Math.max(roundedTotal - paid, 0)
  const paymentStatus = balanceDue <= 0 && roundedTotal > 0
    ? PAYMENT_STATUS.PAID
    : paid > 0
      ? PAYMENT_STATUS.PARTIAL
      : PAYMENT_STATUS.UNPAID

  return {
    subtotal,
    discountAmount,
    adjustedTotal,
    total: roundedTotal,
    amountPaid: paid,
    balanceDue,
    paymentStatus,
  }
}

export function customerDisplayName(customer = {}) {
  return customer.businessName || customer.restaurantName || [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.contactName || 'Unnamed customer'
}

export function contactDisplayName(customer = {}) {
  return customer.contactName || [customer.firstName, customer.lastName].filter(Boolean).join(' ') || ''
}
