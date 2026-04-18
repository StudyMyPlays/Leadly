"use client"

import { useMemo, useState } from "react"
import {
  ArrowLeft,
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  X,
  Power,
  Workflow,
  ChevronDown,
  Search,
  Check,
  AlertTriangle,
  Save,
  Filter,
  Hash,
  Zap,
} from "lucide-react"

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────
type ConditionField = "Service" | "City" | "Source" | "Lead Size" | "Time of Day"
type ConditionOperator = "equals" | "contains" | "greater than"
type LogicJoin = "AND" | "OR"

interface Condition {
  id: string
  field: ConditionField
  operator: ConditionOperator
  value: string
}

interface RoutingRule {
  id: string
  name: string
  priority: number
  enabled: boolean
  join: LogicJoin
  conditions: Condition[]
  assignedToId: string
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
}

// ─────────────────────────────────────────────────────────────────
// Sample data
// ─────────────────────────────────────────────────────────────────
const TEAM: TeamMember[] = [
  { id: "u_01", name: "Marcus Chen",   email: "marcus@leados.app",          role: "Owner" },
  { id: "u_02", name: "Elena Vargas",  email: "elena@growthpartners.io",    role: "Partner" },
  { id: "u_03", name: "Devon Park",    email: "devon@growthpartners.io",    role: "Partner" },
  { id: "u_05", name: "Jordan Reeves", email: "jordan@leadscout.co",        role: "Partner" },
  { id: "u_06", name: "Sam Oduya",     email: "sam@leados.app",             role: "Viewer" },
]

const INITIAL_RULES: RoutingRule[] = [
  {
    id: "r_01",
    name: "Austin installations — Elena",
    priority: 1,
    enabled: true,
    join: "AND",
    assignedToId: "u_02",
    conditions: [
      { id: "c_01", field: "Service", operator: "equals", value: "Installation" },
      { id: "c_02", field: "City", operator: "equals", value: "Austin" },
    ],
  },
  {
    id: "r_02",
    name: "High-value Google leads",
    priority: 2,
    enabled: true,
    join: "AND",
    assignedToId: "u_03",
    conditions: [
      { id: "c_03", field: "Source", operator: "equals", value: "Google" },
      { id: "c_04", field: "Lead Size", operator: "greater than", value: "5000" },
    ],
  },
  {
    id: "r_03",
    name: "After-hours overflow",
    priority: 3,
    enabled: false,
    join: "OR",
    assignedToId: "u_05",
    conditions: [
      { id: "c_05", field: "Time of Day", operator: "greater than", value: "18:00" },
      { id: "c_06", field: "Time of Day", operator: "contains", value: "weekend" },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────
// Tokens (scoped to this panel)
// ─────────────────────────────────────────────────────────────────
const EMERALD = "#10b981"
const EMERALD_BRIGHT = "#34d399"
const EMERALD_SOFT = "rgba(16,185,129,0.10)"
const EMERALD_BORDER = "rgba(16,185,129,0.28)"
const EMERALD_GLOW = "0 0 0 1px rgba(16,185,129,0.22), 0 0 20px rgba(16,185,129,0.18)"

const SLATE_BG = "#0b0f14"
const SLATE_PANEL = "rgba(17,23,31,0.92)"
const SLATE_PANEL_SOLID = "#11171f"
const SLATE_BORDER = "rgba(255,255,255,0.06)"
const SLATE_BORDER_STRONG = "rgba(255,255,255,0.10)"
const TEXT = "#e2e8f0"
const TEXT_DIM = "rgba(226,232,240,0.55)"
const TEXT_MUTE = "rgba(226,232,240,0.35)"

const FIELD_OPTIONS: ConditionField[] = ["Service", "City", "Source", "Lead Size", "Time of Day"]
const OPERATOR_OPTIONS: ConditionOperator[] = ["equals", "contains", "greater than"]

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

function avatarGradient(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  const hue = Math.abs(h) % 360
  return `linear-gradient(135deg, hsl(${hue} 55% 28%) 0%, hsl(${(hue + 40) % 360} 55% 20%) 100%)`
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

function summarizeCondition(c: Condition) {
  const value = c.value.trim() || "—"
  return `${c.field} ${c.operator} ${value}`
}

// ─────────────────────────────────────────────────────────────────
// Panel
// ─────────────────────────────────────────────────────────────────
interface LeadRoutingPanelProps {
  onBack?: () => void
}

export default function LeadRoutingPanel({ onBack }: LeadRoutingPanelProps) {
  const [rules, setRules] = useState<RoutingRule[]>(INITIAL_RULES)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<RoutingRule | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Drag state
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2400)
  }

  const sorted = useMemo(
    () => [...rules].sort((a, b) => a.priority - b.priority),
    [rules],
  )

  const stats = useMemo(
    () => ({
      total: rules.length,
      enabled: rules.filter((r) => r.enabled).length,
      conditions: rules.reduce((sum, r) => sum + r.conditions.length, 0),
    }),
    [rules],
  )

  const userById = (id: string) => TEAM.find((u) => u.id === id)

  // ── Actions ────────────────────────────────────────────────────
  const openNew = () => {
    setEditingRule(null)
    setDrawerOpen(true)
  }

  const openEdit = (rule: RoutingRule) => {
    setEditingRule(rule)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setEditingRule(null)
  }

  const saveRule = (rule: RoutingRule) => {
    setRules((prev) => {
      const exists = prev.some((r) => r.id === rule.id)
      return exists ? prev.map((r) => (r.id === rule.id ? rule : r)) : [...prev, rule]
    })
    closeDrawer()
    showToast(editingRule ? "Rule updated" : "Rule created")
  }

  const toggleEnabled = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    )
  }

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id))
    setConfirmDeleteId(null)
    showToast("Rule deleted")
  }

  // ── Drag reorder ───────────────────────────────────────────────
  const handleDragStart = (id: string) => {
    setDragId(id)
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    if (id !== dragOverId) setDragOverId(id)
  }

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) {
      setDragId(null)
      setDragOverId(null)
      return
    }
    const ordered = [...sorted]
    const fromIdx = ordered.findIndex((r) => r.id === dragId)
    const toIdx = ordered.findIndex((r) => r.id === targetId)
    if (fromIdx < 0 || toIdx < 0) return
    const [moved] = ordered.splice(fromIdx, 1)
    ordered.splice(toIdx, 0, moved)
    // Re-assign priority by new order
    const reprioritized = ordered.map((r, i) => ({ ...r, priority: i + 1 }))
    setRules(reprioritized)
    setDragId(null)
    setDragOverId(null)
    showToast("Priority reordered")
  }

  const deletingRule = confirmDeleteId
    ? rules.find((r) => r.id === confirmDeleteId)
    : null

  return (
    <div
      className="min-h-screen w-full font-sans"
      style={{ background: SLATE_BG, color: TEXT }}
    >
      {/* Backdrop glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 0%, rgba(16,185,129,0.07), transparent 40%), radial-gradient(circle at 85% 100%, rgba(16,185,129,0.04), transparent 45%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-8">
        {/* ── Header ──────────────────────────────────────── */}
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
                Lead Routing Rules
              </h1>
              <p
                className="mt-1 text-sm leading-relaxed max-w-xl"
                style={{ color: TEXT_DIM }}
              >
                Automatically assign incoming leads based on conditions. Rules are evaluated in priority order — drag to reorder.
              </p>
            </div>
          </div>

          <button
            onClick={openNew}
            className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: EMERALD_SOFT,
              border: `1px solid ${EMERALD_BORDER}`,
              color: EMERALD,
              boxShadow: EMERALD_GLOW,
            }}
          >
            <Plus size={14} />
            Add Rule
          </button>
        </div>

        {/* ── Stats row ───────────────────────────────────── */}
        {rules.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCard label="Total Rules" value={stats.total} icon={<Workflow size={13} />} />
            <StatCard
              label="Enabled"
              value={stats.enabled}
              accent={EMERALD}
              icon={<Zap size={13} />}
            />
            <StatCard
              label="Conditions"
              value={stats.conditions}
              icon={<Filter size={13} />}
            />
          </div>
        )}

        {/* ── Rules list ──────────────────────────────────── */}
        {rules.length === 0 ? (
          <EmptyState onAdd={openNew} />
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                user={userById(rule.assignedToId)}
                isDragging={dragId === rule.id}
                isDragOver={dragOverId === rule.id && dragId !== rule.id}
                onDragStart={() => handleDragStart(rule.id)}
                onDragOver={(e) => handleDragOver(e, rule.id)}
                onDrop={() => handleDrop(rule.id)}
                onDragEnd={() => {
                  setDragId(null)
                  setDragOverId(null)
                }}
                onToggle={() => toggleEnabled(rule.id)}
                onEdit={() => openEdit(rule)}
                onDelete={() => setConfirmDeleteId(rule.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Slide-in Drawer ──────────────────────────────── */}
      {drawerOpen && (
        <RuleDrawer
          initial={editingRule}
          team={TEAM}
          nextPriority={rules.length + 1}
          onClose={closeDrawer}
          onSave={saveRule}
        />
      )}

      {/* ── Delete confirm ───────────────────────────────── */}
      {deletingRule && (
        <ConfirmDialog
          title="Delete this routing rule?"
          description={
            <>
              Leads will no longer be auto-assigned by{" "}
              <span style={{ color: TEXT }}>“{deletingRule.name}”</span>. This action cannot be undone.
            </>
          }
          confirmLabel="Delete rule"
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => deleteRule(deletingRule.id)}
        />
      )}

      {/* ── Toast ────────────────────────────────────────── */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
          style={{
            background: SLATE_PANEL_SOLID,
            border: `1px solid ${EMERALD_BORDER}`,
            color: EMERALD_BRIGHT,
            boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(16,185,129,0.12)",
          }}
          role="status"
        >
          <Check size={14} />
          {toast}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────────────────────────
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
      className="rounded-xl p-4"
      style={{
        background: SLATE_PANEL,
        border: `1px solid ${SLATE_BORDER}`,
      }}
    >
      <div className="flex items-center gap-2">
        {icon && (
          <span style={{ color: accent ?? TEXT_MUTE }}>{icon}</span>
        )}
        <span
          className="text-[10px] font-mono uppercase tracking-[0.14em]"
          style={{ color: TEXT_MUTE }}
        >
          {label}
        </span>
      </div>
      <div
        className="mt-2 text-2xl font-semibold tabular-nums"
        style={{ color: accent ?? TEXT }}
      >
        {value}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Rule Card
// ─────────────────────────────────────────────────────────────────
function RuleCard({
  rule,
  user,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onToggle,
  onEdit,
  onDelete,
}: {
  rule: RoutingRule
  user?: TeamMember
  isDragging: boolean
  isDragOver: boolean
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  onDragEnd: () => void
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const summary = rule.conditions
    .map(summarizeCondition)
    .join(`  ${rule.join}  `)

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className="group relative rounded-xl transition-all"
      style={{
        background: SLATE_PANEL,
        border: `1px solid ${isDragOver ? EMERALD_BORDER : SLATE_BORDER}`,
        opacity: isDragging ? 0.45 : 1,
        boxShadow: isDragOver
          ? "0 0 0 1px rgba(16,185,129,0.30), 0 8px 32px rgba(0,0,0,0.4)"
          : "0 4px 20px rgba(0,0,0,0.2)",
        transform: isDragOver ? "translateY(-1px)" : "none",
      }}
    >
      <div className="flex items-stretch gap-3 p-4">
        {/* Drag handle + priority */}
        <div className="flex flex-col items-center gap-2 pt-0.5">
          <button
            className="flex h-6 w-6 items-center justify-center rounded-md cursor-grab active:cursor-grabbing transition-colors"
            style={{ color: TEXT_MUTE }}
            aria-label="Drag to reorder"
            title="Drag to reorder"
          >
            <GripVertical size={14} />
          </button>
          <div
            className="flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-[11px] font-mono font-semibold tabular-nums"
            style={{
              background: rule.enabled ? EMERALD_SOFT : "rgba(255,255,255,0.04)",
              border: `1px solid ${rule.enabled ? EMERALD_BORDER : SLATE_BORDER_STRONG}`,
              color: rule.enabled ? EMERALD : TEXT_MUTE,
            }}
            aria-label={`Priority ${rule.priority}`}
          >
            #{rule.priority}
          </div>
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className="text-base font-semibold tracking-tight truncate"
                  style={{ color: rule.enabled ? TEXT : TEXT_DIM }}
                >
                  {rule.name}
                </h3>
                {!rule.enabled && (
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${SLATE_BORDER_STRONG}`,
                      color: TEXT_MUTE,
                    }}
                  >
                    Paused
                  </span>
                )}
              </div>

              {/* Condition summary */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {rule.conditions.map((c, i) => (
                  <span key={c.id} className="flex items-center gap-1.5">
                    {i > 0 && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider"
                        style={{
                          background: "rgba(16,185,129,0.06)",
                          border: `1px solid ${EMERALD_BORDER}`,
                          color: EMERALD,
                        }}
                      >
                        {rule.join}
                      </span>
                    )}
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: `1px solid ${SLATE_BORDER_STRONG}`,
                        color: rule.enabled ? TEXT : TEXT_DIM,
                      }}
                    >
                      <span style={{ color: TEXT_MUTE }}>{c.field}</span>
                      <span style={{ color: TEXT_MUTE }}>·</span>
                      <span style={{ color: TEXT_DIM }}>{c.operator}</span>
                      <span style={{ color: TEXT_MUTE }}>·</span>
                      <span style={{ color: rule.enabled ? EMERALD_BRIGHT : TEXT_DIM }}>
                        {c.value || "—"}
                      </span>
                    </span>
                  </span>
                ))}
              </div>

              {/* Assigned to */}
              {user && (
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className="text-[10px] font-mono uppercase tracking-[0.14em]"
                    style={{ color: TEXT_MUTE }}
                  >
                    Assigned to
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold"
                      style={{
                        background: avatarGradient(user.name),
                        color: TEXT,
                        border: `1px solid ${SLATE_BORDER_STRONG}`,
                      }}
                    >
                      {initials(user.name)}
                    </span>
                    <span className="text-xs font-medium" style={{ color: TEXT }}>
                      {user.name}
                    </span>
                    <span className="text-[11px] font-mono" style={{ color: TEXT_MUTE }}>
                      {user.role}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right rail: toggle + actions */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <Toggle enabled={rule.enabled} onChange={onToggle} />
              <div className="flex items-center gap-1">
                <IconButton onClick={onEdit} label="Edit rule">
                  <Pencil size={13} />
                </IconButton>
                <IconButton
                  onClick={onDelete}
                  label="Delete rule"
                  variant="danger"
                >
                  <Trash2 size={13} />
                </IconButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle status accent line */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[2px] rounded-l-xl"
        style={{
          background: rule.enabled ? EMERALD : "transparent",
          opacity: rule.enabled ? 0.55 : 0,
        }}
        aria-hidden
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Toggle
// ─────────────────────────────────────────────────────────────────
function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean
  onChange: () => void
}) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
      style={{
        background: enabled ? EMERALD : "rgba(255,255,255,0.08)",
        border: `1px solid ${enabled ? EMERALD_BORDER : SLATE_BORDER_STRONG}`,
        boxShadow: enabled ? "0 0 12px rgba(16,185,129,0.35)" : "none",
      }}
    >
      <span
        className="inline-block h-3.5 w-3.5 rounded-full transition-transform"
        style={{
          background: enabled ? "#062018" : "#e2e8f0",
          transform: enabled ? "translateX(18px)" : "translateX(3px)",
        }}
      />
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────
// Icon button
// ─────────────────────────────────────────────────────────────────
function IconButton({
  children,
  onClick,
  label,
  variant = "default",
}: {
  children: React.ReactNode
  onClick: () => void
  label: string
  variant?: "default" | "danger"
}) {
  const isDanger = variant === "danger"
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${SLATE_BORDER_STRONG}`,
        color: isDanger ? "#f87171" : TEXT_DIM,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isDanger
          ? "rgba(248,113,113,0.10)"
          : EMERALD_SOFT
        e.currentTarget.style.borderColor = isDanger
          ? "rgba(248,113,113,0.32)"
          : EMERALD_BORDER
        e.currentTarget.style.color = isDanger ? "#f87171" : EMERALD
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.03)"
        e.currentTarget.style.borderColor = SLATE_BORDER_STRONG
        e.currentTarget.style.color = isDanger ? "#f87171" : TEXT_DIM
      }}
    >
      {children}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center rounded-2xl py-16 px-6"
      style={{
        background: SLATE_PANEL,
        border: `1px dashed ${SLATE_BORDER_STRONG}`,
      }}
    >
      {/* Illustration */}
      <div className="relative mb-6">
        <svg
          width="180"
          height="120"
          viewBox="0 0 180 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          {/* Subtle backing glow */}
          <ellipse cx="90" cy="100" rx="60" ry="6" fill="rgba(16,185,129,0.10)" />

          {/* Source node */}
          <rect
            x="6"
            y="48"
            width="44"
            height="24"
            rx="6"
            fill="rgba(255,255,255,0.04)"
            stroke="rgba(255,255,255,0.10)"
          />
          <circle cx="14" cy="60" r="2.5" fill={EMERALD} />
          <rect x="20" y="56" width="22" height="2.5" rx="1.25" fill="rgba(226,232,240,0.35)" />
          <rect x="20" y="61" width="14" height="2.5" rx="1.25" fill="rgba(226,232,240,0.20)" />

          {/* Decision diamond */}
          <g transform="translate(90 60)">
            <rect
              x="-18"
              y="-18"
              width="36"
              height="36"
              rx="6"
              transform="rotate(45)"
              fill="rgba(16,185,129,0.08)"
              stroke={EMERALD_BORDER}
            />
            <text
              x="0"
              y="3"
              fontFamily="ui-monospace, monospace"
              fontSize="10"
              fontWeight="600"
              textAnchor="middle"
              fill={EMERALD}
            >
              IF
            </text>
          </g>

          {/* Target nodes */}
          <rect
            x="130"
            y="22"
            width="44"
            height="24"
            rx="6"
            fill="rgba(255,255,255,0.04)"
            stroke="rgba(255,255,255,0.10)"
          />
          <circle cx="138" cy="34" r="3.5" fill="hsl(220 55% 28%)" stroke="rgba(255,255,255,0.10)" />
          <rect x="146" y="30" width="22" height="2.5" rx="1.25" fill="rgba(226,232,240,0.35)" />
          <rect x="146" y="35" width="14" height="2.5" rx="1.25" fill="rgba(226,232,240,0.20)" />

          <rect
            x="130"
            y="74"
            width="44"
            height="24"
            rx="6"
            fill="rgba(255,255,255,0.04)"
            stroke="rgba(255,255,255,0.10)"
          />
          <circle cx="138" cy="86" r="3.5" fill="hsl(160 55% 28%)" stroke="rgba(255,255,255,0.10)" />
          <rect x="146" y="82" width="22" height="2.5" rx="1.25" fill="rgba(226,232,240,0.35)" />
          <rect x="146" y="87" width="14" height="2.5" rx="1.25" fill="rgba(226,232,240,0.20)" />

          {/* Connectors */}
          <path
            d="M50 60 L72 60"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <path
            d="M108 50 C 118 40, 122 36, 130 34"
            stroke={EMERALD}
            strokeOpacity="0.55"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M108 70 C 118 80, 122 84, 130 86"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            fill="none"
          />
        </svg>
      </div>

      <h2 className="text-lg font-semibold tracking-tight">No routing rules yet</h2>
      <p
        className="mt-2 max-w-sm text-sm leading-relaxed"
        style={{ color: TEXT_DIM }}
      >
        Create your first rule to automatically assign leads to the right teammate based on service, location, source, or value.
      </p>
      <button
        onClick={onAdd}
        className="mt-6 flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold transition-all"
        style={{
          background: EMERALD_SOFT,
          border: `1px solid ${EMERALD_BORDER}`,
          color: EMERALD,
          boxShadow: EMERALD_GLOW,
        }}
      >
        <Plus size={14} />
        Create First Rule
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Slide-in Drawer (Rule Builder)
// ─────────────────────────────────────────────────────────────────
function RuleDrawer({
  initial,
  team,
  nextPriority,
  onClose,
  onSave,
}: {
  initial: RoutingRule | null
  team: TeamMember[]
  nextPriority: number
  onClose: () => void
  onSave: (rule: RoutingRule) => void
}) {
  const [name, setName] = useState(initial?.name ?? "")
  const [priority, setPriority] = useState<number>(initial?.priority ?? nextPriority)
  const [join, setJoin] = useState<LogicJoin>(initial?.join ?? "AND")
  const [assignedToId, setAssignedToId] = useState<string>(
    initial?.assignedToId ?? team[0]?.id ?? "",
  )
  const [conditions, setConditions] = useState<Condition[]>(
    initial?.conditions ?? [
      { id: uid("c"), field: "Service", operator: "equals", value: "" },
    ],
  )
  const [touched, setTouched] = useState(false)

  const addCondition = () => {
    setConditions((prev) => [
      ...prev,
      { id: uid("c"), field: "Service", operator: "equals", value: "" },
    ])
  }

  const updateCondition = (id: string, patch: Partial<Condition>) => {
    setConditions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    )
  }

  const removeCondition = (id: string) => {
    setConditions((prev) => (prev.length === 1 ? prev : prev.filter((c) => c.id !== id)))
  }

  const errors = useMemo(() => {
    const e: { name?: string; conditions?: string; assignee?: string } = {}
    if (!name.trim()) e.name = "Name is required"
    if (conditions.some((c) => !c.value.trim())) e.conditions = "All conditions need a value"
    if (!assignedToId) e.assignee = "Pick a teammate"
    return e
  }, [name, conditions, assignedToId])

  const isValid = Object.keys(errors).length === 0

  const handleSave = () => {
    setTouched(true)
    if (!isValid) return
    const rule: RoutingRule = {
      id: initial?.id ?? uid("r"),
      name: name.trim(),
      priority: Math.max(1, Math.floor(priority || nextPriority)),
      enabled: initial?.enabled ?? true,
      join,
      assignedToId,
      conditions: conditions.map((c) => ({ ...c, value: c.value.trim() })),
    }
    onSave(rule)
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        className="absolute inset-0"
        style={{
          background: "rgba(2,6,12,0.65)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
        onClick={onClose}
        aria-label="Close drawer"
      />

      {/* Drawer */}
      <aside
        className="absolute right-0 top-0 bottom-0 w-full max-w-[560px] flex flex-col drawer-enter"
        style={{
          background: SLATE_PANEL_SOLID,
          borderLeft: `1px solid ${SLATE_BORDER_STRONG}`,
          boxShadow: "-24px 0 60px rgba(0,0,0,0.55)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={initial ? "Edit routing rule" : "Add routing rule"}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between gap-3 px-6 py-5"
          style={{ borderBottom: `1px solid ${SLATE_BORDER}` }}
        >
          <div>
            <div
              className="text-[11px] font-mono uppercase tracking-[0.14em]"
              style={{ color: TEXT_MUTE }}
            >
              {initial ? "Edit Rule" : "New Rule"}
            </div>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              {initial ? "Edit routing rule" : "Build a routing rule"}
            </h2>
            <p className="mt-1 text-xs" style={{ color: TEXT_DIM }}>
              Define when this rule fires and who gets assigned.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${SLATE_BORDER}`,
              color: TEXT_DIM,
            }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
          {/* Rule name */}
          <Field label="Rule name" error={touched ? errors.name : undefined}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Austin installations — Elena"
              className="w-full h-9 px-3 rounded-lg text-sm outline-none transition-colors font-sans"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${touched && errors.name ? "rgba(248,113,113,0.45)" : SLATE_BORDER_STRONG}`,
                color: TEXT,
              }}
            />
          </Field>

          {/* Priority */}
          <Field label="Priority">
            <div className="relative">
              <Hash
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: TEXT_MUTE }}
              />
              <input
                type="number"
                min={1}
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-32 h-9 pl-8 pr-3 rounded-lg text-sm outline-none font-mono tabular-nums"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${SLATE_BORDER_STRONG}`,
                  color: TEXT,
                }}
              />
              <span className="ml-2 text-xs" style={{ color: TEXT_MUTE }}>
                Lower numbers run first
              </span>
            </div>
          </Field>

          {/* Conditions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                className="text-[11px] font-mono uppercase tracking-[0.14em]"
                style={{ color: TEXT_MUTE }}
              >
                Conditions
              </label>
              <JoinToggle value={join} onChange={setJoin} />
            </div>

            <div className="flex flex-col gap-2">
              {conditions.map((c, i) => (
                <div key={c.id}>
                  {i > 0 && (
                    <div className="flex items-center gap-2 my-1.5 pl-1">
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider"
                        style={{
                          background: "rgba(16,185,129,0.06)",
                          border: `1px solid ${EMERALD_BORDER}`,
                          color: EMERALD,
                        }}
                      >
                        {join}
                      </span>
                      <span
                        className="flex-1 h-px"
                        style={{ background: SLATE_BORDER }}
                        aria-hidden
                      />
                    </div>
                  )}
                  <ConditionRow
                    condition={c}
                    canRemove={conditions.length > 1}
                    onUpdate={(patch) => updateCondition(c.id, patch)}
                    onRemove={() => removeCondition(c.id)}
                  />
                </div>
              ))}
            </div>

            {touched && errors.conditions && (
              <div
                className="mt-2 flex items-center gap-1.5 text-xs"
                style={{ color: "#f87171" }}
              >
                <AlertTriangle size={11} />
                {errors.conditions}
              </div>
            )}

            <button
              onClick={addCondition}
              className="mt-3 flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-semibold transition-colors"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px dashed ${SLATE_BORDER_STRONG}`,
                color: TEXT_DIM,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = EMERALD_BORDER
                e.currentTarget.style.color = EMERALD
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = SLATE_BORDER_STRONG
                e.currentTarget.style.color = TEXT_DIM
              }}
            >
              <Plus size={12} />
              Add condition
            </button>
          </div>

          {/* Assignee */}
          <Field label="Assign to" error={touched ? errors.assignee : undefined}>
            <UserPicker
              users={team}
              value={assignedToId}
              onChange={setAssignedToId}
            />
          </Field>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex items-center justify-end gap-2"
          style={{ borderTop: `1px solid ${SLATE_BORDER}` }}
        >
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${SLATE_BORDER_STRONG}`,
              color: TEXT_DIM,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={touched && !isValid}
            className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: EMERALD_SOFT,
              border: `1px solid ${EMERALD_BORDER}`,
              color: EMERALD,
              boxShadow: EMERALD_GLOW,
              opacity: touched && !isValid ? 0.55 : 1,
              cursor: touched && !isValid ? "not-allowed" : "pointer",
            }}
          >
            <Save size={13} />
            {initial ? "Save Changes" : "Save Rule"}
          </button>
        </div>
      </aside>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Field wrapper
// ─────────────────────────────────────────────────────────────────
function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        className="block mb-1.5 text-[11px] font-mono uppercase tracking-[0.14em]"
        style={{ color: TEXT_MUTE }}
      >
        {label}
      </label>
      {children}
      {error && (
        <div
          className="mt-1.5 flex items-center gap-1.5 text-xs"
          style={{ color: "#f87171" }}
        >
          <AlertTriangle size={11} />
          {error}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// AND/OR join toggle
// ─────────────────────────────────────────────────────────────────
function JoinToggle({
  value,
  onChange,
}: {
  value: LogicJoin
  onChange: (v: LogicJoin) => void
}) {
  return (
    <div
      className="inline-flex p-0.5 rounded-lg"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${SLATE_BORDER_STRONG}`,
      }}
      role="tablist"
      aria-label="Logic join"
    >
      {(["AND", "OR"] as LogicJoin[]).map((opt) => {
        const active = value === opt
        return (
          <button
            key={opt}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt)}
            className="px-2.5 h-6 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider transition-all"
            style={{
              background: active ? EMERALD_SOFT : "transparent",
              color: active ? EMERALD : TEXT_MUTE,
              boxShadow: active ? "inset 0 0 0 1px rgba(16,185,129,0.28)" : "none",
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Condition row
// ─────────────────────────────────────────────────────────────────
function ConditionRow({
  condition,
  canRemove,
  onUpdate,
  onRemove,
}: {
  condition: Condition
  canRemove: boolean
  onUpdate: (patch: Partial<Condition>) => void
  onRemove: () => void
}) {
  return (
    <div
      className="grid gap-2 p-2 rounded-lg"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${SLATE_BORDER}`,
        gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) minmax(0,1.2fr) auto",
      }}
    >
      <NativeSelect
        value={condition.field}
        onChange={(v) => onUpdate({ field: v as ConditionField })}
        options={FIELD_OPTIONS}
      />
      <NativeSelect
        value={condition.operator}
        onChange={(v) => onUpdate({ operator: v as ConditionOperator })}
        options={OPERATOR_OPTIONS}
      />
      <input
        type="text"
        value={condition.value}
        onChange={(e) => onUpdate({ value: e.target.value })}
        placeholder={
          condition.field === "Lead Size"
            ? "e.g. 5000"
            : condition.field === "Time of Day"
            ? "e.g. 18:00"
            : `Enter ${condition.field.toLowerCase()}…`
        }
        className="h-8 px-3 rounded-md text-sm outline-none font-sans min-w-0"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${SLATE_BORDER_STRONG}`,
          color: TEXT,
        }}
      />
      <button
        onClick={onRemove}
        disabled={!canRemove}
        aria-label="Remove condition"
        title={canRemove ? "Remove condition" : "At least one condition required"}
        className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
        style={{
          background: "transparent",
          color: canRemove ? TEXT_MUTE : "rgba(226,232,240,0.15)",
          cursor: canRemove ? "pointer" : "not-allowed",
        }}
        onMouseEnter={(e) => {
          if (canRemove) {
            e.currentTarget.style.background = "rgba(248,113,113,0.10)"
            e.currentTarget.style.color = "#f87171"
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent"
          e.currentTarget.style.color = canRemove ? TEXT_MUTE : "rgba(226,232,240,0.15)"
        }}
      >
        <X size={13} />
      </button>
    </div>
  )
}

// ────────────────────────────���────────────────────────────────────
// Native select (styled)
// ─────────────────────────────────────────────────────────────────
function NativeSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: readonly string[]
}) {
  return (
    <div className="relative min-w-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full h-8 pl-3 pr-7 rounded-md text-sm outline-none font-sans truncate"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${SLATE_BORDER_STRONG}`,
          color: TEXT,
        }}
      >
        {options.map((opt) => (
          <option
            key={opt}
            value={opt}
            style={{ background: SLATE_PANEL_SOLID, color: TEXT }}
          >
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: TEXT_MUTE }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// User picker (popover)
// ─────────────────────────────────────────────────────────────────
function UserPicker({
  users,
  value,
  onChange,
}: {
  users: TeamMember[]
  value: string
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const selected = users.find((u) => u.id === value)
  const filtered = users.filter(
    (u) =>
      !query.trim() ||
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 h-11 px-3 rounded-lg transition-colors"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${open ? EMERALD_BORDER : SLATE_BORDER_STRONG}`,
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold shrink-0"
              style={{
                background: avatarGradient(selected.name),
                color: TEXT,
                border: `1px solid ${SLATE_BORDER_STRONG}`,
              }}
            >
              {initials(selected.name)}
            </span>
            <div className="min-w-0 text-left">
              <div className="text-sm font-medium truncate" style={{ color: TEXT }}>
                {selected.name}
              </div>
              <div
                className="text-[11px] font-mono truncate"
                style={{ color: TEXT_MUTE }}
              >
                {selected.email}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-sm" style={{ color: TEXT_MUTE }}>
            Select a teammate…
          </span>
        )}
        <ChevronDown size={14} style={{ color: TEXT_MUTE }} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className="absolute left-0 right-0 mt-1.5 z-50 rounded-lg overflow-hidden"
            style={{
              background: SLATE_PANEL_SOLID,
              border: `1px solid ${SLATE_BORDER_STRONG}`,
              boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
            }}
            role="listbox"
          >
            <label
              className="flex items-center gap-2 h-9 px-3"
              style={{ borderBottom: `1px solid ${SLATE_BORDER}` }}
            >
              <Search size={12} style={{ color: TEXT_MUTE }} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search teammates…"
                className="w-full bg-transparent text-sm outline-none font-sans"
                style={{ color: TEXT }}
                autoFocus
              />
            </label>
            <div className="max-h-60 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div
                  className="px-3 py-4 text-xs text-center"
                  style={{ color: TEXT_MUTE }}
                >
                  No matches
                </div>
              ) : (
                filtered.map((u) => {
                  const active = u.id === value
                  return (
                    <button
                      key={u.id}
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onChange(u.id)
                        setOpen(false)
                        setQuery("")
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                      style={{
                        background: active ? EMERALD_SOFT : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"
                      }}
                      onMouseLeave={(e) => {
                        if (!active) e.currentTarget.style.background = "transparent"
                      }}
                    >
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold shrink-0"
                        style={{
                          background: avatarGradient(u.name),
                          color: TEXT,
                          border: `1px solid ${SLATE_BORDER_STRONG}`,
                        }}
                      >
                        {initials(u.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate" style={{ color: TEXT }}>
                          {u.name}
                        </div>
                        <div
                          className="text-[11px] font-mono truncate"
                          style={{ color: TEXT_MUTE }}
                        >
                          {u.email} · {u.role}
                        </div>
                      </div>
                      {active && <Check size={13} style={{ color: EMERALD }} />}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ──────────────────────────────────���──────────────────────────────
// Confirm dialog
// ─────────────────────────────────────────────────────────────────
function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string
  description: React.ReactNode
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center px-4">
      <button
        className="absolute inset-0 modal-backdrop"
        style={{
          background: "rgba(2,6,12,0.72)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
        onClick={onCancel}
        aria-label="Close"
      />
      <div
        className="relative w-full max-w-md rounded-xl p-6 modal-enter"
        style={{
          background: SLATE_PANEL_SOLID,
          border: `1px solid ${SLATE_BORDER_STRONG}`,
          boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
        }}
        role="alertdialog"
        aria-labelledby="confirm-title"
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
            style={{
              background: "rgba(248,113,113,0.10)",
              border: "1px solid rgba(248,113,113,0.28)",
              color: "#f87171",
            }}
          >
            <AlertTriangle size={16} />
          </div>
          <div className="min-w-0">
            <h3 id="confirm-title" className="text-base font-semibold">
              {title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed" style={{ color: TEXT_DIM }}>
              {description}
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="h-9 px-4 rounded-lg text-sm font-medium transition-colors"
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
            className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold"
            style={{
              background: "rgba(248,113,113,0.12)",
              border: "1px solid rgba(248,113,113,0.32)",
              color: "#fca5a5",
              boxShadow: "0 0 0 1px rgba(248,113,113,0.18), 0 0 18px rgba(248,113,113,0.14)",
            }}
          >
            <Power size={13} />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
