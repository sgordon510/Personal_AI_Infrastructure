"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Server, Search, ChevronDown, ChevronUp, AlertTriangle, Shield, Activity } from "lucide-react"
import { NessusVulnerability, generateSampleNessusData } from "@/lib/nessus-parser"

interface HostSummary {
  host: string
  critical: number
  high: number
  medium: number
  low: number
  none: number
  total: number
  riskScore: number
  openPorts: Set<string>
  vulnerabilities: NessusVulnerability[]
}

type SortField = 'host' | 'riskScore' | 'critical' | 'high' | 'total'
type SortDirection = 'asc' | 'desc'

export default function HostsPage() {
  const [vulnerabilities, setVulnerabilities] = useState<NessusVulnerability[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('riskScore')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [selectedHost, setSelectedHost] = useState<HostSummary | null>(null)

  useEffect(() => {
    const storedData = localStorage.getItem('nessusData')
    if (storedData) {
      setVulnerabilities(JSON.parse(storedData))
    } else {
      setVulnerabilities(generateSampleNessusData())
    }
    setLoading(false)

    const handleDataUpdate = () => {
      const data = localStorage.getItem('nessusData')
      if (data) {
        setVulnerabilities(JSON.parse(data))
      }
    }

    window.addEventListener('nessusDataUpdated', handleDataUpdate)
    return () => window.removeEventListener('nessusDataUpdated', handleDataUpdate)
  }, [])

  const hostSummaries = useMemo(() => {
    const hostMap = new Map<string, HostSummary>()

    vulnerabilities.forEach(vuln => {
      if (!hostMap.has(vuln.host)) {
        hostMap.set(vuln.host, {
          host: vuln.host,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          none: 0,
          total: 0,
          riskScore: 0,
          openPorts: new Set(),
          vulnerabilities: []
        })
      }

      const summary = hostMap.get(vuln.host)!
      summary.vulnerabilities.push(vuln)
      summary.total++

      if (vuln.port) {
        summary.openPorts.add(`${vuln.port}/${vuln.protocol}`)
      }

      switch (vuln.risk) {
        case 'Critical': summary.critical++; break
        case 'High': summary.high++; break
        case 'Medium': summary.medium++; break
        case 'Low': summary.low++; break
        case 'None': summary.none++; break
      }
    })

    // Calculate risk scores
    hostMap.forEach(summary => {
      const activeVulns = summary.total - summary.none
      if (activeVulns > 0) {
        summary.riskScore = Math.round(
          ((summary.critical * 10 + summary.high * 7 + summary.medium * 4 + summary.low * 1) /
            activeVulns) * 10
        )
      }
    })

    return Array.from(hostMap.values())
  }, [vulnerabilities])

  const filteredAndSortedHosts = useMemo(() => {
    let result = [...hostSummaries]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(h => h.host.toLowerCase().includes(query))
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'host':
          comparison = a.host.localeCompare(b.host)
          break
        case 'riskScore':
          comparison = a.riskScore - b.riskScore
          break
        case 'critical':
          comparison = a.critical - b.critical
          break
        case 'high':
          comparison = a.high - b.high
          break
        case 'total':
          comparison = a.total - b.total
          break
      }
      return sortDirection === 'desc' ? -comparison : comparison
    })

    return result
  }, [hostSummaries, searchQuery, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc'
      ? <ChevronUp className="h-4 w-4 inline ml-1" />
      : <ChevronDown className="h-4 w-4 inline ml-1" />
  }

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { label: 'Critical', color: 'text-[#f52a65]', bg: 'bg-[#f52a65]' }
    if (score >= 60) return { label: 'High', color: 'text-[#f0a020]', bg: 'bg-[#f0a020]' }
    if (score >= 40) return { label: 'Medium', color: 'text-[#2e7de9]', bg: 'bg-[#2e7de9]' }
    if (score >= 1) return { label: 'Low', color: 'text-[#33b579]', bg: 'bg-[#33b579]' }
    return { label: 'Info', color: 'text-gray-500', bg: 'bg-gray-400' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Server className="h-12 w-12 text-[#2e7de9] animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading host data...</p>
        </div>
      </div>
    )
  }

  // Calculate summary stats
  const totalHosts = hostSummaries.length
  const criticalHosts = hostSummaries.filter(h => h.critical > 0).length
  const highHosts = hostSummaries.filter(h => h.high > 0).length
  const cleanHosts = hostSummaries.filter(h => h.critical === 0 && h.high === 0 && h.medium === 0 && h.low === 0).length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Affected Hosts</h1>
        <p className="text-lg text-gray-600">
          Analysis of vulnerability distribution across scanned systems
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-l-4 border-l-[#2e7de9]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Server className="h-4 w-4 mr-2" />
              Total Hosts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-gray-900">{totalHosts}</p>
            <p className="text-xs text-gray-500 mt-1">scanned systems</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#f52a65]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-[#f52a65]" />
              Critical Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-[#f52a65]">{criticalHosts}</p>
            <p className="text-xs text-gray-500 mt-1">hosts with critical vulns</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#f0a020]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Activity className="h-4 w-4 mr-2 text-[#f0a020]" />
              High Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-[#f0a020]">{highHosts}</p>
            <p className="text-xs text-gray-500 mt-1">hosts with high vulns</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#33b579]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Shield className="h-4 w-4 mr-2 text-[#33b579]" />
              Clean Hosts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-[#33b579]">{cleanHosts}</p>
            <p className="text-xs text-gray-500 mt-1">no vulnerabilities</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by host IP or hostname..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2e7de9] focus:border-transparent"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredAndSortedHosts.length} of {hostSummaries.length} hosts
        {searchQuery && ` matching "${searchQuery}"`}
      </div>

      {/* Hosts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('host')}
                >
                  Host <SortIcon field="host" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('riskScore')}
                >
                  Risk Score <SortIcon field="riskScore" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-100 text-center"
                  onClick={() => handleSort('critical')}
                >
                  Critical <SortIcon field="critical" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-100 text-center"
                  onClick={() => handleSort('high')}
                >
                  High <SortIcon field="high" />
                </TableHead>
                <TableHead className="text-center">Medium</TableHead>
                <TableHead className="text-center">Low</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-100 text-right"
                  onClick={() => handleSort('total')}
                >
                  Total <SortIcon field="total" />
                </TableHead>
                <TableHead>Open Ports</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedHosts.map((host) => {
                const riskLevel = getRiskLevel(host.riskScore)
                return (
                  <TableRow
                    key={host.host}
                    className="cursor-pointer hover:bg-blue-50"
                    onClick={() => setSelectedHost(host)}
                  >
                    <TableCell className="font-mono font-medium">{host.host}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16">
                          <Progress
                            value={host.riskScore}
                            indicatorClassName={riskLevel.bg}
                            className="h-2"
                          />
                        </div>
                        <span className={`font-bold ${riskLevel.color}`}>{host.riskScore}</span>
                      </div>
                    </TableCell>
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
                    <TableCell className="text-right font-bold">{host.total - host.none}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(host.openPorts).slice(0, 3).map(port => (
                          <Badge key={port} variant="secondary" className="text-xs">
                            {port}
                          </Badge>
                        ))}
                        {host.openPorts.size > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{host.openPorts.size - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Host Detail Modal */}
      {selectedHost && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedHost(null)}
        >
          <Card
            className="max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="border-b">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Server className="h-6 w-6 text-[#2e7de9]" />
                    <CardTitle className="text-2xl font-mono">{selectedHost.host}</CardTitle>
                  </div>
                  <CardDescription>
                    Risk Score: <span className={`font-bold ${getRiskLevel(selectedHost.riskScore).color}`}>
                      {selectedHost.riskScore}
                    </span> | {selectedHost.total - selectedHost.none} vulnerabilities | {selectedHost.openPorts.size} ports scanned
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedHost(null)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Severity Breakdown */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-3xl font-bold text-[#f52a65]">{selectedHost.critical}</p>
                  <p className="text-sm text-gray-600">Critical</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-3xl font-bold text-[#f0a020]">{selectedHost.high}</p>
                  <p className="text-sm text-gray-600">High</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-[#2e7de9]">{selectedHost.medium}</p>
                  <p className="text-sm text-gray-600">Medium</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-[#33b579]">{selectedHost.low}</p>
                  <p className="text-sm text-gray-600">Low</p>
                </div>
              </div>

              {/* Open Ports */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-500 mb-2">Open Ports</h4>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedHost.openPorts).map(port => (
                    <Badge key={port} variant="outline" className="font-mono">
                      {port}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Vulnerabilities List */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-2">Vulnerabilities</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Severity</TableHead>
                        <TableHead>Vulnerability</TableHead>
                        <TableHead>Port</TableHead>
                        <TableHead>CVSS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedHost.vulnerabilities
                        .filter(v => v.risk !== 'None')
                        .sort((a, b) => {
                          const order = { Critical: 0, High: 1, Medium: 2, Low: 3, None: 4 }
                          return order[a.risk] - order[b.risk]
                        })
                        .map((vuln, index) => (
                          <TableRow key={`${vuln.pluginId}-${index}`}>
                            <TableCell>
                              <Badge variant={vuln.risk.toLowerCase() as 'critical' | 'high' | 'medium' | 'low'}>
                                {vuln.risk}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{vuln.name}</div>
                              <div className="text-xs text-gray-500">{vuln.synopsis}</div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{vuln.port}/{vuln.protocol}</TableCell>
                            <TableCell className="font-mono font-bold">{vuln.cvss.toFixed(1)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
