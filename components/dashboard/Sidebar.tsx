"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback } from "react"
import {
  LayoutGrid,
  BarChart2,
  Settings,
  LogOut,
  Users,
  Bell,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  activeSection: string
  onNavigate: (section: string) => void
  clientName: string
  role?: "owner" | "partner"
  userEmail?: string
  onLogout?: () => void
  expanded: boolean
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Leads",     icon: LayoutGrid },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
]

// Admin is always available to Owners (Owner === admin).
const ADMIN_ITEMS = [
  { href: "/admin/users",         label: "User Management", icon: Users },
  { href: "/admin/notifications", label: "Notifications",   icon: Bell },
  { href: "/admin/config",        label: "Settings",        icon: Settings },
]

const ACTIVE_SECTION_KEY = "leadosActiveSection"
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
  const pathname = usePathname() ?? "/"
  const isAdmin = role === "owner"
  const isOnDashboard = pathname === "/"

  // When the user clicks an admin link from the main dashboard, persist the
  // current workspace section so `/?returnTo=admin` can restore it later.
  const handleAdminLinkClick = useCallback(() => {
    if (typeof window === "undefined") return
    if (!isOnDashboard || !activeSection) return
    try {
      window.sessionStorage.setItem(ACTIVE_SECTION_KEY, activeSection)
    } catch {
      // ignore
    }
  }, [activeSection, isOnDashboard])

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

      {/* Scrollable nav area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Workspace nav */}
        <nav className={cn("flex flex-col gap-0.5", expanded ? "p-2" : "px-2 py-2")}>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            // Workspace items can only be "active" while sitting on the main dashboard.
            const isActive = isOnDashboard && activeSection === id
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={cn(
                  "relative nav-item flex items-center rounded-lg w-full text-left",
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
                {!expanded && isActive && (
                  <span
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-l-full"
                    style={{
                      background: "#3b82f6",
                      boxShadow: "0 0 6px rgba(59,130,246,0.7)",
                    }}
                  />
                )}
              </button>
            )
          })}
        </nav>

        {/* Admin section — only rendered for Owner */}
        {isAdmin && (
          <div
            className="pt-2 mt-1 px-2 pb-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            {expanded ? (
              <div className="flex items-center gap-1.5 px-2 mb-2 mt-1">
                <ShieldCheck size={10} style={{ color: "rgba(16,185,129,0.8)" }} />
                <span
                  className="text-[10px] font-mono uppercase tracking-[0.12em] font-semibold"
                  style={{ color: "rgba(16,185,129,0.75)" }}
                >
                  Admin
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center mb-1 mt-0.5">
                <span
                  className="w-1 h-1 rounded-full"
                  style={{
                    background: "rgba(16,185,129,0.8)",
                    boxShadow: "0 0 6px rgba(16,185,129,0.55)",
                  }}
                  aria-hidden="true"
                />
              </div>
            )}

            <div className="flex flex-col gap-0.5">
              {ADMIN_ITEMS.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(href + "/")
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={handleAdminLinkClick}
                    className={cn(
                      "relative nav-item flex items-center rounded-lg w-full transition-colors",
                      expanded
                        ? "gap-3 px-2 py-2.5 justify-start"
                        : "justify-center px-0 py-2.5",
                    )}
                    style={{
                      color: isActive ? "#34d399" : "rgba(200,205,216,0.55)",
                      background: isActive ? "rgba(16,185,129,0.08)" : "transparent",
                      border: isActive
                        ? "1px solid rgba(16,185,129,0.32)"
                        : "1px solid transparent",
                      boxShadow: isActive
                        ? "inset 0 0 0 1px rgba(16,185,129,0.10), 0 0 14px rgba(16,185,129,0.14)"
                        : "none",
                      minHeight: 40,
                    }}
                    title={!expanded ? label : undefined}
                    aria-label={label}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon
                      size={17}
                      className="flex-shrink-0"
                      style={{ color: isActive ? "#34d399" : "rgba(16,185,129,0.65)" }}
                    />
                    {expanded && (
                      <span className="text-sm font-medium font-sans truncate">{label}</span>
                    )}
                    {expanded && isActive && (
                      <span
                        className="ml-auto w-1 h-4 rounded-full flex-shrink-0"
                        style={{
                          background: "#10b981",
                          boxShadow: "0 0 6px rgba(16,185,129,0.6)",
                        }}
                      />
                    )}
                    {!expanded && isActive && (
                      <span
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-l-full"
                        style={{
                          background: "#10b981",
                          boxShadow: "0 0 6px rgba(16,185,129,0.7)",
                        }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>

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
              className="text-[11px] font-mono capitalize mt-0.5 flex items-center gap-1"
              style={{
                color: isAdmin ? "rgba(16,185,129,0.75)" : "rgba(96,165,250,0.55)",
              }}
            >
              {isAdmin && <ShieldCheck size={10} />}
              {isAdmin ? "owner · admin" : role}
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
