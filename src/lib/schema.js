export const COLLECTIONS = {
  CUSTOMERS: 'customers',
  COMMERCIAL_ACCOUNTS: 'commercialAccounts',
  CUSTOMER_EVENTS: 'customerEvents',
  LEAD_ALERTS: 'leadAlerts',
  CONTENT_PIPELINE: 'contentPipeline',
  PROOF_ASSETS: 'proofAssets',
  TRAINING_SESSIONS: 'trainingSessions',
  SHARPENING_SESSIONS: 'sharpeningSessions',
  INVOICES: 'invoices',
  PAYMENT_ACTIONS: 'paymentActions',
  INVOICE_REMINDERS: 'invoiceReminders',
  STAFF_USERS: 'staffUsers',
  ANALYTICS: 'analytics',
}

export const ACCOUNT_TYPES = {
  RESTAURANT: 'restaurant', HOTEL: 'hotel', YACHT_CLUB: 'yacht_club', COUNTRY_CLUB: 'country_club', CATERER: 'caterer', CHEF_PARTNER: 'chef_partner', OTHER: 'other',
}
export const ACCOUNT_STATUS = { PROSPECT: 'prospect', TRIAL: 'trial', ACTIVE: 'active', PAUSED: 'paused', LOST: 'lost' }
export const TRUST_STAGES = { COLD: 'cold', INTRODUCED: 'introduced', SAMPLED: 'sampled', PROPOSAL_SENT: 'proposal_sent', CLOSED: 'closed' }
export const EVENT_TYPES = { CUSTOMER_CREATED: 'customer_created', COMMERCIAL_ACCOUNT_CREATED: 'commercial_account_created', MARKET_LEAD_CAPTURED: 'market_lead_captured', CHEF_PARTNER_ADDED: 'chef_partner_added', SHARPENING_COMPLETED: 'sharpening_completed', PICKUP_SCHEDULED: 'pickup_scheduled', DELIVERY_COMPLETED: 'delivery_completed', REVIEW_REQUESTED: 'review_requested', REVIEW_SUBMITTED: 'review_submitted', REFERRAL_SENT: 'referral_sent', REWARD_ISSUED: 'reward_issued', UGC_UPLOADED: 'ugc_uploaded', SMS_SENT: 'sms_sent', LEAD_ALERT_CREATED: 'lead_alert_created', RETENTION_CAMPAIGN_TRIGGERED: 'retention_campaign_triggered', PROPOSAL_SENT: 'proposal_sent', COMMERCIAL_TRIAL_COMPLETED: 'commercial_trial_completed', MEMBERSHIP_STARTED: 'membership_started', WORKSHOP_INTEREST_LOGGED: 'workshop_interest_logged', TRAINING_SESSION_COMPLETED: 'training_session_completed', QUALITY_CHECK_COMPLETED: 'quality_check_completed', INVOICE_CREATED: 'invoice_created' }
export const CONTENT_CHANNELS = { YOUTUBE: 'youtube', INSTAGRAM: 'instagram', FACEBOOK: 'facebook', BLOG: 'blog', EBOOK: 'ebook', PODCAST: 'podcast', PRESS: 'press', SHORT_FORM: 'short_form' }
export const CONTENT_STAGES = { IDEA: 'idea', SCRIPTED: 'scripted', FILMED: 'filmed', EDITED: 'edited', SCHEDULED: 'scheduled', PUBLISHED: 'published', REPURPOSED: 'repurposed' }
export const PROOF_TYPES = { GOOGLE_REVIEW: 'google_review', YELP_REVIEW: 'yelp_review', TESTIMONIAL: 'testimonial', CHEF_QUOTE: 'chef_quote', BEFORE_AFTER_PHOTO: 'before_after_photo', EVENT_PHOTO: 'event_photo', WORKSHOP_PHOTO: 'workshop_photo', PRESS_MENTION: 'press_mention', PODCAST_APPEARANCE: 'podcast_appearance', YOUTUBE_FEATURE: 'youtube_feature', TECHNICAL_DEMO: 'technical_demo' }
export const TRAINING_OUTCOMES = { PASS: 'pass', NEEDS_REVIEW: 'needs_review', FAIL: 'fail' }
export const INVOICE_TYPES = { B2C: 'b2c', B2B: 'b2b' }
export const INVOICE_STATUS = { DRAFT: 'draft', SENT: 'sent', PAID: 'paid', OVERDUE: 'overdue', VOID: 'void' }
export const LINE_ITEM_TYPES = { SHARPENING: 'sharpening', REPAIR: 'repair', RUSH: 'rush', PICKUP_DELIVERY: 'pickup_delivery', MEMBERSHIP: 'membership', WORKSHOP: 'workshop', COURSE: 'course', OTHER: 'other' }
export const PAYMENT_METHODS = { STRIPE: 'stripe', CASH_APP: 'cash_app', VENMO: 'venmo', PAYPAL: 'paypal', CASH: 'cash', CRYPTO: 'crypto', OTHER: 'other' }
export const PAYMENT_STATUS = { UNPAID: 'unpaid', PARTIAL: 'partial', PAID: 'paid', REFUNDED: 'refunded' }
export const PAYMENT_ACTION_STATUS = { PENDING: 'pending', CREATED: 'created', SENT: 'sent', FAILED: 'failed', COMPLETED: 'completed' }
export const REMINDER_STATUS = { NOT_SCHEDULED: 'not_scheduled', SCHEDULED: 'scheduled', SENT: 'sent', PAUSED: 'paused', FAILED: 'failed' }
export const LEAD_ALERT_STATUS = { NEW: 'new', CONTACTED: 'contacted', SCHEDULED: 'scheduled', CLOSED: 'closed' }
