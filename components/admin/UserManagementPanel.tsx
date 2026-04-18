"use client"

import { useMemo, useState } from "react"
import {
  Search,
  UserPlus,
  ShieldCheck,
  Shield,
  Eye,
  MoreHorizontal,
  Ban,
  KeyRound,
  Trash2,
  X,
  Mail,
  ChevronDown,
  ArrowLeft,
  Clock,
  CircleCheck,
  CircleSlash,
  Percent,
} from "lucide-react"

// ─────────────────────────────────────────────────────────────────
// Types & data
// ─────────────────────────────────────────────────────────────────
export type UserRole = "Owner" | "Partner" | "Viewer"
export type UserStatus = "Active" | "Suspended"

export interface TeamUser {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  lastLogin: string // ISO
  commissionRate?: number
}

const INITIAL_USERS: TeamUser[] = [
  {
    id: "u_01",
    name: "Marcus Chen",
    email: "marcus@leados.app",
    role: "Owner",
    status: "Active",
    lastLogin: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: "u_02",
    name: "Elena Vargas",
    email: "elena@growthpartners.io",
    role: "Partner",
    status: "Active",
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    commissionRate: 15,
  },
  {
    id: "u_03",
    name: "Devon Park",
    email: "devon@growthpartners.io",
    role: "Partner",
    status: "Active",
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    commissionRate: 12,
  },
  {
    id: "u_04",
    name: "Priya Shah",
    email: "priya.shah@leados.app",
    role: "Viewer",
    status: "Active",
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: "u_05",
    name: "Jordan Reeves",
    email: "jordan@leadscout.co",
    role: "Partner",
    status: "Suspended",
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    commissionRate: 10,
  },
  {
    id: "u_06",
    name: "Sam Oduya",
    email: "sam@leados.app",
    role: "Viewer",
    status: "Active",
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
]

interface PendingInvite {
  id: string
  email: string
  role: UserRole
  commissionRate?: number
  sentAt: string
}

const INITIAL_INVITES: PendingInvite[] = [
  {
    id: "i_01",
    email: "alex.cho@growthpartners.io",
    role: "Partner",
    commissionRate: 12,
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: "i_02",
    email: "ops@leados.app",
    role: "Viewer",
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
]

// ─────────────────────────────────────────────────────────────────
// Design tokens (scoped to this panel)
// ─────────────────────────────────────────────────────────────────
const EMERALD = "#10b981"
const EMERALD_SOFT = "rgba(16,185,129,0.10)"
const EMERALD_BORDER = "rgba(16,185,129,0.28)"
const EMERALD_GLOW = "0 0 0 1px rgba(16,185,129,0.22), 0 0 20px rgba(16,185,129,0.18)"

const SLATE_BG = "#0b0f14"
const SLATE_PANEL = "rgba(17,23,31,0.92)"
const SLATE_ROW_HOVER = "rgba(16,185,129,0.04)"
const SLATE_BORDER = "rgba(255,255,255,0.06)"
const SLATE_BORDER_STRONG = "rgba(255,255,255,0.10)"
const TEXT = "#e2e8f0"
const TEXT_DIM = "rgba(226,232,240,0.55)"
const TEXT_MUTE = "rgba(226,232,240,0.35)"

const ROLE_META: Record<UserRole, { icon: typeof ShieldCheck; color: string; bg: string; border: string }> = {
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
    color: "#93c5fd",
    bg: "rgba(147,197,253,0.08)",
    border: "rgba(147,197,253,0.22)",
  },
}

// ─────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

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
  const mo = Math.floor(d / 30)
  return `${mo}mo ago`
}

// Deterministic avatar color from name
function avatarGradient(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  const hue = Math.abs(h) % 360
  return `linear-gradient(135deg, hsl(${hue} 55% 28%) 0%, hsl(${(hue + 40) % 360} 55% 20%) 100%)`
}

// ─────────────────────────────────────────────────────────────────
// Panel
// ─────────────────────────────────────────────────────────────────
interface UserManagementPanelProps {
  onBack?: () => void
}

export default function UserManagementPanel({ onBack }: UserManagementPanelProps) {
  const [users, setUsers] = useState<TeamUser[]>(INITIAL_USERS)
  const [invites, setInvites] = useState<PendingInvite[]>(INITIAL_INVITES)

  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRole | "All">("All")
  const [statusFilter, setStatusFilter] = useState<UserStatus | "All">("All")

  const [inviteOpen, setInviteOpen] = useState(false)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2400)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      const matchQ =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      const matchRole = roleFilter === "All" || u.role === roleFilter
      const matchStatus = statusFilter === "All" || u.status === statusFilter
      return matchQ && matchRole && matchStatus
    })
  }, [users, search, roleFilter, statusFilter])

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.status === "Active").length,
      suspended: users.filter((u) => u.status === "Suspended").length,
      pending: invites.length,
    }
  }, [users, invites])

  // Actions
  const changeRole = (id: string, role: UserRole) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
    showToast(`Role updated to ${role}`)
  }

  const toggleSuspend = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "Active" ? "Suspended" : "Active" }
          : u,
      ),
    )
    const u = users.find((x) => x.id === id)
    showToast(u?.status === "Active" ? "User suspended" : "User reactivated")
  }

  const resetPassword = (id: string) => {
    const u = users.find((x) => x.id === id)
    if (u) showToast(`Reset link sent to ${u.email}`)
  }

  const removeUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id))
    setConfirmRemoveId(null)
    showToast("User removed")
  }

  const sendInvite = (email: string, role: UserRole, commissionRate?: number) => {
    const invite: PendingInvite = {
      id: `i_${Date.now()}`,
      email,
      role,
      commissionRate,
      sentAt: new Date().toISOString(),
    }
    setInvites((prev) => [invite, ...prev])
    setInviteOpen(false)
    showToast(`Invite sent to ${email}`)
  }

  const revokeInvite = (id: string) => {
    setInvites((prev) => prev.filter((i) => i.id !== id))
    showToast("Invite revoked")
  }

  const removingUser = confirmRemoveId
    ? users.find((u) => u.id === confirmRemoveId)
    : null

  return (
    <div
      className="min-h-screen w-full font-sans"
      style={{
        background: SLATE_BG,
        color: TEXT,
      }}
    >
      {/* Subtle slate grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 0%, rgba(16,185,129,0.06), transparent 40%), radial-gradient(circle at 80% 100%, rgba(16,185,129,0.04), transparent 45%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-8">
        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div className="flex items-start gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${SLATE_BORDER}`,
                  color: TEXT_DIM,
                }}
                aria-label="Back"
              >
                <ArrowLeft size={14} />
              </button>
            )}
            <div>
              <div
                className="text-[11px] font-mono uppercase tracking-[0.14em]"
                style={{ color: TEXT_MUTE }}
              >
                LeadOS / Admin
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-balance">
                User Management
              </h1>
              <p
                className="mt-1 text-sm leading-relaxed"
                style={{ color: TEXT_DIM }}
              >
                Manage team members, permissions, and pending invites.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setInviteOpen(true)}
              className="group relative flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: EMERALD_SOFT,
                border: `1px solid ${EMERALD_BORDER}`,
                color: EMERALD,
                boxShadow: EMERALD_GLOW,
              }}
            >
              <UserPlus size={14} />
              Invite User
              {stats.pending > 0 && (
                <span
                  className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-mono font-semibold"
                  style={{
                    background: EMERALD,
                    color: "#062018",
                  }}
                  aria-label={`${stats.pending} pending invites`}
                >
                  {stats.pending}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Stats row ────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Users" value={stats.total} />
          <StatCard
            label="Active"
            value={stats.active}
            accent={EMERALD}
            icon={<CircleCheck size={13} />}
          />
          <StatCard
            label="Suspended"
            value={stats.suspended}
            accent="#f87171"
            icon={<CircleSlash size={13} />}
          />
          <StatCard
            label="Pending Invites"
            value={stats.pending}
            accent="#fbbf24"
            icon={<Clock size={13} />}
          />
        </div>

        {/* ── Toolbar ──────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <label
            className="flex flex-1 min-w-[240px] items-center gap-2 h-9 px-3 rounded-lg"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${SLATE_BORDER_STRONG}`,
            }}
          >
            <Search size={13} style={{ color: TEXT_MUTE }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full bg-transparent text-sm outline-none font-sans"
              style={{ color: TEXT }}
              aria-label="Search users"
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="Clear search">
                <X size={12} style={{ color: TEXT_MUTE }} />
              </button>
            )}
          </label>

          <FilterPill
            label="Role"
            value={roleFilter}
            onChange={(v) => setRoleFilter(v as UserRole | "All")}
            options={["All", "Owner", "Partner", "Viewer"]}
          />
          <FilterPill
            label="Status"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as UserStatus | "All")}
            options={["All", "Active", "Suspended"]}
          />

          <div
            className="ml-auto text-xs font-mono"
            style={{ color: TEXT_MUTE }}
          >
            {filtered.length} {filtered.length === 1 ? "user" : "users"}
          </div>
        </div>

        {/* ── Users table ──────────────────────────────────── */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: SLATE_PANEL,
            border: `1px solid ${SLATE_BORDER}`,
            boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    borderBottom: `1px solid ${SLATE_BORDER}`,
                  }}
                >
                  <Th width={56}>&nbsp;</Th>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th width={150}>Role</Th>
                  <Th width={120}>Status</Th>
                  <Th width={130}>Last Login</Th>
                  <Th width={80} align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        hasQuery={!!search || roleFilter !== "All" || statusFilter !== "All"}
                        onInvite={() => setInviteOpen(true)}
                        onClear={() => {
                          setSearch("")
                          setRoleFilter("All")
                          setStatusFilter("All")
                        }}
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      onChangeRole={(r) => changeRole(u.id, r)}
                      onSuspend={() => toggleSuspend(u.id)}
                      onReset={() => resetPassword(u.id)}
                      onRemove={() => setConfirmRemoveId(u.id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Pending invites ──────────────────────────────── */}
        {invites.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">Pending Invites</h2>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono"
                  style={{
                    background: "rgba(251,191,36,0.10)",
                    border: "1px solid rgba(251,191,36,0.28)",
                    color: "#fbbf24",
                  }}
                >
                  <Clock size={10} />
                  {invites.length}
                </span>
              </div>
            </div>

            <div
              className="rounded-xl divide-y"
              style={{
                background: SLATE_PANEL,
                border: `1px solid ${SLATE_BORDER}`,
                // @ts-ignore: tailwind divide utilities don't apply to arbitrary border color in this context
                // Using inline border-bottom per row instead.
              }}
            >
              {invites.map((inv, i) => {
                const meta = ROLE_META[inv.role]
                const Icon = meta.icon
                return (
                  <div
                    key={inv.id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3"
                    style={{
                      borderBottom:
                        i === invites.length - 1 ? "none" : `1px solid ${SLATE_BORDER}`,
                    }}
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: `1px solid ${SLATE_BORDER_STRONG}`,
                        color: TEXT_DIM,
                      }}
                    >
                      <Mail size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{inv.email}</div>
                      <div
                        className="text-xs font-mono mt-0.5"
                        style={{ color: TEXT_MUTE }}
                      >
                        Sent {formatRelative(inv.sentAt)}
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono"
                      style={{
                        background: meta.bg,
                        border: `1px solid ${meta.border}`,
                        color: meta.color,
                      }}
                    >
                      <Icon size={11} />
                      {inv.role}
                      {inv.role === "Partner" && inv.commissionRate != null && (
                        <span style={{ color: TEXT_MUTE }}>· {inv.commissionRate}%</span>
                      )}
                    </span>
                    <button
                      onClick={() => revokeInvite(inv.id)}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-colors"
                      style={{
                        background: "rgba(248,113,113,0.06)",
                        border: "1px solid rgba(248,113,113,0.22)",
                        color: "#f87171",
                      }}
                    >
                      <X size={12} /> Revoke
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Invite modal ─────────────────────────────────────── */}
      {inviteOpen && (
        <InviteModal
          onClose={() => setInviteOpen(false)}
          onSend={sendInvite}
          existingEmails={new Set([
            ...users.map((u) => u.email.toLowerCase()),
            ...invites.map((i) => i.email.toLowerCase()),
          ])}
        />
      )}

      {/* ── Remove confirmation ──────────────────────────────── */}
      {removingUser && (
        <ConfirmDialog
          title="Remove user?"
          description={
            <>
              This will permanently remove{" "}
              <span style={{ color: TEXT }}>{removingUser.name}</span> (
              <span className="font-mono">{removingUser.email}</span>) from your
              workspace. They will lose access immediately.
            </>
          }
          confirmLabel="Remove user"
          destructive
          onCancel={() => setConfirmRemoveId(null)}
          onConfirm={() => removeUser(removingUser.id)}
        />
      )}

      {/* ── Toast ────────────────────────────────────────────── */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-lg text-sm font-medium z-50"
          style={{
            background: "rgba(17,23,31,0.98)",
            border: `1px solid ${EMERALD_BORDER}`,
            color: EMERALD,
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          }}
          role="status"
        >
          {toast}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────

function Th({
  children,
  width,
  align = "left",
}: {
  children: React.ReactNode
  width?: number
  align?: "left" | "right"
}) {
  return (
    <th
      className="px-4 py-3 text-[11px] font-mono font-medium uppercase tracking-[0.08em]"
      style={{
        color: TEXT_MUTE,
        width,
        textAlign: align,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  )
}

function StatCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string
  value: number
  accent?: string
  icon?: React.ReactNode
}) {
  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{
        background: SLATE_PANEL,
        border: `1px solid ${SLATE_BORDER}`,
      }}
    >
      <div
        className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.08em]"
        style={{ color: accent ?? TEXT_MUTE }}
      >
        {icon}
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  )
}

function FilterPill({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  const active = value !== "All"
  return (
    <div
      className="relative flex items-center gap-1.5 px-3 h-9 rounded-lg cursor-pointer transition-colors"
      style={{
        background: active ? EMERALD_SOFT : "rgba(255,255,255,0.03)",
        border: `1px solid ${active ? EMERALD_BORDER : SLATE_BORDER_STRONG}`,
        color: active ? EMERALD : TEXT_DIM,
      }}
    >
      <span className="text-xs font-mono uppercase tracking-[0.06em]">
        {label}:
      </span>
      <span className="text-xs font-medium">{value}</span>
      <ChevronDown size={12} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label={`Filter by ${label}`}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}

function UserRow({
  user,
  onChangeRole,
  onSuspend,
  onReset,
  onRemove,
}: {
  user: TeamUser
  onChangeRole: (role: UserRole) => void
  onSuspend: () => void
  onReset: () => void
  onRemove: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isSuspended = user.status === "Suspended"

  return (
    <tr
      className="transition-colors"
      style={{
        borderBottom: `1px solid ${SLATE_BORDER}`,
        background: "transparent",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = SLATE_ROW_HOVER)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Avatar */}
      <td className="px-4 py-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold font-mono"
          style={{
            background: avatarGradient(user.name),
            color: "#e2e8f0",
            border: `1px solid ${SLATE_BORDER_STRONG}`,
            opacity: isSuspended ? 0.55 : 1,
          }}
          aria-hidden
        >
          {initials(user.name)}
        </div>
      </td>

      {/* Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-medium" style={{ opacity: isSuspended ? 0.55 : 1 }}>
            {user.name}
          </span>
          {user.role === "Partner" && user.commissionRate != null && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono"
              style={{
                background: EMERALD_SOFT,
                border: `1px solid ${EMERALD_BORDER}`,
                color: EMERALD,
              }}
            >
              <Percent size={9} />
              {user.commissionRate}
            </span>
          )}
        </div>
      </td>

      {/* Email */}
      <td
        className="px-4 py-3 font-mono text-xs"
        style={{ color: TEXT_DIM }}
      >
        {user.email}
      </td>

      {/* Role dropdown */}
      <td className="px-4 py-3">
        <RoleDropdown value={user.role} onChange={onChangeRole} />
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge status={user.status} />
      </td>

      {/* Last login */}
      <td
        className="px-4 py-3 font-mono text-xs whitespace-nowrap"
        style={{ color: TEXT_MUTE }}
      >
        {formatRelative(user.lastLogin)}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <div className="relative inline-block">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            onBlur={() => window.setTimeout(() => setMenuOpen(false), 120)}
            className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
            style={{
              background: menuOpen ? "rgba(255,255,255,0.06)" : "transparent",
              border: `1px solid ${menuOpen ? SLATE_BORDER_STRONG : "transparent"}`,
              color: TEXT_DIM,
            }}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={`Actions for ${user.name}`}
          >
            <MoreHorizontal size={15} />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-10 z-20 w-56 rounded-lg py-1"
              role="menu"
              style={{
                background: "rgba(14,18,24,0.98)",
                border: `1px solid ${SLATE_BORDER_STRONG}`,
                boxShadow: "0 12px 32px rgba(0,0,0,0.55)",
                backdropFilter: "blur(12px)",
              }}
            >
              <MenuItem
                onClick={onSuspend}
                icon={<Ban size={13} />}
                label={isSuspended ? "Reactivate account" : "Suspend account"}
                color={isSuspended ? EMERALD : "#fbbf24"}
              />
              <MenuItem
                onClick={onReset}
                icon={<KeyRound size={13} />}
                label="Reset password"
              />
              <div
                className="my-1 h-px"
                style={{ background: SLATE_BORDER }}
              />
              <MenuItem
                onClick={onRemove}
                icon={<Trash2 size={13} />}
                label="Remove user"
                color="#f87171"
                disabled={user.role === "Owner"}
                disabledHint="Cannot remove Owner"
              />
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

function MenuItem({
  onClick,
  icon,
  label,
  color,
  disabled,
  disabledHint,
}: {
  onClick: () => void
  icon: React.ReactNode
  label: string
  color?: string
  disabled?: boolean
  disabledHint?: string
}) {
  return (
    <button
      onMouseDown={(e) => e.preventDefault()} // prevent blur from closing before click
      onClick={() => {
        if (!disabled) onClick()
      }}
      disabled={disabled}
      title={disabled ? disabledHint : undefined}
      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors"
      style={{
        color: disabled ? TEXT_MUTE : (color ?? TEXT),
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = "rgba(255,255,255,0.04)"
      }}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      role="menuitem"
    >
      {icon}
      {label}
    </button>
  )
}

function RoleDropdown({
  value,
  onChange,
}: {
  value: UserRole
  onChange: (role: UserRole) => void
}) {
  const meta = ROLE_META[value]
  const Icon = meta.icon
  return (
    <div
      className="relative inline-flex items-center gap-1.5 h-7 pl-2 pr-1.5 rounded-md cursor-pointer transition-colors"
      style={{
        background: meta.bg,
        border: `1px solid ${meta.border}`,
        color: meta.color,
      }}
    >
      <Icon size={11} />
      <span className="text-xs font-medium">{value}</span>
      <ChevronDown size={11} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as UserRole)}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label="Change role"
      >
        <option value="Owner">Owner</option>
        <option value="Partner">Partner</option>
        <option value="Viewer">Viewer</option>
      </select>
    </div>
  )
}

function StatusBadge({ status }: { status: UserStatus }) {
  const active = status === "Active"
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono"
      style={{
        background: active ? EMERALD_SOFT : "rgba(248,113,113,0.08)",
        border: `1px solid ${active ? EMERALD_BORDER : "rgba(248,113,113,0.28)"}`,
        color: active ? EMERALD : "#f87171",
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          background: active ? EMERALD : "#f87171",
          boxShadow: active ? "0 0 6px rgba(16,185,129,0.7)" : "none",
        }}
      />
      {status}
    </span>
  )
}

function EmptyState({
  hasQuery,
  onInvite,
  onClear,
}: {
  hasQuery: boolean
  onInvite: () => void
  onClear: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{
          background: EMERALD_SOFT,
          border: `1px solid ${EMERALD_BORDER}`,
          color: EMERALD,
        }}
      >
        <UserPlus size={20} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold">
          {hasQuery ? "No users match your filters" : "No users yet"}
        </p>
        <p className="mt-1 text-xs font-mono" style={{ color: TEXT_MUTE }}>
          {hasQuery
            ? "Try clearing your search and filters."
            : "Invite your first teammate to get started."}
        </p>
      </div>
      {hasQuery ? (
        <button
          onClick={onClear}
          className="flex items-center gap-2 h-8 px-3 rounded-md text-xs font-medium"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${SLATE_BORDER_STRONG}`,
            color: TEXT_DIM,
          }}
        >
          <X size={12} /> Clear filters
        </button>
      ) : (
        <button
          onClick={onInvite}
          className="flex items-center gap-2 h-8 px-3 rounded-md text-xs font-medium"
          style={{
            background: EMERALD_SOFT,
            border: `1px solid ${EMERALD_BORDER}`,
            color: EMERALD,
          }}
        >
          <UserPlus size={12} /> Invite user
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Invite modal
// ─────────────────────────────────────────────────────────────────
function InviteModal({
  onClose,
  onSend,
  existingEmails,
}: {
  onClose: () => void
  onSend: (email: string, role: UserRole, commissionRate?: number) => void
  existingEmails: Set<string>
}) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<UserRole>("Viewer")
  const [commission, setCommission] = useState<string>("10")
  const [error, setError] = useState<string | null>(null)

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const emailTaken = existingEmails.has(email.trim().toLowerCase())
  const commissionNum = Number(commission)
  const commissionValid =
    role !== "Partner" ||
    (commission !== "" &&
      !Number.isNaN(commissionNum) &&
      commissionNum >= 0 &&
      commissionNum <= 100)
  const canSend = emailValid && !emailTaken && commissionValid

  const handleSend = () => {
    if (!emailValid) return setError("Enter a valid email address.")
    if (emailTaken) return setError("That email is already a user or has a pending invite.")
    if (!commissionValid) return setError("Commission rate must be between 0 and 100.")
    onSend(
      email.trim(),
      role,
      role === "Partner" ? commissionNum : undefined,
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.62)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-title"
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "rgba(17,23,31,0.98)",
          border: `1px solid ${SLATE_BORDER_STRONG}`,
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${SLATE_BORDER}` }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background: EMERALD_SOFT,
                border: `1px solid ${EMERALD_BORDER}`,
                color: EMERALD,
              }}
            >
              <UserPlus size={14} />
            </div>
            <h2 id="invite-title" className="text-base font-semibold">
              Invite User
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ color: TEXT_DIM }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          {/* Email */}
          <div>
            <label
              className="block text-[11px] font-mono uppercase tracking-[0.08em] mb-1.5"
              style={{ color: TEXT_MUTE }}
              htmlFor="invite-email"
            >
              Email address
            </label>
            <div
              className="flex items-center gap-2 h-10 px-3 rounded-lg"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${
                  email && !emailValid ? "rgba(248,113,113,0.45)" : SLATE_BORDER_STRONG
                }`,
              }}
            >
              <Mail size={14} style={{ color: TEXT_MUTE }} />
              <input
                id="invite-email"
                type="email"
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null)
                }}
                placeholder="teammate@company.com"
                className="w-full bg-transparent text-sm outline-none"
                style={{ color: TEXT }}
              />
            </div>
          </div>

          {/* Role selector */}
          <div>
            <label
              className="block text-[11px] font-mono uppercase tracking-[0.08em] mb-1.5"
              style={{ color: TEXT_MUTE }}
            >
              Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Owner", "Partner", "Viewer"] as UserRole[]).map((r) => {
                const meta = ROLE_META[r]
                const Icon = meta.icon
                const selected = role === r
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r)
                      setError(null)
                    }}
                    className="flex flex-col items-start gap-1 rounded-lg px-3 py-2.5 text-left transition-all"
                    style={{
                      background: selected ? meta.bg : "rgba(255,255,255,0.02)",
                      border: `1px solid ${selected ? meta.border : SLATE_BORDER}`,
                      color: selected ? meta.color : TEXT_DIM,
                    }}
                  >
                    <Icon size={14} />
                    <span className="text-sm font-medium" style={{ color: selected ? meta.color : TEXT }}>
                      {r}
                    </span>
                    <span
                      className="text-[10px] font-mono leading-snug"
                      style={{ color: TEXT_MUTE }}
                    >
                      {r === "Owner" && "Full access"}
                      {r === "Partner" && "Leads + commission"}
                      {r === "Viewer" && "Read-only"}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Commission (Partner only) */}
          {role === "Partner" && (
            <div>
              <label
                className="block text-[11px] font-mono uppercase tracking-[0.08em] mb-1.5"
                style={{ color: TEXT_MUTE }}
                htmlFor="invite-commission"
              >
                Commission rate (optional)
              </label>
              <div
                className="flex items-center gap-2 h-10 px-3 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${SLATE_BORDER_STRONG}`,
                }}
              >
                <Percent size={14} style={{ color: EMERALD }} />
                <input
                  id="invite-commission"
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={commission}
                  onChange={(e) => {
                    setCommission(e.target.value)
                    setError(null)
                  }}
                  placeholder="10"
                  className="w-full bg-transparent text-sm outline-none font-mono"
                  style={{ color: TEXT }}
                />
                <span className="text-xs font-mono" style={{ color: TEXT_MUTE }}>
                  %
                </span>
              </div>
              <p className="mt-1.5 text-[11px]" style={{ color: TEXT_MUTE }}>
                Percentage of each converted lead paid to this partner.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-md text-xs"
              style={{
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.28)",
                color: "#f87171",
              }}
              role="alert"
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-3.5"
          style={{
            borderTop: `1px solid ${SLATE_BORDER}`,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-md text-sm font-medium transition-colors"
            style={{
              background: "transparent",
              color: TEXT_DIM,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="flex items-center gap-2 h-9 px-4 rounded-md text-sm font-semibold transition-all"
            style={{
              background: canSend ? EMERALD : "rgba(16,185,129,0.15)",
              color: canSend ? "#062018" : "rgba(16,185,129,0.5)",
              border: `1px solid ${canSend ? EMERALD : EMERALD_BORDER}`,
              cursor: canSend ? "pointer" : "not-allowed",
              boxShadow: canSend ? "0 4px 14px rgba(16,185,129,0.30)" : "none",
            }}
          >
            <Mail size={13} />
            Send Invite
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Confirm dialog
// ─────────────────────────────────────────────────────────────────
function ConfirmDialog({
  title,
  description,
  confirmLabel,
  destructive,
  onCancel,
  onConfirm,
}: {
  title: string
  description: React.ReactNode
  confirmLabel: string
  destructive?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.62)", backdropFilter: "blur(4px)" }}
      onClick={onCancel}
      role="alertdialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "rgba(17,23,31,0.98)",
          border: `1px solid ${SLATE_BORDER_STRONG}`,
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-start gap-3">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
              style={{
                background: destructive ? "rgba(248,113,113,0.10)" : EMERALD_SOFT,
                border: `1px solid ${destructive ? "rgba(248,113,113,0.28)" : EMERALD_BORDER}`,
                color: destructive ? "#f87171" : EMERALD,
              }}
            >
              <Trash2 size={15} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold">{title}</h3>
              <p
                className="mt-1 text-sm leading-relaxed"
                style={{ color: TEXT_DIM }}
              >
                {description}
              </p>
            </div>
          </div>
        </div>
        <div
          className="flex items-center justify-end gap-2 px-5 py-3.5"
          style={{
            borderTop: `1px solid ${SLATE_BORDER}`,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <button
            onClick={onCancel}
            className="h-9 px-4 rounded-md text-sm font-medium"
            style={{ color: TEXT_DIM }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="h-9 px-4 rounded-md text-sm font-semibold"
            style={{
              background: destructive ? "#ef4444" : EMERALD,
              color: "#ffffff",
              border: `1px solid ${destructive ? "#ef4444" : EMERALD}`,
              boxShadow: destructive
                ? "0 4px 14px rgba(239,68,68,0.30)"
                : "0 4px 14px rgba(16,185,129,0.30)",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
