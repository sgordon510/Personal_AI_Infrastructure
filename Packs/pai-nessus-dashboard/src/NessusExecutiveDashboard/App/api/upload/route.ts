import { NextRequest, NextResponse } from 'next/server'
import { parseNessusCSV, generateNessusSummary } from '@/lib/nessus-parser'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Please upload a CSV file' },
        { status: 400 }
      )
    }

    const text = await file.text()
    const vulnerabilities = parseNessusCSV(text)

    if (vulnerabilities.length === 0) {
      return NextResponse.json(
        { error: 'No vulnerabilities found in the CSV file' },
        { status: 400 }
      )
    }

    const summary = generateNessusSummary(vulnerabilities)

    return NextResponse.json({
      success: true,
      fileName: file.name,
      vulnerabilities,
      summary,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process CSV file' },
      { status: 500 }
    )
  }
}
