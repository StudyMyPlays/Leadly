"use client"

import { useEffect, useRef, useState } from "react"
import { Bell, Search, PanelLeft, PanelLeftClose, X, Check } from "lucide-react"

interface TopbarProps {
  activeSection: string
  clientName: string
  accentColor: string
  role?: "owner" | "partner"
  userEmail?: string
  sidebarExpanded: boolean
  onToggleSidebar: () => void
}

const SECTION_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  leads:     "All Leads",
  pipeline:  "Pipeline",
  analytics: "Analytics",
  settings:  "Settings",
}

interface Notification {
  id: string
  title: string
  body: string
  time: string
  unread: boolean
}

const SAMPLE_NOTIFICATIONS: Notification[] = [
  { id: "n1", title: "New lead assigned",    body: "Robert Martinez (Installation — New York)", time: "2m ago",  unread: true },
  { id: "n2", title: "Estimate accepted",    body: "Emily Thompson accepted a $1,640 estimate.", time: "1h ago",  unread: true },
  { id: "n3", title: "Routing rule updated", body: "\"Austin installations — Elena\" re-ordered to #1.", time: "4h ago", unread: false },
  { id: "n4", title: "Partner invited",      body: "alex.cho@growthpartners.io accepted their invite.", time: "1d ago", unread: false },
]

export default function Topbar({
  activeSection,
  clientName,
  sidebarExpanded,
  onToggleSidebar,
}: TopbarProps) {
  const [searchOpen, setSearchOpen]     = useState(false)
  const [searchQuery, setSearchQuery]   = useState("")
  const [notifOpen, setNotifOpen]       = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(SAMPLE_NOTIFICATIONS)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const notifWrapRef   = useRef<HTMLDivElement>(null)
  const searchWrapRef  = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => n.unread).length

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) {
      const t = window.setTimeout(() => searchInputRef.current?.focus(), 60)
      return () => window.clearTimeout(t)
    }
  }, [searchOpen])

  // Close on outside click
  useEffect(() => {
    if (!notifOpen && !searchOpen) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (notifOpen && notifWrapRef.current && !notifWrapRef.current.contains(t)) {
        setNotifOpen(false)
      }
      if (
        searchOpen &&
        searchWrapRef.current &&
        !searchWrapRef.current.contains(t) &&
        !searchQuery
      ) {
        setSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [notifOpen, searchOpen, searchQuery])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNotifOpen(false)
        if (!searchQuery) setSearchOpen(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [searchQuery])

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))

  const dismiss = (id: string) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id))

  return (
    <header
      className="relative flex items-center justify-between px-4 md:px-5 h-12 shrink-0 z-20"
      style={{
        borderBottom: "1px solid rgba(255, 255, 255, 0.055)",
        background: "rgba(8, 8, 10, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Left: sidebar toggle + section label + client badge */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors flex-shrink-0"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            color: "rgba(200,205,216,0.65)",
          }}
          aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={sidebarExpanded}
          title={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarExpanded ? <PanelLeftClose size={14} /> : <PanelLeft size={14} />}
        </button>

        <h1
          className="text-sm font-semibold font-sans truncate"
          style={{ color: "#c8cdd8" }}
        >
          {SECTION_LABELS[activeSection] ?? activeSection}
        </h1>

        <span
          className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-full font-mono truncate max-w-[180px]"
          style={{
            background: "rgba(59,130,246,0.08)",
            color: "#93c5fd",
            border: "1px solid rgba(59,130,246,0.18)",
          }}
          title={clientName}
        >
          {clientName}
        </span>
      </div>

      {/* Right: search + bell */}
      <div className="flex items-center gap-2">
        {/* Search — collapsed chip expands into input */}
        <div ref={searchWrapRef} className="relative flex items-center">
          {searchOpen ? (
            <div
              className="flex items-center gap-2 h-7 pl-2.5 pr-1 rounded-lg transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(59,130,246,0.32)",
                boxShadow: "0 0 0 3px rgba(59,130,246,0.08)",
                width: 240,
              }}
            >
              <Search size={12} style={{ color: "rgba(200,205,216,0.55)", flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leads, people, rules…"
                className="flex-1 bg-transparent outline-none text-xs font-sans"
                style={{ color: "#e2e8f0" }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearchQuery("")
                    setSearchOpen(false)
                  }
                }}
                aria-label="Global search"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("")
                  setSearchOpen(false)
                }}
                className="flex items-center justify-center w-5 h-5 rounded flex-shrink-0"
                style={{ color: "rgba(200,205,216,0.45)", background: "transparent", border: "none" }}
                aria-label="Close search"
              >
                <X size={11} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "rgba(200,205,216,0.55)",
              }}
              aria-label="Open search"
              title="Search"
            >
              <Search size={13} />
            </button>
          )}
        </div>

        {/* Notifications */}
        <div ref={notifWrapRef} className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            className="relative flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
            style={{
              background: notifOpen ? "rgba(59,130,246,0.10)" : "rgba(255,255,255,0.03)",
              border: notifOpen ? "1px solid rgba(59,130,246,0.28)" : "1px solid rgba(255,255,255,0.07)",
              color: notifOpen ? "#93c5fd" : "rgba(200,205,216,0.55)",
            }}
            aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
            aria-haspopup="menu"
            aria-expanded={notifOpen}
          >
            <Bell size={13} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 rounded-full flex items-center justify-center text-[9px] font-mono font-bold"
                style={{
                  background: "#22c55e",
                  color: "#06150a",
                  boxShadow: "0 0 6px rgba(34,197,94,0.55)",
                  lineHeight: 1,
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 rounded-xl overflow-hidden"
              style={{
                width: 340,
                background: "rgba(11,14,19,0.98)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 18px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.05)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-3 py-2.5"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold font-sans" style={{ color: "#e2e8f0" }}>
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                      style={{
                        background: "rgba(34,197,94,0.10)",
                        color: "#4ade80",
                        border: "1px solid rgba(34,197,94,0.22)",
                      }}
                    >
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-[11px] font-mono"
                    style={{
                      color: "#93c5fd",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <Check size={10} /> Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-[340px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div
                    className="px-4 py-8 text-center text-xs font-mono"
                    style={{ color: "rgba(200,205,216,0.35)" }}
                  >
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="group flex items-start gap-3 px-3 py-2.5 transition-colors"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: n.unread ? "rgba(59,130,246,0.04)" : "transparent",
                      }}
                    >
                      <span
                        className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{
                          background: n.unread ? "#3b82f6" : "transparent",
                          boxShadow: n.unread ? "0 0 6px rgba(59,130,246,0.6)" : "none",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold font-sans truncate" style={{ color: "#e2e8f0" }}>
                            {n.title}
                          </p>
                          <span className="text-[10px] font-mono flex-shrink-0" style={{ color: "rgba(200,205,216,0.35)" }}>
                            {n.time}
                          </span>
                        </div>
                        <p className="text-xs font-sans mt-0.5 line-clamp-2" style={{ color: "rgba(200,205,216,0.55)" }}>
                          {n.body}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => dismiss(n.id)}
                        className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-5 h-5 rounded transition-opacity flex-shrink-0"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          color: "rgba(200,205,216,0.45)",
                        }}
                        aria-label="Dismiss"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div
                className="px-3 py-2 text-center"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
              >
                <button
                  type="button"
                  className="text-[11px] font-mono"
                  style={{
                    color: "#93c5fd",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  onClick={() => setNotifOpen(false)}
                >
                  View all activity →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
