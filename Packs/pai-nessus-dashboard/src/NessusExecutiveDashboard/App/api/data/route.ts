import { NextRequest, NextResponse } from 'next/server'
import { generateSampleNessusData, generateNessusSummary } from '@/lib/nessus-parser'

// GET - Return sample data for demo purposes
export async function GET() {
  const vulnerabilities = generateSampleNessusData()
  const summary = generateNessusSummary(vulnerabilities)

  return NextResponse.json({
    vulnerabilities,
    summary,
    source: 'sample',
  })
}
