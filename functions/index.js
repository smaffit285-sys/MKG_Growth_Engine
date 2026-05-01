'use strict';

const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const twilio = require('twilio');

initializeApp();

// ─── Twilio helper ────────────────────────────────────────────────────────────
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.');
  }
  return twilio(accountSid, authToken);
}

async function sendSMS(to, body) {
  const client = getTwilioClient();
  const from = process.env.TWILIO_NUMBER;
  await client.messages.create({ to, from, body });
}

const OWNER_PHONE = process.env.OWNER_PHONE || '+13059095773';

// ─── Function 1: sendWelcomeSMS ───────────────────────────────────────────────
// Trigger: new customer document created
exports.sendWelcomeSMS = onDocumentCreated('customers/{customerId}', async (event) => {
  const customer = event.data.data();
  if (!customer) return;

  const { phone, firstName, lastName, referredBy } = customer;

  // Send welcome SMS to new customer
  if (phone) {
    try {
      await sendSMS(
        phone,
        'Welcome to Miami Knife Guy! \uD83D\uDD2A Your free sharpening is confirmed. We\'ll be in touch to schedule. Reply STOP to opt out.'
      );
      console.log(`Welcome SMS sent to ${phone}`);
    } catch (err) {
      console.error(`Failed to send welcome SMS to ${phone}:`, err.message);
    }
  }

  // Send lead notification to owner
  try {
    const referralInfo = referredBy || 'direct';
    await sendSMS(
      OWNER_PHONE,
      `New MKG lead: ${firstName || ''} ${lastName || ''} | ${phone || 'no phone'} | Referred by: ${referralInfo}`
    );
    console.log('Owner notification sent');
  } catch (err) {
    console.error('Failed to send owner notification:', err.message);
  }
});

// ─── Function 2: sendReferralCompleteSMS ─────────────────────────────────────
// Trigger: referral document updated — fires when status changes to 'completed'
exports.sendReferralCompleteSMS = onDocumentUpdated('referrals/{referralId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  if (!before || !after) return;

  // Only fire when status transitions to 'completed'
  if (after.status !== 'completed' || before.status === 'completed') return;

  const db = getFirestore();
  const { referringCustomerId } = after;

  if (!referringCustomerId) {
    console.warn('No referringCustomerId on referral');
    return;
  }

  try {
    const referrerDoc = await db.collection('customers').doc(referringCustomerId).get();
    if (!referrerDoc.exists) {
      console.warn(`Referring customer ${referringCustomerId} not found`);
      return;
    }

    const referrer = referrerDoc.data();
    const { phone, referralCode } = referrer;

    if (!phone) {
      console.warn('Referring customer has no phone number');
      return;
    }

    await sendSMS(
      phone,
      `Your MKG referral was completed! $20 has been added to your rewards balance. Keep sharing — miamiknifeguy.com/r/${referralCode || ''}`
    );
    console.log(`Referral complete SMS sent to ${phone}`);
  } catch (err) {
    console.error('Failed to send referral complete SMS:', err.message);
  }
});

// ─── Function 3: sendReviewApprovedSMS ───────────────────────────────────────
// Trigger: reviewSubmissions document updated — fires when status changes to 'approved'
exports.sendReviewApprovedSMS = onDocumentUpdated('reviewSubmissions/{reviewId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  if (!before || !after) return;

  // Only fire when status transitions to 'approved'
  if (after.status !== 'approved' || before.status === 'approved') return;

  const db = getFirestore();
  const { customerId } = after;

  if (!customerId) {
    console.warn('No customerId on reviewSubmission');
    return;
  }

  try {
    const customerDoc = await db.collection('customers').doc(customerId).get();
    if (!customerDoc.exists) {
      console.warn(`Customer ${customerId} not found`);
      return;
    }

    const customer = customerDoc.data();
    const { phone } = customer;

    if (!phone) {
      console.warn('Customer has no phone number');
      return;
    }

    await sendSMS(
      phone,
      '$10 reward credit added to your MKG account. Thank you for sharing your experience!'
    );
    console.log(`Review approved SMS sent to ${phone}`);
  } catch (err) {
    console.error('Failed to send review approved SMS:', err.message);
  }
});

// ─── Function 4: sendFraudFlagSMS ────────────────────────────────────────────
// Trigger: referral document updated — fires when fraudFlag is set to true
exports.sendFraudFlagSMS = onDocumentUpdated('referrals/{referralId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  if (!before || !after) return;

  // Only fire when fraudFlag transitions from false/undefined to true
  if (!after.fraudFlag || before.fraudFlag === true) return;

  const referralId = event.params.referralId;

  try {
    await sendSMS(
      OWNER_PHONE,
      `\u26A0\uFE0F MKG Fraud Flag: Referral ${referralId} flagged. Check CRM.`
    );
    console.log(`Fraud alert SMS sent to owner for referral ${referralId}`);
  } catch (err) {
    console.error('Failed to send fraud flag SMS:', err.message);
  }
});
