"use client"

import { useState, useMemo } from "react"
import {
  Search, Plus, Globe, Users, MapPin, PhoneCall, Briefcase,
  Eye, Pencil, Archive, ChevronDown, X, Flame,
  ListFilter, MessageCircle, Send, Tag,
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
    case "website":    return <Globe {...props} />
    case "referral":   return <Users {...props} />
    case "door-knock": return <MapPin {...props} />
    case "call-in":    return <PhoneCall {...props} />
    case "craigslist": return <ListFilter {...props} />
    case "google":     return <Search {...props} />
    case "signage":    return <Tag {...props} />
    case "jobboard":   return <Briefcase {...props} />
    case "other":
    default:           return <Send {...props} />
  }
}

// ── Job size dots ────────────────────────────────────────────────
const JOB_SIZE_COLOR: Record<string, string> = {
  "$":   "rgba(212,216,224,0.4)",
  "$$":  "#f59e0b",
  "$$$": "#10b981",
}

interface LeadsTableProps {
  leads?: Lead[]
  onViewLead: (lead: Lead) => void
  onAddLead: () => void
  currency?: string
  allServices?: string[]
}

const ALL_STATUSES:  LeadStatus[] = ["New", "Contacted", "Estimate", "Converted", "Lost"]
const ALL_SOURCES:   LeadSource[] = ["website", "referral", "door-knock", "call-in", "craigslist", "google", "signage", "jobboard", "other"]
const ALL_PRIORITIES: Priority[]  = ["High", "Medium", "Low"]

export default function LeadsTable({
  leads = SAMPLE_LEADS,
  onViewLead,
  onAddLead,
  currency = "USD",
  allServices = [],
}: LeadsTableProps) {
  const [search, setSearch]             = useState("")
  const [statusFilter, setStatus]       = useState<LeadStatus | "All">("All")
  const [sourceFilter, setSource]       = useState<LeadSource | "All">("All")
  const [serviceFilter, setService]     = useState("All")
  const [priorityFilter, setPriority]   = useState<Priority | "All">("All")
  const [copied, setCopied]             = useState<number | null>(null)

  const services = useMemo(() => Array.from(new Set(leads.map((l) => l.service))), [leads])

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n || 0)

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const q = search.toLowerCase()
      const matchSearch =
        l.name.toLowerCase().includes(q) ||
        (l.businessName ?? "").toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.service.toLowerCase().includes(q)
      const matchStatus   = statusFilter   === "All" || l.status   === statusFilter
      const matchSource   = sourceFilter   === "All" || l.source   === sourceFilter
      const matchService  = serviceFilter  === "All" || l.service  === serviceFilter
      const matchPriority = priorityFilter === "All" || l.priority === priorityFilter
      return matchSearch && matchStatus && matchSource && matchService && matchPriority
    })
  }, [leads, search, statusFilter, sourceFilter, serviceFilter, priorityFilter])

  const copyPhone = (lead: Lead) => {
    navigator.clipboard.writeText(lead.phone).catch(() => {})
    setCopied(lead.id)
    setTimeout(() => setCopied(null), 1500)
  }

  const hasFilters = statusFilter !== "All" || sourceFilter !== "All" || serviceFilter !== "All" || priorityFilter !== "All" || search !== ""

  return (
    <div className="flex flex-col gap-4">

      {/* ── Toolbar ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <label
          className="flex items-center gap-2 px-3 h-9 rounded-lg flex-1 min-w-[220px]"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Search size={13} style={{ color: "rgba(212,216,224,0.35)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search name, business, city, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none w-full text-xs font-mono"
            style={{ color: "#d4d8e0" }}
            aria-label="Search leads"
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search">
              <X size={11} style={{ color: "rgba(212,216,224,0.4)" }} />
            </button>
          )}
        </label>

        {/* Filter chips */}
        <FilterSelect label="Status"   value={statusFilter}   onChange={(v) => setStatus(v as LeadStatus | "All")}     options={["All", ...ALL_STATUSES]} />
        <FilterSelect label="Priority" value={priorityFilter} onChange={(v) => setPriority(v as Priority | "All")}     options={["All", ...ALL_PRIORITIES]} />
        <FilterSelect label="Service"  value={serviceFilter}  onChange={setService}                                   options={["All", ...services]} />
        <FilterSelect label="Source"   value={sourceFilter}   onChange={(v) => setSource(v as LeadSource | "All")}     options={["All", ...ALL_SOURCES]} labelMap={SOURCE_LABELS as Record<string, string>} />

        {hasFilters && (
          <button
            onClick={() => {
              setSearch(""); setStatus("All"); setSource("All"); setService("All"); setPriority("All")
            }}
            className="text-xs font-mono h-9 px-3 rounded-lg flex items-center gap-1.5"
            style={{ color: "#f87171", border: "1px solid rgba(248,113,113,0.22)", background: "rgba(248,113,113,0.06)" }}
          >
            <X size={11} /> Clear
          </button>
        )}

        <div className="text-xs font-mono ml-auto" style={{ color: "rgba(212,216,224,0.35)" }}>
          {filtered.length} lead{filtered.length !== 1 ? "s" : ""}
        </div>

        {/* Add New Lead CTA */}
        <button
          onClick={onAddLead}
          className="flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-semibold font-sans"
          style={{
            background: "rgba(59,130,246,0.14)",
            border: "1px solid rgba(59,130,246,0.35)",
            color: "#93c5fd",
            boxShadow: "0 0 14px rgba(59,130,246,0.16)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(59,130,246,0.22)"
            e.currentTarget.style.boxShadow  = "0 0 22px rgba(59,130,246,0.28)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(59,130,246,0.14)"
            e.currentTarget.style.boxShadow  = "0 0 14px rgba(59,130,246,0.16)"
          }}
        >
          <Plus size={14} />
          Add New Lead
        </button>
      </div>

      {/* ── Table panel ───────────────────────────────────────── */}
      <div
        className="glass-card rounded-xl overflow-hidden"
        style={{ boxShadow: "0 4px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-sans" style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: 1100 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.025)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Lead / Business", "Phone", "Service", "Source", "Status", "Priority", "Size", "Last Contact", "Est. Value", ""].map((h, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 text-left font-medium text-[10px] uppercase tracking-[0.14em] font-mono"
                    style={{ color: "rgba(212,216,224,0.42)", whiteSpace: "nowrap" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <EmptyState hasSearch={hasFilters} onAdd={onAddLead} />
              ) : (
                filtered.map((lead) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    fmt={fmt}
                    copied={copied}
                    onCopy={copyPhone}
                    onView={onViewLead}
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
  return (
    <div
      className="relative flex items-center gap-1.5 px-3 h-9 rounded-lg cursor-pointer"
      style={{
        background: isActive ? "rgba(59,130,246,0.10)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${isActive ? "rgba(59,130,246,0.32)" : "rgba(255,255,255,0.08)"}`,
        color: isActive ? "#93c5fd" : "rgba(212,216,224,0.5)",
      }}
    >
      <span className="text-xs font-mono whitespace-nowrap">
        {value === "All" ? label : (labelMap?.[value] ?? value)}
      </span>
      <ChevronDown size={11} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full opacity-0 cursor-pointer"
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
  lead, fmt, copied, onCopy, onView, allServices,
}: {
  lead: Lead
  fmt: (n: number) => string
  copied: number | null
  onCopy: (l: Lead) => void
  onView: (l: Lead) => void
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
      <td className="px-4 py-3" style={{ minWidth: 200 }}>
        <div className="flex items-center gap-2.5">
          <Avatar name={lead.name} />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold font-sans text-[13px]" style={{ color: "#eaecef" }}>{lead.name}</span>
              {lead.priority === "High" && (
                <Flame size={10} style={{ color: "#f87171" }} />
              )}
            </div>
            {lead.businessName ? (
              <span className="text-[11px] font-sans truncate" style={{ color: "rgba(212,216,224,0.55)", maxWidth: 180 }}>
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

      {/* Phone — click to copy */}
      <td
        className="px-4 py-3 font-mono"
        style={{ color: "rgba(212,216,224,0.5)", minWidth: 130 }}
        onClick={(e) => { e.stopPropagation(); onCopy(lead) }}
        title="Click to copy"
      >
        <span
          className="cursor-pointer hover:underline"
          style={{ color: copied === lead.id ? "#10b981" : "rgba(212,216,224,0.6)" }}
        >
          {copied === lead.id ? "Copied!" : lead.phone}
        </span>
      </td>

      {/* Service */}
      <td className="px-4 py-3" style={{ minWidth: 130 }}>
        <span
          className="inline-block px-2 py-0.5 rounded-md text-xs font-mono"
          style={{
            background: `${svc}14`,
            border: `1px solid ${svc}30`,
            color: svc,
          }}
        >
          {lead.service}
        </span>
      </td>

      {/* Source */}
      <td className="px-4 py-3" style={{ minWidth: 130 }}>
        <div
          className="flex items-center gap-1.5 text-xs font-mono"
          style={{ color: "rgba(212,216,224,0.55)" }}
          title={SOURCE_LABELS[lead.source]}
        >
          <SourceIcon source={lead.source} />
          <span className="hidden md:inline">{SOURCE_LABELS[lead.source]}</span>
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

      {/* Last contact + touchpoints */}
      <td className="px-4 py-3" style={{ minWidth: 130 }}>
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
        </div>
      </td>

      {/* Est. Value */}
      <td className="px-4 py-3 font-mono font-semibold text-right" style={{ color: "#34d399" }}>
        {fmt(lead.estValue)}
      </td>

      {/* Actions */}
      <td
        className="px-4 py-3"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 100 }}
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
          <ActionBtn color="rgba(212,216,224,0.4)" label="Archive" onClick={() => {}}>
            <Archive size={12} />
          </ActionBtn>
        </div>
      </td>
    </tr>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")

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
