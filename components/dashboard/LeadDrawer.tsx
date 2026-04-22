"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { createPortal } from "react-dom"
import {
  X, Phone, Mail, MapPin, Globe, Users, PhoneCall, Clock,
  FileText, Activity, Pencil, Save, RotateCcw, Trash2, AlertCircle,
  DollarSign, Check, Copy, Building2, Flame, Calendar, Target,
  FileCheck, MessageSquare, ListFilter, Search, Tag, Send, Briefcase,
} from "lucide-react"
import {
  Lead, LeadStatus, LeadSource, JobSize, Priority,
  STATUS_CONFIG, PRIORITY_CONFIG, getServiceColor,
} from "./leads-data"

interface LeadDrawerProps {
  lead: Lead | null
  onClose: () => void
  onUpdate?: (lead: Lead) => void
  onDelete?: (leadId: number) => void
  currency?: string
  services?: string[]
  cities?: string[]
}

const ALL_STATUSES: LeadStatus[] = ["New", "Contacted", "In Progress", "Won", "Lost", "Dead"]
const ALL_SOURCES: { value: LeadSource; label: string }[] = [
  { value: "website",       label: "Website" },
  { value: "referral",      label: "Referral" },
  { value: "word-of-mouth", label: "Word of Mouth" },
  { value: "door-knock",    label: "Door Knock" },
  { value: "call-in",       label: "Call-In" },
  { value: "craigslist",    label: "Craigslist" },
  { value: "google",        label: "Google Search" },
  { value: "signage",       label: "Signage" },
  { value: "jobboard",      label: "Job Board" },
  { value: "other",         label: "Other" },
]
const JOB_SIZES: JobSize[] = ["$", "$$", "$$$"]
const ALL_PRIORITIES: Priority[] = ["High", "Medium", "Low"]

export default function LeadDrawer({
  lead,
  onClose,
  onUpdate,
  onDelete,
  currency = "USD",
  services = [],
  cities = [],
}: LeadDrawerProps) {
  const [mounted, setMounted]   = useState(false)
  const [closing, setClosing]   = useState(false)
  const [activeTab, setActiveTab] = useState<"info" | "notes" | "activity">("info")
  const [draft, setDraft]       = useState<Lead | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [discardOpen, setDiscardOpen]     = useState(false)
  const [toast, setToast]       = useState<string | null>(null)
  const [copied, setCopied]     = useState<"phone" | "email" | null>(null)
  const firstInputRef           = useRef<HTMLInputElement>(null)

  // Portal mount
  useEffect(() => { setMounted(true) }, [])

  // Sync incoming lead → draft
  useEffect(() => {
    if (lead) {
      setDraft({ ...lead })
      setActiveTab("info")
      setClosing(false)
      setConfirmDelete(false)
      setDiscardOpen(false)
    }
  }, [lead])

  const isDirty = useMemo(() => {
    if (!lead || !draft) return false
    return (
      draft.name            !== lead.name            ||
      draft.businessName    !== lead.businessName    ||
      draft.phone           !== lead.phone           ||
      draft.email           !== lead.email           ||
      draft.city            !== lead.city            ||
      draft.service         !== lead.service         ||
      draft.source          !== lead.source          ||
      draft.jobSize         !== lead.jobSize         ||
      draft.status          !== lead.status          ||
      draft.priority        !== lead.priority        ||
      draft.estValue        !== lead.estValue        ||
      draft.quoteAmount     !== lead.quoteAmount     ||
      draft.quoteSent       !== lead.quoteSent       ||
      draft.lastContactDate !== lead.lastContactDate ||
      draft.nextActionDate  !== lead.nextActionDate  ||
      draft.nextActionLabel !== lead.nextActionLabel ||
      draft.notes           !== lead.notes
    )
  }, [lead, draft])

  // Escape key — close or cancel discard prompt
  useEffect(() => {
    if (!lead) return
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      if (discardOpen)     return setDiscardOpen(false)
      if (confirmDelete)   return setConfirmDelete(false)
      attemptClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead, isDirty, discardOpen, confirmDelete])

  // Lock body scroll while open
  useEffect(() => {
    if (!lead) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [lead])

  const attemptClose = () => {
    if (isDirty) return setDiscardOpen(true)
    hardClose()
  }

  const hardClose = () => {
    setClosing(true)
    setTimeout(() => { onClose(); setClosing(false); setDraft(null) }, 200)
  }

  const patch = <K extends keyof Lead>(k: K, v: Lead[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d))

  const handleSave = () => {
    if (!draft || !lead || !isDirty) return
    const updated: Lead = { ...draft }

    // Auto-log status change
    if (draft.status !== lead.status) {
      const stamp = new Date().toLocaleString("en-US", {
        month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
      })
      updated.activity = [
        ...(draft.activity ?? []),
        {
          id: `act-${Date.now()}`,
          timestamp: stamp,
          text: `Status changed to ${draft.status}.`,
        },
      ]
    }

    onUpdate?.(updated)
    setDraft(updated)
    setToast("Changes saved")
    setTimeout(() => setToast(null), 2200)
  }

  const handleReset = () => {
    if (!lead) return
    setDraft({ ...lead })
  }

  const handleDelete = () => {
    if (!lead) return
    onDelete?.(lead.id)
    setConfirmDelete(false)
    hardClose()
  }

  const copyField = (kind: "phone" | "email", value: string) => {
    if (!value) return
    navigator.clipboard.writeText(value).catch(() => {})
    setCopied(kind)
    setTimeout(() => setCopied(null), 1400)
  }

  if (!mounted || (!lead && !closing) || !draft) return null

  const sc       = STATUS_CONFIG[draft.status]
  const svcColor = getServiceColor(draft.service, services)
  const pri      = draft.priority ? PRIORITY_CONFIG[draft.priority] : null
  const fmt      = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency", currency, maximumFractionDigits: 0,
    }).format(n || 0)

  const ui = (
    <>
      {/* Backdrop */}
      <div
        onClick={attemptClose}
        aria-hidden="true"
        className="modal-backdrop"
        style={{
          position: "fixed", inset: 0, zIndex: 9990,
          background: "rgba(0,0,0,0.62)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          opacity: closing ? 0 : 1,
          transition: "opacity 0.2s ease",
        }}
      />

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Lead ${lead?.name ?? ""}`}
        className={closing ? "drawer-exit" : "drawer-enter"}
        style={{
          position: "fixed",
          top: 0, right: 0, bottom: 0,
          width: "min(520px, 100vw)",
          zIndex: 9991,
          display: "flex",
          flexDirection: "column",
          background: "#0b0f14",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "-12px 0 60px rgba(0,0,0,0.75)",
        }}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <div
          className="flex items-start justify-between gap-3 px-6 py-5 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-mono uppercase tracking-[0.14em]"
                style={{ color: "rgba(212,216,224,0.38)" }}
              >
                Lead · #{draft.id}
              </span>
              {isDirty && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.1em] px-1.5 py-0.5 rounded"
                  style={{
                    background: "rgba(251,191,36,0.10)",
                    border: "1px solid rgba(251,191,36,0.25)",
                    color: "#fbbf24",
                  }}
                >
                  <span
                    style={{
                      width: 5, height: 5, borderRadius: 9999,
                      background: "#fbbf24",
                      boxShadow: "0 0 6px #fbbf24",
                    }}
                  />
                  Unsaved
                </span>
              )}
            </div>
            <input
              ref={firstInputRef}
              value={draft.name}
              onChange={(e) => patch("name", e.target.value)}
              className="bg-transparent outline-none text-lg font-semibold tracking-tight w-full"
              style={{ color: "#eaecef" }}
              aria-label="Lead name"
            />
            {draft.businessName ? (
              <div className="flex items-center gap-1.5">
                <Building2 size={10} style={{ color: "rgba(212,216,224,0.45)" }} />
                <span
                  className="text-[12px] font-sans truncate"
                  style={{ color: "rgba(212,216,224,0.78)" }}
                >
                  {draft.businessName}
                </span>
              </div>
            ) : null}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1 text-[11px] font-mono"
                style={{ color: "rgba(212,216,224,0.4)" }}
              >
                <MapPin size={10} /> {draft.city || "—"}
              </span>
              <span
                className="inline-block px-2 py-0.5 rounded-md text-[11px] font-mono badge-3d"
                style={{
                  background: `${svcColor}14`,
                  border: `1px solid ${svcColor}30`,
                  color: svcColor,
                }}
              >
                {draft.service || "—"}
              </span>
              <span className={`${sc.badge} badge-3d inline-block px-2 py-0.5 rounded-full text-[11px]`}>
                {sc.label}
              </span>
              {pri && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider"
                  style={{
                    background: pri.bg,
                    border: `1px solid ${pri.border}`,
                    color: pri.color,
                  }}
                >
                  {draft.priority === "High" && <Flame size={9} />}
                  {pri.label}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={attemptClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(212,216,224,0.55)",
            }}
            aria-label="Close drawer"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Quick stats row ─────────────────────────────── */}
        <div
          className="grid grid-cols-3 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <StatCell label="Est. Value" color="#39FF14" glow>
            <div className="flex items-center justify-center gap-1">
              <DollarSign size={12} style={{ color: "rgba(57,255,20,0.5)" }} />
              <input
                type="number"
                min={0}
                value={draft.estValue || ""}
                onChange={(e) => patch("estValue", Number(e.target.value) || 0)}
                placeholder="0"
                className="bg-transparent outline-none text-center font-bold font-mono w-full"
                style={{
                  color: "#39FF14",
                  textShadow: "0 0 10px rgba(57,255,20,0.4)",
                  fontSize: 15,
                }}
                aria-label="Estimated value"
              />
            </div>
            <span className="text-[10px] font-mono mt-1" style={{ color: "rgba(212,216,224,0.35)" }}>
              {fmt(draft.estValue)}
            </span>
          </StatCell>
          <StatCell label="Job Size" color="#FFB800" divider>
            <div className="flex items-center justify-center gap-1 mt-1">
              {JOB_SIZES.map((sz) => {
                const active = draft.jobSize === sz
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => patch("jobSize", sz)}
                    className="px-2 py-0.5 rounded-md text-[11px] font-bold font-mono"
                    style={{
                      background: active ? "rgba(255,184,0,0.14)" : "rgba(255,255,255,0.04)",
                      border: active ? "1px solid rgba(255,184,0,0.4)" : "1px solid rgba(255,255,255,0.08)",
                      color: active ? "#FFB800" : "rgba(212,216,224,0.38)",
                      boxShadow: active ? "0 0 8px rgba(255,184,0,0.2)" : "none",
                      transition: "all 0.12s ease",
                    }}
                    aria-label={`Set job size ${sz}`}
                    aria-pressed={active}
                  >
                    {sz}
                  </button>
                )
              })}
            </div>
          </StatCell>
          <StatCell label="Date Added" color="rgba(212,216,224,0.7)" divider>
            <span
              className="text-[13px] font-mono font-semibold"
              style={{ color: "rgba(212,216,224,0.7)" }}
            >
              {draft.dateAdded}
            </span>
          </StatCell>
        </div>

        {/* ── Tabs ────────────────────────────────────────── */}
        <div
          className="flex gap-1 px-4 pt-3 pb-2 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <TabBtn active={activeTab === "info"}     onClick={() => setActiveTab("info")}     icon={<Pencil  size={11} />}>Details</TabBtn>
          <TabBtn active={activeTab === "notes"}    onClick={() => setActiveTab("notes")}    icon={<FileText size={11} />}>Notes</TabBtn>
          <TabBtn active={activeTab === "activity"} onClick={() => setActiveTab("activity")} icon={<Activity size={11} />}>
            Activity
            <span
              className="ml-1 px-1 rounded text-[9px] font-bold"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(212,216,224,0.55)" }}
            >
              {draft.activity?.length ?? 0}
            </span>
          </TabBtn>
        </div>

        {/* ── Tab content (scrollable) ────────────────────── */}
        <div
          className="flex-1 overflow-y-auto px-6 py-5"
          style={{ paddingBottom: isDirty ? 96 : 24 }}
        >
          {activeTab === "info" && (
            <InfoTab
              draft={draft}
              patch={patch}
              services={services}
              cities={cities}
              copied={copied}
              onCopy={copyField}
              currency={currency}
            />
          )}

          {activeTab === "notes" && (
            <NotesTab
              value={draft.notes}
              onChange={(v) => patch("notes", v)}
            />
          )}

          {activeTab === "activity" && (
            <ActivityTab entries={draft.activity} />
          )}

          {/* Status updater (always visible below content) */}
          <div
            className="mt-6 rounded-xl p-4 flex flex-col gap-3"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <p
              className="text-[10px] font-mono uppercase tracking-[0.14em]"
              style={{ color: "rgba(212,216,224,0.42)" }}
            >
              Pipeline Stage
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_STATUSES.map((s) => {
                const cfg = STATUS_CONFIG[s]
                const active = draft.status === s
                return (
                  <button
                    key={s}
                    onClick={() => patch("status", s)}
                    className={`${cfg.badge} badge-3d px-3 py-1 rounded-full text-[11px] font-mono`}
                    style={{
                      opacity: active ? 1 : 0.42,
                      transform: active ? "scale(1.05)" : "scale(1)",
                      boxShadow: active ? `0 0 12px ${cfg.color}55` : "none",
                      transition: "all 0.15s ease",
                      cursor: "pointer",
                    }}
                    aria-pressed={active}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Danger zone */}
          <div className="mt-6">
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 text-[11px] font-mono px-3 py-1.5 rounded-lg"
              style={{
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#f87171",
              }}
            >
              <Trash2 size={12} /> Delete lead
            </button>
          </div>
        </div>

        {/* ── Save bar (appears when dirty) ───────────────── */}
        {isDirty && (
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-3 px-6 py-3"
            style={{
              background: "rgba(11,15,20,0.96)",
              borderTop: "1px solid rgba(16,185,129,0.25)",
              backdropFilter: "blur(10px)",
              animation: "slideUpFade 0.18s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <span
              className="flex items-center gap-2 text-[11px] font-mono"
              style={{ color: "rgba(212,216,224,0.55)" }}
            >
              <span
                style={{
                  width: 6, height: 6, borderRadius: 9999,
                  background: "#fbbf24", boxShadow: "0 0 8px #fbbf24",
                }}
              />
              Unsaved changes
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 h-8 px-3 rounded-md text-[11px] font-mono"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  color: "rgba(212,216,224,0.6)",
                }}
              >
                <RotateCcw size={11} /> Reset
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 h-8 px-4 rounded-md text-[11px] font-semibold font-sans"
                style={{
                  background: "rgba(16,185,129,0.18)",
                  border: "1px solid rgba(16,185,129,0.4)",
                  color: "#34d399",
                  boxShadow: "0 0 16px rgba(16,185,129,0.28)",
                }}
              >
                <Save size={12} /> Save changes
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 9999,
            padding: "10px 16px", borderRadius: 10,
            background: "rgba(16,185,129,0.14)",
            border: "1px solid rgba(16,185,129,0.38)",
            color: "#34d399",
            fontSize: 12, fontFamily: "var(--font-mono)",
            boxShadow: "0 10px 40px rgba(16,185,129,0.24)",
            animation: "slideUpFade 0.2s ease",
          }}
          role="status"
        >
          <span className="inline-flex items-center gap-2">
            <Check size={13} /> {toast}
          </span>
        </div>
      )}

      {/* Discard confirm */}
      {discardOpen && (
        <ConfirmDialog
          icon={<AlertCircle size={18} />}
          accent="#fbbf24"
          title="Discard changes?"
          body="You have unsaved changes to this lead. Closing now will discard them."
          confirmLabel="Discard"
          onCancel={() => setDiscardOpen(false)}
          onConfirm={() => { setDiscardOpen(false); hardClose() }}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <ConfirmDialog
          icon={<Trash2 size={18} />}
          accent="#f87171"
          title="Delete this lead?"
          body={`“${lead?.name}” will be permanently removed. This cannot be undone.`}
          confirmLabel="Delete lead"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
        />
      )}

      <style>{`
        @keyframes slideUpFade {
          from { transform: translateY(8px); opacity: 0 }
          to   { transform: translateY(0);   opacity: 1 }
        }
      `}</style>
    </>
  )

  return createPortal(ui, document.body)
}

// ── Sub-components ───────────────────────────────────────────────

function TabBtn({
  active, onClick, icon, children,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium font-sans"
      style={{
        background: active ? "rgba(16,185,129,0.1)" : "transparent",
        color: active ? "#34d399" : "rgba(212,216,224,0.45)",
        border: active ? "1px solid rgba(16,185,129,0.28)" : "1px solid transparent",
        transition: "all 0.12s ease",
      }}
      aria-pressed={active}
    >
      {icon} {children}
    </button>
  )
}

function StatCell({
  label, color, glow, divider, children,
}: {
  label: string
  color: string
  glow?: boolean
  divider?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className="flex flex-col items-center justify-center py-3 px-2"
      style={{
        borderLeft: divider ? "1px solid rgba(255,255,255,0.06)" : undefined,
        minHeight: 68,
      }}
    >
      <div className="flex flex-col items-center gap-0.5 w-full">
        {children}
        <span
          className="text-[10px] font-mono uppercase tracking-[0.12em]"
          style={{ color: "rgba(212,216,224,0.38)" }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}

function InfoTab({
  draft, patch, services, cities, copied, onCopy, currency,
}: {
  draft: Lead
  patch: <K extends keyof Lead>(k: K, v: Lead[K]) => void
  services: string[]
  cities: string[]
  copied: "phone" | "email" | null
  onCopy: (kind: "phone" | "email", value: string) => void
  currency: string
}) {
  const sourceIcon = (s: LeadSource) => {
    const p = { size: 12, style: { color: "rgba(212,216,224,0.5)" } }
    if (s === "website")    return <Globe     {...p} />
    if (s === "referral")   return <Users     {...p} />
    if (s === "door-knock") return <MapPin    {...p} />
    if (s === "call-in")    return <PhoneCall {...p} />
    if (s === "craigslist") return <ListFilter {...p} />
    if (s === "google")     return <Search    {...p} />
    if (s === "signage")    return <Tag       {...p} />
    if (s === "jobboard")   return <Briefcase {...p} />
    return                         <Send      {...p} />
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n || 0)

  return (
    <div className="flex flex-col gap-3">
      {/* Business name */}
      <EditRow label="Business" icon={<Building2 size={12} />}>
        <input
          type="text"
          value={draft.businessName ?? ""}
          onChange={(e) => patch("businessName", e.target.value)}
          placeholder="e.g. Acme Properties LLC"
          className="bg-transparent outline-none w-full text-[13px] font-sans"
          style={{ color: "#eaecef" }}
          aria-label="Business name"
        />
      </EditRow>

      {/* Phone with copy */}
      <EditRow label="Phone" icon={<Phone size={12} />}>
        <div className="flex items-center gap-2 w-full">
          <input
            type="tel"
            value={draft.phone}
            onChange={(e) => patch("phone", e.target.value)}
            placeholder="+1 555 000 0000"
            className="bg-transparent outline-none flex-1 text-[13px] font-mono"
            style={{ color: "#eaecef" }}
            aria-label="Phone number"
          />
          {draft.phone && (
            <button
              onClick={() => onCopy("phone", draft.phone)}
              className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
              style={{
                background: copied === "phone" ? "rgba(57,255,20,0.12)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${copied === "phone" ? "rgba(57,255,20,0.35)" : "rgba(255,255,255,0.08)"}`,
                color: copied === "phone" ? "#39FF14" : "rgba(212,216,224,0.5)",
                transition: "all 0.12s ease",
              }}
              aria-label="Copy phone"
              title="Copy phone"
            >
              {copied === "phone" ? <Check size={11} /> : <Copy size={11} />}
            </button>
          )}
        </div>
      </EditRow>

      {/* Email with copy */}
      <EditRow label="Email" icon={<Mail size={12} />}>
        <div className="flex items-center gap-2 w-full">
          <input
            type="email"
            value={draft.email ?? ""}
            onChange={(e) => patch("email", e.target.value)}
            placeholder="name@example.com"
            className="bg-transparent outline-none flex-1 text-[13px] font-sans"
            style={{ color: "#eaecef" }}
            aria-label="Email address"
          />
          {draft.email && (
            <button
              onClick={() => onCopy("email", draft.email ?? "")}
              className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
              style={{
                background: copied === "email" ? "rgba(57,255,20,0.12)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${copied === "email" ? "rgba(57,255,20,0.35)" : "rgba(255,255,255,0.08)"}`,
                color: copied === "email" ? "#39FF14" : "rgba(212,216,224,0.5)",
                transition: "all 0.12s ease",
              }}
              aria-label="Copy email"
              title="Copy email"
            >
              {copied === "email" ? <Check size={11} /> : <Copy size={11} />}
            </button>
          )}
        </div>
      </EditRow>

      {/* City */}
      <EditRow label="City" icon={<MapPin size={12} />}>
        <input
          type="text"
          value={draft.city}
          onChange={(e) => patch("city", e.target.value)}
          list="lead-cities"
          placeholder="e.g. Austin, TX"
          className="bg-transparent outline-none w-full text-[13px] font-sans"
          style={{ color: "#eaecef" }}
          aria-label="City"
        />
        {cities.length > 0 && (
          <datalist id="lead-cities">
            {cities.map((c) => <option key={c} value={c} />)}
          </datalist>
        )}
      </EditRow>

      {/* Service */}
      <EditRow label="Service" icon={<FileText size={12} />}>
        <input
          type="text"
          value={draft.service}
          onChange={(e) => patch("service", e.target.value)}
          list="lead-services"
          placeholder="e.g. Installation"
          className="bg-transparent outline-none w-full text-[13px] font-sans"
          style={{ color: "#eaecef" }}
          aria-label="Service"
        />
        {services.length > 0 && (
          <datalist id="lead-services">
            {services.map((s) => <option key={s} value={s} />)}
          </datalist>
        )}
      </EditRow>

      {/* Source */}
      <EditRow label="Source" icon={sourceIcon(draft.source)}>
        <select
          value={draft.source}
          onChange={(e) => patch("source", e.target.value as LeadSource)}
          className="bg-transparent outline-none w-full text-[13px] font-sans cursor-pointer"
          style={{ color: "#eaecef", appearance: "none" }}
          aria-label="Source"
        >
          {ALL_SOURCES.map((s) => (
            <option key={s.value} value={s.value} style={{ background: "#0b0f14" }}>
              {s.label}
            </option>
          ))}
        </select>
      </EditRow>

      {/* Priority */}
      <EditRow label="Priority" icon={<Flame size={12} />}>
        <div className="flex items-center gap-1.5 w-full">
          {ALL_PRIORITIES.map((p) => {
            const cfg    = PRIORITY_CONFIG[p]
            const active = draft.priority === p
            return (
              <button
                key={p}
                type="button"
                onClick={() => patch("priority", p)}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider"
                style={{
                  background: active ? cfg.bg : "rgba(255,255,255,0.03)",
                  border: `1px solid ${active ? cfg.border : "rgba(255,255,255,0.07)"}`,
                  color: active ? cfg.color : "rgba(212,216,224,0.4)",
                  transition: "all 0.12s ease",
                }}
                aria-pressed={active}
              >
                {cfg.label}
              </button>
            )
          })}
        </div>
      </EditRow>

      {/* Section divider */}
      <div
        className="flex items-center gap-2 mt-2 mb-0.5"
        aria-hidden="true"
      >
        <span
          className="text-[10px] font-mono uppercase tracking-[0.14em]"
          style={{ color: "rgba(212,216,224,0.42)" }}
        >
          Engagement
        </span>
        <span className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>

      {/* Last contact */}
      <EditRow label="Last Contact" icon={<MessageSquare size={12} />}>
        <input
          type="text"
          value={draft.lastContactDate ?? ""}
          onChange={(e) => patch("lastContactDate", e.target.value)}
          placeholder="e.g. Mar 14"
          className="bg-transparent outline-none w-full text-[13px] font-mono"
          style={{ color: "#eaecef" }}
          aria-label="Last contact date"
        />
      </EditRow>

      {/* Next action */}
      <EditRow label="Next Action" icon={<Target size={12} />}>
        <div className="flex items-center gap-2 w-full">
          <input
            type="text"
            value={draft.nextActionLabel ?? ""}
            onChange={(e) => patch("nextActionLabel", e.target.value)}
            placeholder="e.g. Follow up call"
            className="bg-transparent outline-none flex-1 text-[13px] font-sans"
            style={{ color: "#eaecef" }}
            aria-label="Next action label"
          />
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <Calendar size={10} style={{ color: "rgba(212,216,224,0.4)" }} />
            <input
              type="text"
              value={draft.nextActionDate ?? ""}
              onChange={(e) => patch("nextActionDate", e.target.value)}
              placeholder="Mar 18"
              className="bg-transparent outline-none text-[11px] font-mono"
              style={{ color: "#eaecef", width: 64 }}
              aria-label="Next action date"
            />
          </div>
        </div>
      </EditRow>

      {/* Section divider */}
      <div className="flex items-center gap-2 mt-2 mb-0.5" aria-hidden="true">
        <span
          className="text-[10px] font-mono uppercase tracking-[0.14em]"
          style={{ color: "rgba(212,216,224,0.42)" }}
        >
          Quote
        </span>
        <span className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>

      {/* Quote sent */}
      <EditRow label="Quote" icon={<FileCheck size={12} />}>
        <div className="flex items-center justify-between gap-2 w-full">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!draft.quoteSent}
              onChange={(e) => patch("quoteSent", e.target.checked)}
              className="sr-only"
              aria-label="Quote sent"
            />
            <span
              className="w-4 h-4 rounded flex items-center justify-center"
              style={{
                background: draft.quoteSent ? "rgba(16,185,129,0.18)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${draft.quoteSent ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.12)"}`,
              }}
            >
              {draft.quoteSent && <Check size={10} style={{ color: "#34d399" }} />}
            </span>
            <span
              className="text-[12px] font-sans"
              style={{ color: draft.quoteSent ? "#34d399" : "rgba(212,216,224,0.6)" }}
            >
              {draft.quoteSent ? "Sent" : "Not sent yet"}
            </span>
          </label>

          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <DollarSign size={10} style={{ color: "rgba(52,211,153,0.5)" }} />
            <input
              type="number"
              min={0}
              value={draft.quoteAmount ?? ""}
              onChange={(e) => patch("quoteAmount", Number(e.target.value) || undefined)}
              placeholder="Amount"
              className="bg-transparent outline-none text-[11px] font-mono text-right"
              style={{ color: "#34d399", width: 80 }}
              aria-label="Quote amount"
            />
          </div>
        </div>
      </EditRow>

      {draft.quoteAmount ? (
        <div
          className="text-[10px] font-mono text-right -mt-1"
          style={{ color: "rgba(212,216,224,0.45)" }}
        >
          {fmt(draft.quoteAmount)}
        </div>
      ) : null}

      {/* Touchpoints readout */}
      <div
        className="flex items-center justify-between px-3 py-2 rounded-lg mt-1"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px dashed rgba(255,255,255,0.07)",
        }}
      >
        <span
          className="flex items-center gap-1.5 text-[11px] font-mono"
          style={{ color: "rgba(212,216,224,0.55)" }}
        >
          <MessageSquare size={11} /> Touchpoints
        </span>
        <span
          className="text-[12px] font-mono font-bold"
          style={{ color: (draft.numberOfTouchpoints ?? 0) > 0 ? "#34d399" : "rgba(212,216,224,0.4)" }}
        >
          {draft.numberOfTouchpoints ?? 0}
        </span>
      </div>
    </div>
  )
}

function EditRow({
  label, icon, children,
}: {
  label: string; icon: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span
        className="flex items-center justify-center w-5 h-5 flex-shrink-0"
        style={{ color: "rgba(212,216,224,0.42)" }}
      >
        {icon}
      </span>
      <span
        className="text-[10px] font-mono uppercase tracking-[0.12em] w-14 flex-shrink-0"
        style={{ color: "rgba(212,216,224,0.38)" }}
      >
        {label}
      </span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

function NotesTab({
  value, onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <label
        className="text-[10px] font-mono uppercase tracking-[0.14em]"
        style={{ color: "rgba(212,216,224,0.42)" }}
      >
        Lead Notes
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        placeholder="Add notes about this lead…"
        className="w-full rounded-lg p-3 text-[13px] font-sans resize-none outline-none"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#eaecef",
          lineHeight: 1.6,
        }}
      />
      <p className="text-[11px] font-mono" style={{ color: "rgba(212,216,224,0.35)" }}>
        Tip: use the Save button at the bottom to persist your notes and any other edits.
      </p>
    </div>
  )
}

function ActivityTab({ entries }: { entries: Lead["activity"] }) {
  if (!entries?.length) {
    return (
      <div
        className="text-center py-10 rounded-lg"
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px dashed rgba(255,255,255,0.08)",
        }}
      >
        <p className="text-[12px] font-mono" style={{ color: "rgba(212,216,224,0.4)" }}>
          No activity yet.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p
        className="text-[10px] font-mono uppercase tracking-[0.14em]"
        style={{ color: "rgba(212,216,224,0.42)" }}
      >
        Activity Log
      </p>
      <div className="flex flex-col gap-0">
        {entries.slice().reverse().map((entry, i, arr) => (
          <div key={entry.id} className="flex gap-3 relative">
            {i < arr.length - 1 && (
              <div
                className="absolute left-[7px] top-5 w-px"
                style={{ height: "calc(100% - 4px)", background: "rgba(255,255,255,0.08)" }}
              />
            )}
            <div
              className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-1"
              style={{
                background: i === 0 ? "#34d399" : "rgba(255,255,255,0.1)",
                border: `2px solid ${i === 0 ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.12)"}`,
                boxShadow: i === 0 ? "0 0 8px rgba(16,185,129,0.45)" : "none",
              }}
            />
            <div className="pb-4 flex flex-col gap-0.5 min-w-0">
              <span className="text-[12px] font-sans" style={{ color: "rgba(212,216,224,0.78)" }}>
                {entry.text}
              </span>
              <span
                className="flex items-center gap-1 text-[11px] font-mono"
                style={{ color: "rgba(212,216,224,0.32)" }}
              >
                <Clock size={9} /> {entry.timestamp}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ConfirmDialog({
  icon, accent, title, body, confirmLabel, onCancel, onConfirm,
}: {
  icon: React.ReactNode
  accent: string
  title: string
  body: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed", inset: 0, zIndex: 9995,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(380px, 94vw)",
          background: "#0c1016",
          border: `1px solid ${accent}40`,
          borderRadius: 14,
          boxShadow: `0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px ${accent}10`,
          padding: 20,
        }}
      >
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: `${accent}14`,
              border: `1px solid ${accent}40`,
              color: accent,
            }}
          >
            {icon}
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold font-sans" style={{ color: "#eaecef" }}>
              {title}
            </h3>
            <p className="text-[12px] font-sans leading-relaxed" style={{ color: "rgba(212,216,224,0.6)" }}>
              {body}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            className="h-8 px-3 rounded-md text-[11px] font-mono"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(212,216,224,0.55)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="h-8 px-4 rounded-md text-[11px] font-semibold font-sans"
            style={{
              background: `${accent}22`,
              border: `1px solid ${accent}60`,
              color: accent,
              boxShadow: `0 0 12px ${accent}35`,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
