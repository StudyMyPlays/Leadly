"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Dashboard from "@/components/dashboard/Dashboard"
import type { DashboardConfig } from "@/components/admin/AdminConfigPanel"

const FALLBACK: DashboardConfig = {
  clientName: "Preview Client",
  clientLogo: null,
  accentColor: "#3b82f6",
  currency: "USD",
  services: ["Tree Removal", "Stump Grinding"],
  cities: ["Denver", "Aurora"],
  ownerEmail: "owner@preview.com",
  partnerEmail: "partner@preview.com",
  commissionPerLead: 50,
}

export default function AdminPreviewPage() {
  const router = useRouter()
  const [config, setConfig] = useState<DashboardConfig | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem("previewConfig")
    setConfig(raw ? (JSON.parse(raw) as DashboardConfig) : FALLBACK)
  }, [])

  if (!config) return null

  return (
    <div className="relative">
      {/* "Exit Preview" banner */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-2"
        style={{
          background: "rgba(59,130,246,0.12)",
          borderBottom: "1px solid rgba(59,130,246,0.22)",
          backdropFilter: "blur(12px)",
        }}
      >
        <span className="text-xs font-mono" style={{ color: "#93c5fd" }}>
          Preview mode — config not saved
        </span>
        <button
          type="button"
          onClick={() => router.push("/admin/config")}
          className="text-xs font-mono px-3 py-1 rounded-lg"
          style={{
            background: "rgba(59,130,246,0.12)",
            border: "1px solid rgba(59,130,246,0.28)",
            color: "#60a5fa",
            cursor: "pointer",
          }}
        >
          Exit Preview
        </button>
      </div>
      {/* Offset for banner */}
      <div style={{ paddingTop: 36 }}>
        <Dashboard previewConfig={config} />
      </div>
    </div>
  )
}
