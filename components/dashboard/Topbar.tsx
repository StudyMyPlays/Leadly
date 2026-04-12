"use client"

import { Bell, Search } from "lucide-react"

interface TopbarProps {
  activeSection: string
  clientName: string
  accentColor: string
  role?: "owner" | "partner"
  userEmail?: string
}

const SECTION_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  leads:     "All Leads",
  pipeline:  "Pipeline",
  analytics: "Analytics",
  settings:  "Settings",
}

export default function Topbar({ activeSection, clientName, role = "owner", userEmail }: TopbarProps) {
  return (
    <header
      className="flex items-center justify-between px-5 h-12 shrink-0 z-10"
      style={{
        borderBottom: "1px solid rgba(255, 255, 255, 0.055)",
        background: "rgba(8, 8, 10, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Left: section label + client badge */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold font-sans" style={{ color: "#c8cdd8" }}>
          {SECTION_LABELS[activeSection] ?? activeSection}
        </h1>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-mono"
          style={{
            background: "rgba(59,130,246,0.08)",
            color: "#93c5fd",
            border: "1px solid rgba(59,130,246,0.18)",
          }}
        >
          {clientName}
        </span>
      </div>

      {/* Right: search + bell + avatar */}
      <div className="flex items-center gap-2.5">
        {/* Search */}
        <div
          className="hidden md:flex items-center gap-2 px-3 h-7 rounded-lg text-xs font-mono"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            color: "rgba(200,205,216,0.35)",
          }}
        >
          <Search size={11} />
          <span>Search…</span>
        </div>

        {/* Bell */}
        <button
          className="relative flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            color: "rgba(200,205,216,0.5)",
          }}
          aria-label="Notifications"
        >
          <Bell size={13} />
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
            style={{ background: "#22c55e", boxShadow: "0 0 5px #22c55e" }}
          />
        </button>

        {/* Role badge */}
        <span
          className="hidden md:inline-block text-xs font-mono px-2 py-0.5 rounded-full capitalize"
          style={{
            background: role === "owner" ? "rgba(59,130,246,0.08)" : "rgba(34,197,94,0.07)",
            border: role === "owner" ? "1px solid rgba(59,130,246,0.20)" : "1px solid rgba(34,197,94,0.20)",
            color: role === "owner" ? "#93c5fd" : "#4ade80",
          }}
        >
          {role}
        </span>

        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono cursor-pointer flex-shrink-0"
          style={{
            background: "rgba(59,130,246,0.14)",
            border: "1px solid rgba(59,130,246,0.28)",
            color: "#93c5fd",
          }}
          title={userEmail}
          aria-label="User menu"
        >
          {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
        </div>
      </div>
    </header>
  )
}
