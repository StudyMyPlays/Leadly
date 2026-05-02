"use client"

import { useState, useMemo } from "react"
import {
  Search, Plus, Globe, Users, MapPin, PhoneCall, Briefcase,
  Eye, Pencil, Archive, ChevronDown, ChevronUp, ChevronsUpDown, X, Flame,
  ListFilter, MessageCircle, Send, Tag, UsersRound, Mail, Calendar,
} from "lucide-react"
import {
  Lead, LeadStatus, LeadSource, Priority,
  STATUS_CONFIG, SOURCE_LABELS, PRIORITY_CONFIG, getServiceColor,
  SAMPLE_LEADS,
} from "./leads-data"

// ── Source icons ─────────────────────────────────────────────────
function SourceIcon({ source }: { source: LeadSource }) {
  const props = { size: 12, style: { color: "rgba(212,216,224,0.55)" } }
  switch (source) {
    case "website":        return <Globe {...props} />
    case "referral":       return <Users {...props} />
    case "word-of-mouth":  return <UsersRound {...props} />
    case "door-knock":     return <MapPin {...props} />
    case "call-in":        return <PhoneCall {...props} />
    case "craigslist":     return <ListFilter {...props} />
    case "google":         return <Search {...props} />
    case "signage":        return <Tag {...props} />
    case "jobboard":       return <Briefcase {...props} />
    case "other":
    default:               return <Send {...props} />
  }
}

// ── Job size dots ────────────────────────────────────────────────
const JOB_SIZE_COLOR: Record<string, string> = {
  "$":   "rgba(212,216,224,0.4)",
  "$$":  "#f59e0b",
  "$$$": "#10b981",
}

// ── Sort infrastructure ──────────────────────────────────────────
type SortKey =
  | "name" | "service" | "source" | "status" | "priority"
  | "jobSize" | "lastContactDate" | "estValue" | "dateAdded"
type SortDir = "asc" | "desc"

interface LeadsTableProps {
  leads?: Lead[]
  onViewLead: (lead: Lead) => void
  onAddLead: () => void
  onArchiveLead?: (id: number) => void
  currency?: string
  allServices?: string[]
}

const ALL_STATUSES: LeadStatus[] = ["New", "Contacted", "In Progress", "Won", "Lost", "Dead"]
const ALL_SOURCES: LeadSource[] = [
  "website", "referral", "word-of-mouth", "door-knock", "call-in",
  "craigslist", "google", "signage", "jobboard", "other",
]
const ALL_PRIORITIES: Priority[] = ["High", "Medium", "Low"]
const STATUS_SORT_RANK: Record<LeadStatus, number> = {
  "New": 0, "Contacted": 1, "In Progress": 2, "Won": 3, "Lost": 4, "Dead": 5,
}
const PRIORITY_SORT_RANK: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 }
const JOB_SIZE_SORT_RANK: Record<string, number> = { "$": 1, "$$": 2, "$$$": 3 }

export default function LeadsTable({
  leads = SAMPLE_LEADS,
  onViewLead,
  onAddLead,
  onArchiveLead,
  currency = "USD",
  allServices = [],
}: LeadsTableProps) {
  const [search, setSearch]             = useState("")
  const [statusFilter, setStatus]       = useState<LeadStatus | "All">("All")
  const [sourceFilter, setSource]       = useState<LeadSource | "All">("All")
  const [serviceFilter, setService]     = useState("All")
  const [priorityFilter, setPriority]   = useState<Priority | "All">("All")
  const [sortKey, setSortKey]           = useState<SortKey>("dateAdded")
  const [sortDir, setSortDir]           = useState<SortDir>("desc")
  const [copied, setCopied]             = useState<number | null>(null)

  const services = useMemo(() => Array.from(new Set(leads.map((l) => l.service))), [leads])

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n || 0)

  // ── Filter ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const q = search.toLowerCase()
      const matchSearch =
        l.name.toLowerCase().includes(q) ||
        (l.businessName ?? "").toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        (l.email ?? "").toLowerCase().includes(q) ||
        l.service.toLowerCase().includes(q)
      const matchStatus   = statusFilter   === "All" || l.status   === statusFilter
      const matchSource   = sourceFilter   === "All" || l.source   === sourceFilter
      const matchService  = serviceFilter  === "All" || l.service  === serviceFilter
      const matchPriority = priorityFilter === "All" || l.priority === priorityFilter
      return matchSearch && matchStatus && matchSource && matchService && matchPriority
    })
  }, [leads, search, statusFilter, sourceFilter, serviceFilter, priorityFilter])

  // ── Sort ────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    const dirMul = sortDir === "asc" ? 1 : -1
    const value = (l: Lead): number | string => {
      switch (sortKey) {
        case "name":             return l.name.toLowerCase()
        case "service":          return l.service.toLowerCase()
        case "source":           return l.source
        case "status":           return STATUS_SORT_RANK[l.status] ?? 99
        case "priority":         return PRIORITY_SORT_RANK[l.priority] ?? 99
        case "jobSize":          return JOB_SIZE_SORT_RANK[l.jobSize] ?? 0
        case "estValue":         return l.estValue ?? 0
        case "lastContactDate":  return l.lastContactDate ? Date.parse(l.lastContactDate) || 0 : 0
        case "dateAdded":        return Date.parse(l.dateAdded) || 0
      }
    }
    return [...filtered].sort((a, b) => {
      const av = value(a); const bv = value(b)
      if (av < bv) return -1 * dirMul
      if (av > bv) return  1 * dirMul
      return 0
    })
  }, [filtered, sortKey, sortDir])

  const copyPhone = (lead: Lead) => {
    navigator.clipboard.writeText(lead.phone).catch(() => {})
    setCopied(lead.id)
    setTimeout(() => setCopied(null), 1500)
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir(key === "estValue" || key === "dateAdded" || key === "lastContactDate" ? "desc" : "asc") }
  }

  const hasFilters =
    statusFilter !== "All" || sourceFilter !== "All" ||
    serviceFilter !== "All" || priorityFilter !== "All" || search !== ""

  // ── Header config ───────────────────────────────────────────
  const columns: { key: SortKey | null; label: string; className?: string }[] = [
    { key: "name",            label: "Lead / Business" },
    { key: null,              label: "Contact" },
    { key: "service",         label: "Service" },
    { key: "source",          label: "Source" },
    { key: "status",          label: "Status" },
    { key: "priority",        label: "Priority" },
    { key: "jobSize",         label: "Size" },
    { key: "lastContactDate", label: "Last Contact" },
    { key: "estValue",        label: "Est. Value", className: "text-right" },
    { key: null,              label: "" },
  ]

  return (
    <div className="flex flex-col gap-4">

      {/* ── Toolbar ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <label
          className="toolbar-pill flex items-center gap-2 pl-3 pr-2 h-9 flex-1 min-w-[240px]"
        >
          <Search size={13} style={{ color: "rgba(212,216,224,0.45)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search name, business, city, phone, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none w-full text-[13px] font-sans"
            style={{ color: "#e5e7eb" }}
            aria-label="Search leads"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="flex items-center justify-center w-5 h-5 rounded-md"
              style={{
                color: "rgba(212,216,224,0.5)",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <X size={11} />
            </button>
          )}
        </label>

        {/* Filter dropdowns — outlined pills with chevron */}
        <FilterSelect
          label="Status" value={statusFilter}
          onChange={(v) => setStatus(v as LeadStatus | "All")}
          options={["All", ...ALL_STATUSES]}
        />
        <FilterSelect
          label="Priority" value={priorityFilter}
          onChange={(v) => setPriority(v as Priority | "All")}
          options={["All", ...ALL_PRIORITIES]}
        />
        <FilterSelect label="Service" value={serviceFilter} onChange={setService} options={["All", ...services]} />
        <FilterSelect
          label="Source" value={sourceFilter}
          onChange={(v) => setSource(v as LeadSource | "All")}
          options={["All", ...ALL_SOURCES]}
          labelMap={SOURCE_LABELS as Record<string, string>}
        />

        {/* Compact reset icon button — only rendered when any filter is active */}
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch(""); setStatus("All"); setSource("All"); setService("All"); setPriority("All")
            }}
            aria-label="Clear all filters"
            title="Clear all filters"
            className="toolbar-icon-btn flex flex-shrink-0 items-center justify-center w-9 h-9"
          >
            <X size={13} style={{ color: "#f87171" }} />
          </button>
        )}

        {/*
          Right-aligned cluster: count + CTA travel together.
          ml-auto lives on this wrapper (not the count) so when the count is
          hidden on mobile, the CTA still hugs the right edge instead of
          collapsing into the filter row or wrapping alone on its own line.
        */}
        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          <div
            className="text-[11px] font-mono whitespace-nowrap hidden md:block"
            style={{ color: "rgba(212,216,224,0.4)" }}
          >
            {sorted.length} lead{sorted.length !== 1 ? "s" : ""}
          </div>

          {/* Add New Lead — solid primary CTA */}
          <button
            onClick={onAddLead}
            className="toolbar-primary-btn flex flex-shrink-0 items-center gap-1.5 h-9 px-4 text-[13px] font-semibold font-sans whitespace-nowrap"
          >
            <Plus size={14} strokeWidth={2.5} />
            Add New Lead
          </button>
        </div>
      </div>

      {/* ── Table panel ───────────────────────────────────────── */}
      <div
        className="glass-card rounded-xl"
        style={{ boxShadow: "0 4px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)", overflow: "clip" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-sans" style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: 1180 }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
              <tr style={{ background: "rgba(8,8,10,0.97)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {columns.map((col, i) => {
                  const active = col.key && sortKey === col.key
                  return (
                    <th
                      key={i}
                      className={`px-4 py-3 text-left font-medium text-[10px] uppercase tracking-[0.14em] font-mono ${col.className ?? ""}`}
                      style={{
                        color: active ? "#93c5fd" : "rgba(212,216,224,0.42)",
                        whiteSpace: "nowrap",
                        cursor: col.key ? "pointer" : "default",
                        userSelect: "none",
                        transition: "color 0.12s ease",
                        ...(i === columns.length - 1 ? {
                          position: "sticky", right: 0, zIndex: 5,
                          background: "rgba(8,8,10,0.97)",
                          borderLeft: "1px solid rgba(255,255,255,0.04)",
                        } : {}),
                      }}
                      onClick={col.key ? () => toggleSort(col.key as SortKey) : undefined}
                      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                    >
                      <span className={`inline-flex items-center gap-1 ${col.className === "text-right" ? "justify-end w-full" : ""}`}>
                        {col.label}
                        {col.key && (
                          active
                            ? (sortDir === "asc"
                                ? <ChevronUp size={11} />
                                : <ChevronDown size={11} />)
                            : <ChevronsUpDown size={11} style={{ opacity: 0.28 }} />
                        )}
                      </span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <EmptyState hasSearch={hasFilters} onAdd={onAddLead} />
              ) : (
                sorted.map((lead) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    fmt={fmt}
                    copied={copied}
                    onCopy={copyPhone}
                    onView={onViewLead}
                    onArchive={onArchiveLead}
                    allServices={allServices.length ? allServices : services}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────

function FilterSelect({
  label, value, onChange, options, labelMap,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  labelMap?: Record<string, string>
}) {
  const isActive = value !== "All"
  const displayValue = value === "All" ? label : (labelMap?.[value] ?? value)
  return (
    <div
      className="toolbar-pill relative flex flex-shrink-0 items-center gap-2 pl-3 pr-2.5 h-9 cursor-pointer"
      data-active={isActive ? "true" : "false"}
      style={{
        color: isActive ? "#93c5fd" : "rgba(212,216,224,0.7)",
      }}
    >
      {isActive && (
        <span
          aria-hidden="true"
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{
            background: "#60a5fa",
            boxShadow: "0 0 6px rgba(96,165,250,0.55)",
          }}
        />
      )}
      <span className="text-[13px] font-sans whitespace-nowrap">{displayValue}</span>
      <ChevronDown size={12} style={{ opacity: 0.6, flexShrink: 0 }} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        aria-label={`Filter by ${label}`}
      >
        {options.map((o) => (
          <option key={o} value={o}>{labelMap?.[o] ?? o}</option>
        ))}
      </select>
    </div>
  )
}

function LeadRow({
  lead, fmt, copied, onCopy, onView, onArchive, allServices,
}: {
  lead: Lead
  fmt: (n: number) => string
  copied: number | null
  onCopy: (l: Lead) => void
  onView: (l: Lead) => void
  onArchive?: (id: number) => void
  allServices: string[]
}) {
  const sc  = STATUS_CONFIG[lead.status]
  const svc = getServiceColor(lead.service, allServices)
  const pri = lead.priority ? PRIORITY_CONFIG[lead.priority] : null
  const touches = lead.numberOfTouchpoints ?? 0

  return (
    <tr
      className="table-row-hover group"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}
      onClick={() => onView(lead)}
    >
      {/* Lead + Business */}
      <td className="px-4 py-3" style={{ minWidth: 220 }}>
        <div className="flex items-center gap-2.5">
          <Avatar name={lead.name} />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold font-sans text-[13px]" style={{ color: "#eaecef" }}>{lead.name}</span>
              {lead.priority === "High" && <Flame size={10} style={{ color: "#f87171" }} />}
              <span
                className="ml-1 text-[9px] font-mono uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: "rgba(212,216,224,0.28)" }}
              >
                #{lead.id}
              </span>
            </div>
            {lead.businessName ? (
              <span className="text-[11px] font-sans truncate" style={{ color: "rgba(212,216,224,0.55)", maxWidth: 200 }}>
                {lead.businessName}
              </span>
            ) : null}
            <span
              className="text-[10px] font-mono mt-0.5 inline-flex items-center gap-1"
              style={{ color: "rgba(212,216,224,0.35)" }}
            >
              <MapPin size={9} />
              {lead.city}
            </span>
          </div>
        </div>
      </td>

      {/* Contact cluster — phone + email */}
      <td className="px-4 py-3" style={{ minWidth: 160 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => onCopy(lead)}
            className="inline-flex items-center gap-1.5 text-[11px] font-mono hover:underline w-fit"
            style={{ color: copied === lead.id ? "#10b981" : "rgba(212,216,224,0.62)" }}
            title="Click to copy"
          >
            <PhoneCall size={10} style={{ color: "rgba(212,216,224,0.42)" }} />
            {copied === lead.id ? "Copied!" : lead.phone}
          </button>
          {lead.email ? (
            <a
              href={`mailto:${lead.email}`}
              className="inline-flex items-center gap-1.5 text-[10px] font-mono truncate hover:underline"
              style={{ color: "rgba(212,216,224,0.4)", maxWidth: 160 }}
              title={lead.email}
            >
              <Mail size={9} />
              {lead.email}
            </a>
          ) : null}
        </div>
      </td>

      {/* Service */}
      <td className="px-4 py-3" style={{ minWidth: 130 }}>
        <span
          className="inline-block px-2 py-0.5 rounded-md text-xs font-mono truncate align-middle"
          style={{
            background: `${svc}14`,
            border: `1px solid ${svc}30`,
            color: svc,
            maxWidth: 140,
          }}
          title={lead.service}
        >
          {lead.service}
        </span>
      </td>

      {/* Source */}
      <td className="px-4 py-3" style={{ minWidth: 140 }}>
        <div
          className="flex items-center gap-1.5 text-xs font-mono"
          style={{ color: "rgba(212,216,224,0.55)" }}
          title={SOURCE_LABELS[lead.source]}
        >
          <SourceIcon source={lead.source} />
          <span>{SOURCE_LABELS[lead.source]}</span>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span className={`${sc.badge} inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono`}>
          <span
            className="w-1 h-1 rounded-full"
            style={{ background: sc.color, boxShadow: `0 0 4px ${sc.color}` }}
          />
          {sc.label}
        </span>
      </td>

      {/* Priority */}
      <td className="px-4 py-3">
        {pri ? (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider"
            style={{
              background: pri.bg,
              border: `1px solid ${pri.border}`,
              color: pri.color,
            }}
          >
            <span
              className="w-1 h-1 rounded-full"
              style={{ background: pri.color, boxShadow: `0 0 4px ${pri.color}` }}
            />
            {pri.label}
          </span>
        ) : (
          <span className="text-[11px] font-mono" style={{ color: "rgba(212,216,224,0.3)" }}>—</span>
        )}
      </td>

      {/* Job size */}
      <td className="px-4 py-3 font-mono font-bold" style={{ color: JOB_SIZE_COLOR[lead.jobSize], width: 48 }}>
        {lead.jobSize}
      </td>

      {/* Last contact + touchpoints + follow-up */}
      <td className="px-4 py-3" style={{ minWidth: 150 }}>
        <div className="flex flex-col">
          <span
            className="text-[11px] font-mono"
            style={{ color: lead.lastContactDate ? "rgba(212,216,224,0.65)" : "rgba(212,216,224,0.3)" }}
          >
            {lead.lastContactDate || "—"}
          </span>
          <span
            className="text-[10px] font-mono flex items-center gap-1 mt-0.5"
            style={{ color: touches > 0 ? "rgba(16,185,129,0.65)" : "rgba(212,216,224,0.3)" }}
          >
            <MessageCircle size={9} /> {touches} touch{touches !== 1 ? "es" : ""}
          </span>
          {lead.followUpDate ? (
            <span
              className="text-[10px] font-mono flex items-center gap-1 mt-0.5"
              style={{ color: "rgba(245,158,11,0.75)" }}
              title="Follow-up scheduled"
            >
              <Calendar size={9} /> {lead.followUpDate}
            </span>
          ) : null}
        </div>
      </td>

      {/* Est. Value */}
      <td className="px-4 py-3 font-mono font-semibold text-right" style={{ color: "#34d399" }}>
        {fmt(lead.estValue)}
      </td>

      {/* Actions — sticky right so it stays visible during horizontal scroll */}
      <td
        className="px-4 py-3"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 110,
          position: "sticky",
          right: 0,
          background: "rgba(8,8,10,0.99)",
          borderLeft: "1px solid rgba(255,255,255,0.03)",
        }}
      >
        <div
          className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100"
          style={{ transition: "opacity 0.15s ease" }}
        >
          <ActionBtn color="#60a5fa" label="View" onClick={() => onView(lead)}>
            <Eye size={12} />
          </ActionBtn>
          <ActionBtn color="#c084fc" label="Edit" onClick={() => onView(lead)}>
            <Pencil size={12} />
          </ActionBtn>
          <ActionBtn
            color="rgba(212,216,224,0.4)"
            label="Archive"
            onClick={() => onArchive?.(lead.id)}
          >
            <Archive size={12} />
          </ActionBtn>
        </div>
      </td>
    </tr>
  )
}

function Avatar({ name }: { name: string }) {
  // Always produce at least two characters so single-word names
  // (e.g. "Madonna") still render a proper glyph instead of a single letter.
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean)
  let initials: string
  if (parts.length === 0) {
    initials = "??"
  } else if (parts.length === 1) {
    const w = parts[0]
    initials = (w.length >= 2 ? w.slice(0, 2) : w + w).toUpperCase()
  } else {
    initials = (parts[0][0] + parts[1][0]).toUpperCase()
  }

  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  const hue = Math.abs(h) % 360

  return (
    <span
      className="flex items-center justify-center flex-shrink-0 font-mono text-[10px] font-semibold"
      style={{
        width: 32,
        height: 32,
        borderRadius: 9,
        background: `linear-gradient(135deg, hsl(${hue} 55% 22%) 0%, hsl(${(hue + 40) % 360} 55% 14%) 100%)`,
        border: "1px solid rgba(255,255,255,0.06)",
        color: "#eaecef",
      }}
      aria-hidden
    >
      {initials}
    </span>
  )
}

function ActionBtn({
  color, label, onClick, children,
}: {
  color: string; label: string; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      className="w-7 h-7 rounded-md flex items-center justify-center"
      style={{
        background: `${color}14`,
        border: `1px solid ${color}2a`,
        color,
        transition: "background 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `${color}24`
        e.currentTarget.style.boxShadow  = `0 0 8px ${color}44`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = `${color}14`
        e.currentTarget.style.boxShadow  = "none"
      }}
    >
      {children}
    </button>
  )
}

function EmptyState({ hasSearch, onAdd }: { hasSearch: boolean; onAdd: () => void }) {
  return (
    <tr>
      <td colSpan={10}>
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div
            style={{
              animation: "spin 4s linear infinite",
              color: "rgba(59,130,246,0.45)",
              filter: "drop-shadow(0 0 8px rgba(59,130,246,0.25))",
            }}
          >
            <Search size={40} strokeWidth={1.2} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold font-sans" style={{ color: "rgba(212,216,224,0.65)" }}>
              {hasSearch ? "No leads found" : "No leads yet"}
            </p>
            <p className="text-xs font-mono mt-1" style={{ color: "rgba(212,216,224,0.35)" }}>
              {hasSearch ? "Try adjusting your filters or search query." : "Add your first lead to get started."}
            </p>
          </div>
          {!hasSearch && (
            <button
              onClick={onAdd}
              className="flex items-center gap-2 h-9 px-5 rounded-lg text-xs font-semibold font-sans mt-1"
              style={{
                background: "rgba(59,130,246,0.14)",
                border: "1px solid rgba(59,130,246,0.35)",
                color: "#93c5fd",
                boxShadow: "0 0 18px rgba(59,130,246,0.18)",
              }}
            >
              <Plus size={14} /> Add your first lead
            </button>
          )}
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </td>
    </tr>
  )
}
