import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSubcontractors, createSubcontractor, getSubcontractorByEmail, getDivisionById, getDivisionByName, getBidResponses } from '@/lib/db'
import { isFirebaseConfigured } from '@/lib/firebase'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

// POST import subcontractors from Excel
export async function POST(request: NextRequest) {
  try {
    if (!isFirebaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read Excel file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[]

    if (data.length === 0) {
      return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 })
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const row of data) {
      try {
        // Map common column names (case-insensitive)
        const name = String(row['Name'] || row['name'] || row['NAME'] || row['Contact Name'] || row['Contact'] || '').trim()
        const email = String(row['Email'] || row['email'] || row['EMAIL'] || row['E-mail'] || '').trim().toLowerCase()
        const phone = String(row['Phone'] || row['phone'] || row['PHONE'] || row['Phone Number'] || row['Tel'] || '').trim() || undefined
        const company = String(row['Company'] || row['company'] || row['COMPANY'] || row['Company Name'] || row['Business'] || '').trim() || undefined
        const address = String(row['Address'] || row['address'] || row['ADDRESS'] || row['Location'] || '').trim() || undefined
        const divisionName = String(row['Division'] || row['division'] || row['DIVISION'] || row['Trade'] || row['Category'] || '').trim()

        if (!name || !email) {
          results.errors.push(`Row missing name or email: ${JSON.stringify(row).substring(0, 100)}`)
          results.skipped++
          continue
        }

        // Check if email already exists
        const existing = await getSubcontractorByEmail(email)
        if (existing) {
          results.skipped++
          continue
        }

        // Try to find division by name
        let divisionIds: string[] = []
        if (divisionName) {
          const division = await getDivisionByName(divisionName)
          if (division) {
            divisionIds = [division.id]
          }
        }

        await createSubcontractor({
          name,
          email,
          phone,
          company,
          address,
          divisionIds,
        })

        results.imported++
      } catch (err) {
        results.errors.push(`Error importing row: ${err instanceof Error ? err.message : 'Unknown error'}`)
        results.skipped++
      }
    }

    return NextResponse.json({
      message: `Import complete: ${results.imported} imported, ${results.skipped} skipped`,
      ...results,
    })
  } catch (error) {
    console.error('[IMPORT API] Error:', error)
    return NextResponse.json({ error: 'Failed to import subcontractors' }, { status: 500 })
  }
}

// GET export subcontractors to Excel
export async function GET() {
  try {
    if (!isFirebaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const subcontractors = await getSubcontractors()

    // Get division names for each subcontractor
    const exportData = await Promise.all(
      subcontractors.map(async (sub) => {
        const divisions = await Promise.all(
          sub.divisionIds.map(id => getDivisionById(id))
        )
        const divisionNames = divisions.filter(Boolean).map(d => d!.name).join(', ')

        return {
          'Name': sub.name,
          'Email': sub.email,
          'Phone': sub.phone || '',
          'Company': sub.company || '',
          'Address': sub.address || '',
          'Division': divisionNames,
        }
      })
    )

    // Create workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(exportData)

    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Name
      { wch: 30 }, // Email
      { wch: 15 }, // Phone
      { wch: 30 }, // Company
      { wch: 40 }, // Address
      { wch: 30 }, // Division
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Subcontractors')

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="subcontractors-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('[EXPORT API] Error:', error)
    return NextResponse.json({ error: 'Failed to export subcontractors' }, { status: 500 })
  }
}
