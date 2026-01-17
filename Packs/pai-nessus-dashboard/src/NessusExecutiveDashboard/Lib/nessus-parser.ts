// Nessus CSV Parser
// Handles standard Nessus Professional/Expert CSV export format

export interface NessusVulnerability {
  pluginId: string
  cve: string
  cvss: number
  risk: 'Critical' | 'High' | 'Medium' | 'Low' | 'None'
  host: string
  protocol: string
  port: string
  name: string
  synopsis: string
  description: string
  solution: string
  seeAlso: string
  pluginOutput: string
}

export interface NessusSummary {
  totalVulnerabilities: number
  uniqueVulnerabilities: number
  uniqueHosts: number
  critical: number
  high: number
  medium: number
  low: number
  none: number
  topVulnerabilities: { name: string; count: number; risk: string; cvss: number }[]
  topAffectedHosts: { host: string; critical: number; high: number; medium: number; low: number; total: number }[]
  riskDistribution: { name: string; value: number; color: string }[]
  cvssDistribution: { range: string; count: number }[]
}

// Parse CSV while handling quoted fields with commas
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

// Map risk string to severity level
function normalizeRisk(risk: string): NessusVulnerability['risk'] {
  const r = risk.toLowerCase().trim()
  if (r === 'critical') return 'Critical'
  if (r === 'high') return 'High'
  if (r === 'medium') return 'Medium'
  if (r === 'low') return 'Low'
  return 'None'
}

// Parse CVSS score
function parseCVSS(cvss: string): number {
  const parsed = parseFloat(cvss)
  return isNaN(parsed) ? 0 : parsed
}

export function parseNessusCSV(csvContent: string): NessusVulnerability[] {
  const lines = csvContent.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  const headerLine = lines[0]
  const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''))

  // Map common Nessus column names to our fields
  const columnMap: Record<string, number> = {}
  headers.forEach((header, index) => {
    if (header.includes('pluginid') || header === 'plugin') columnMap.pluginId = index
    if (header === 'cve') columnMap.cve = index
    if (header.includes('cvss') || header === 'cvssv2base' || header === 'cvssv3base') columnMap.cvss = index
    if (header === 'risk' || header === 'severity') columnMap.risk = index
    if (header === 'host' || header === 'ip' || header === 'ipaddress') columnMap.host = index
    if (header === 'protocol') columnMap.protocol = index
    if (header === 'port') columnMap.port = index
    if (header === 'name' || header === 'pluginname') columnMap.name = index
    if (header === 'synopsis') columnMap.synopsis = index
    if (header === 'description') columnMap.description = index
    if (header === 'solution') columnMap.solution = index
    if (header === 'seealso' || header === 'references') columnMap.seeAlso = index
    if (header === 'pluginoutput' || header === 'output') columnMap.pluginOutput = index
  })

  const vulnerabilities: NessusVulnerability[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length < 3) continue

    const vuln: NessusVulnerability = {
      pluginId: values[columnMap.pluginId] || '',
      cve: values[columnMap.cve] || '',
      cvss: parseCVSS(values[columnMap.cvss] || '0'),
      risk: normalizeRisk(values[columnMap.risk] || 'None'),
      host: values[columnMap.host] || '',
      protocol: values[columnMap.protocol] || '',
      port: values[columnMap.port] || '',
      name: values[columnMap.name] || '',
      synopsis: values[columnMap.synopsis] || '',
      description: values[columnMap.description] || '',
      solution: values[columnMap.solution] || '',
      seeAlso: values[columnMap.seeAlso] || '',
      pluginOutput: values[columnMap.pluginOutput] || '',
    }

    vulnerabilities.push(vuln)
  }

  return vulnerabilities
}

export function generateNessusSummary(vulnerabilities: NessusVulnerability[]): NessusSummary {
  // Count by severity
  const critical = vulnerabilities.filter(v => v.risk === 'Critical').length
  const high = vulnerabilities.filter(v => v.risk === 'High').length
  const medium = vulnerabilities.filter(v => v.risk === 'Medium').length
  const low = vulnerabilities.filter(v => v.risk === 'Low').length
  const none = vulnerabilities.filter(v => v.risk === 'None').length

  // Unique counts
  const uniqueHosts = new Set(vulnerabilities.map(v => v.host)).size
  const uniquePlugins = new Set(vulnerabilities.map(v => v.pluginId))

  // Top vulnerabilities by occurrence
  const vulnCounts = new Map<string, { count: number; risk: string; cvss: number; name: string }>()
  vulnerabilities.forEach(v => {
    if (v.risk === 'None') return
    const key = v.pluginId
    const existing = vulnCounts.get(key)
    if (existing) {
      existing.count++
    } else {
      vulnCounts.set(key, { count: 1, risk: v.risk, cvss: v.cvss, name: v.name })
    }
  })

  const topVulnerabilities = Array.from(vulnCounts.entries())
    .map(([id, data]) => ({ name: data.name, count: data.count, risk: data.risk, cvss: data.cvss }))
    .sort((a, b) => {
      // Sort by severity first, then by count
      const severityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3, None: 4 }
      const aSev = severityOrder[a.risk as keyof typeof severityOrder] ?? 4
      const bSev = severityOrder[b.risk as keyof typeof severityOrder] ?? 4
      if (aSev !== bSev) return aSev - bSev
      return b.count - a.count
    })
    .slice(0, 10)

  // Top affected hosts
  const hostStats = new Map<string, { critical: number; high: number; medium: number; low: number }>()
  vulnerabilities.forEach(v => {
    if (v.risk === 'None') return
    const host = v.host
    if (!hostStats.has(host)) {
      hostStats.set(host, { critical: 0, high: 0, medium: 0, low: 0 })
    }
    const stats = hostStats.get(host)!
    if (v.risk === 'Critical') stats.critical++
    else if (v.risk === 'High') stats.high++
    else if (v.risk === 'Medium') stats.medium++
    else if (v.risk === 'Low') stats.low++
  })

  const topAffectedHosts = Array.from(hostStats.entries())
    .map(([host, stats]) => ({
      host,
      ...stats,
      total: stats.critical + stats.high + stats.medium + stats.low,
    }))
    .sort((a, b) => {
      // Weight by severity
      const aScore = a.critical * 4 + a.high * 3 + a.medium * 2 + a.low
      const bScore = b.critical * 4 + b.high * 3 + b.medium * 2 + b.low
      return bScore - aScore
    })
    .slice(0, 10)

  // Risk distribution for charts
  const riskDistribution = [
    { name: 'Critical', value: critical, color: '#f52a65' },
    { name: 'High', value: high, color: '#f0a020' },
    { name: 'Medium', value: medium, color: '#2e7de9' },
    { name: 'Low', value: low, color: '#33b579' },
  ].filter(item => item.value > 0)

  // CVSS distribution
  const cvssRanges = [
    { range: '9.0-10.0', min: 9.0, max: 10.0, count: 0 },
    { range: '7.0-8.9', min: 7.0, max: 8.9, count: 0 },
    { range: '4.0-6.9', min: 4.0, max: 6.9, count: 0 },
    { range: '0.1-3.9', min: 0.1, max: 3.9, count: 0 },
  ]

  vulnerabilities.forEach(v => {
    for (const range of cvssRanges) {
      if (v.cvss >= range.min && v.cvss <= range.max) {
        range.count++
        break
      }
    }
  })

  const cvssDistribution = cvssRanges
    .filter(r => r.count > 0)
    .map(r => ({ range: r.range, count: r.count }))

  return {
    totalVulnerabilities: vulnerabilities.length,
    uniqueVulnerabilities: uniquePlugins.size,
    uniqueHosts,
    critical,
    high,
    medium,
    low,
    none,
    topVulnerabilities,
    topAffectedHosts,
    riskDistribution,
    cvssDistribution,
  }
}

// Generate sample data for demo purposes
export function generateSampleNessusData(): NessusVulnerability[] {
  const sampleVulns: NessusVulnerability[] = [
    { pluginId: '10001', cve: 'CVE-2024-1234', cvss: 9.8, risk: 'Critical', host: '192.168.1.10', protocol: 'tcp', port: '445', name: 'Remote Code Execution in SMB', synopsis: 'A critical RCE vulnerability exists', description: 'The remote Windows host is affected by a critical vulnerability', solution: 'Apply the latest security updates', seeAlso: 'https://cve.mitre.org', pluginOutput: 'Vulnerable version detected' },
    { pluginId: '10002', cve: 'CVE-2024-5678', cvss: 9.1, risk: 'Critical', host: '192.168.1.15', protocol: 'tcp', port: '22', name: 'SSH Authentication Bypass', synopsis: 'SSH server has authentication bypass', description: 'The SSH server can be accessed without proper authentication', solution: 'Upgrade SSH server to latest version', seeAlso: 'https://cve.mitre.org', pluginOutput: 'Authentication bypass confirmed' },
    { pluginId: '10003', cve: 'CVE-2024-9012', cvss: 8.5, risk: 'High', host: '192.168.1.10', protocol: 'tcp', port: '80', name: 'SQL Injection in Web Application', synopsis: 'Web application vulnerable to SQL injection', description: 'Input parameters are not properly sanitized', solution: 'Apply input validation and parameterized queries', seeAlso: 'https://owasp.org', pluginOutput: 'SQL error returned' },
    { pluginId: '10004', cve: 'CVE-2024-3456', cvss: 7.5, risk: 'High', host: '192.168.1.20', protocol: 'tcp', port: '443', name: 'TLS Certificate Expired', synopsis: 'SSL/TLS certificate has expired', description: 'The certificate is no longer valid', solution: 'Renew the SSL/TLS certificate', seeAlso: '', pluginOutput: 'Certificate expired on 2024-01-01' },
    { pluginId: '10005', cve: '', cvss: 6.5, risk: 'Medium', host: '192.168.1.10', protocol: 'tcp', port: '21', name: 'FTP Anonymous Access Enabled', synopsis: 'FTP server allows anonymous login', description: 'The FTP server permits anonymous access', solution: 'Disable anonymous FTP access', seeAlso: '', pluginOutput: 'Anonymous login successful' },
    { pluginId: '10006', cve: 'CVE-2023-4567', cvss: 5.3, risk: 'Medium', host: '192.168.1.25', protocol: 'tcp', port: '3306', name: 'MySQL Version Disclosure', synopsis: 'MySQL version is disclosed', description: 'The MySQL server reveals its version', solution: 'Configure MySQL to hide version info', seeAlso: '', pluginOutput: 'MySQL 8.0.28' },
    { pluginId: '10007', cve: '', cvss: 4.0, risk: 'Medium', host: '192.168.1.15', protocol: 'tcp', port: '80', name: 'Missing HTTP Security Headers', synopsis: 'HTTP security headers are not set', description: 'The web server does not send security headers', solution: 'Configure X-Frame-Options, CSP, and HSTS headers', seeAlso: '', pluginOutput: 'Missing headers detected' },
    { pluginId: '10008', cve: '', cvss: 3.1, risk: 'Low', host: '192.168.1.30', protocol: 'udp', port: '161', name: 'SNMP Default Community String', synopsis: 'SNMP uses default community string', description: 'The SNMP service uses public as community string', solution: 'Change the SNMP community string', seeAlso: '', pluginOutput: 'public community string accepted' },
    { pluginId: '10009', cve: '', cvss: 2.5, risk: 'Low', host: '192.168.1.20', protocol: 'tcp', port: '22', name: 'SSH Weak MAC Algorithms', synopsis: 'SSH supports weak MAC algorithms', description: 'The SSH server supports weak MAC algorithms', solution: 'Disable weak MAC algorithms in SSH config', seeAlso: '', pluginOutput: 'hmac-md5 supported' },
    { pluginId: '10010', cve: '', cvss: 0, risk: 'None', host: '192.168.1.10', protocol: 'tcp', port: '443', name: 'SSL Certificate Information', synopsis: 'SSL certificate details', description: 'Informational finding about SSL certificate', solution: 'No action required', seeAlso: '', pluginOutput: 'Certificate valid until 2025-12-31' },
    { pluginId: '10001', cve: 'CVE-2024-1234', cvss: 9.8, risk: 'Critical', host: '192.168.1.20', protocol: 'tcp', port: '445', name: 'Remote Code Execution in SMB', synopsis: 'A critical RCE vulnerability exists', description: 'The remote Windows host is affected by a critical vulnerability', solution: 'Apply the latest security updates', seeAlso: 'https://cve.mitre.org', pluginOutput: 'Vulnerable version detected' },
    { pluginId: '10003', cve: 'CVE-2024-9012', cvss: 8.5, risk: 'High', host: '192.168.1.25', protocol: 'tcp', port: '8080', name: 'SQL Injection in Web Application', synopsis: 'Web application vulnerable to SQL injection', description: 'Input parameters are not properly sanitized', solution: 'Apply input validation and parameterized queries', seeAlso: 'https://owasp.org', pluginOutput: 'SQL error returned' },
  ]

  return sampleVulns
}
