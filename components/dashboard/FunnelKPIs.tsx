"use client"

import { Zap, TrendingUp, Clock, Star } from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────
interface FunnelStage {
  stage: string
  kpi: string
  target: string
  accent: string
}

const FUNNEL_STAGES: FunnelStage[] = [
  { stage: "Lead Magnet",  kpi: "Conversion Rate",                accent: "#34d399", target: "20–40%" },
  { stage: "Tripwire",     kpi: "Conversion Rate",                accent: "#60a5fa", target: "8–15%"  },
  { stage: "Core Offer",   kpi: "Conversion from Tripwire Buyers",accent: "#c084fc", target: "25–40%" },
  { stage: "Upsells",      kpi: "Upsell Conversion Rate",         accent: "#FF8A2B", target: "20–40%" },
]

const BANT_LEVELS = [
  { label: "High",   color: "#39FF14", glow: "rgba(57,255,20,0.35)",  desc: "Qualify → immediate follow-up" },
  { label: "Medium", color: "#FFB800", glow: "rgba(255,184,0,0.30)",  desc: "Nurture sequence" },
  { label: "Low",    color: "#60a5fa", glow: "rgba(96,165,250,0.25)", desc: "Long-term drip" },
  { label: "None",   color: "#ff4455", glow: "rgba(255,68,85,0.22)",  desc: "Disqualified / archive" },
]

// ── Section heading ───────────────────────────────────────────────
function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span style={{ color: "rgba(212,216,224,0.4)" }}>{icon}</span>
      <span
        className="text-[10px] font-mono uppercase tracking-[0.16em]"
        style={{ color: "rgba(212,216,224,0.38)" }}
      >
        {title}
      </span>
      <div
        className="flex-1 h-px"
        style={{ background: "linear-gradient(to right, rgba(255,255,255,0.06), transparent)" }}
      />
    </div>
  )
}

// ── Panel wrapper ─────────────────────────────────────────────────
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      {children}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────
export default function FunnelKPIs() {
  return (
    <div className="flex flex-col gap-4 mt-6">

      {/* divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        <span className="text-[9px] font-mono uppercase tracking-[0.18em]" style={{ color: "rgba(212,216,224,0.2)" }}>
          Funnel Benchmarks &amp; KPIs
        </span>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>

      {/* ── Funnel stage KPIs ───────────────────────────────────── */}
      <Panel>
        <SectionHeading icon={<TrendingUp size={12} />} title="Funnel Stage KPIs" />
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
            <thead>
              <tr>
                {["Stage", "KPI", "Target"].map((h) => (
                  <th
                    key={h}
                    className="pb-2 text-left font-mono font-medium pr-6"
                    style={{ color: "rgba(212,216,224,0.32)", whiteSpace: "nowrap" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FUNNEL_STAGES.map((row, i) => (
                <tr
                  key={row.stage}
                  style={{ borderTop: i === 0 ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(255,255,255,0.04)" }}
                >
                  <td className="py-2.5 pr-6 font-sans font-medium" style={{ color: row.accent, whiteSpace: "nowrap" }}>
                    {row.stage}
                  </td>
                  <td className="py-2.5 pr-6 font-mono" style={{ color: "rgba(212,216,224,0.55)" }}>
                    {row.kpi}
                  </td>
                  <td className="py-2.5 font-mono font-bold" style={{ color: row.accent, whiteSpace: "nowrap" }}>
                    {row.target}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* ── Revenue + Operational KPIs side-by-side ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Revenue */}
        <Panel>
          <SectionHeading icon={<Star size={12} />} title="Revenue KPIs" />
          <div className="flex flex-col gap-3">
            <RevenueKPI
              label="AOV Increase via Upsells"
              value="300–500%"
              accent="#c084fc"
              glow="rgba(192,132,252,0.22)"
            />
            <RevenueKPI
              label="Customer LTV vs. Traditional"
              value="2–4× higher"
              accent="#34d399"
              glow="rgba(16,185,129,0.22)"
            />
          </div>
        </Panel>

        {/* Operational */}
        <Panel>
          <SectionHeading icon={<Clock size={12} />} title="Operational KPIs" />
          <div className="flex flex-col gap-2.5">
            <OperationalKPI
              label="Speed to Lead"
              value="5–15 min"
              note="10× conversion improvement"
              accent="#39FF14"
            />
            <OperationalKPI
              label="Cost per Lead"
              value="Variable"
              note="Tracked per industry"
              accent="#60a5fa"
            />
            <OperationalKPI
              label="Lead Quality Score"
              value="Engagement"
              note="Based on activity metrics"
              accent="#FF8A2B"
            />
          </div>
        </Panel>
      </div>

      {/* ── BANT routing ─────────────────────────────────────────── */}
      <Panel>
        <SectionHeading icon={<Zap size={12} />} title="BANT Qualification Score — Routing Logic" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BANT_LEVELS.map((b) => (
            <div
              key={b.label}
              className="rounded-lg p-3 flex flex-col gap-1.5"
              style={{
                background: `${b.color}08`,
                border: `1px solid ${b.color}22`,
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  style={{
                    width: 8, height: 8, borderRadius: 9999,
                    background: b.color,
                    boxShadow: `0 0 8px ${b.glow}`,
                    flexShrink: 0,
                  }}
                />
                <span className="text-xs font-bold font-sans" style={{ color: b.color }}>
                  {b.label}
                </span>
              </div>
              <p className="text-[10px] font-mono leading-snug" style={{ color: "rgba(212,216,224,0.42)" }}>
                {b.desc}
              </p>
            </div>
          ))}
        </div>
      </Panel>

    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────
function RevenueKPI({ label, value, accent, glow }: { label: string; value: string; accent: string; glow: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-mono" style={{ color: "rgba(212,216,224,0.5)" }}>{label}</span>
      <span
        className="text-sm font-bold font-sans whitespace-nowrap"
        style={{ color: accent, textShadow: `0 0 12px ${glow}` }}
      >
        {value}
      </span>
    </div>
  )
}

function OperationalKPI({ label, value, note, accent }: { label: string; value: string; note: string; accent: string }) {
  return (
    <div
      className="flex items-start gap-3 rounded-lg px-3 py-2"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
    >
      <span
        className="text-xs font-bold font-mono whitespace-nowrap mt-0.5"
        style={{ color: accent, minWidth: 72 }}
      >
        {value}
      </span>
      <div>
        <div className="text-xs font-sans font-medium" style={{ color: "rgba(212,216,224,0.65)" }}>{label}</div>
        <div className="text-[10px] font-mono" style={{ color: "rgba(212,216,224,0.3)" }}>{note}</div>
      </div>
    </div>
  )
}
