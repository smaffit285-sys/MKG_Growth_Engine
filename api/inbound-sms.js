'use strict';

const twilio = require('twilio');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

if (!getApps().length) {
    initializeApp({
          credential: cert({
                  projectId: process.env.FIREBASE_PROJECT_ID,
                  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                  privateKey: process.env.FIREBASE_PRIVATE_KEY
                    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                            : undefined,
          }),
    });
}

const db = getFirestore();

function getTwilioClient() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
          throw new Error('Twilio credentials not configured.');
    }
    return twilio(accountSid, authToken);
}

async function sendSMS(to, body) {
    const client = getTwilioClient();
    const from = process.env.TWILIO_NUMBER;
    await client.messages.create({ to, from, body });
}

const RESPONSES = {
    SHARP: [
          'Hey! Thanks for texting MKG.',
          "You're now registered for Sharp After Dark.",
          'Reply with your name and restaurant to get started, or visit miamiknifeguy.com',
        ].join('\n'),
    STOP: 'You have been unsubscribed. Reply START to resubscribe.',
    START: 'Welcome back! You are now resubscribed to MKG updates.',
    HELP: [
          'MKG Sharp After Dark — Professional knife sharpening for Miami restaurants.',
          'SHARP to register, STOP to unsubscribe, HELP for this message.',
          'Visit miamiknifeguy.com',
        ].join('\n'),
    UNKNOWN: [
          'Text SHARP to register for your first knife free.',
          'miamiknifeguy.com',
        ].join('\n'),
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
    }

  const body = ((req.body && req.body.Body) || '').trim().toUpperCase();
    const fromPhone = ((req.body && req.body.From) || '').replace(/\D/g, '');
    const replyText = RESPONSES[body] || RESPONSES.UNKNOWN;

  try {
        await sendSMS((req.body && req.body.From) || '', replyText);
  } catch (err) {
        console.error('SMS send failed:', err.message);
        return res.status(500).json({ error: 'Failed to send SMS' });
  }

  if (body === 'SHARP') {
        try {
                const snap = await db
                  .collection('customers')
                  .where('phone', '==', fromPhone)
                  .limit(1)
                  .get();
                if (snap.empty) {
                          await db.collection('customers').add({
                                      phone: fromPhone,
                                      source: 'sms_sharp',
                                      optIn: true,
                                      createdAt: FieldValue.serverTimestamp(),
                                      lastActivity: FieldValue.serverTimestamp(),
                          });
                } else {
                          await snap.docs[0].ref.update({
                                      optIn: true,
                                      lastActivity: FieldValue.serverTimestamp(),
                          });
                }
        } catch (err) {
                console.error('Firestore error:', err.message);
        }
  }

  if (body === 'STOP') {
        try {
                const snap = await db
                  .collection('customers')
                  .where('phone', '==', fromPhone)
                  .limit(1)
                  .get();
                if (!snap.empty) {
                          await snap.docs[0].ref.update({
                                      optIn: false,
                                      lastActivity: FieldValue.serverTimestamp(),
                          });
                }
        } catch (err) {
                console.error('Firestore STOP error:', err.message);
        }
  }

  return res.status(200).json({ success: true });
}
