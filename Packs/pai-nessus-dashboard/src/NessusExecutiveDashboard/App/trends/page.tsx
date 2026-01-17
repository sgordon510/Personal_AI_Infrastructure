"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  BarChart3,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Target,
  Activity
} from "lucide-react"
import {
  MonthlySnapshot,
  TrendMetrics,
  MonthOverMonthChange,
  YearlyProgress,
  getHistoricalData,
  calculateTrendMetrics,
  calculateMonthOverMonth,
  calculateYearlyProgress,
  getAvailableYears
} from "@/lib/trend-analysis"

export default function TrendsPage() {
  const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  useEffect(() => {
    const loadData = () => {
      const data = getHistoricalData()
      setSnapshots(data)
      setLoading(false)

      // Set selected year to most recent with data
      if (data.length > 0) {
        const years = getAvailableYears(data)
        if (years.length > 0) {
          setSelectedYear(years[0])
        }
      }
    }

    loadData()

    const handleUpdate = () => loadData()
    window.addEventListener('nessusHistoryUpdated', handleUpdate)
    return () => window.removeEventListener('nessusHistoryUpdated', handleUpdate)
  }, [])

  const availableYears = useMemo(() => getAvailableYears(snapshots), [snapshots])
  const trendMetrics = useMemo(() => calculateTrendMetrics(snapshots), [snapshots])
  const yearlyProgress = useMemo(
    () => calculateYearlyProgress(snapshots, selectedYear),
    [snapshots, selectedYear]
  )

  // Calculate month-over-month for the last two months
  const latestChange = useMemo(() => {
    if (snapshots.length < 2) return null
    const sorted = [...snapshots].sort((a, b) => b.month.localeCompare(a.month))
    return calculateMonthOverMonth(sorted[0], sorted[1])
  }, [snapshots])

  const TrendIndicator = ({ value, inverted = false }: { value: number; inverted?: boolean }) => {
    const isPositive = inverted ? value < 0 : value > 0
    const isNegative = inverted ? value > 0 : value < 0

    if (value === 0) {
      return <Minus className="h-4 w-4 text-gray-400" />
    }
    if (isPositive) {
      return (
        <span className="flex items-center text-[#33b579]">
          <TrendingUp className="h-4 w-4 mr-1" />
          +{Math.abs(value)}
        </span>
      )
    }
    return (
      <span className="flex items-center text-[#f52a65]">
        <TrendingDown className="h-4 w-4 mr-1" />
        -{Math.abs(value)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-[#2e7de9] animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading trend data...</p>
        </div>
      </div>
    )
  }

  if (snapshots.length === 0) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Trends & Progress</h1>
          <p className="text-lg text-gray-600">Track your vulnerability remediation progress over time</p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-16 text-center">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Historical Data</h3>
            <p className="text-gray-500 mb-6">
              Upload monthly scan results to track your remediation progress over time.
              Go to the Upload page and select a month for each scan.
            </p>
            <Button onClick={() => window.location.href = '/upload'}>
              Upload Monthly Scan
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Find max value for chart scaling
  const maxTotal = Math.max(...trendMetrics.map(m => m.total), 1)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Trends & Progress</h1>
        <p className="text-lg text-gray-600">
          Month-over-month vulnerability remediation tracking
        </p>
      </div>

      {/* Year Selector */}
      {availableYears.length > 1 && (
        <div className="mb-6 flex items-center gap-2">
          <span className="text-sm text-gray-600">Year:</span>
          {availableYears.map(year => (
            <Button
              key={year}
              variant={selectedYear === year ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedYear(year)}
            >
              {year}
            </Button>
          ))}
        </div>
      )}

      {/* Yearly Summary Cards */}
      {yearlyProgress && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-[#33b579]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-[#33b579]" />
                Remediated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-[#33b579]">{yearlyProgress.totalRemediated}</p>
              <p className="text-xs text-gray-500 mt-1">vulnerabilities fixed this year</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#f0a020]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-[#f0a020]" />
                New Discovered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-[#f0a020]">{yearlyProgress.totalNew}</p>
              <p className="text-xs text-gray-500 mt-1">new vulnerabilities found</p>
            </CardContent>
          </Card>

          <Card className={`border-l-4 ${yearlyProgress.netChange <= 0 ? 'border-l-[#33b579]' : 'border-l-[#f52a65]'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                Net Change
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-4xl font-bold ${yearlyProgress.netChange <= 0 ? 'text-[#33b579]' : 'text-[#f52a65]'}`}>
                {yearlyProgress.netChange > 0 ? '+' : ''}{yearlyProgress.netChange}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {yearlyProgress.startingTotal} → {yearlyProgress.currentTotal}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#2e7de9]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Target className="h-4 w-4 mr-2 text-[#2e7de9]" />
                Remediation Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-[#2e7de9]">{yearlyProgress.remediationRate}%</p>
              <p className="text-xs text-gray-500 mt-1">of issues addressed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Month-over-Month Change */}
      {latestChange && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowRight className="h-5 w-5 mr-2 text-[#2e7de9]" />
              Latest Month-over-Month Change
            </CardTitle>
            <CardDescription>
              Comparing {snapshots.find(s => s.month === latestChange.previousMonth)?.label} to{' '}
              {snapshots.find(s => s.month === latestChange.currentMonth)?.label}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Critical</p>
                <TrendIndicator value={latestChange.criticalChange} inverted />
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">High</p>
                <TrendIndicator value={latestChange.highChange} inverted />
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Medium</p>
                <TrendIndicator value={latestChange.mediumChange} inverted />
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Low</p>
                <TrendIndicator value={latestChange.lowChange} inverted />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <CheckCircle className="h-5 w-5 text-[#33b579] mr-2" />
                  <span className="font-semibold text-[#33b579]">
                    {latestChange.remediatedVulnerabilities.length} Remediated
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Unique vulnerabilities that were fixed since last month
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-5 w-5 text-[#f0a020] mr-2" />
                  <span className="font-semibold text-[#f0a020]">
                    {latestChange.newVulnerabilities.length} New
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  New unique vulnerabilities discovered this month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trend Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Vulnerability Trend</CardTitle>
          <CardDescription>Total vulnerabilities by severity over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trendMetrics.map((metric, index) => (
              <div key={metric.month} className="flex items-center gap-4">
                <div className="w-28 text-sm text-gray-600 shrink-0">
                  {metric.label.split(' ')[0].slice(0, 3)} {metric.label.split(' ')[1]}
                </div>
                <div className="flex-1 flex h-8 rounded overflow-hidden bg-gray-100">
                  {metric.critical > 0 && (
                    <div
                      className="bg-[#f52a65] flex items-center justify-center text-white text-xs font-bold"
                      style={{ width: `${(metric.critical / maxTotal) * 100}%`, minWidth: metric.critical > 0 ? '20px' : 0 }}
                      title={`Critical: ${metric.critical}`}
                    >
                      {metric.critical}
                    </div>
                  )}
                  {metric.high > 0 && (
                    <div
                      className="bg-[#f0a020] flex items-center justify-center text-white text-xs font-bold"
                      style={{ width: `${(metric.high / maxTotal) * 100}%`, minWidth: metric.high > 0 ? '20px' : 0 }}
                      title={`High: ${metric.high}`}
                    >
                      {metric.high}
                    </div>
                  )}
                  {metric.medium > 0 && (
                    <div
                      className="bg-[#2e7de9] flex items-center justify-center text-white text-xs font-bold"
                      style={{ width: `${(metric.medium / maxTotal) * 100}%`, minWidth: metric.medium > 0 ? '20px' : 0 }}
                      title={`Medium: ${metric.medium}`}
                    >
                      {metric.medium}
                    </div>
                  )}
                  {metric.low > 0 && (
                    <div
                      className="bg-[#33b579] flex items-center justify-center text-white text-xs font-bold"
                      style={{ width: `${(metric.low / maxTotal) * 100}%`, minWidth: metric.low > 0 ? '20px' : 0 }}
                      title={`Low: ${metric.low}`}
                    >
                      {metric.low}
                    </div>
                  )}
                </div>
                <div className="w-16 text-right font-bold text-gray-700">{metric.total}</div>
                {index > 0 && (
                  <div className="w-12">
                    <TrendIndicator
                      value={metric.total - trendMetrics[index - 1].total}
                      inverted
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#f52a65]" />
              <span>Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#f0a020]" />
              <span>High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#2e7de9]" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#33b579]" />
              <span>Low</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Details</CardTitle>
          <CardDescription>Detailed breakdown by month</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Month</TableHead>
                <TableHead className="text-center">Critical</TableHead>
                <TableHead className="text-center">High</TableHead>
                <TableHead className="text-center">Medium</TableHead>
                <TableHead className="text-center">Low</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Hosts</TableHead>
                <TableHead className="text-center">Risk Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trendMetrics.map((metric) => (
                <TableRow key={metric.month}>
                  <TableCell className="font-medium">{metric.label}</TableCell>
                  <TableCell className="text-center">
                    <span className={metric.critical > 0 ? 'text-[#f52a65] font-bold' : 'text-gray-400'}>
                      {metric.critical}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={metric.high > 0 ? 'text-[#f0a020] font-bold' : 'text-gray-400'}>
                      {metric.high}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={metric.medium > 0 ? 'text-[#2e7de9] font-bold' : 'text-gray-400'}>
                      {metric.medium}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={metric.low > 0 ? 'text-[#33b579] font-bold' : 'text-gray-400'}>
                      {metric.low}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-bold">{metric.total}</TableCell>
                  <TableCell className="text-center">{metric.uniqueHosts}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        metric.riskScore >= 80 ? 'critical' :
                        metric.riskScore >= 60 ? 'high' :
                        metric.riskScore >= 40 ? 'medium' : 'low'
                      }
                    >
                      {metric.riskScore}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
