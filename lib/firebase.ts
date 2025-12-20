import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getStorage } from 'firebase-admin/storage'

// Initialize Firebase Admin (server-side only)
if (!getApps().length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined

  initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : undefined,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  })
}

export const storage = getStorage()

export async function uploadFileToFirebase(
  file: Buffer,
  fileName: string,
  folder: string
): Promise<string> {
  const bucket = storage.bucket()
  const filePath = `${folder}/${Date.now()}-${fileName}`
  const fileRef = bucket.file(filePath)

  await fileRef.save(file, {
    metadata: {
      contentType: 'application/octet-stream',
    },
  })

  // Make file publicly readable (optional - remove if you want private files)
  await fileRef.makePublic()

  return `https://storage.googleapis.com/${bucket.name}/${filePath}`
}

export async function deleteFileFromFirebase(filePath: string): Promise<void> {
  const bucket = storage.bucket()
  await bucket.file(filePath).delete()
}

export async function getFileFromFirebase(filePath: string): Promise<Buffer> {
  const bucket = storage.bucket()
  const [file] = await bucket.file(filePath).download()
  return file
}
