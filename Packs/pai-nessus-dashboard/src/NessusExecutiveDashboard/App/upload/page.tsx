"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, CheckCircle, AlertCircle, Trash2, Download } from "lucide-react"
import { parseNessusCSV, generateNessusSummary, generateSampleNessusData, NessusVulnerability } from "@/lib/nessus-parser"

export default function UploadPage() {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [parsedData, setParsedData] = useState<NessusVulnerability[] | null>(null)
  const [fileName, setFileName] = useState('')

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setUploadStatus('error')
      setErrorMessage('Please upload a CSV file')
      return
    }

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

      setParsedData(vulnerabilities)
      setUploadStatus('success')

      // Store in localStorage
      localStorage.setItem('nessusData', JSON.stringify(vulnerabilities))
      localStorage.setItem('nessusFileName', file.name)
      localStorage.setItem('nessusUploadDate', new Date().toISOString())

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('nessusDataUpdated'))
    } catch (error) {
      setUploadStatus('error')
      setErrorMessage('Failed to parse CSV file. Please ensure it\'s a valid Nessus export.')
    }
  }, [])

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
    const sampleData = generateSampleNessusData()
    setParsedData(sampleData)
    setFileName('sample-data.csv')
    setUploadStatus('success')

    localStorage.setItem('nessusData', JSON.stringify(sampleData))
    localStorage.setItem('nessusFileName', 'sample-data.csv')
    localStorage.setItem('nessusUploadDate', new Date().toISOString())

    window.dispatchEvent(new CustomEvent('nessusDataUpdated'))
  }

  const clearData = () => {
    localStorage.removeItem('nessusData')
    localStorage.removeItem('nessusFileName')
    localStorage.removeItem('nessusUploadDate')
    setParsedData(null)
    setUploadStatus('idle')
    setFileName('')

    window.dispatchEvent(new CustomEvent('nessusDataUpdated'))
  }

  const summary = parsedData ? generateNessusSummary(parsedData) : null

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Upload Scan Results</h1>
        <p className="text-lg text-gray-600">
          Import your Nessus vulnerability scan CSV export
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Area */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Upload Nessus CSV</CardTitle>
              <CardDescription>
                Export your scan results from Nessus and upload the CSV file here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                  border-2 border-dashed rounded-xl p-12 text-center transition-all
                  ${isDragging ? 'border-[#2e7de9] bg-[#2e7de9]/5' : 'border-gray-300 hover:border-gray-400'}
                  ${uploadStatus === 'processing' ? 'opacity-50 pointer-events-none' : ''}
                `}
              >
                <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragging ? 'text-[#2e7de9]' : 'text-gray-400'}`} />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  {isDragging ? 'Drop your file here' : 'Drag and drop your CSV file'}
                </p>
                <p className="text-sm text-gray-500 mb-4">or</p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <Button variant="outline" asChild>
                    <span>Browse Files</span>
                  </Button>
                </label>
              </div>

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
                    <span className="text-[#33b579] font-medium">Successfully loaded {fileName}</span>
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
                  Load Sample Data
                </Button>
                {parsedData && (
                  <Button variant="destructive" onClick={clearData}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Data
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">How to Export from Nessus</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-3">
              <p>1. Open your scan results in Nessus</p>
              <p>2. Click "Export" in the top right</p>
              <p>3. Select "CSV" as the export format</p>
              <p>4. Choose "All" for both hosts and vulnerabilities</p>
              <p>5. Click "Export" and save the file</p>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-700 mb-2">Supported Columns:</p>
                <p className="text-xs text-gray-500">
                  Plugin ID, CVE, CVSS, Risk/Severity, Host/IP, Protocol, Port, Name, Synopsis, Description, Solution, See Also, Plugin Output
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div>
          {summary ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-[#2e7de9]" />
                  Scan Summary
                </CardTitle>
                <CardDescription>
                  Overview of the loaded vulnerability data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Severity Breakdown */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-[#f52a65]">{summary.critical}</p>
                    <p className="text-sm text-gray-600">Critical</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-[#f0a020]">{summary.high}</p>
                    <p className="text-sm text-gray-600">High</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-[#2e7de9]">{summary.medium}</p>
                    <p className="text-sm text-gray-600">Medium</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-[#33b579]">{summary.low}</p>
                    <p className="text-sm text-gray-600">Low</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Total Vulnerabilities</span>
                    <span className="font-bold">{summary.totalVulnerabilities}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Unique Plugins</span>
                    <span className="font-bold">{summary.uniqueVulnerabilities}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Affected Hosts</span>
                    <span className="font-bold">{summary.uniqueHosts}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Informational</span>
                    <span className="font-bold text-gray-400">{summary.none}</span>
                  </div>
                </div>

                {/* Top Vulnerabilities */}
                {summary.topVulnerabilities.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 mb-3">Top Critical Issues</h4>
                    <div className="space-y-2">
                      {summary.topVulnerabilities.slice(0, 5).map((vuln, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Badge variant={vuln.risk.toLowerCase() as 'critical' | 'high' | 'medium' | 'low'} className="shrink-0">
                              {vuln.risk}
                            </Badge>
                            <span className="text-sm truncate">{vuln.name}</span>
                          </div>
                          <Badge variant="secondary" className="ml-2 shrink-0">{vuln.count}x</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Navigate Button */}
                <div className="mt-6">
                  <Button className="w-full" onClick={() => router.push('/')}>
                    View Executive Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-16">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg text-gray-500 mb-2">No data loaded</p>
                <p className="text-sm text-gray-400">
                  Upload a Nessus CSV file or load sample data to preview
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
