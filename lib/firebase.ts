import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, Firestore, Timestamp } from 'firebase-admin/firestore'

// Initialize Firebase Admin SDK
function getFirebaseAdmin() {
  if (getApps().length === 0) {
    // Check for service account credentials
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY

    if (serviceAccount) {
      try {
        const credentials = JSON.parse(serviceAccount)
        initializeApp({
          credential: cert(credentials),
          projectId: credentials.project_id,
        })
      } catch (error) {
        console.error('[Firebase] Failed to parse service account:', error)
        throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY format')
      }
    } else if (process.env.FIREBASE_PROJECT_ID) {
      // Use default credentials (for environments like Cloud Run)
      initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      })
    } else {
      throw new Error(
        'Firebase not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PROJECT_ID environment variable.'
      )
    }
  }

  return getFirestore()
}

// Lazy initialization
let _db: Firestore | null = null

export function getDb(): Firestore {
  if (!_db) {
    _db = getFirebaseAdmin()
  }
  return _db
}

// Collection names
export const COLLECTIONS = {
  DIVISIONS: 'divisions',
  SUBCONTRACTORS: 'subcontractors',
  BIDS: 'bids',
  BID_RESPONSES: 'bidResponses',
  CALENDAR_EVENTS: 'calendarEvents',
  EMAIL_THREADS: 'emailThreads',
  EMAIL_MESSAGES: 'emailMessages',
} as const

// Type definitions
export type BidStatus = 'DRAFT' | 'PENDING_DIVISION' | 'ACTIVE' | 'CLOSED' | 'AWARDED' | 'CANCELLED'
export type ResponseStatus = 'PENDING' | 'VIEWED' | 'INTERESTED' | 'QUOTED' | 'DECLINED' | 'ACCEPTED'

export interface Division {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface Subcontractor {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  address?: string
  divisionIds: string[] // Array of division IDs this subcontractor belongs to
  createdAt: Date
  updatedAt: Date
}

export interface Bid {
  id: string
  title: string
  description?: string
  divisionId: string
  status: BidStatus
  dueDate?: Date
  aiSuggestedDivision?: string
  divisionConfirmed: boolean
  createdAt: Date
  updatedAt: Date
}

export interface BidResponse {
  id: string
  bidId: string
  subcontractorId: string
  status: ResponseStatus
  amount?: number
  notes?: string
  submittedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CalendarEvent {
  id: string
  bidId: string
  googleEventId?: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  location?: string
  attendees: string[]
  createdAt: Date
  updatedAt: Date
}

export interface EmailThread {
  id: string
  bidId: string
  subject: string
  recipients: string[]
  lastMessageAt?: Date
  createdAt: Date
  updatedAt: Date
}

// Helper to convert Firestore timestamps to Dates
export function toDate(timestamp: Timestamp | Date | undefined): Date | undefined {
  if (!timestamp) return undefined
  if (timestamp instanceof Date) return timestamp
  return timestamp.toDate()
}

// Helper to prepare data for Firestore (convert dates to timestamps)
export function toFirestore<T extends Record<string, unknown>>(data: T): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Date) {
      result[key] = Timestamp.fromDate(value)
    } else if (value === undefined) {
      // Skip undefined values
    } else {
      result[key] = value
    }
  }
  return result as T
}

// Helper to convert Firestore document to typed object
export function fromFirestore<T>(doc: FirebaseFirestore.DocumentSnapshot): T | null {
  if (!doc.exists) return null
  const data = doc.data()
  if (!data) return null

  const result: Record<string, unknown> = { id: doc.id }
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) {
      result[key] = value.toDate()
    } else {
      result[key] = value
    }
  }
  return result as T
}

// Check if Firebase is configured
export function isFirebaseConfigured(): boolean {
  return !!(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_PROJECT_ID)
}

// Validate Firebase connection
export async function validateFirebaseConnection(): Promise<{
  connected: boolean
  latencyMs?: number
  error?: string
}> {
  if (!isFirebaseConfigured()) {
    return {
      connected: false,
      error: 'Firebase not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.',
    }
  }

  try {
    const startTime = Date.now()
    const db = getDb()
    // Try to read from a collection to verify connection
    await db.collection('_health').limit(1).get()
    const latencyMs = Date.now() - startTime
    return { connected: true, latencyMs }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown Firebase error',
    }
  }
}
