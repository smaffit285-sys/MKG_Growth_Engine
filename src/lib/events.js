import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { COLLECTIONS } from './schema'

export async function logCustomerEvent({
  eventType,
  customerId = null,
  commercialAccountId = null,
  actorUserId = null,
  metadata = {},
}) {
  return addDoc(collection(db, COLLECTIONS.CUSTOMER_EVENTS), {
    eventType,
    customerId,
    commercialAccountId,
    actorUserId,
    metadata,
    createdAt: serverTimestamp(),
  })
}

export async function logTrainingSession({
  staffUserId,
  trainingType,
  score,
  outcome,
  durationSeconds,
  metadata = {},
}) {
  return addDoc(collection(db, COLLECTIONS.TRAINING_SESSIONS), {
    staffUserId,
    trainingType,
    score,
    outcome,
    durationSeconds,
    metadata,
    createdAt: serverTimestamp(),
  })
}

export async function logSharpeningSession({
  customerId = null,
  commercialAccountId = null,
  staffUserId = null,
  bladeType = null,
  steelType = null,
  edgeCondition = null,
  sharpeningAngle = null,
  durationSeconds = null,
  qualityScore = null,
  filmed = false,
  metadata = {},
}) {
  return addDoc(collection(db, COLLECTIONS.SHARPENING_SESSIONS), {
    customerId,
    commercialAccountId,
    staffUserId,
    bladeType,
    steelType,
    edgeCondition,
    sharpeningAngle,
    durationSeconds,
    qualityScore,
    filmed,
    metadata,
    createdAt: serverTimestamp(),
  })
}
