"use client"

import { useState } from "react"
import {
  LayoutGrid,
  List,
  Filter,
  BarChart2,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  activeSection: string
  onNavigate: (section: string) => void
  clientName: string
  accentColor: string
  role?: "owner" | "partner"
  userEmail?: string
  onLogout?: () => void
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "leads",     label: "All Leads", icon: List },
  { id: "pipeline",  label: "Pipeline",  icon: Filter },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "settings",  label: "Settings",  icon: Settings },
]

export default function Sidebar({
  activeSection,
  onNavigate,
  clientName,
  role = "owner",
  userEmail,
  onLogout,
}: SidebarProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <aside
      className="relative flex flex-col h-full transition-all duration-300 ease-in-out"
      style={{
        width: expanded ? 220 : 64,
        background: "rgba(6, 6, 9, 0.97)",
        borderRight: "1px solid rgba(255, 255, 255, 0.06)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        flexShrink: 0,
      }}
    >
      {/* Logo row */}
      <div
        className="flex items-center h-12 px-3 gap-3 overflow-hidden"
        style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}
      >
        <div
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono"
          style={{
            background: "rgba(59, 130, 246, 0.12)",
            border: "1px solid rgba(59, 130, 246, 0.28)",
            color: "#60a5fa",
            boxShadow: "0 0 10px rgba(59, 130, 246, 0.15)",
          }}
        >
          {clientName.charAt(0)}
        </div>
        {expanded && (
          <span
            className="text-sm font-semibold font-sans truncate"
            style={{ color: "#c8cdd8" }}
          >
            {clientName}
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 p-2 flex-1 mt-2">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={cn(
                "nav-item flex items-center gap-3 rounded-lg px-2 py-2.5 w-full text-left",
                isActive ? "active" : ""
              )}
              style={{
                color: isActive ? "#93c5fd" : "rgba(200,205,216,0.55)",
                minHeight: 40,
              }}
              title={!expanded ? label : undefined}
            >
              <Icon
                size={17}
                className="flex-shrink-0"
                style={{ color: isActive ? "#60a5fa" : "rgba(200,205,216,0.4)" }}
              />
              {expanded && (
                <span className="text-sm font-medium font-sans truncate">{label}</span>
              )}
              {expanded && isActive && (
                <span
                  className="ml-auto w-1 h-4 rounded-full flex-shrink-0"
                  style={{
                    background: "#3b82f6",
                    boxShadow: "0 0 6px rgba(59,130,246,0.6)",
                  }}
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* User info + Logout */}
      <div className="p-2 flex flex-col gap-0.5" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
        {expanded && userEmail && (
          <div
            className="px-2 py-2 rounded-lg mb-1"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <p className="text-xs font-mono truncate" style={{ color: "rgba(200,205,216,0.35)" }}>
              {userEmail}
            </p>
            <p
              className="text-xs font-mono capitalize mt-0.5"
              style={{ color: "rgba(96,165,250,0.50)" }}
            >
              {role}
            </p>
          </div>
        )}
        <button
          onClick={onLogout}
          className="nav-item flex items-center gap-3 rounded-lg px-2 py-2.5 w-full text-left"
          style={{ color: "rgba(248,113,113,0.7)" }}
          title={!expanded ? "Logout" : undefined}
        >
          <LogOut size={17} className="flex-shrink-0" style={{ color: "rgba(248,113,113,0.6)" }} />
          {expanded && <span className="text-sm font-medium font-sans">Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center z-10"
        style={{
          background: "#08080a",
          border: "1px solid rgba(59,130,246,0.22)",
          color: "#60a5fa",
          boxShadow: "0 0 6px rgba(59,130,246,0.15)",
        }}
        aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        <ChevronRight
          size={12}
          className="transition-transform duration-300"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
    </aside>
  )
}
