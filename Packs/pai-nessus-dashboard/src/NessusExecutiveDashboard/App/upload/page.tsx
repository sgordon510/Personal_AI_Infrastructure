"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, FileText, CheckCircle, AlertCircle, Trash2, Download, Calendar, BarChart3 } from "lucide-react"
import { parseNessusCSV, generateNessusSummary, generateSampleNessusData, NessusVulnerability } from "@/lib/nessus-parser"
import { saveMonthlySnapshot, getHistoricalData, deleteMonthlySnapshot, clearHistoricalData, MonthlySnapshot, getMonthOptions } from "@/lib/trend-analysis"

export default function UploadPage() {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [parsedData, setParsedData] = useState<NessusVulnerability[] | null>(null)
  const [fileName, setFileName] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [historicalData, setHistoricalData] = useState<MonthlySnapshot[]>([])
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  // Generate month options for current and previous year
  const currentYear = new Date().getFullYear()
  const monthOptions = [
    ...getMonthOptions(currentYear),
    ...getMonthOptions(currentYear - 1)
  ]

  // Set default month to current month
  useEffect(() => {
    const now = new Date()
    const defaultMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
    setSelectedMonth(defaultMonth)
    setHistoricalData(getHistoricalData())

    const handleHistoryUpdate = () => setHistoricalData(getHistoricalData())
    window.addEventListener('nessusHistoryUpdated', handleHistoryUpdate)
    return () => window.removeEventListener('nessusHistoryUpdated', handleHistoryUpdate)
  }, [])

  const processFile = useCallback(async (file: File, month: string) => {
    setUploadStatus('processing')
    setFileName(file.name)

    try {
      const text = await file.text()
      const vulnerabilities = parseNessusCSV(text)

      if (vulnerabilities.length === 0) {
        setUploadStatus('error')
        setErrorMessage('No vulnerabilities found in the CSV file. Please check the file format.')
        return
      }

      // Save as monthly snapshot
      saveMonthlySnapshot(month, file.name, vulnerabilities)

      setParsedData(vulnerabilities)
      setUploadStatus('success')
      setPendingFile(null)
      setHistoricalData(getHistoricalData())
    } catch (error) {
      setUploadStatus('error')
      setErrorMessage('Failed to parse CSV file. Please ensure it\'s a valid Nessus export.')
    }
  }, [])

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setUploadStatus('error')
      setErrorMessage('Please upload a CSV file')
      return
    }

    // Store file and wait for month confirmation
    setPendingFile(file)
    setFileName(file.name)
    setUploadStatus('idle')
  }, [])

  const confirmUpload = () => {
    if (pendingFile && selectedMonth) {
      processFile(pendingFile, selectedMonth)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  const loadSampleData = () => {
    // Generate sample data for multiple months
    const months = [
      { month: `${currentYear}-01`, multiplier: 1.3 },
      { month: `${currentYear}-02`, multiplier: 1.2 },
      { month: `${currentYear}-03`, multiplier: 1.1 },
      { month: `${currentYear}-04`, multiplier: 1.0 },
    ]

    months.forEach(({ month, multiplier }) => {
      const baseData = generateSampleNessusData()
      // Adjust data to show trend (earlier months have more vulns)
      const adjustedData = baseData.slice(0, Math.floor(baseData.length * multiplier))
      saveMonthlySnapshot(month, `sample-${month}.csv`, adjustedData)
    })

    setHistoricalData(getHistoricalData())
    setUploadStatus('success')
    setParsedData(generateSampleNessusData())
    setFileName('sample-data.csv')
  }

  const handleDeleteMonth = (month: string) => {
    deleteMonthlySnapshot(month)
    setHistoricalData(getHistoricalData())
  }

  const handleClearAll = () => {
    clearHistoricalData()
    localStorage.removeItem('nessusData')
    localStorage.removeItem('nessusFileName')
    localStorage.removeItem('nessusUploadDate')
    setParsedData(null)
    setUploadStatus('idle')
    setFileName('')
    setPendingFile(null)
    setHistoricalData([])
    window.dispatchEvent(new CustomEvent('nessusDataUpdated'))
  }

  const summary = parsedData ? generateNessusSummary(parsedData) : null

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Upload Scan Results</h1>
        <p className="text-lg text-gray-600">
          Import monthly Nessus scans to track remediation progress over time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Area */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-[#2e7de9]" />
                Upload Monthly Scan
              </CardTitle>
              <CardDescription>
                Select the scan month and upload your Nessus CSV export
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Month Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scan Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2e7de9] focus:border-transparent"
                >
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {historicalData.some(s => s.month === selectedMonth) && (
                  <p className="mt-2 text-sm text-[#f0a020]">
                    Data already exists for this month. Uploading will replace it.
                  </p>
                )}
              </div>

              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center transition-all
                  ${isDragging ? 'border-[#2e7de9] bg-[#2e7de9]/5' : 'border-gray-300 hover:border-gray-400'}
                  ${uploadStatus === 'processing' ? 'opacity-50 pointer-events-none' : ''}
                `}
              >
                <Upload className={`h-10 w-10 mx-auto mb-3 ${isDragging ? 'text-[#2e7de9]' : 'text-gray-400'}`} />
                <p className="text-base font-medium text-gray-700 mb-2">
                  {isDragging ? 'Drop your file here' : 'Drag and drop your CSV file'}
                </p>
                <p className="text-sm text-gray-500 mb-3">or</p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <Button variant="outline" size="sm" asChild>
                    <span>Browse Files</span>
                  </Button>
                </label>
              </div>

              {/* Pending File Confirmation */}
              {pendingFile && uploadStatus === 'idle' && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-[#2e7de9] mr-2" />
                      <span className="font-medium">{pendingFile.name}</span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setPendingFile(null)}>
                      Cancel
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    This file will be saved as the scan for <strong>{monthOptions.find(m => m.value === selectedMonth)?.label}</strong>
                  </p>
                  <Button onClick={confirmUpload} className="w-full">
                    Confirm Upload
                  </Button>
                </div>
              )}

              {/* Status Messages */}
              {uploadStatus === 'processing' && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#2e7de9] border-t-transparent mr-3" />
                  <span className="text-[#2e7de9]">Processing {fileName}...</span>
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="mt-6 p-4 bg-red-50 rounded-lg flex items-center">
                  <AlertCircle className="h-5 w-5 text-[#f52a65] mr-3" />
                  <span className="text-[#f52a65]">{errorMessage}</span>
                </div>
              )}

              {uploadStatus === 'success' && summary && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center mb-3">
                    <CheckCircle className="h-5 w-5 text-[#33b579] mr-3" />
                    <span className="text-[#33b579] font-medium">Successfully saved {fileName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Findings:</span>
                      <span className="ml-2 font-bold">{summary.totalVulnerabilities}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Unique Hosts:</span>
                      <span className="ml-2 font-bold">{summary.uniqueHosts}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex gap-4">
                <Button variant="outline" onClick={loadSampleData}>
                  <Download className="h-4 w-4 mr-2" />
                  Load Sample History
                </Button>
                {historicalData.length > 0 && (
                  <Button variant="destructive" onClick={handleClearAll}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Tracking Monthly Progress</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-3">
              <p>1. Run your Nessus scan at the end of each month</p>
              <p>2. Export results as CSV from Nessus</p>
              <p>3. Select the corresponding month above</p>
              <p>4. Upload the CSV file</p>
              <p>5. View trends in the <strong>Trends</strong> page</p>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-[#2e7de9] mb-1">Pro Tip</p>
                <p className="text-xs text-gray-600">
                  For best results, run scans on the same schedule each month (e.g., last Friday)
                  and use consistent scan policies for accurate comparisons.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historical Data */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-[#9854f1]" />
                Uploaded Scans
              </CardTitle>
              <CardDescription>
                Monthly scan data available for trend analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historicalData.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-center">C</TableHead>
                        <TableHead className="text-center">H</TableHead>
                        <TableHead className="text-center">M</TableHead>
                        <TableHead className="text-center">L</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historicalData.map((snapshot) => (
                        <TableRow key={snapshot.id}>
                          <TableCell className="font-medium">{snapshot.label}</TableCell>
                          <TableCell className="text-center">
                            <span className={snapshot.summary.critical > 0 ? 'text-[#f52a65] font-bold' : 'text-gray-400'}>
                              {snapshot.summary.critical}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={snapshot.summary.high > 0 ? 'text-[#f0a020] font-bold' : 'text-gray-400'}>
                              {snapshot.summary.high}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={snapshot.summary.medium > 0 ? 'text-[#2e7de9] font-bold' : 'text-gray-400'}>
                              {snapshot.summary.medium}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={snapshot.summary.low > 0 ? 'text-[#33b579] font-bold' : 'text-gray-400'}>
                              {snapshot.summary.low}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {snapshot.summary.totalVulnerabilities - snapshot.summary.none}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMonth(snapshot.month)}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-[#f52a65]"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Summary Stats */}
                  {historicalData.length >= 2 && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Months of data:</span>
                        <Badge variant="secondary">{historicalData.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Date range:</span>
                        <span className="text-sm font-medium">
                          {historicalData[0].label} - {historicalData[historicalData.length - 1].label}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* View Trends Button */}
                  <div className="mt-6">
                    <Button className="w-full" onClick={() => router.push('/trends')}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Trends & Progress
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg text-gray-500 mb-2">No historical data</p>
                  <p className="text-sm text-gray-400">
                    Upload monthly scans to track your remediation progress
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
