import { getDb, COLLECTIONS, toFirestore, fromFirestore } from './firebase'
import type { Division, Subcontractor, Bid, BidResponse, CalendarEvent, EmailThread, BidStatus, ResponseStatus } from './firebase'
import { FieldValue } from 'firebase-admin/firestore'

// Generate a unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// ============ DIVISIONS ============

export async function getDivisions(): Promise<Division[]> {
  const db = getDb()
  const snapshot = await db.collection(COLLECTIONS.DIVISIONS).orderBy('name').get()
  return snapshot.docs.map(doc => fromFirestore<Division>(doc)!).filter(Boolean)
}

export async function getDivisionById(id: string): Promise<Division | null> {
  const db = getDb()
  const doc = await db.collection(COLLECTIONS.DIVISIONS).doc(id).get()
  return fromFirestore<Division>(doc)
}

export async function getDivisionByName(name: string): Promise<Division | null> {
  const db = getDb()
  const snapshot = await db.collection(COLLECTIONS.DIVISIONS).where('name', '==', name).limit(1).get()
  if (snapshot.empty) return null
  return fromFirestore<Division>(snapshot.docs[0])
}

export async function createDivision(data: { name: string; description?: string }): Promise<Division> {
  const db = getDb()
  const id = generateId()
  const now = new Date()
  const division: Omit<Division, 'id'> = {
    name: data.name,
    description: data.description,
    createdAt: now,
    updatedAt: now,
  }
  await db.collection(COLLECTIONS.DIVISIONS).doc(id).set(toFirestore(division))
  return { id, ...division }
}

// ============ SUBCONTRACTORS ============

export async function getSubcontractors(filters?: { divisionId?: string }): Promise<Subcontractor[]> {
  const db = getDb()
  let query = db.collection(COLLECTIONS.SUBCONTRACTORS).orderBy('name')

  if (filters?.divisionId) {
    query = db.collection(COLLECTIONS.SUBCONTRACTORS)
      .where('divisionIds', 'array-contains', filters.divisionId)
      .orderBy('name') as typeof query
  }

  const snapshot = await query.get()
  return snapshot.docs.map(doc => fromFirestore<Subcontractor>(doc)!).filter(Boolean)
}

export async function getSubcontractorById(id: string): Promise<Subcontractor | null> {
  const db = getDb()
  const doc = await db.collection(COLLECTIONS.SUBCONTRACTORS).doc(id).get()
  return fromFirestore<Subcontractor>(doc)
}

export async function getSubcontractorByEmail(email: string): Promise<Subcontractor | null> {
  const db = getDb()
  const snapshot = await db.collection(COLLECTIONS.SUBCONTRACTORS).where('email', '==', email).limit(1).get()
  if (snapshot.empty) return null
  return fromFirestore<Subcontractor>(snapshot.docs[0])
}

export async function createSubcontractor(data: {
  name: string
  email: string
  phone?: string
  company?: string
  address?: string
  divisionIds?: string[]
}): Promise<Subcontractor> {
  const db = getDb()
  const id = generateId()
  const now = new Date()
  const subcontractor: Omit<Subcontractor, 'id'> = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    company: data.company,
    address: data.address,
    divisionIds: data.divisionIds || [],
    createdAt: now,
    updatedAt: now,
  }
  await db.collection(COLLECTIONS.SUBCONTRACTORS).doc(id).set(toFirestore(subcontractor))
  return { id, ...subcontractor }
}

export async function updateSubcontractor(id: string, data: Partial<Subcontractor>): Promise<Subcontractor | null> {
  const db = getDb()
  const docRef = db.collection(COLLECTIONS.SUBCONTRACTORS).doc(id)
  await docRef.update(toFirestore({ ...data, updatedAt: new Date() }))
  const doc = await docRef.get()
  return fromFirestore<Subcontractor>(doc)
}

// ============ BIDS ============

export async function getBids(filters?: { status?: BidStatus; divisionId?: string }): Promise<Bid[]> {
  const db = getDb()
  let query: FirebaseFirestore.Query = db.collection(COLLECTIONS.BIDS)

  if (filters?.status) {
    query = query.where('status', '==', filters.status)
  }
  if (filters?.divisionId) {
    query = query.where('divisionId', '==', filters.divisionId)
  }

  query = query.orderBy('createdAt', 'desc')
  const snapshot = await query.get()
  return snapshot.docs.map(doc => fromFirestore<Bid>(doc)!).filter(Boolean)
}

export async function getBidById(id: string): Promise<Bid | null> {
  const db = getDb()
  const doc = await db.collection(COLLECTIONS.BIDS).doc(id).get()
  return fromFirestore<Bid>(doc)
}

export async function createBid(data: {
  title: string
  description?: string
  divisionId: string
  status?: BidStatus
  dueDate?: Date
}): Promise<Bid> {
  const db = getDb()
  const id = generateId()
  const now = new Date()
  const bid: Omit<Bid, 'id'> = {
    title: data.title,
    description: data.description,
    divisionId: data.divisionId,
    status: data.status || 'DRAFT',
    dueDate: data.dueDate,
    divisionConfirmed: false,
    createdAt: now,
    updatedAt: now,
  }
  await db.collection(COLLECTIONS.BIDS).doc(id).set(toFirestore(bid))
  return { id, ...bid }
}

export async function updateBid(id: string, data: Partial<Bid>): Promise<Bid | null> {
  const db = getDb()
  const docRef = db.collection(COLLECTIONS.BIDS).doc(id)
  await docRef.update(toFirestore({ ...data, updatedAt: new Date() }))
  const doc = await docRef.get()
  return fromFirestore<Bid>(doc)
}

export async function deleteBid(id: string): Promise<void> {
  const db = getDb()
  // Delete bid and related data
  const batch = db.batch()

  // Delete bid responses
  const responses = await db.collection(COLLECTIONS.BID_RESPONSES).where('bidId', '==', id).get()
  responses.docs.forEach(doc => batch.delete(doc.ref))

  // Delete calendar events
  const events = await db.collection(COLLECTIONS.CALENDAR_EVENTS).where('bidId', '==', id).get()
  events.docs.forEach(doc => batch.delete(doc.ref))

  // Delete email threads
  const threads = await db.collection(COLLECTIONS.EMAIL_THREADS).where('bidId', '==', id).get()
  threads.docs.forEach(doc => batch.delete(doc.ref))

  // Delete the bid itself
  batch.delete(db.collection(COLLECTIONS.BIDS).doc(id))

  await batch.commit()
}

// ============ BID RESPONSES ============

export async function getBidResponses(filters?: { bidId?: string; subcontractorId?: string }): Promise<BidResponse[]> {
  const db = getDb()
  let query: FirebaseFirestore.Query = db.collection(COLLECTIONS.BID_RESPONSES)

  if (filters?.bidId) {
    query = query.where('bidId', '==', filters.bidId)
  }
  if (filters?.subcontractorId) {
    query = query.where('subcontractorId', '==', filters.subcontractorId)
  }

  const snapshot = await query.get()
  return snapshot.docs.map(doc => fromFirestore<BidResponse>(doc)!).filter(Boolean)
}

export async function getBidResponseById(id: string): Promise<BidResponse | null> {
  const db = getDb()
  const doc = await db.collection(COLLECTIONS.BID_RESPONSES).doc(id).get()
  return fromFirestore<BidResponse>(doc)
}

export async function upsertBidResponse(data: {
  bidId: string
  subcontractorId: string
  status?: ResponseStatus
}): Promise<BidResponse> {
  const db = getDb()

  // Check if response already exists
  const existing = await db.collection(COLLECTIONS.BID_RESPONSES)
    .where('bidId', '==', data.bidId)
    .where('subcontractorId', '==', data.subcontractorId)
    .limit(1)
    .get()

  const now = new Date()

  if (!existing.empty) {
    // Update existing
    const doc = existing.docs[0]
    await doc.ref.update(toFirestore({ status: data.status || 'PENDING', updatedAt: now }))
    return fromFirestore<BidResponse>(await doc.ref.get())!
  }

  // Create new
  const id = generateId()
  const response: Omit<BidResponse, 'id'> = {
    bidId: data.bidId,
    subcontractorId: data.subcontractorId,
    status: data.status || 'PENDING',
    createdAt: now,
    updatedAt: now,
  }
  await db.collection(COLLECTIONS.BID_RESPONSES).doc(id).set(toFirestore(response))
  return { id, ...response }
}

export async function updateBidResponse(id: string, data: Partial<BidResponse>): Promise<BidResponse | null> {
  const db = getDb()
  const docRef = db.collection(COLLECTIONS.BID_RESPONSES).doc(id)
  await docRef.update(toFirestore({ ...data, updatedAt: new Date() }))
  const doc = await docRef.get()
  return fromFirestore<BidResponse>(doc)
}

// ============ CALENDAR EVENTS ============

export async function createCalendarEvent(data: {
  bidId: string
  googleEventId?: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  location?: string
  attendees?: string[]
}): Promise<CalendarEvent> {
  const db = getDb()
  const id = generateId()
  const now = new Date()
  const event: Omit<CalendarEvent, 'id'> = {
    bidId: data.bidId,
    googleEventId: data.googleEventId,
    title: data.title,
    description: data.description,
    startTime: data.startTime,
    endTime: data.endTime,
    location: data.location,
    attendees: data.attendees || [],
    createdAt: now,
    updatedAt: now,
  }
  await db.collection(COLLECTIONS.CALENDAR_EVENTS).doc(id).set(toFirestore(event))
  return { id, ...event }
}

// ============ EMAIL THREADS ============

export async function createEmailThread(data: {
  bidId: string
  subject: string
  recipients: string[]
}): Promise<EmailThread> {
  const db = getDb()
  const id = generateId()
  const now = new Date()
  const thread: Omit<EmailThread, 'id'> = {
    bidId: data.bidId,
    subject: data.subject,
    recipients: data.recipients,
    lastMessageAt: now,
    createdAt: now,
    updatedAt: now,
  }
  await db.collection(COLLECTIONS.EMAIL_THREADS).doc(id).set(toFirestore(thread))
  return { id, ...thread }
}

// ============ AGGREGATE QUERIES ============

export async function getBidWithDetails(id: string): Promise<{
  bid: Bid
  division: Division | null
  responses: (BidResponse & { subcontractor: Subcontractor | null })[]
} | null> {
  const bid = await getBidById(id)
  if (!bid) return null

  const [division, responses] = await Promise.all([
    getDivisionById(bid.divisionId),
    getBidResponses({ bidId: id }),
  ])

  // Get subcontractors for responses
  const responsesWithSubcontractors = await Promise.all(
    responses.map(async (response) => ({
      ...response,
      subcontractor: await getSubcontractorById(response.subcontractorId),
    }))
  )

  return {
    bid,
    division,
    responses: responsesWithSubcontractors,
  }
}

export async function getDivisionWithSubcontractors(id: string): Promise<{
  division: Division
  subcontractors: Subcontractor[]
} | null> {
  const division = await getDivisionById(id)
  if (!division) return null

  const subcontractors = await getSubcontractors({ divisionId: id })

  return { division, subcontractors }
}
