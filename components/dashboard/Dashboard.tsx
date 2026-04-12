"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"
import DashboardView from "./DashboardView"
import LeadsView from "./LeadsView"
import PipelineView from "./PipelineView"
import AnalyticsView from "./AnalyticsView"
import SettingsView from "./SettingsView"
import type { DashboardConfig as AdminConfig } from "@/components/admin/AdminConfigPanel"

// Dynamically import particle background to avoid SSR issues
const ParticleBackground = dynamic(() => import("./ParticleBackground"), { ssr: false })

// ─────────────────────────────────────────────────────────────────
// DASHBOARD CONFIG — reskin this for any client
// ─────────────────────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  clientName: "My Business",
  clientLogo: null as string | null,
  accentColor: "#3b82f6",
  currency: "USD",
  services: ["Consultation", "Installation", "Maintenance", "Emergency"],
  cities: ["New York", "Los Angeles", "Chicago"],
  ownerEmail: "owner@demo.com",
  partnerEmail: "partner@demo.com",
  commissionPerLead: 50,
}
// ─────────────────────────────────────────────────────────────────

type Section = "dashboard" | "leads" | "pipeline" | "analytics" | "settings"

interface DashboardProps {
  role?: "owner" | "partner"
  userEmail?: string
  onLogout?: () => void
  previewConfig?: AdminConfig
}

export default function Dashboard({ role = "owner", userEmail, onLogout, previewConfig }: DashboardProps) {
  const [activeSection, setActiveSection] = useState<Section>("dashboard")

  // Use previewConfig (from admin panel) if provided, otherwise use default
  const config = previewConfig ?? DEFAULT_CONFIG

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":  return <DashboardView config={config} />
      case "leads":      return <LeadsView config={config} />
      case "pipeline":   return <PipelineView config={config} />
      case "analytics":  return <AnalyticsView config={config} />
      case "settings":   return <SettingsView config={config} />
      default:           return <DashboardView config={config} />
    }
  }

  return (
    <div className="relative flex h-screen w-screen overflow-hidden" style={{ background: "#08080a" }}>
      {/* Layer 0: animated grid */}
      <div
        className="grid-bg absolute inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      />

      {/* Layer 1: particles */}
      <ParticleBackground />

      {/* Layer 2: app chrome */}
      <div className="relative z-10 flex h-full w-full">
        <Sidebar
          activeSection={activeSection}
          onNavigate={(s) => setActiveSection(s as Section)}
          clientName={config.clientName}
          accentColor={config.accentColor}
          role={role}
          userEmail={userEmail}
          onLogout={onLogout}
        />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Topbar
            activeSection={activeSection}
            clientName={config.clientName}
            accentColor={config.accentColor}
            role={role}
            userEmail={userEmail}
          />

          <main className="flex-1 overflow-y-auto p-5 md:p-6">
            {renderSection()}
          </main>
        </div>
      </div>
    </div>
  )
}
