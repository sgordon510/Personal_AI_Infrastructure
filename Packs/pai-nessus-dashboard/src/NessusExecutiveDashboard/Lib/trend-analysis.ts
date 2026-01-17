// Historical data storage and trend analysis for Nessus scans
import { NessusVulnerability, NessusSummary, generateNessusSummary } from './nessus-parser'

export interface MonthlySnapshot {
  id: string
  month: string // YYYY-MM format
  label: string // e.g., "January 2024"
  uploadedAt: string
  fileName: string
  vulnerabilities: NessusVulnerability[]
  summary: NessusSummary
}

export interface TrendMetrics {
  month: string
  label: string
  critical: number
  high: number
  medium: number
  low: number
  total: number
  uniqueHosts: number
  riskScore: number
}

export interface MonthOverMonthChange {
  currentMonth: string
  previousMonth: string
  criticalChange: number
  highChange: number
  mediumChange: number
  lowChange: number
  totalChange: number
  hostsChange: number
  riskScoreChange: number
  newVulnerabilities: string[] // Plugin IDs of new vulns
  remediatedVulnerabilities: string[] // Plugin IDs that were fixed
}

export interface YearlyProgress {
  year: number
  startingTotal: number
  currentTotal: number
  totalRemediated: number
  totalNew: number
  netChange: number
  monthlyData: TrendMetrics[]
  remediationRate: number // percentage
}

const STORAGE_KEY = 'nessusHistoricalData'

// Get all stored monthly snapshots
export function getHistoricalData(): MonthlySnapshot[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return []
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

// Save a monthly snapshot
export function saveMonthlySnapshot(
  month: string,
  fileName: string,
  vulnerabilities: NessusVulnerability[]
): MonthlySnapshot {
  const snapshots = getHistoricalData()

  // Parse month to create label
  const [year, monthNum] = month.split('-')
  const date = new Date(parseInt(year), parseInt(monthNum) - 1)
  const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const snapshot: MonthlySnapshot = {
    id: `${month}-${Date.now()}`,
    month,
    label,
    uploadedAt: new Date().toISOString(),
    fileName,
    vulnerabilities,
    summary: generateNessusSummary(vulnerabilities)
  }

  // Replace existing snapshot for same month or add new
  const existingIndex = snapshots.findIndex(s => s.month === month)
  if (existingIndex >= 0) {
    snapshots[existingIndex] = snapshot
  } else {
    snapshots.push(snapshot)
  }

  // Sort by month
  snapshots.sort((a, b) => a.month.localeCompare(b.month))

  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots))

  // Also update current data
  localStorage.setItem('nessusData', JSON.stringify(vulnerabilities))
  localStorage.setItem('nessusFileName', fileName)
  localStorage.setItem('nessusUploadDate', new Date().toISOString())

  window.dispatchEvent(new CustomEvent('nessusDataUpdated'))
  window.dispatchEvent(new CustomEvent('nessusHistoryUpdated'))

  return snapshot
}

// Delete a monthly snapshot
export function deleteMonthlySnapshot(month: string): void {
  const snapshots = getHistoricalData()
  const filtered = snapshots.filter(s => s.month !== month)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  window.dispatchEvent(new CustomEvent('nessusHistoryUpdated'))
}

// Clear all historical data
export function clearHistoricalData(): void {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new CustomEvent('nessusHistoryUpdated'))
}

// Calculate trend metrics from snapshots
export function calculateTrendMetrics(snapshots: MonthlySnapshot[]): TrendMetrics[] {
  return snapshots.map(snapshot => {
    const s = snapshot.summary
    const activeVulns = s.totalVulnerabilities - s.none
    const riskScore = activeVulns > 0
      ? Math.round(((s.critical * 10 + s.high * 7 + s.medium * 4 + s.low * 1) / activeVulns) * 10)
      : 0

    return {
      month: snapshot.month,
      label: snapshot.label,
      critical: s.critical,
      high: s.high,
      medium: s.medium,
      low: s.low,
      total: activeVulns,
      uniqueHosts: s.uniqueHosts,
      riskScore
    }
  })
}

// Calculate month-over-month changes
export function calculateMonthOverMonth(
  current: MonthlySnapshot,
  previous: MonthlySnapshot
): MonthOverMonthChange {
  const currentPlugins = new Set(current.vulnerabilities.filter(v => v.risk !== 'None').map(v => v.pluginId))
  const previousPlugins = new Set(previous.vulnerabilities.filter(v => v.risk !== 'None').map(v => v.pluginId))

  const newVulns = Array.from(currentPlugins).filter(p => !previousPlugins.has(p))
  const remediatedVulns = Array.from(previousPlugins).filter(p => !currentPlugins.has(p))

  const currentActive = current.summary.totalVulnerabilities - current.summary.none
  const previousActive = previous.summary.totalVulnerabilities - previous.summary.none

  const currentRisk = currentActive > 0
    ? Math.round(((current.summary.critical * 10 + current.summary.high * 7 + current.summary.medium * 4 + current.summary.low * 1) / currentActive) * 10)
    : 0
  const previousRisk = previousActive > 0
    ? Math.round(((previous.summary.critical * 10 + previous.summary.high * 7 + previous.summary.medium * 4 + previous.summary.low * 1) / previousActive) * 10)
    : 0

  return {
    currentMonth: current.month,
    previousMonth: previous.month,
    criticalChange: current.summary.critical - previous.summary.critical,
    highChange: current.summary.high - previous.summary.high,
    mediumChange: current.summary.medium - previous.summary.medium,
    lowChange: current.summary.low - previous.summary.low,
    totalChange: currentActive - previousActive,
    hostsChange: current.summary.uniqueHosts - previous.summary.uniqueHosts,
    riskScoreChange: currentRisk - previousRisk,
    newVulnerabilities: newVulns,
    remediatedVulnerabilities: remediatedVulns
  }
}

// Calculate yearly progress
export function calculateYearlyProgress(snapshots: MonthlySnapshot[], year: number): YearlyProgress | null {
  const yearSnapshots = snapshots.filter(s => s.month.startsWith(year.toString()))

  if (yearSnapshots.length === 0) return null

  const monthlyData = calculateTrendMetrics(yearSnapshots)
  const firstMonth = yearSnapshots[0]
  const lastMonth = yearSnapshots[yearSnapshots.length - 1]

  const startingTotal = firstMonth.summary.totalVulnerabilities - firstMonth.summary.none
  const currentTotal = lastMonth.summary.totalVulnerabilities - lastMonth.summary.none

  // Calculate total remediated and new across all months
  let totalRemediated = 0
  let totalNew = 0

  for (let i = 1; i < yearSnapshots.length; i++) {
    const change = calculateMonthOverMonth(yearSnapshots[i], yearSnapshots[i - 1])
    totalRemediated += change.remediatedVulnerabilities.length
    totalNew += change.newVulnerabilities.length
  }

  const remediationRate = startingTotal > 0
    ? Math.round((totalRemediated / (startingTotal + totalNew)) * 100)
    : 0

  return {
    year,
    startingTotal,
    currentTotal,
    totalRemediated,
    totalNew,
    netChange: currentTotal - startingTotal,
    monthlyData,
    remediationRate
  }
}

// Get available years from historical data
export function getAvailableYears(snapshots: MonthlySnapshot[]): number[] {
  const years = new Set(snapshots.map(s => parseInt(s.month.split('-')[0])))
  return Array.from(years).sort((a, b) => b - a)
}

// Generate month options for a year
export function getMonthOptions(year: number): { value: string; label: string }[] {
  const months = []
  for (let i = 1; i <= 12; i++) {
    const monthNum = i.toString().padStart(2, '0')
    const date = new Date(year, i - 1)
    months.push({
      value: `${year}-${monthNum}`,
      label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    })
  }
  return months
}
