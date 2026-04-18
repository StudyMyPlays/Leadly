"use client"

import { useState, useMemo, useCallback } from "react"
import {
  TrendingUp, Flame, Target, Sparkles, Download, ArrowUpRight, ArrowDownRight,
} from "lucide-react"
import LeadsTable from "./LeadsTable"
import LeadDrawer from "./LeadDrawer"
import AddLeadModal from "./AddLeadModal"
import FunnelKPIs from "./FunnelKPIs"
import { Lead, SAMPLE_LEADS, STATUS_CONFIG } from "./leads-data"

interface LeadsViewProps {
  config: {
    accentColor: string
    currency: string
    services: string[]
    cities: string[]
  }
  leads?: Lead[]
}

export default function LeadsView({ config, leads = SAMPLE_LEADS }: LeadsViewProps) {
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

  // ── KPI calculations ────────────────────────────────────────────
  const kpis = useMemo(() => {
    const open = allLeads.filter((l) => l.status !== "Lost" && l.status !== "Converted")
    const pipelineValue = open.reduce((s, l) => s + (l.estValue || 0), 0)

    const hot = allLeads.filter((l) => l.status === "Estimate" || l.jobSize === "$$$")

    const won  = allLeads.filter((l) => l.status === "Converted")
    const lost = allLeads.filter((l) => l.status === "Lost")
    const decided = won.length + lost.length
    const conversion = decided === 0 ? 0 : Math.round((won.length / decided) * 100)
    const wonValue = won.reduce((s, l) => s + (l.estValue || 0), 0)

    // "This week" — approximate by most recent 7 unique dates. With real dates this would be a Date compare.
    // We use all leads here since the sample set spans a handful of days.
    const thisWeek = allLeads.length

    const avgDeal = won.length === 0 ? 0 : Math.round(wonValue / won.length)

    return { pipelineValue, hotCount: hot.length, conversion, thisWeek, wonCount: won.length, avgDeal, lostCount: lost.length }
  }, [allLeads])

  // ── CRUD handlers ───────────────────────────────────────────────
  const handleAddLead = (form: {
    name: string; city: string; phone: string; email: string; service: string
    source: Lead["source"]; jobSize: Lead["jobSize"]
    status: Lead["status"]; estValue: number; notes: string
  }) => {
    const newLead: Lead = {
      id: Date.now(),
      ...form,
      estValue: form.estValue || 0,
      dateAdded: new Date().toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      }),
      activity: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toLocaleString("en-US", {
            month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
          }),
          text: "Lead created manually.",
        },
      ],
    }
    setAllLeads((prev) => [newLead, ...prev])
  }

  const handleUpdateLead = (updated: Lead) => {
    setAllLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
    setSelectedLead(updated)
  }

  const handleDeleteLead = (id: number) => {
    setAllLeads((prev) => prev.filter((l) => l.id !== id))
    setSelectedLead(null)
  }

  // ── CSV export ──────────────────────────────────────────────────
  const exportCsv = () => {
    const headers = [
      "ID", "Name", "City", "Phone", "Email", "Service", "Source",
      "Job Size", "Status", "Est. Value", "Date Added", "Notes",
    ]
    const escape = (v: unknown) => {
      const s = String(v ?? "")
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const rows = allLeads.map((l) => [
      l.id, l.name, l.city, l.phone, l.email ?? "", l.service, l.source,
      l.jobSize, l.status, l.estValue, l.dateAdded, l.notes,
    ].map(escape).join(","))
    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  // ── Status distribution for the mini pipeline bar ────────────────
  const statusRanks = ["New", "Contacted", "Estimate", "Converted", "Lost"] as const
  const statusBreakdown = useMemo(() => {
    const total = Math.max(1, allLeads.length)
    return statusRanks.map((s) => {
      const count = allLeads.filter((l) => l.status === s).length
      return {
        status: s,
        count,
        pct: (count / total) * 100,
        color: STATUS_CONFIG[s].color,
      }
    })
  }, [allLeads])

  return (
    <>
      {/* ── Page header ────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight font-sans" style={{ color: "#eaecef" }}>
            All Leads
          </h1>
          <p className="text-xs font-mono" style={{ color: "rgba(212,216,224,0.38)" }}>
            {allLeads.length} total · {config.cities.length > 0 ? config.cities.join(" · ") : "All regions"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-[11px] font-mono"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
              color: "rgba(212,216,224,0.7)",
              transition: "all 0.12s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.07)"
              e.currentTarget.style.color = "#eaecef"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)"
              e.currentTarget.style.color = "rgba(212,216,224,0.7)"
            }}
            aria-label="Export CSV"
            title="Export CSV"
          >
            <Download size={12} />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── KPI strip ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard
          label="Pipeline Value"
          value={fmt(kpis.pipelineValue)}
          sub={`${kpis.thisWeek} open lead${kpis.thisWeek !== 1 ? "s" : ""}`}
          icon={<TrendingUp size={14} />}
          accent="#34d399"
          glow="rgba(16,185,129,0.25)"
        />
        <KpiCard
          label="Hot Leads"
          value={String(kpis.hotCount)}
          sub="Ready to close"
          icon={<Flame size={14} />}
          accent="#FF8A2B"
          glow="rgba(255,138,43,0.24)"
          trendUp={kpis.hotCount > 0}
        />
        <KpiCard
          label="Conversion"
          value={`${kpis.conversion}%`}
          sub={`${kpis.wonCount} won · ${kpis.lostCount} lost`}
          icon={<Target size={14} />}
          accent="#60a5fa"
          glow="rgba(96,165,250,0.22)"
          trendUp={kpis.conversion >= 50}
        />
        <KpiCard
          label="Avg Deal"
          value={fmt(kpis.avgDeal)}
          sub={kpis.wonCount > 0 ? "Based on closed won" : "No closed wins yet"}
          icon={<Sparkles size={14} />}
          accent="#c084fc"
          glow="rgba(192,132,252,0.22)"
        />
      </div>

      {/* ── Pipeline distribution bar ──────────────────────────── */}
      <div
        className="rounded-xl p-3 mb-5"
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-[10px] font-mono uppercase tracking-[0.14em]"
            style={{ color: "rgba(212,216,224,0.42)" }}
          >
            Pipeline Distribution
          </span>
          <span className="text-[11px] font-mono" style={{ color: "rgba(212,216,224,0.5)" }}>
            {allLeads.length} lead{allLeads.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div
          className="flex h-1.5 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)" }}
          role="img"
          aria-label="Pipeline distribution"
        >
          {statusBreakdown.map((s) => (
            <div
              key={s.status}
              style={{
                width: `${s.pct}%`,
                background: s.color,
                boxShadow: `inset 0 0 4px ${s.color}88`,
                transition: "width 0.24s ease",
              }}
              title={`${s.status}: ${s.count}`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-2.5 flex-wrap gap-2">
          {statusBreakdown.map((s) => (
            <span
              key={s.status}
              className="inline-flex items-center gap-1.5 text-[10px] font-mono"
              style={{ color: "rgba(212,216,224,0.55)" }}
            >
              <span
                style={{
                  width: 7, height: 7, borderRadius: 9999,
                  background: s.color,
                  boxShadow: `0 0 5px ${s.color}88`,
                }}
              />
              {s.status} <span style={{ color: "rgba(212,216,224,0.35)" }}>· {s.count}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Leads table ───────────────────────────────────────── */}
      <LeadsTable
        leads={allLeads}
        currency={config.currency}
        onViewLead={setSelectedLead}
        onAddLead={() => setModalOpen(true)}
        allServices={config.services}
      />

      {/* ── Funnel benchmarks + KPI reference ─────────────────── */}
      <FunnelKPIs />

      {/* ── Drawer ────────────────────────────────────────────── */}
      <LeadDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdate={handleUpdateLead}
        onDelete={handleDeleteLead}
        currency={config.currency}
        services={config.services}
        cities={config.cities}
      />

      {/* ── Add modal ─────────────────────────────────────────── */}
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

// ── KPI Card ─────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon, accent, glow, trendUp,
}: {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
  accent: string
  glow: string
  trendUp?: boolean
}) {
  return (
    <div
      className="relative rounded-xl p-4 overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      {/* Accent glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -40, right: -40,
          width: 120, height: 120,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div className="flex items-center justify-between mb-2 relative">
        <span
          className="text-[10px] font-mono uppercase tracking-[0.14em]"
          style={{ color: "rgba(212,216,224,0.4)" }}
        >
          {label}
        </span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{
            background: `${accent}14`,
            border: `1px solid ${accent}30`,
            color: accent,
          }}
        >
          {icon}
        </div>
      </div>

      <div className="flex items-baseline gap-2 relative">
        <span
          className="text-xl font-bold font-sans tracking-tight"
          style={{ color: "#eaecef", textShadow: `0 0 14px ${glow}` }}
        >
          {value}
        </span>
        {trendUp !== undefined && (
          <span
            style={{ color: trendUp ? "#34d399" : "#f87171" }}
            className="flex items-center"
          >
            {trendUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
          </span>
        )}
      </div>

      <p
        className="text-[11px] font-mono mt-1 relative"
        style={{ color: "rgba(212,216,224,0.42)" }}
      >
        {sub}
      </p>
    </div>
  )
}
