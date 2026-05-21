'use strict';

const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onRequest } = require('firebase-functions/v2/https');
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
                                                                     'Welcome to Miami Knife Guy! Your free sharpening is confirmed. We\'ll be in touch to schedule. Reply STOP to opt out.'
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
                                                             `MKG Fraud Flag: Referral ${referralId} flagged. Check CRM.`
                                                           );
                                                     console.log(`Fraud alert SMS sent to owner for referral ${referralId}`);
                                               } catch (err) {
                                                     console.error('Failed to send fraud flag SMS:', err.message);
                                               }
});

// ─── Function 5: handleInboundSMS ────────────────────────────────────────────
// Twilio webhook — handles inbound SMS to MKG Twilio number
// SHARP → registration link, HELP → support, STATUS → rewards balance
// Deploy: firebase deploy --only functions
// Then set Twilio webhook to: https://us-central1-YOUR_PROJECT.cloudfunctions.net/handleInboundSMS

const REPLIES = {
    SHARP: [
          'Miami Knife Guy here.',
          'Register for your first knife free -> https://miamiknifeguy.com/register',
          'Takes 60 seconds. We come to you.',
          'Questions? Reply HELP.',
        ].join('\n'),

    HELP: [
          'Miami Knife Guy support:',
          'Text SHARP to register.',
          'Call or text Sean directly: (305) 909-5773',
          'miamiknifeguy.com',
        ].join('\n'),

    STATUS_NOT_FOUND: [
          'We don\'t see a registration for this number yet.',
          'Text SHARP to get started.',
          'miamiknifeguy.com/register',
        ].join('\n'),

    UNKNOWN: [
          'Text SHARP to register for your first knife free.',
          'miamiknifeguy.com',
        ].join('\n'),
};

exports.handleInboundSMS = onRequest(async (req, res) => {
    const body = (req.body.Body || '').trim().toUpperCase();
    const fromPhone = (req.body.From || '').replace(/\D/g, '');
    const db = getFirestore();

                                       const twimlReply = (message) => {
                                             res.set('Content-Type', 'text/xml');
                                             res.send(`<?xml version="1.0" encoding="UTF-8"?>
                                             <Response>
                                               <Message>${escapeXml(message)}</Message>
                                               </Response>`);
                                       };

                                       const twimlEmpty = () => {
                                             res.set('Content-Type', 'text/xml');
                                             res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
                                       };

                                       try {
                                             if (body === 'SHARP') {
                                                     const existing = await db.collection('customers')
                                                       .where('phone', '==', fromPhone)
                                                       .limit(1)
                                                       .get();

                                               if (!existing.empty) {
                                                         const customer = existing.docs[0].data();
                                                         const alreadyRegisteredReply = [
                                                                     `Hey ${customer.firstName || 'there'} — you're already registered.`,
                                                                     `Your referral link: https://miamiknifeguy.com/r/${customer.referralCode}`,
                                                                     `Share it to earn rewards. Questions? (305) 909-5773`,
                                                                   ].join('\n');

                                                       await db.collection('customerEvents').add({
                                                                   eventType: 'sms_sharp_existing',
                                                                   customerId: existing.docs[0].id,
                                                                   metadata: { keyword: 'SHARP', phone: fromPhone },
                                                                   createdAt: FieldValue.serverTimestamp(),
                                                       });

                                                       return twimlReply(alreadyRegisteredReply);
                                               }

                                               await db.collection('leadAlerts').add({
                                                         alertType: 'sharp_keyword_inbound',
                                                         status: 'new',
                                                         customerPhone: fromPhone,
                                                         keyword: 'SHARP',
                                                         ownerPhone: process.env.OWNER_PHONE || '+13059095773',
                                                         ownerSmsBody: `SHARP keyword from ${fromPhone} — new lead. Not yet registered.`,
                                                         createdAt: FieldValue.serverTimestamp(),
                                               });

                                               try {
                                                         const client = getTwilioClient();
                                                         await client.messages.create({
                                                                     to: process.env.OWNER_PHONE || '+13059095773',
                                                                     from: process.env.TWILIO_NUMBER,
                                                                     body: `SHARP keyword from +${fromPhone} — new lead inbound. Not yet registered.`,
                                                         });
                                               } catch (notifyErr) {
                                                         console.error('Owner notify failed:', notifyErr.message);
                                               }

                                               return twimlReply(REPLIES.SHARP);
                                             }

      if (body === 'HELP') {
              return twimlReply(REPLIES.HELP);
      }

      if (body === 'STATUS') {
              const snap = await db.collection('customers')
                .where('phone', '==', fromPhone)
                .limit(1)
                .get();

                                               if (snap.empty) {
                                                         return twimlReply(REPLIES.STATUS_NOT_FOUND);
                                               }

                                               const c = snap.docs[0].data();
              const statusReply = [
                        `Hey ${c.firstName || 'there'} — you're registered with Miami Knife Guy.`,
        `Rewards balance: $${c.rewardsBalance || 0}`,
                        `Referrals completed: ${c.completedReferrals || 0}`,
                        `Your link: https://miamiknifeguy.com/r/${c.referralCode}`,
                      ].join('\n');

                                               return twimlReply(statusReply);
      }

      if (body === 'STOP' || body === 'UNSTOP' || body === 'START' || body === 'CANCEL') {
              return twimlEmpty();
      }

      return twimlReply(REPLIES.UNKNOWN);

                                       } catch (err) {
                                             console.error('handleInboundSMS error:', err);
                                             res.set('Content-Type', 'text/xml');
                                             res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?>
                                             <Response>
                                               <Message>Something went wrong on our end. Text SHARP again or call (305) 909-5773.</Message>
                                               </Response>`);
                                       }
});

// ─── Helper: escape XML special chars in TwiML ─────────────────────────────
function escapeXml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
}
