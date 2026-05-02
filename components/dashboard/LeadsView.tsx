"use client"

import { useState, useMemo, useCallback } from "react"
import {
  TrendingUp, Flame, Target, Sparkles, Download, ArrowUpRight, ArrowDownRight,
  LineChart as LineChartIcon, PieChart as PieIcon, MapPin,
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, CartesianGrid,
} from "recharts"
import LeadsTable from "./LeadsTable"
import LeadDrawer from "./LeadDrawer"
import AddLeadModal from "./AddLeadModal"
import FunnelKPIs from "./FunnelKPIs"
import {
  Lead, SAMPLE_LEADS, STATUS_CONFIG, LeadSource, JobSize,
  LeadStatus, Priority, ContactMethod,
} from "./leads-data"
import type { NotificationType } from "@/lib/notifications"

interface LeadsViewProps {
  config: {
    accentColor: string
    currency: string
    services: string[]
    cities: string[]
  }
  leads?: Lead[]
  addNotification?: (type: NotificationType, message: string) => void
}

// ── Palette ─────────────────────────────────────────────────────
const BLUE = "#3b82f6"
const EMERALD = "#10b981"
const TEXT = "#e2e8f0"
const TEXT_DIM = "rgba(226,232,240,0.55)"
const TEXT_MUTE = "rgba(226,232,240,0.38)"
const PANEL_BORDER = "rgba(255,255,255,0.06)"

const WEEKLY_DATA = [
  { day: "Mon", leads: 14, closed: 4 },
  { day: "Tue", leads: 21, closed: 7 },
  { day: "Wed", leads: 18, closed: 5 },
  { day: "Thu", leads: 28, closed: 11 },
  { day: "Fri", leads: 35, closed: 15 },
  { day: "Sat", leads: 22, closed: 9 },
  { day: "Sun", leads: 10, closed: 3 },
]

const chartTooltipStyle: React.CSSProperties = {
  background: "rgba(8,10,14,0.96)",
  border: "1px solid rgba(59,130,246,0.22)",
  borderRadius: 10,
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  color: TEXT,
  boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
  padding: "8px 10px",
}

export default function LeadsView({ config, leads = SAMPLE_LEADS, addNotification }: LeadsViewProps) {
  const [allLeads, setAllLeads]         = useState<Lead[]>(leads)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [modalOpen, setModalOpen]       = useState(false)

  const fmt = useCallback(
    (n: number) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: config.currency,
        maximumFractionDigits: 0,
      }).format(n || 0),
    [config.currency],
  )

  // ── KPIs ──────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const closedStatuses: LeadStatus[] = ["Won", "Lost", "Dead"]
    const open = allLeads.filter((l) => !closedStatuses.includes(l.status))
    const pipelineValue = open.reduce((s, l) => s + (l.estValue || 0), 0)
    const hot  = allLeads.filter((l) => l.status === "In Progress" || l.jobSize === "$$$" || l.priority === "High")
    const won  = allLeads.filter((l) => l.status === "Won")
    const lost = allLeads.filter((l) => l.status === "Lost" || l.status === "Dead")
    const decided = won.length + lost.length
    const conversion = decided === 0 ? 0 : Math.round((won.length / decided) * 100)
    const wonValue   = won.reduce((s, l) => s + (l.revenue || l.estValue || 0), 0)
    const avgDeal    = won.length === 0 ? 0 : Math.round(wonValue / won.length)
    return {
      pipelineValue, hotCount: hot.length, conversion,
      wonCount: won.length, avgDeal, lostCount: lost.length,
      openCount: open.length,
    }
  }, [allLeads])

  // ── By-service chart data ────────────────────────────────────
  const serviceData = useMemo(() => {
    const svcs = config.services.length ? config.services : Array.from(new Set(allLeads.map((l) => l.service)))
    return svcs.slice(0, 5).map((s) => ({
      name: s.length > 12 ? s.slice(0, 10) + "…" : s,
      value: allLeads.filter((l) => l.service === s).length,
    }))
  }, [allLeads, config.services])

  // ── Pipeline distribution ────────────────────────────────────
  const statusRanks: LeadStatus[] = ["New", "Contacted", "In Progress", "Won", "Lost", "Dead"]
  const statusBreakdown = useMemo(() => {
    const total = Math.max(1, allLeads.length)
    return statusRanks.map((s) => {
      const count = allLeads.filter((l) => l.status === s).length
      return { status: s, count, pct: (count / total) * 100, color: STATUS_CONFIG[s].color }
    })
  }, [allLeads])

  // ── Handlers ─────────────────────────────────────────────────
  const handleAddLead = (form: any) => {
    const now = new Date()
    const dateAdded = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    const stamp     = now.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })

    const newLead: Lead = {
      id: Date.now(),
      dateAdded,
      name:               form.name || "",
      businessName:       form.businessName || "",
      phone:              form.phone || "",
      email:              form.email || "",
      address:            form.address || "",
      city:               form.city || "",
      service:            form.service || "",
      source:             (form.source || "website") as LeadSource,
      sourceUrl:          form.sourceUrl || "",
      campaign:           form.campaign || "",
      notes:              form.notes || "",
      estValue:           Number(form.estValue) || 0,
      status:             (form.status || "New") as LeadStatus,
      priority:           (form.priority || "Medium") as Priority,
      jobSize:            (form.jobSize || "$") as JobSize,
      followUpDate:       form.followUpDate || "",
      assignedTo:         form.assignedTo || "",
      nextAction:         form.nextAction || "",
      firstContactedDate: form.firstContactedDate || "",
      lastContactDate:    form.lastContactDate || "",
      contactMethod:      (form.contactMethod || undefined) as ContactMethod | undefined,
      numberOfTouchpoints: Number(form.numberOfTouchpoints) || 0,
      converted:          !!form.converted,
      conversionDate:     form.conversionDate || "",
      revenue:            Number(form.revenue) || 0,
      reasonLost:         form.reasonLost || "",
      activity: [
        { id: `act-${Date.now()}`, timestamp: stamp, text: "Lead created manually." },
      ],
    }

    setAllLeads((prev) => [newLead, ...prev])
    addNotification?.("lead", `New lead: ${newLead.name} (${newLead.service || "—"}) added`)
  }

  const handleUpdateLead = (updated: Lead) => {
    setAllLeads((prev) => {
      const existing = prev.find((l) => l.id === updated.id)
      if (existing && existing.status !== updated.status) {
        addNotification?.("status", `${updated.name} moved to ${updated.status}`)
      }
      return prev.map((l) => (l.id === updated.id ? updated : l))
    })
    setSelectedLead(updated)
  }

  const handleDeleteLead = (id: number) => {
    const removed = allLeads.find((l) => l.id === id)
    setAllLeads((prev) => prev.filter((l) => l.id !== id))
    setSelectedLead(null)
    if (removed) addNotification?.("warning", `${removed.name} was removed from pipeline`)
  }

  const handleArchiveLead = useCallback((id: number) => {
    setAllLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: "Dead" as LeadStatus } : l)),
    )
    const lead = allLeads.find((l) => l.id === id)
    if (lead) addNotification?.("warning", `${lead.name} archived`)
  }, [allLeads, addNotification])

  // ── CSV export ���─────────────────────────────────────────────
  const exportCsv = () => {
    const headers = [
      "ID", "Date Added", "Name", "Business", "Phone", "Email", "Address", "City",
      "Service", "Source", "Source URL", "Campaign",
      "Status", "Priority", "Job Size", "Est. Value", "Revenue",
      "Follow-up", "Assigned To", "Next Action",
      "First Contacted", "Last Contact", "Contact Method", "Touchpoints",
      "Won", "Conversion Date", "Reason Lost", "Notes",
    ]
    const escape = (v: unknown) => {
      const s = String(v ?? "")
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const rows = allLeads.map((l) => [
      l.id, l.dateAdded, l.name, l.businessName ?? "", l.phone, l.email ?? "", l.address ?? "", l.city,
      l.service, l.source, l.sourceUrl ?? "", l.campaign ?? "",
      l.status, l.priority ?? "", l.jobSize, l.estValue, l.revenue ?? "",
      l.followUpDate ?? "", l.assignedTo ?? "", l.nextAction ?? "",
      l.firstContactedDate ?? "", l.lastContactDate ?? "", l.contactMethod ?? "", l.numberOfTouchpoints ?? 0,
      l.converted ? "Yes" : "No", l.conversionDate ?? "", l.reasonLost ?? "", l.notes,
    ].map(escape).join(","))
    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight font-sans" style={{ color: TEXT }}>
            Lead Intelligence
          </h1>
          <p className="text-xs font-mono" style={{ color: TEXT_MUTE }}>
            {allLeads.length} total · {kpis.openCount} open · {config.cities.length > 0 ? config.cities.join(" · ") : "All regions"}
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-[11px] font-mono"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            color: "rgba(226,232,240,0.7)",
            transition: "all 0.12s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = TEXT }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(226,232,240,0.7)" }}
          aria-label="Export CSV"
        >
          <Download size={12} /> Export CSV
        </button>
      </div>

      {/* ── KPI strip ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Pipeline Value" value={fmt(kpis.pipelineValue)} sub={`${kpis.openCount} open lead${kpis.openCount !== 1 ? "s" : ""}`} icon={<TrendingUp size={14} />} accent="#34d399" glow="rgba(16,185,129,0.25)" />
        <KpiCard label="Hot Leads"      value={String(kpis.hotCount)}    sub="Ready to close"                     icon={<Flame size={14} />}      accent="#FF8A2B" glow="rgba(255,138,43,0.24)" trendUp={kpis.hotCount > 0} />
        <KpiCard label="Conversion"     value={`${kpis.conversion}%`}    sub={`${kpis.wonCount} won · ${kpis.lostCount} lost`} icon={<Target size={14} />} accent="#60a5fa" glow="rgba(96,165,250,0.22)" trendUp={kpis.conversion >= 50} />
        <KpiCard label="Avg Deal"       value={fmt(kpis.avgDeal)}        sub={kpis.wonCount > 0 ? "Based on closed won" : "No closed wins yet"} icon={<Sparkles size={14} />} accent="#c084fc" glow="rgba(192,132,252,0.22)" />
      </div>

      {/* ── Charts row ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Weekly flow */}
        <Panel className="lg:col-span-2">
          <SectionHead icon={LineChartIcon} title="Weekly Lead Flow" subtitle="Leads vs. closed · last 7 days"
            right={<div className="hidden sm:flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider"><LegendDot color={BLUE} label="Leads" /><LegendDot color={EMERALD} label="Closed" /></div>}
          />
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={WEEKLY_DATA} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={BLUE} stopOpacity={0.40} /><stop offset="100%" stopColor={BLUE} stopOpacity={0} /></linearGradient>
                <linearGradient id="gClosed" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={EMERALD} stopOpacity={0.35} /><stop offset="100%" stopColor={EMERALD} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: TEXT_MUTE, fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: TEXT_MUTE, fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={chartTooltipStyle} cursor={{ stroke: "rgba(59,130,246,0.18)", strokeWidth: 1 }} />
              <Area type="monotone" dataKey="leads"  stroke={BLUE}    strokeWidth={2} fill="url(#gLeads)"  dot={false} activeDot={{ r: 4, fill: BLUE,    stroke: "#08080a", strokeWidth: 2 }} />
              <Area type="monotone" dataKey="closed" stroke={EMERALD} strokeWidth={2} fill="url(#gClosed)" dot={false} activeDot={{ r: 4, fill: EMERALD, stroke: "#08080a", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        {/* Service breakdown */}
        <Panel>
          <SectionHead icon={PieIcon} title="By Service" subtitle="Lead distribution" />
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={serviceData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }} barCategoryGap={serviceData.length > 3 ? "18%" : "28%"}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: TEXT_MUTE, fontSize: 10, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} interval={0} />
              <YAxis hide />
              <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "rgba(59,130,246,0.05)" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {serviceData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? BLUE : EMERALD} opacity={0.9} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* ── Pipeline distribution bar ─────────────────────── */}
      <div
        className="rounded-xl p-3 mb-5"
        style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${PANEL_BORDER}` }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.14em]" style={{ color: TEXT_MUTE }}>Pipeline Distribution</span>
          <span className="text-[11px] font-mono" style={{ color: TEXT_DIM }}>{allLeads.length} lead{allLeads.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }} role="img" aria-label="Pipeline distribution">
          {statusBreakdown.map((s) => (
            <div key={s.status} style={{ width: `${s.pct}%`, background: s.color, boxShadow: `inset 0 0 4px ${s.color}88`, transition: "width 0.24s ease" }} title={`${s.status}: ${s.count}`} />
          ))}
        </div>
        <div className="flex items-center justify-between mt-2.5 flex-wrap gap-2">
          {statusBreakdown.map((s) => (
            <span key={s.status} className="inline-flex items-center gap-1.5 text-[10px] font-mono" style={{ color: "rgba(226,232,240,0.55)" }}>
              <span style={{ width: 7, height: 7, borderRadius: 9999, background: s.color, boxShadow: `0 0 5px ${s.color}88` }} />
              {s.status} <span style={{ color: TEXT_MUTE }}>· {s.count}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Leads table ────────────────────────────────────── */}
      <LeadsTable
        leads={allLeads}
        currency={config.currency}
        onViewLead={setSelectedLead}
        onAddLead={() => setModalOpen(true)}
        onArchiveLead={handleArchiveLead}
        allServices={config.services}
      />

      {/* ── Funnel benchmarks ──────────────────────────────── */}
      <FunnelKPIs />

      {/* ── Drawer & Add modal ─────────────────────────────── */}
      <LeadDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdate={handleUpdateLead}
        onDelete={handleDeleteLead}
        currency={config.currency}
        services={config.services}
        cities={config.cities}
      />
      <AddLeadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        services={config.services}
        cities={config.cities}
        onAdd={handleAddLead}
      />
    </>
  )
}

// ── Panel wrapper ────────────────────────────────────────────────
function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`p-5 ${className}`}
      style={{
        background: "linear-gradient(180deg, rgba(17,22,32,0.92) 0%, rgba(10,13,20,0.92) 100%)",
        border: `1px solid ${PANEL_BORDER}`,
        borderRadius: 12,
        boxShadow: "0 1px 0 rgba(255,255,255,0.03) inset, 0 24px 50px -24px rgba(0,0,0,0.55)",
      }}
    >
      {children}
    </section>
  )
}

// ── Section heading ─────────────────────────────────────────────
function SectionHead({
  icon: Icon, title, subtitle, right,
}: {
  icon: typeof LineChartIcon
  title: string
  subtitle: string
  right?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5">
        <div
          className="flex items-center justify-center"
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.28)",
            color: "#60a5fa",
          }}
        >
          <Icon size={13} strokeWidth={2} />
        </div>
        <div>
          <p className="text-[13px] font-semibold font-sans leading-none" style={{ color: TEXT }}>{title}</p>
          <p className="text-[10px] font-mono uppercase tracking-wider mt-1.5" style={{ color: TEXT_MUTE }}>{subtitle}</p>
        </div>
      </div>
      {right}
    </div>
  )
}

// ── Legend dot ─────────────────────────────────────────────────
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5" style={{ color: TEXT_DIM }}>
      <span className="inline-block w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      {label}
    </span>
  )
}

// ── KPI Card ───────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon, accent, glow, trendUp,
}: {
  label: string; value: string; sub: string
  icon: React.ReactNode; accent: string; glow: string; trendUp?: boolean
}) {
  return (
    <div
      className="relative rounded-xl p-4 overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: `1px solid ${PANEL_BORDER}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      <div aria-hidden="true" style={{
        position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%",
        background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`, pointerEvents: "none",
      }} />
      <div className="flex items-center justify-between mb-2 relative">
        <span className="text-[10px] font-mono uppercase tracking-[0.14em]" style={{ color: "rgba(226,232,240,0.4)" }}>{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accent}14`, border: `1px solid ${accent}30`, color: accent }}>{icon}</div>
      </div>
      <div className="flex items-baseline gap-2 relative">
        <span className="text-xl font-bold font-sans tracking-tight" style={{ color: TEXT, textShadow: `0 0 14px ${glow}` }}>{value}</span>
        {trendUp !== undefined && (
          <span style={{ color: trendUp ? "#34d399" : "#f87171" }} className="flex items-center">
            {trendUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
          </span>
        )}
      </div>
      <p className="text-[11px] font-mono mt-1 relative" style={{ color: "rgba(226,232,240,0.42)" }}>{sub}</p>
    </div>
  )
}
