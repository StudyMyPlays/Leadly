"use client"

import {
  LayoutGrid,
  List,
  Filter,
  BarChart2,
  Settings,
  LogOut,
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
  expanded: boolean
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "leads",     label: "All Leads", icon: List },
  { id: "pipeline",  label: "Pipeline",  icon: Filter },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "settings",  label: "Settings",  icon: Settings },
]

const EXPANDED_W  = 220
const COLLAPSED_W = 64

export default function Sidebar({
  activeSection,
  onNavigate,
  clientName,
  role = "owner",
  userEmail,
  onLogout,
  expanded,
}: SidebarProps) {
  return (
    <aside
      className="relative flex flex-col h-full transition-[width] duration-300 ease-in-out"
      style={{
        width: expanded ? EXPANDED_W : COLLAPSED_W,
        background: "rgba(6, 6, 9, 0.97)",
        borderRight: "1px solid rgba(255, 255, 255, 0.06)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        flexShrink: 0,
      }}
      aria-label="Primary navigation"
    >
      {/* Logo row — 48px tall to match topbar */}
      <div
        className={cn(
          "flex items-center h-12 gap-3 overflow-hidden",
          expanded ? "px-3 justify-start" : "px-0 justify-center",
        )}
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
          {clientName.charAt(0).toUpperCase()}
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
      <nav className={cn("flex flex-col gap-0.5 flex-1 mt-2", expanded ? "p-2" : "px-2 py-2")}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={cn(
                "nav-item flex items-center rounded-lg w-full text-left",
                isActive ? "active" : "",
                expanded
                  ? "gap-3 px-2 py-2.5 justify-start"
                  : "justify-center px-0 py-2.5",
              )}
              style={{
                color: isActive ? "#93c5fd" : "rgba(200,205,216,0.55)",
                minHeight: 40,
              }}
              title={!expanded ? label : undefined}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
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
      <div
        className={cn("flex flex-col gap-0.5", expanded ? "p-2" : "px-2 py-2")}
        style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}
      >
        {expanded && userEmail && (
          <div
            className="px-2 py-2 rounded-lg mb-1"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <p className="text-xs font-mono truncate" style={{ color: "rgba(200,205,216,0.45)" }}>
              {userEmail}
            </p>
            <p
              className="text-[11px] font-mono capitalize mt-0.5"
              style={{ color: "rgba(96,165,250,0.55)" }}
            >
              {role}
            </p>
          </div>
        )}
        <button
          onClick={onLogout}
          className={cn(
            "nav-item flex items-center rounded-lg w-full text-left",
            expanded ? "gap-3 px-2 py-2.5 justify-start" : "justify-center px-0 py-2.5",
          )}
          style={{ color: "rgba(248,113,113,0.7)" }}
          title={!expanded ? "Logout" : undefined}
          aria-label="Logout"
        >
          <LogOut size={17} className="flex-shrink-0" style={{ color: "rgba(248,113,113,0.6)" }} />
          {expanded && <span className="text-sm font-medium font-sans">Logout</span>}
        </button>
      </div>
    </aside>
  )
}
