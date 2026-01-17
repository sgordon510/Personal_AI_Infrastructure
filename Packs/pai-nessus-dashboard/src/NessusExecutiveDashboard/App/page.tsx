"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, Shield, Server, Activity, TrendingUp, FileWarning } from "lucide-react"
import { NessusSummary, NessusVulnerability, generateNessusSummary, generateSampleNessusData } from "@/lib/nessus-parser"

export default function ExecutiveSummary() {
  const [summary, setSummary] = useState<NessusSummary | null>(null)
  const [vulnerabilities, setVulnerabilities] = useState<NessusVulnerability[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try to load data from localStorage or use sample data
    const storedData = localStorage.getItem('nessusData')
    if (storedData) {
      const vulns = JSON.parse(storedData) as NessusVulnerability[]
      setVulnerabilities(vulns)
      setSummary(generateNessusSummary(vulns))
    } else {
      // Use sample data for demo
      const sampleData = generateSampleNessusData()
      setVulnerabilities(sampleData)
      setSummary(generateNessusSummary(sampleData))
    }
    setLoading(false)

    // Listen for data updates
    const handleDataUpdate = () => {
      const data = localStorage.getItem('nessusData')
      if (data) {
        const vulns = JSON.parse(data) as NessusVulnerability[]
        setVulnerabilities(vulns)
        setSummary(generateNessusSummary(vulns))
      }
    }

    window.addEventListener('nessusDataUpdated', handleDataUpdate)
    return () => window.removeEventListener('nessusDataUpdated', handleDataUpdate)
  }, [])

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Activity className="h-12 w-12 text-[#2e7de9] animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const riskScore = Math.round(
    ((summary.critical * 10 + summary.high * 7 + summary.medium * 4 + summary.low * 1) /
      Math.max(summary.totalVulnerabilities, 1)) * 10
  )

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { label: 'Critical', color: 'text-[#f52a65]', bg: 'bg-[#f52a65]' }
    if (score >= 60) return { label: 'High', color: 'text-[#f0a020]', bg: 'bg-[#f0a020]' }
    if (score >= 40) return { label: 'Medium', color: 'text-[#2e7de9]', bg: 'bg-[#2e7de9]' }
    return { label: 'Low', color: 'text-[#33b579]', bg: 'bg-[#33b579]' }
  }

  const riskLevel = getRiskLevel(riskScore)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Executive Summary</h1>
        <p className="text-lg text-gray-600">
          Vulnerability assessment overview and risk posture analysis
        </p>
      </div>

      {/* Hero Risk Score */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 text-white shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="text-center">
              <p className="text-sm text-gray-400 uppercase tracking-wide mb-2">Overall Risk Score</p>
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    className="text-gray-700"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={440}
                    strokeDashoffset={440 - (440 * riskScore) / 100}
                    className={riskLevel.color.replace('text-', 'text-')}
                    style={{ color: riskLevel.color.includes('f52a65') ? '#f52a65' : riskLevel.color.includes('f0a020') ? '#f0a020' : riskLevel.color.includes('2e7de9') ? '#2e7de9' : '#33b579' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-5xl font-bold ${riskLevel.color}`}>{riskScore}</span>
                  <span className="text-sm text-gray-400">/ 100</span>
                </div>
              </div>
              <Badge className={`mt-4 ${riskLevel.bg} text-white px-4 py-1`}>
                {riskLevel.label} Risk
              </Badge>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
              <AlertTriangle className="h-6 w-6 text-[#f52a65] mx-auto mb-2" />
              <p className="text-3xl font-bold text-[#f52a65]">{summary.critical}</p>
              <p className="text-xs text-gray-400 uppercase">Critical</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
              <FileWarning className="h-6 w-6 text-[#f0a020] mx-auto mb-2" />
              <p className="text-3xl font-bold text-[#f0a020]">{summary.high}</p>
              <p className="text-xs text-gray-400 uppercase">High</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
              <Shield className="h-6 w-6 text-[#2e7de9] mx-auto mb-2" />
              <p className="text-3xl font-bold text-[#2e7de9]">{summary.medium}</p>
              <p className="text-xs text-gray-400 uppercase">Medium</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
              <TrendingUp className="h-6 w-6 text-[#33b579] mx-auto mb-2" />
              <p className="text-3xl font-bold text-[#33b579]">{summary.low}</p>
              <p className="text-xs text-gray-400 uppercase">Low</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-l-4 border-l-[#2e7de9]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-gray-900">{summary.totalVulnerabilities}</p>
            <p className="text-xs text-gray-500 mt-1">vulnerability instances</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#9854f1]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Unique Vulnerabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-gray-900">{summary.uniqueVulnerabilities}</p>
            <p className="text-xs text-gray-500 mt-1">distinct issues</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#118c74]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Affected Hosts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-gray-900">{summary.uniqueHosts}</p>
            <p className="text-xs text-gray-500 mt-1">unique systems</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#f52a65]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Critical + High</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-[#f52a65]">{summary.critical + summary.high}</p>
            <p className="text-xs text-gray-500 mt-1">require immediate attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Severity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
            <CardDescription>Breakdown of vulnerabilities by risk level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Critical', count: summary.critical, color: 'bg-[#f52a65]', textColor: 'text-[#f52a65]' },
                { label: 'High', count: summary.high, color: 'bg-[#f0a020]', textColor: 'text-[#f0a020]' },
                { label: 'Medium', count: summary.medium, color: 'bg-[#2e7de9]', textColor: 'text-[#2e7de9]' },
                { label: 'Low', count: summary.low, color: 'bg-[#33b579]', textColor: 'text-[#33b579]' },
              ].map((item) => {
                const percentage = Math.round((item.count / Math.max(summary.totalVulnerabilities - summary.none, 1)) * 100)
                return (
                  <div key={item.label} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.label}</span>
                      <span className={`font-bold ${item.textColor}`}>{item.count} ({percentage}%)</span>
                    </div>
                    <Progress value={percentage} indicatorClassName={item.color} className="h-2" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CVSS Score Distribution</CardTitle>
            <CardDescription>Vulnerabilities grouped by CVSS severity ranges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.cvssDistribution.length > 0 ? (
                summary.cvssDistribution.map((item) => {
                  const percentage = Math.round((item.count / summary.totalVulnerabilities) * 100)
                  const getColor = (range: string) => {
                    if (range.startsWith('9')) return 'bg-[#f52a65]'
                    if (range.startsWith('7')) return 'bg-[#f0a020]'
                    if (range.startsWith('4')) return 'bg-[#2e7de9]'
                    return 'bg-[#33b579]'
                  }
                  return (
                    <div key={item.range} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">CVSS {item.range}</span>
                        <span className="font-bold">{item.count}</span>
                      </div>
                      <Progress value={percentage} indicatorClassName={getColor(item.range)} className="h-2" />
                    </div>
                  )
                })
              ) : (
                <p className="text-gray-500 text-center py-8">No CVSS data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Vulnerabilities & Affected Hosts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-[#f52a65] mr-2" />
              Top Vulnerabilities
            </CardTitle>
            <CardDescription>Most critical and prevalent issues</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vulnerability</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.topVulnerabilities.slice(0, 5).map((vuln, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium max-w-[200px] truncate" title={vuln.name}>
                      {vuln.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={vuln.risk.toLowerCase() as 'critical' | 'high' | 'medium' | 'low'}>
                        {vuln.risk}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{vuln.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="h-5 w-5 text-[#f0a020] mr-2" />
              Most Affected Hosts
            </CardTitle>
            <CardDescription>Systems with the highest vulnerability counts</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Host</TableHead>
                  <TableHead className="text-center">C</TableHead>
                  <TableHead className="text-center">H</TableHead>
                  <TableHead className="text-center">M</TableHead>
                  <TableHead className="text-center">L</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.topAffectedHosts.slice(0, 5).map((host, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">{host.host}</TableCell>
                    <TableCell className="text-center">
                      <span className={host.critical > 0 ? 'text-[#f52a65] font-bold' : 'text-gray-400'}>
                        {host.critical}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={host.high > 0 ? 'text-[#f0a020] font-bold' : 'text-gray-400'}>
                        {host.high}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={host.medium > 0 ? 'text-[#2e7de9] font-bold' : 'text-gray-400'}>
                        {host.medium}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={host.low > 0 ? 'text-[#33b579] font-bold' : 'text-gray-400'}>
                        {host.low}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold">{host.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Footer Note */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Data loaded from {vulnerabilities.length > 0 ? 'uploaded scan results' : 'sample data'}. Upload a Nessus CSV file for your actual scan data.</p>
      </div>
    </div>
  )
}
