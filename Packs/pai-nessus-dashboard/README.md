# Nessus Executive Dashboard

A professional executive-level dashboard for visualizing and analyzing Nessus vulnerability scan results. Built with Next.js 15, React 19, and Tailwind CSS.

## Features

- **Executive Summary**: High-level risk score visualization with severity breakdown
- **Vulnerability List**: Searchable, filterable, and sortable vulnerability database
- **Host Analysis**: Per-host vulnerability distribution and risk assessment
- **CSV Import**: Drag-and-drop upload for Nessus CSV exports
- **Sample Data**: Built-in sample data for demonstration

## Screenshots

The dashboard includes:
- Overall risk score gauge (0-100)
- Severity distribution (Critical/High/Medium/Low)
- Top vulnerabilities by occurrence
- Most affected hosts breakdown
- CVSS score distribution
- Detailed vulnerability modal with full information

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm, yarn, or bun package manager

### Installation

```bash
cd Packs/pai-nessus-dashboard/src/NessusExecutiveDashboard

# Install dependencies
bun install
# or
npm install

# Start development server
bun dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Uploading Nessus Data

1. Export your scan from Nessus as CSV
2. Navigate to the "Upload Scan" page
3. Drag and drop your CSV file or click to browse
4. View the parsed results in the dashboard

### Nessus CSV Export Format

The parser supports standard Nessus CSV exports with columns:
- Plugin ID
- CVE
- CVSS (v2 or v3)
- Risk / Severity
- Host / IP Address
- Protocol
- Port
- Name / Plugin Name
- Synopsis
- Description
- Solution
- See Also / References
- Plugin Output

## Project Structure

```
NessusExecutiveDashboard/
├── App/
│   ├── api/
│   │   ├── data/route.ts      # Sample data API
│   │   └── upload/route.ts    # File upload API
│   ├── hosts/page.tsx         # Hosts analysis page
│   ├── upload/page.tsx        # File upload page
│   ├── vulnerabilities/page.tsx # Vulnerabilities list
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Executive summary (home)
├── Components/
│   ├── Ui/
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── progress.tsx
│   │   └── table.tsx
│   └── sidebar.tsx
├── Lib/
│   ├── nessus-parser.ts       # CSV parsing logic
│   └── utils.ts               # Utility functions
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Technology Stack

- **Framework**: Next.js 15.5
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4.1
- **Icons**: Lucide React
- **Charts**: Recharts (optional)
- **Components**: Custom shadcn/ui implementation

## Color Theme

Uses Tokyo Night Day color palette:
- Primary: `#2e7de9` (Blue)
- Secondary: `#9854f1` (Purple)
- Success: `#33b579` (Green)
- Warning: `#f0a020` (Orange)
- Danger: `#f52a65` (Red)

## License

Part of the Personal AI Infrastructure (PAI) project.
