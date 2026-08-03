import { DISCOUNT_TYPES, PAYMENT_STATUS, SERVICE_LINE_ITEM_TYPES } from './schema'

export const KNIFE_COUNT_PRICES = {
  0: 80,
  1: 80,
  2: 80,
  3: 80,
  4: 80,
  5: 80,
  6: 80,
  7: 80,
  8: 80,
  9: 80,
  10: 80,
  11: 85,
  12: 88,
  13: 90,
  14: 92,
  15: 94,
  16: 95,
  17: 97,
  18: 98,
  19: 99,
  20: 100,
}

export const SERVICE_ITEM_PRESETS = [
  { label: 'Restaurant knife count', type: SERVICE_LINE_ITEM_TYPES.KNIFE_COUNT, unit: 'knives', unitPrice: 0, priceMode: 'knife_count' },
  { label: 'Stamped knife repair', type: SERVICE_LINE_ITEM_TYPES.STAMPED_REPAIR, unit: 'repair', unitPrice: 4 },
  { label: 'Forged knife repair', type: SERVICE_LINE_ITEM_TYPES.FORGED_REPAIR, unit: 'repair', unitPrice: 7 },
  { label: 'Japanese knife repair', type: SERVICE_LINE_ITEM_TYPES.JAPANESE_REPAIR, unit: 'repair', unitPrice: 8 },
  { label: 'Food processor', type: SERVICE_LINE_ITEM_TYPES.FOOD_PROCESSOR, unit: 'item', unitPrice: 16 },
  { label: 'Meat slicer', type: SERVICE_LINE_ITEM_TYPES.MEAT_SLICER, unit: 'item', unitPrice: 16 },
  { label: 'Scissors', type: SERVICE_LINE_ITEM_TYPES.SCISSORS, unit: 'item', unitPrice: 16 },
  { label: 'Japanese mandolin', type: SERVICE_LINE_ITEM_TYPES.JAPANESE_MANDOLIN, unit: 'item', unitPrice: 16 },
  { label: 'Immersion blender', type: SERVICE_LINE_ITEM_TYPES.IMMERSION_BLENDER, unit: 'item', unitPrice: 22 },
  { label: 'Vita Mix blender blade', type: SERVICE_LINE_ITEM_TYPES.VITAMIX_BLENDER_BLADE, unit: 'blade', unitPrice: 22 },
  { label: 'Buffalo chopper', type: SERVICE_LINE_ITEM_TYPES.BUFFALO_CHOPPER, unit: 'item', unitPrice: 22 },
  { label: '#12 meat grinder set', type: SERVICE_LINE_ITEM_TYPES.MEAT_GRINDER_12_SET, unit: 'set', unitPrice: 22 },
  { label: 'French mandolin', type: SERVICE_LINE_ITEM_TYPES.FRENCH_MANDOLIN, unit: 'item', unitPrice: 22 },
  { label: 'Industrial food processor blade', type: SERVICE_LINE_ITEM_TYPES.INDUSTRIAL_FOOD_PROCESSOR_BLADE, unit: 'blade', unitPrice: 22 },
  { label: 'Industrial food processor serrated blade', type: SERVICE_LINE_ITEM_TYPES.INDUSTRIAL_FOOD_PROCESSOR_SERRATED_BLADE, unit: 'blade', unitPrice: 30 },
  { label: 'Bone cleaver', type: SERVICE_LINE_ITEM_TYPES.BONE_CLEAVER, unit: 'item', unitPrice: 20 },
  { label: 'Thick single bevel by inch', type: SERVICE_LINE_ITEM_TYPES.THICK_SINGLE_BEVEL_INCH, unit: 'inch', unitPrice: 5 },
  { label: 'Thin single bevel by inch', type: SERVICE_LINE_ITEM_TYPES.THIN_SINGLE_BEVEL_INCH, unit: 'inch', unitPrice: 2.5 },
  { label: 'Custom line item', type: SERVICE_LINE_ITEM_TYPES.CUSTOM, unit: 'item', unitPrice: 0 },
]

export const emptyServiceItem = {
  description: 'Restaurant knife count',
  type: SERVICE_LINE_ITEM_TYPES.KNIFE_COUNT,
  unit: 'knives',
  qty: 10,
  unitPrice: 0,
  priceMode: 'knife_count',
}

export function serviceItemFromPreset(type) {
  const preset = SERVICE_ITEM_PRESETS.find(item => item.type === type) || SERVICE_ITEM_PRESETS[0]
  return {
    description: preset.label,
    type: preset.type,
    unit: preset.unit,
    qty: preset.type === SERVICE_LINE_ITEM_TYPES.KNIFE_COUNT ? 10 : 1,
    unitPrice: preset.unitPrice,
    priceMode: preset.priceMode || 'unit',
  }
}

export function calculateKnifeCountPrice(countInput) {
  const count = Math.max(Math.round(Number(countInput || 0)), 0)
  if (count <= 20) return KNIFE_COUNT_PRICES[count] ?? 80
  return 100 + (count - 20) * 5
}

export function calculateLineItemTotal(item = {}) {
  if (item.priceMode === 'knife_count' || item.type === SERVICE_LINE_ITEM_TYPES.KNIFE_COUNT) {
    return calculateKnifeCountPrice(item.qty)
  }
  return Number(item.qty || 0) * Number(item.unitPrice || 0)
}

export function formatLineItemRate(item = {}) {
  if (item.priceMode === 'knife_count' || item.type === SERVICE_LINE_ITEM_TYPES.KNIFE_COUNT) {
    return 'schedule'
  }
  return `$${Number(item.unitPrice || 0).toFixed(2)}`
}

export function calculateServiceTotals({ items = [], discountType = DISCOUNT_TYPES.FLAT, discountValue = 0, roundDown = false, amountPaid = 0 }) {
  const subtotal = items.reduce((sum, item) => sum + calculateLineItemTotal(item), 0)
  const requestedDiscount = discountType === DISCOUNT_TYPES.PERCENT
    ? subtotal * (Math.abs(Number(discountValue || 0)) / 100)
    : Math.abs(Number(discountValue || 0))
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
