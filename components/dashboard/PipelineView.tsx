"use client"

import TiltCard from "./TiltCard"
import FunnelChart from "./FunnelChart"
import { Phone, Calendar } from "lucide-react"

// ── Funnel stages (5-step journey) ──────────────────────────────────────────
const FUNNEL_STAGES = [
  { name: "New Leads",     count: 47, color: "#00F5FF", avgDays: 0  },
  { name: "Contacted",     count: 31, color: "#4D9FFF", avgDays: 2  },
  { name: "Estimate Sent", count: 22, color: "#9B59FF", avgDays: 5  },
  { name: "Negotiating",   count: 16, color: "#FFB800", avgDays: 9  },
  { name: "Converted",     count: 14, color: "#39FF14", avgDays: 14 },
]

// ── Kanban columns ───────────────────────────────────────────────────────────
const STAGES = [
  {
    id: "new",
    label: "New",
    color: "#00F5FF",
    count: 18,
    value: 12400,
    cards: [
      { name: "Robert Martinez", service: "Installation",  city: "New York",    value: 1850 },
      { name: "Priya Patel",     service: "Emergency",     city: "New York",    value: 2200 },
      { name: "Marcus Johnson",  service: "Consultation",  city: "Los Angeles", value: 390  },
    ],
  },
  {
    id: "contacted",
    label: "Contacted",
    color: "#4D9FFF",
    count: 12,
    value: 9800,
    cards: [
      { name: "Sarah Kim",   service: "Consultation", city: "Chicago",  value: 420 },
      { name: "David Park",  service: "Maintenance",  city: "New York", value: 220 },
    ],
  },
  {
    id: "quoted",
    label: "Quoted",
    color: "#9B59FF",
    count: 8,
    value: 21600,
    cards: [
      { name: "Olivia Chen",   service: "Installation", city: "Chicago",  value: 3100 },
      { name: "Carlos Rivera", service: "Maintenance",  city: "Chicago",  value: 275  },
    ],
  },
  {
    id: "closed",
    label: "Closed Won",
    color: "#39FF14",
    count: 5,
    value: 14870,
    cards: [
      { name: "Emily Thompson", service: "Installation",  city: "New York",    value: 1640 },
      { name: "Natasha Gomez",  service: "Consultation",  city: "Los Angeles", value: 510  },
    ],
  },
]

export default function PipelineView({ config }: { config: { currency: string } }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: config.currency, maximumFractionDigits: 0 }).format(n)

  return (
    <div className="flex flex-col gap-6">

      {/* ── 3D Funnel visualization ──────────────────────────────────── */}
      <TiltCard className="p-5 md:p-6" intensity={3}>
        <p
          className="text-xs font-semibold font-sans mb-5 tracking-widest"
          style={{ color: "rgba(232,244,248,0.45)" }}
        >
          LEAD PIPELINE FUNNEL
        </p>
        <FunnelChart stages={FUNNEL_STAGES} />
      </TiltCard>

      {/* ── Kanban board ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAGES.map((stage) => (
          <div key={stage.id} className="flex flex-col gap-3">
            {/* Column header */}
            <div
              className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{ background: `${stage.color}10`, border: `1px solid ${stage.color}25` }}
            >
              <span className="text-xs font-semibold font-sans" style={{ color: stage.color }}>
                {stage.label}
              </span>
              <span
                className="text-xs font-mono px-1.5 py-0.5 rounded-full"
                style={{ background: `${stage.color}20`, color: stage.color }}
              >
                {stage.count}
              </span>
            </div>

            {/* Lead cards */}
            {stage.cards.map((card, ci) => (
              <TiltCard key={ci} className="p-3" intensity={9}>
                <p className="text-xs font-semibold font-sans mb-1" style={{ color: "#e8f4f8" }}>
                  {card.name}
                </p>
                <p className="text-xs font-mono mb-2" style={{ color: "rgba(232,244,248,0.45)" }}>
                  {card.service} · {card.city}
                </p>
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-mono font-bold"
                    style={{ color: "#39FF14", textShadow: "0 0 8px rgba(57,255,20,0.5)" }}
                  >
                    {fmt(card.value)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      className="w-5 h-5 rounded flex items-center justify-center"
                      style={{ background: "rgba(0,245,255,0.1)", color: "#00F5FF" }}
                      aria-label="Call"
                    >
                      <Phone size={9} />
                    </button>
                    <button
                      className="w-5 h-5 rounded flex items-center justify-center"
                      style={{ background: "rgba(57,255,20,0.1)", color: "#39FF14" }}
                      aria-label="Schedule"
                    >
                      <Calendar size={9} />
                    </button>
                  </div>
                </div>
                {/* Stage color bar */}
                <div
                  className="mt-2 h-0.5 rounded-full"
                  style={{ background: stage.color, boxShadow: `0 0 6px ${stage.color}` }}
                />
              </TiltCard>
            ))}

            {/* Add placeholder */}
            <button
              className="w-full rounded-lg py-2 text-xs font-mono text-center transition-colors"
              style={{
                border: `1px dashed ${stage.color}30`,
                color: `${stage.color}50`,
              }}
            >
              + Add lead
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
