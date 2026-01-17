"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, AlertTriangle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react"
import { NessusVulnerability, generateSampleNessusData } from "@/lib/nessus-parser"

type SortField = 'risk' | 'cvss' | 'name' | 'host' | 'port'
type SortDirection = 'asc' | 'desc'

export default function VulnerabilitiesPage() {
  const [vulnerabilities, setVulnerabilities] = useState<NessusVulnerability[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>('risk')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedVuln, setSelectedVuln] = useState<NessusVulnerability | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

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

  const severityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3, None: 4 }

  const filteredAndSortedVulns = useMemo(() => {
    let result = [...vulnerabilities]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(v =>
        v.name.toLowerCase().includes(query) ||
        v.host.toLowerCase().includes(query) ||
        v.cve.toLowerCase().includes(query) ||
        v.pluginId.includes(query) ||
        v.synopsis.toLowerCase().includes(query)
      )
    }

    // Apply severity filter
    if (severityFilter.length > 0) {
      result = result.filter(v => severityFilter.includes(v.risk))
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'risk':
          comparison = severityOrder[a.risk] - severityOrder[b.risk]
          break
        case 'cvss':
          comparison = b.cvss - a.cvss
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'host':
          comparison = a.host.localeCompare(b.host)
          break
        case 'port':
          comparison = parseInt(a.port || '0') - parseInt(b.port || '0')
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [vulnerabilities, searchQuery, severityFilter, sortField, sortDirection])

  const paginatedVulns = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedVulns.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedVulns, currentPage])

  const totalPages = Math.ceil(filteredAndSortedVulns.length / itemsPerPage)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleSeverityFilter = (severity: string) => {
    setSeverityFilter(prev =>
      prev.includes(severity)
        ? prev.filter(s => s !== severity)
        : [...prev, severity]
    )
    setCurrentPage(1)
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc'
      ? <ChevronUp className="h-4 w-4 inline ml-1" />
      : <ChevronDown className="h-4 w-4 inline ml-1" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-[#f0a020] animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading vulnerabilities...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Vulnerabilities</h1>
        <p className="text-lg text-gray-600">
          Complete list of detected vulnerabilities with filtering and search
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, host, CVE, or plugin ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2e7de9] focus:border-transparent"
              />
            </div>

            {/* Severity Filters */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              {['Critical', 'High', 'Medium', 'Low'].map((severity) => (
                <Button
                  key={severity}
                  variant={severityFilter.includes(severity) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleSeverityFilter(severity)}
                  className={severityFilter.includes(severity) ? '' : 'border-gray-300'}
                >
                  {severity}
                </Button>
              ))}
              {severityFilter.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSeverityFilter([])}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {paginatedVulns.length} of {filteredAndSortedVulns.length} vulnerabilities
        {searchQuery && ` matching "${searchQuery}"`}
        {severityFilter.length > 0 && ` (filtered by: ${severityFilter.join(', ')})`}
      </div>

      {/* Vulnerabilities Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('risk')}
                >
                  Severity <SortIcon field="risk" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('cvss')}
                >
                  CVSS <SortIcon field="cvss" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  Vulnerability <SortIcon field="name" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('host')}
                >
                  Host <SortIcon field="host" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('port')}
                >
                  Port <SortIcon field="port" />
                </TableHead>
                <TableHead>CVE</TableHead>
                <TableHead>Plugin ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedVulns.map((vuln, index) => (
                <TableRow
                  key={`${vuln.pluginId}-${vuln.host}-${index}`}
                  className="cursor-pointer hover:bg-blue-50"
                  onClick={() => setSelectedVuln(vuln)}
                >
                  <TableCell>
                    <Badge variant={vuln.risk.toLowerCase() as 'critical' | 'high' | 'medium' | 'low' | 'none'}>
                      {vuln.risk}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`font-mono font-bold ${
                      vuln.cvss >= 9 ? 'text-[#f52a65]' :
                      vuln.cvss >= 7 ? 'text-[#f0a020]' :
                      vuln.cvss >= 4 ? 'text-[#2e7de9]' :
                      'text-[#33b579]'
                    }`}>
                      {vuln.cvss.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <div className="truncate font-medium" title={vuln.name}>{vuln.name}</div>
                    <div className="text-xs text-gray-500 truncate" title={vuln.synopsis}>{vuln.synopsis}</div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{vuln.host}</TableCell>
                  <TableCell className="font-mono text-sm">{vuln.port}/{vuln.protocol}</TableCell>
                  <TableCell>
                    {vuln.cve && (
                      <a
                        href={`https://cve.mitre.org/cgi-bin/cvename.cgi?name=${vuln.cve}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2e7de9] hover:underline flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {vuln.cve}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-gray-500">{vuln.pluginId}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Vulnerability Detail Modal */}
      {selectedVuln && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedVuln(null)}
        >
          <Card
            className="max-w-3xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="border-b">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant={selectedVuln.risk.toLowerCase() as 'critical' | 'high' | 'medium' | 'low'} className="mb-2">
                    {selectedVuln.risk}
                  </Badge>
                  <CardTitle className="text-xl">{selectedVuln.name}</CardTitle>
                  <CardDescription className="mt-2">
                    Plugin ID: {selectedVuln.pluginId} | CVSS: {selectedVuln.cvss}
                    {selectedVuln.cve && ` | ${selectedVuln.cve}`}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedVuln(null)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-1">Affected Host</h4>
                  <p className="font-mono">{selectedVuln.host}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-1">Port/Protocol</h4>
                  <p className="font-mono">{selectedVuln.port}/{selectedVuln.protocol}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-1">Synopsis</h4>
                <p className="text-gray-700">{selectedVuln.synopsis}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-1">Description</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedVuln.description}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-1">Solution</h4>
                <p className="text-gray-700">{selectedVuln.solution}</p>
              </div>

              {selectedVuln.pluginOutput && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-1">Plugin Output</h4>
                  <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto font-mono">
                    {selectedVuln.pluginOutput}
                  </pre>
                </div>
              )}

              {selectedVuln.seeAlso && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-1">References</h4>
                  <p className="text-[#2e7de9] break-all">{selectedVuln.seeAlso}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
