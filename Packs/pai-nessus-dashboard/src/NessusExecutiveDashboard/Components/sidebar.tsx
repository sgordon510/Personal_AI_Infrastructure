"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Shield, Server, Upload, FileText, AlertTriangle, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Executive Summary", href: "/", icon: Home },
  { name: "Trends & Progress", href: "/trends", icon: TrendingUp },
  { name: "Vulnerabilities", href: "/vulnerabilities", icon: AlertTriangle },
  { name: "Affected Hosts", href: "/hosts", icon: Server },
  { name: "Upload Scan", href: "/upload", icon: Upload },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col fixed left-0 top-0 bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700">
      <div className="flex h-16 items-center px-6 border-b border-gray-700">
        <Shield className="h-8 w-8 text-[#2e7de9] mr-3" />
        <div>
          <h1 className="text-lg font-bold text-white">Nessus</h1>
          <p className="text-xs text-gray-400">Executive Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all",
                isActive
                  ? "bg-[#2e7de9] text-white shadow-lg shadow-[#2e7de9]/30"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                  isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-700 p-4">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-gray-400 mr-3" />
          <div className="text-xs text-gray-400">
            <div>Nessus CSV Parser</div>
            <div className="font-semibold text-[#2e7de9]">v1.0</div>
          </div>
        </div>
      </div>
    </div>
  )
}
