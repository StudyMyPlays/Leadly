"use client"

import { useCallback, useEffect, useState } from "react"
import dynamic from "next/dynamic"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"
import LeadsView from "./LeadsView"
import PipelineView from "./PipelineView"
import AnalyticsView from "./AnalyticsView"
import type { DashboardConfig as AdminConfig } from "@/components/admin/AdminConfigPanel"
import {
  type AppNotification,
  type NotificationType,
  createNotification,
  loadNotifications,
  saveNotifications,
  NOTIFICATIONS_MAX,
} from "@/lib/notifications"

const ParticleBackground = dynamic(() => import("./ParticleBackground"), { ssr: false })

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

type Section = "dashboard" | "pipeline" | "analytics"
const VALID_SECTIONS: Section[] = ["dashboard", "pipeline", "analytics"]

function normalizeSection(value: string | undefined): Section {
  return VALID_SECTIONS.includes(value as Section) ? (value as Section) : "dashboard"
}

interface DashboardProps {
  role?: "owner" | "partner"
  userEmail?: string
  onLogout?: () => void
  previewConfig?: AdminConfig
  initialSection?: string
}

export default function Dashboard({
  role = "owner",
  userEmail,
  onLogout,
  previewConfig,
  initialSection,
}: DashboardProps) {
  const [activeSection, setActiveSection] = useState<Section>(() =>
    normalizeSection(initialSection),
  )
  const [sidebarExpanded, setSidebarExpanded] = useState(true)

  // ── Notifications (live state, backed by localStorage) ────────────────
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  // Load persisted notifications on mount.
  useEffect(() => {
    setNotifications(loadNotifications())
  }, [])

  const addNotification = useCallback((type: NotificationType, message: string) => {
    setNotifications((prev) => {
      const next = [createNotification(type, message), ...prev].slice(0, NOTIFICATIONS_MAX)
      saveNotifications(next)
      return next
    })
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => {
      if (prev.every((n) => n.read)) return prev
      const next = prev.map((n) => ({ ...n, read: true }))
      saveNotifications(next)
      return next
    })
  }, [])

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id)
      saveNotifications(next)
      return next
    })
  }, [])

  const config = previewConfig ?? DEFAULT_CONFIG

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":  return <LeadsView config={config} addNotification={addNotification} />
      case "pipeline":   return <PipelineView config={config} />
      case "analytics":  return <AnalyticsView config={config} />
      default:           return <LeadsView config={config} addNotification={addNotification} />
    }
  }

  return (
    <div className="relative flex h-screen w-screen overflow-hidden" style={{ background: "#08080a" }}>
      <div
        className="grid-bg absolute inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      />

      <ParticleBackground />

      <div className="relative z-10 flex h-full w-full">
        <Sidebar
          activeSection={activeSection}
          onNavigate={(s) => setActiveSection(s as Section)}
          clientName={config.clientName}
          role={role}
          userEmail={userEmail}
          onLogout={onLogout}
          expanded={sidebarExpanded}
        />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Topbar
            activeSection={activeSection}
            clientName={config.clientName}
            accentColor={config.accentColor}
            role={role}
            userEmail={userEmail}
            sidebarExpanded={sidebarExpanded}
            onToggleSidebar={() => setSidebarExpanded((v) => !v)}
            notifications={notifications}
            onMarkAllRead={markAllNotificationsRead}
            onDismiss={dismissNotification}
          />

          <main className="flex-1 overflow-y-auto p-5 md:p-6">
            {renderSection()}
          </main>
        </div>
      </div>
    </div>
  )
}
