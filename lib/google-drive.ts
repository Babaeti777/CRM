import { google } from 'googleapis'

export function getGoogleDrive(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: accessToken })

  return google.drive({ version: 'v3', auth: oauth2Client })
}

export async function uploadToGoogleDrive(
  accessToken: string,
  file: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ id: string; webViewLink: string }> {
  const drive = getGoogleDrive(accessToken)

  const fileMetadata = {
    name: fileName,
  }

  const media = {
    mimeType: mimeType,
    body: require('stream').Readable.from(file),
  }

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id,webViewLink',
  })

  return {
    id: response.data.id!,
    webViewLink: response.data.webViewLink!,
  }
}

export async function deleteFromGoogleDrive(
  accessToken: string,
  fileId: string
): Promise<void> {
  const drive = getGoogleDrive(accessToken)
  await drive.files.delete({ fileId })
}

export async function getFileFromGoogleDrive(
  accessToken: string,
  fileId: string
): Promise<Buffer> {
  const drive = getGoogleDrive(accessToken)

  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  )

  return Buffer.from(response.data as ArrayBuffer)
}
