"use client"

import { useMemo, useState } from "react"
import {
  ArrowLeft,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Mail,
  ShieldCheck,
  Shield,
  Eye,
  MoreHorizontal,
  Ban,
  KeyRound,
  Trash2,
  Clock,
  X,
  Check,
  Search,
  ChevronDown,
  Send,
} from "lucide-react"
import {
  EMERALD,
  EMERALD_SOFT,
  EMERALD_BORDER,
  EMERALD_GLOW,
  SLATE_BG,
  SLATE_PANEL,
  SLATE_BORDER,
  SLATE_BORDER_STRONG,
  TEXT,
  TEXT_DIM,
  TEXT_MUTE,
} from "@/lib/tokens"
import {
  AUTHORIZED_USERS,
  INITIAL_INVITES,
  type AuthorizedUser,
  type PendingInvite,
  type UserRole,
  type UserStatus,
} from "@/lib/users"

// ─────────────────────────────────────────────────────────────────
// Role presentation
// ─────────────────────────────────────────────────────────────────
const ROLE_META: Record<
  UserRole,
  { icon: typeof ShieldCheck; color: string; bg: string; border: string }
> = {
  Owner: {
    icon: ShieldCheck,
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.10)",
    border: "rgba(251,191,36,0.28)",
  },
  Partner: {
    icon: Shield,
    color: EMERALD,
    bg: EMERALD_SOFT,
    border: EMERALD_BORDER,
  },
  Viewer: {
    icon: Eye,
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.10)",
    border: "rgba(96,165,250,0.28)",
  },
}

const STATUS_META: Record<UserStatus, { label: string; color: string; bg: string; border: string }> = {
  Active:     { label: "Active",    color: EMERALD,   bg: EMERALD_SOFT,              border: EMERALD_BORDER },
  Suspended:  { label: "Suspended", color: "#f87171", bg: "rgba(248,113,113,0.10)",  border: "rgba(248,113,113,0.28)" },
}

// ─────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────
function formatRelative(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  const w = Math.floor(d / 7)
  if (w < 5) return `${w}w ago`
  return `${Math.floor(d / 30)}mo ago`
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

function avatarGradient(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  const hue = Math.abs(h) % 360
  return `linear-gradient(135deg, hsl(${hue} 55% 22%) 0%, hsl(${(hue + 40) % 360} 55% 14%) 100%)`
}

// ─────────────────────────────────────────────────────────────────
// Small primitives — mirrored from NotificationSettingsPanel
// ─────────────────────────────────────────────────────────────────
function StatPill({
  label,
  count,
  tone,
  icon: Icon,
}: {
  label: string
  count: number
  tone: "emerald" | "amber" | "muted" | "red"
  icon: typeof Users
}) {
  const colors =
    tone === "emerald"
      ? { color: EMERALD, bg: EMERALD_SOFT, border: EMERALD_BORDER }
      : tone === "amber"
      ? { color: "#fbbf24", bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.28)" }
      : tone === "red"
      ? { color: "#f87171", bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.28)" }
      : { color: TEXT_DIM, bg: "rgba(255,255,255,0.03)", border: SLATE_BORDER_STRONG }

  return (
    <span
      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-mono uppercase tracking-wider"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.color,
      }}
    >
      <Icon size={11} />
      <span>{label}</span>
      <span style={{ color: colors.color, fontWeight: 600 }}>{count}</span>
    </span>
  )
}

function Section({
  icon: Icon,
  title,
  subtitle,
  meta,
  children,
}: {
  icon: typeof Users
  title: string
  subtitle: string
  meta?: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: EMERALD_SOFT,
              border: `1px solid ${EMERALD_BORDER}`,
              color: EMERALD,
            }}
          >
            <Icon size={13} />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold leading-none truncate" style={{ color: TEXT }}>
              {title}
            </p>
            <p
              className="text-[11px] font-mono uppercase tracking-wider mt-1.5 truncate"
              style={{ color: TEXT_MUTE }}
            >
              {subtitle}
            </p>
          </div>
        </div>
        {meta && (
          <span className="text-[11px] font-mono flex-shrink-0" style={{ color: TEXT_MUTE }}>
            {meta}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────
// Panel
// ─────────────────────────────────────────────────────────────────
interface Props {
  onBack?: () => void
}

export default function UserManagementPanel({ onBack }: Props) {
  const [users, setUsers] = useState<AuthorizedUser[]>(AUTHORIZED_USERS)
  const [invites, setInvites] = useState<PendingInvite[]>(INITIAL_INVITES)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRole | "All">("All")

  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)

  const [toast, setToast] = useState<{ id: number; text: string; tone: "success" | "info" } | null>(null)

  const showToast = (text: string, tone: "success" | "info" = "success") => {
    const id = Date.now()
    setToast({ id, text, tone })
    setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), 2400)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      const matchQ =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      const matchRole = roleFilter === "All" || u.role === roleFilter
      return matchQ && matchRole
    })
  }, [users, search, roleFilter])

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.status === "Active").length,
      partners: users.filter((u) => u.role === "Partner").length,
      suspended: users.filter((u) => u.status === "Suspended").length,
      pending: invites.length,
    }
  }, [users, invites])

  // ── Actions ────────────────────────────────────────────────
  const changeRole = (id: string, role: UserRole) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
    setMenuOpen(null)
    showToast(`Role updated to ${role}`)
  }

  const toggleSuspend = (id: string) => {
    const u = users.find((x) => x.id === id)
    setUsers((prev) =>
      prev.map((x) =>
        x.id === id
          ? { ...x, status: x.status === "Active" ? "Suspended" : "Active" }
          : x,
      ),
    )
    setMenuOpen(null)
    showToast(u?.status === "Active" ? "Partner suspended" : "Partner reactivated")
  }

  const resetPassword = (id: string) => {
    const u = users.find((x) => x.id === id)
    if (u) showToast(`Reset link sent to ${u.email}`)
    setMenuOpen(null)
  }

  const removeUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id))
    setConfirmRemoveId(null)
    setMenuOpen(null)
    showToast("Removed from team", "info")
  }

  const revokeInvite = (id: string) => {
    setInvites((prev) => prev.filter((i) => i.id !== id))
    showToast("Invite revoked", "info")
  }

  const sendInvite = (email: string, role: UserRole, commissionRate?: number) => {
    if (!email.trim()) return
    const invite: PendingInvite = {
      id: `i_${Date.now()}`,
      email: email.trim().toLowerCase(),
      role,
      commissionRate,
      sentAt: new Date().toISOString(),
    }
    setInvites((prev) => [invite, ...prev])
    setInviteOpen(false)
    showToast(`Invite sent to ${invite.email}`)
  }

  const removingUser = confirmRemoveId
    ? users.find((u) => u.id === confirmRemoveId) ?? null
    : null

  return (
    <div
      className="min-h-screen w-full font-sans"
      style={{ background: SLATE_BG, color: TEXT }}
      onClick={() => setMenuOpen(null)}
    >
      {/* Ambient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 0%, rgba(16,185,129,0.06), transparent 40%), radial-gradient(circle at 80% 100%, rgba(59,130,246,0.05), transparent 45%)",
        }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between gap-3 px-6 h-14"
        style={{
          background: "rgba(11,15,20,0.85)",
          borderBottom: `1px solid ${SLATE_BORDER}`,
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${SLATE_BORDER_STRONG}`,
                color: TEXT_DIM,
              }}
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={14} />
            </button>
          )}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: EMERALD_SOFT,
                border: `1px solid ${EMERALD_BORDER}`,
                color: EMERALD,
              }}
            >
              <Users size={14} />
            </div>
            <div className="min-w-0">
              <h1 className="text-[15px] font-semibold truncate" style={{ color: TEXT }}>
                User Management
              </h1>
              <p
                className="text-[11px] font-mono uppercase tracking-wider truncate"
                style={{ color: TEXT_MUTE }}
              >
                Partners · Owners · Invites
              </p>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <StatPill label="Active" count={stats.active} tone="emerald" icon={UserCheck} />
          <StatPill
            label="Suspended"
            count={stats.suspended}
            tone={stats.suspended > 0 ? "red" : "muted"}
            icon={UserX}
          />
          <StatPill label="Pending" count={stats.pending} tone="amber" icon={Mail} />
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-6 py-7 flex flex-col gap-8">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div
            className="flex items-center gap-2 h-9 px-3 rounded-lg flex-1 min-w-[220px]"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: `1px solid ${SLATE_BORDER_STRONG}`,
            }}
          >
            <Search size={13} style={{ color: TEXT_MUTE }} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search partners by name or email…"
              className="flex-1 bg-transparent outline-none text-[13px]"
              style={{ color: TEXT }}
            />
          </div>

          {/* Role filter */}
          <div
            role="tablist"
            aria-label="Filter by role"
            className="inline-flex items-center gap-0.5 p-0.5 rounded-lg"
            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${SLATE_BORDER}` }}
          >
            {(["All", "Owner", "Partner"] as const).map((r) => {
              const active = roleFilter === r
              return (
                <button
                  key={r}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setRoleFilter(r)}
                  className="px-2.5 h-7 rounded-md text-[11px] font-mono font-semibold uppercase tracking-wider transition-all"
                  style={{
                    background: active ? EMERALD_SOFT : "transparent",
                    border: `1px solid ${active ? EMERALD_BORDER : "transparent"}`,
                    color: active ? EMERALD : TEXT_DIM,
                  }}
                >
                  {r}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2 px-3 h-9 rounded-lg text-[12px] font-semibold transition-all"
            style={{
              background: EMERALD,
              border: `1px solid ${EMERALD_BORDER}`,
              color: "#06150a",
              boxShadow: EMERALD_GLOW,
            }}
          >
            <UserPlus size={13} />
            Invite Partner
          </button>
        </div>

        {/* Section 1 — Team */}
        <Section
          icon={Users}
          title="Team Members"
          subtitle="Accounts that can authenticate & access LeadOS"
          meta={`${filtered.length} of ${stats.total} shown`}
        >
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: SLATE_PANEL, border: `1px solid ${SLATE_BORDER}` }}
          >
            {filtered.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center gap-2 px-6 py-14"
                style={{ color: TEXT_MUTE }}
              >
                <Users size={22} />
                <p className="text-[13px] font-sans" style={{ color: TEXT_DIM }}>
                  No partners match these filters.
                </p>
              </div>
            ) : (
              filtered.map((u, idx, arr) => {
                const role = ROLE_META[u.role]
                const status = STATUS_META[u.status]
                const isSuspended = u.status === "Suspended"
                const RoleIcon = role.icon
                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{
                      borderBottom: idx < arr.length - 1 ? `1px solid ${SLATE_BORDER}` : "none",
                      background: isSuspended
                        ? "rgba(248,113,113,0.025)"
                        : u.status === "Active"
                        ? "rgba(16,185,129,0.018)"
                        : "transparent",
                      opacity: isSuspended ? 0.82 : 1,
                    }}
                  >
                    {/* Avatar */}
                    <div
                      className="flex items-center justify-center flex-shrink-0 font-mono text-[11px] font-semibold"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: avatarGradient(u.email),
                        border: `1px solid ${SLATE_BORDER_STRONG}`,
                        color: TEXT,
                        filter: isSuspended ? "grayscale(0.7)" : "none",
                      }}
                      aria-hidden
                    >
                      {initials(u.name)}
                    </div>

                    {/* Identity */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-[13px] font-medium truncate" style={{ color: TEXT }}>
                          {u.name}
                        </p>
                        {/* Live dot */}
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{
                            background: status.color,
                            boxShadow: isSuspended ? "none" : `0 0 6px ${status.color}`,
                          }}
                          aria-label={status.label}
                        />
                      </div>
                      <p className="text-[11px] truncate font-mono mt-0.5" style={{ color: TEXT_MUTE }}>
                        {u.email}
                        {u.commissionRate !== undefined && (
                          <>
                            <span className="mx-1.5" style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
                            <span>{u.commissionRate}% comm.</span>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Role badge */}
                    <span
                      className="hidden sm:inline-flex items-center gap-1 h-[22px] px-2 rounded-full text-[10px] font-mono uppercase tracking-wider flex-shrink-0"
                      style={{
                        background: role.bg,
                        border: `1px solid ${role.border}`,
                        color: role.color,
                      }}
                    >
                      <RoleIcon size={10} />
                      {u.role}
                    </span>

                    {/* Last login */}
                    <span
                      className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono flex-shrink-0"
                      style={{ color: TEXT_MUTE, minWidth: 78, justifyContent: "flex-end" }}
                    >
                      <Clock size={10} />
                      {formatRelative(u.lastLogin)}
                    </span>

                    {/* Kebab */}
                    <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        aria-label={`Actions for ${u.name}`}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen === u.id}
                        onClick={() => setMenuOpen(menuOpen === u.id ? null : u.id)}
                        className="flex items-center justify-center"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background:
                            menuOpen === u.id
                              ? "rgba(255,255,255,0.06)"
                              : "rgba(255,255,255,0.02)",
                          border: `1px solid ${SLATE_BORDER_STRONG}`,
                          color: TEXT_DIM,
                        }}
                      >
                        <MoreHorizontal size={13} />
                      </button>

                      {menuOpen === u.id && (
                        <div
                          role="menu"
                          className="absolute right-0 top-9 z-30 w-52 rounded-lg overflow-hidden"
                          style={{
                            background: "rgba(12,16,22,0.98)",
                            border: `1px solid ${SLATE_BORDER_STRONG}`,
                            boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
                          }}
                        >
                          <MenuItem
                            icon={ShieldCheck}
                            label="Make Owner"
                            disabled={u.role === "Owner"}
                            onClick={() => changeRole(u.id, "Owner")}
                          />
                          <MenuItem
                            icon={Shield}
                            label="Make Partner"
                            disabled={u.role === "Partner"}
                            onClick={() => changeRole(u.id, "Partner")}
                          />
                          <MenuItem
                            icon={Eye}
                            label="Make Viewer"
                            disabled={u.role === "Viewer"}
                            onClick={() => changeRole(u.id, "Viewer")}
                          />
                          <div style={{ height: 1, background: SLATE_BORDER }} />
                          <MenuItem
                            icon={KeyRound}
                            label="Reset password"
                            onClick={() => resetPassword(u.id)}
                          />
                          <MenuItem
                            icon={Ban}
                            label={u.status === "Active" ? "Suspend" : "Reactivate"}
                            onClick={() => toggleSuspend(u.id)}
                          />
                          <div style={{ height: 1, background: SLATE_BORDER }} />
                          <MenuItem
                            icon={Trash2}
                            label="Remove"
                            danger
                            onClick={() => {
                              setMenuOpen(null)
                              setConfirmRemoveId(u.id)
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Section>

        {/* Section 2 — Pending invites */}
        <Section
          icon={Mail}
          title="Pending Invites"
          subtitle="Waiting for the partner to accept & sign in."
          meta={`${invites.length} open`}
        >
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: SLATE_PANEL, border: `1px solid ${SLATE_BORDER}` }}
          >
            {invites.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center gap-2 px-6 py-10"
                style={{ color: TEXT_MUTE }}
              >
                <Check size={18} style={{ color: EMERALD }} />
                <p className="text-[12px] font-sans" style={{ color: TEXT_DIM }}>
                  No pending invites.
                </p>
              </div>
            ) : (
              invites.map((inv, idx, arr) => {
                const role = ROLE_META[inv.role]
                const RoleIcon = role.icon
                return (
                  <div
                    key={inv.id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{
                      borderBottom: idx < arr.length - 1 ? `1px solid ${SLATE_BORDER}` : "none",
                    }}
                  >
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: "rgba(251,191,36,0.08)",
                        border: "1px solid rgba(251,191,36,0.28)",
                        color: "#fbbf24",
                      }}
                    >
                      <Mail size={13} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate" style={{ color: TEXT }}>
                        {inv.email}
                      </p>
                      <p className="text-[11px] font-mono mt-0.5" style={{ color: TEXT_MUTE }}>
                        sent {formatRelative(inv.sentAt)}
                        {inv.commissionRate !== undefined && (
                          <>
                            <span className="mx-1.5" style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
                            <span>{inv.commissionRate}% comm.</span>
                          </>
                        )}
                      </p>
                    </div>

                    <span
                      className="hidden sm:inline-flex items-center gap-1 h-[22px] px-2 rounded-full text-[10px] font-mono uppercase tracking-wider flex-shrink-0"
                      style={{
                        background: role.bg,
                        border: `1px solid ${role.border}`,
                        color: role.color,
                      }}
                    >
                      <RoleIcon size={10} />
                      {inv.role}
                    </span>

                    <button
                      type="button"
                      onClick={() => showToast(`Invite resent to ${inv.email}`)}
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.03)",
                        border: `1px solid ${SLATE_BORDER_STRONG}`,
                        color: TEXT_DIM,
                      }}
                      aria-label="Resend invite"
                    >
                      <Send size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => revokeInvite(inv.id)}
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.03)",
                        border: `1px solid ${SLATE_BORDER_STRONG}`,
                        color: TEXT_DIM,
                      }}
                      aria-label="Revoke invite"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </Section>
      </main>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-[12px] font-sans shadow-xl"
          style={{
            background: "rgba(6,21,13,0.98)",
            border: `1px solid ${EMERALD_BORDER}`,
            color: "#a7f3d0",
            boxShadow: "0 12px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(16,185,129,0.12)",
            minWidth: 240,
          }}
        >
          <Check size={13} style={{ color: EMERALD, flexShrink: 0 }} />
          {toast.text}
        </div>
      )}

      {/* Confirm remove */}
      {removingUser && (
        <ConfirmDialog
          user={removingUser}
          onCancel={() => setConfirmRemoveId(null)}
          onConfirm={() => removeUser(removingUser.id)}
        />
      )}

      {/* Invite modal */}
      {inviteOpen && (
        <InviteDialog onClose={() => setInviteOpen(false)} onSend={sendInvite} />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────
function MenuItem({
  icon: Icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: typeof ShieldCheck
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 h-9 text-[12px] font-sans transition-colors disabled:cursor-not-allowed disabled:opacity-45"
      style={{
        background: "transparent",
        color: danger ? "#fca5a5" : TEXT_DIM,
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        e.currentTarget.style.background = danger
          ? "rgba(248,113,113,0.08)"
          : "rgba(255,255,255,0.04)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent"
      }}
    >
      <Icon size={12} />
      {label}
    </button>
  )
}

function ConfirmDialog({
  user,
  onCancel,
  onConfirm,
}: {
  user: AuthorizedUser
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-xl p-5 flex flex-col gap-4"
        style={{
          background: "#0c0f14",
          border: "1px solid rgba(248,113,113,0.28)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center"
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: "rgba(248,113,113,0.10)",
              border: "1px solid rgba(248,113,113,0.28)",
              color: "#f87171",
            }}
          >
            <Trash2 size={13} />
          </div>
          <h3 className="text-[14px] font-semibold" style={{ color: TEXT }}>
            Remove {user.name}?
          </h3>
        </div>
        <p className="text-[12px]" style={{ color: TEXT_DIM, lineHeight: 1.5 }}>
          They will immediately lose access to LeadOS. This action cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            className="h-9 px-3.5 rounded-lg text-[12px]"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${SLATE_BORDER_STRONG}`,
              color: TEXT_DIM,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="h-9 px-3.5 rounded-lg text-[12px] font-semibold"
            style={{
              background: "rgba(248,113,113,0.14)",
              border: "1px solid rgba(248,113,113,0.42)",
              color: "#fca5a5",
            }}
          >
            Remove partner
          </button>
        </div>
      </div>
    </div>
  )
}

function InviteDialog({
  onClose,
  onSend,
}: {
  onClose: () => void
  onSend: (email: string, role: UserRole, commissionRate?: number) => void
}) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<UserRole>("Partner")
  const [commission, setCommission] = useState<string>("15")

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Invite partner"
        className="w-full max-w-md rounded-xl overflow-hidden"
        style={{
          background: "#0c0f14",
          border: `1px solid ${EMERALD_BORDER}`,
          boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${SLATE_BORDER}` }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center"
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: EMERALD_SOFT, border: `1px solid ${EMERALD_BORDER}`, color: EMERALD,
              }}
            >
              <UserPlus size={13} />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold leading-none" style={{ color: TEXT }}>
                Invite Partner
              </h3>
              <p className="text-[10px] font-mono uppercase tracking-wider mt-1.5" style={{ color: TEXT_MUTE }}>
                They&apos;ll get a sign-in link via email
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center"
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${SLATE_BORDER_STRONG}`,
              color: TEXT_DIM,
            }}
            aria-label="Close"
          >
            <X size={13} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <LabeledField label="Email address">
            <input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="partner@example.com"
              className="w-full h-10 px-3 rounded-lg text-[13px] font-sans outline-none"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${SLATE_BORDER_STRONG}`,
                color: TEXT,
              }}
            />
          </LabeledField>

          <div className="grid grid-cols-2 gap-4">
            <LabeledField label="Role">
              <div style={{ position: "relative" }}>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full h-10 px-3 rounded-lg text-[13px] font-sans outline-none appearance-none"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${SLATE_BORDER_STRONG}`,
                    color: TEXT,
                    paddingRight: 32,
                  }}
                >
                  <option value="Partner">Partner</option>
                  <option value="Owner">Owner</option>
                  <option value="Viewer">Viewer</option>
                </select>
                <ChevronDown
                  size={13}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: TEXT_MUTE,
                    pointerEvents: "none",
                  }}
                />
              </div>
            </LabeledField>

            {role === "Partner" && (
              <LabeledField label="Commission %">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg text-[13px] font-mono outline-none"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${SLATE_BORDER_STRONG}`,
                    color: TEXT,
                  }}
                />
              </LabeledField>
            )}
          </div>
        </div>

        <div
          className="flex items-center justify-end gap-2 px-5 py-4"
          style={{ borderTop: `1px solid ${SLATE_BORDER}` }}
        >
          <button
            onClick={onClose}
            className="h-9 px-3.5 rounded-lg text-[12px]"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${SLATE_BORDER_STRONG}`,
              color: TEXT_DIM,
            }}
          >
            Cancel
          </button>
          <button
            disabled={!valid}
            onClick={() =>
              onSend(
                email,
                role,
                role === "Partner" ? Number(commission) || undefined : undefined,
              )
            }
            className="h-9 px-3.5 rounded-lg text-[12px] font-semibold inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: valid ? EMERALD : "rgba(255,255,255,0.04)",
              border: `1px solid ${valid ? EMERALD_BORDER : SLATE_BORDER_STRONG}`,
              color: valid ? "#06150a" : TEXT_MUTE,
              boxShadow: valid ? EMERALD_GLOW : "none",
            }}
          >
            <Send size={12} />
            Send invite
          </button>
        </div>
      </div>
    </div>
  )
}

function LabeledField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-[10px] font-mono uppercase tracking-wider"
        style={{ color: TEXT_MUTE }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}
