"use client"

import HeroStats from "./HeroStats"
import TiltCard from "./TiltCard"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
} from "recharts"
import {
  Activity,
  LineChart,
  PieChart as PieIcon,
  MapPin,
  ArrowUpRight,
  ArrowRight,
} from "lucide-react"

// ── Palette ─────────────────────────────────────────────────────
const BLUE = "#3b82f6"
const BLUE_2 = "#60a5fa"
const EMERALD = "#10b981"
const AMBER = "#f59e0b"
const TEXT = "#e2e8f0"
const TEXT_DIM = "rgba(226,232,240,0.55)"
const TEXT_MUTE = "rgba(226,232,240,0.38)"
const PANEL_BORDER = "rgba(255,255,255,0.06)"

interface DashboardConfig {
  clientName: string
  accentColor: string
  currency: string
  services: string[]
  cities: string[]
}

const WEEKLY_DATA = [
  { day: "Mon", leads: 14, closed: 4 },
  { day: "Tue", leads: 21, closed: 7 },
  { day: "Wed", leads: 18, closed: 5 },
  { day: "Thu", leads: 28, closed: 11 },
  { day: "Fri", leads: 35, closed: 15 },
  { day: "Sat", leads: 22, closed: 9 },
  { day: "Sun", leads: 10, closed: 3 },
]

const RECENT_LEADS = [
  { name: "Robert Martinez", service: "Installation",  city: "New York",    status: "hot",  value: 1850 },
  { name: "Sarah Kim",       service: "Consultation",  city: "Chicago",     status: "warm", value: 420  },
  { name: "James O'Brien",   service: "Maintenance",   city: "Los Angeles", status: "new",  value: 310  },
  { name: "Priya Patel",     service: "Emergency",     city: "New York",    status: "hot",  value: 2200 },
  { name: "Carlos Rivera",   service: "Maintenance",   city: "Chicago",     status: "warm", value: 275  },
]

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  hot:  { label: "Hot",  color: "#f87171", bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.28)" },
  warm: { label: "Warm", color: AMBER,     bg: "rgba(245,158,11,0.10)",  border: "rgba(245,158,11,0.28)"  },
  new:  { label: "New",  color: BLUE_2,    bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.28)"  },
}

// ── Section heading ─────────────────────────────────────────────
function SectionHead({
  icon: Icon,
  title,
  subtitle,
  right,
}: {
  icon: typeof Activity
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
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "rgba(59,130,246,0.10)",
            border: "1px solid rgba(59,130,246,0.28)",
            color: BLUE_2,
          }}
        >
          <Icon size={13} strokeWidth={2} />
        </div>
        <div>
          <p className="text-[13px] font-semibold font-sans leading-none" style={{ color: TEXT }}>
            {title}
          </p>
          <p className="text-[10px] font-mono uppercase tracking-wider mt-1.5" style={{ color: TEXT_MUTE }}>
            {subtitle}
          </p>
        </div>
      </div>
      {right}
    </div>
  )
}

// ── Panel wrapper with refined border + subtle glow ────────────
function Panel({
  children,
  className = "",
  tilt = false,
}: {
  children: React.ReactNode
  className?: string
  tilt?: boolean
}) {
  const style: React.CSSProperties = {
    background:
      "linear-gradient(180deg, rgba(17,22,32,0.92) 0%, rgba(10,13,20,0.92) 100%)",
    border: `1px solid ${PANEL_BORDER}`,
    borderRadius: 12,
    boxShadow:
      "0 1px 0 rgba(255,255,255,0.03) inset, 0 24px 50px -24px rgba(0,0,0,0.55)",
  }
  if (tilt) {
    return (
      <TiltCard className={`p-5 ${className}`} intensity={3}>
        {children}
      </TiltCard>
    )
  }
  return (
    <section className={`p-5 ${className}`} style={style}>
      {children}
    </section>
  )
}

// ── Tooltip for charts ─────────────────────────────────────────
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

// ── Component ──────────────────────────────────────────────────
export default function DashboardView({ config }: { config: DashboardConfig }) {
  const { currency, services, cities } = config

  const serviceData = services.map((s, i) => ({
    name: s,
    value: [42, 28, 30, 18][i % 4],
  }))

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n)

  return (
    <div className="flex flex-col gap-5">
      {/* KPI row */}
      <HeroStats />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <Panel className="lg:col-span-2">
          <SectionHead
            icon={LineChart}
            title="Weekly Lead Flow"
            subtitle="Leads vs. closed · last 7 days"
            right={
              <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider">
                <LegendDot color={BLUE} label="Leads" />
                <LegendDot color={EMERALD} label="Closed" />
              </div>
            }
          />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={WEEKLY_DATA} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BLUE} stopOpacity={0.40} />
                  <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gClosed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={EMERALD} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={EMERALD} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="rgba(255,255,255,0.04)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: TEXT_MUTE, fontSize: 11, fontFamily: "var(--font-mono)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: TEXT_MUTE, fontSize: 11, fontFamily: "var(--font-mono)" }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={chartTooltipStyle}
                cursor={{ stroke: "rgba(59,130,246,0.18)", strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="leads"
                stroke={BLUE}
                strokeWidth={2}
                fill="url(#gLeads)"
                dot={false}
                activeDot={{ r: 4, fill: BLUE, stroke: "#08080a", strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="closed"
                stroke={EMERALD}
                strokeWidth={2}
                fill="url(#gClosed)"
                dot={false}
                activeDot={{ r: 4, fill: EMERALD, stroke: "#08080a", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        {/* Service bar chart */}
        <Panel>
          <SectionHead
            icon={PieIcon}
            title="By Service"
            subtitle="Lead distribution"
          />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={serviceData}
              margin={{ top: 8, right: 4, left: -24, bottom: 0 }}
              barCategoryGap={serviceData.length > 3 ? "18%" : "28%"}
            >
              <CartesianGrid
                stroke="rgba(255,255,255,0.04)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: TEXT_MUTE, fontSize: 10, fontFamily: "var(--font-mono)" }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={chartTooltipStyle}
                cursor={{ fill: "rgba(59,130,246,0.05)" }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {serviceData.map((_, i) => (
                  <Cell key={i} fill={i % 2 === 0 ? BLUE : EMERALD} opacity={0.9} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* Recent leads */}
      <Panel>
        <SectionHead
          icon={Activity}
          title="Recent Leads"
          subtitle="Latest activity"
          right={
            <button
              className="group flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider transition-colors"
              style={{ color: BLUE_2 }}
            >
              View all
              <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          }
        />

        <div
          className="rounded-lg overflow-hidden"
          style={{ border: `1px solid ${PANEL_BORDER}` }}
        >
          {/* Header row */}
          <div
            className="hidden md:grid text-[10px] font-mono uppercase tracking-wider px-4 py-2.5"
            style={{
              gridTemplateColumns: "2fr 1.4fr 1.4fr 1fr 1fr",
              color: TEXT_MUTE,
              background: "rgba(255,255,255,0.02)",
              borderBottom: `1px solid ${PANEL_BORDER}`,
            }}
          >
            <span>Name</span>
            <span>Service</span>
            <span>City</span>
            <span>Status</span>
            <span className="text-right">Est. Value</span>
          </div>

          {RECENT_LEADS.map((lead, i) => {
            const meta = STATUS_META[lead.status]
            return (
              <div
                key={i}
                className="grid items-center px-4 py-3 transition-colors hover:bg-white/[0.02]"
                style={{
                  gridTemplateColumns: "2fr 1.4fr 1.4fr 1fr 1fr",
                  borderBottom: i < RECENT_LEADS.length - 1 ? `1px solid ${PANEL_BORDER}` : "none",
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={lead.name} />
                  <span
                    className="text-[13px] font-medium truncate"
                    style={{ color: TEXT }}
                  >
                    {lead.name}
                  </span>
                </div>
                <span className="text-[12px] truncate" style={{ color: TEXT_DIM }}>
                  {lead.service}
                </span>
                <span
                  className="text-[12px] truncate flex items-center gap-1"
                  style={{ color: TEXT_DIM }}
                >
                  <MapPin size={10} style={{ color: TEXT_MUTE }} />
                  {lead.city}
                </span>
                <span>
                  <span
                    className="inline-flex items-center gap-1 h-[22px] px-2 rounded-full text-[10px] font-mono uppercase tracking-wider"
                    style={{
                      background: meta.bg,
                      border: `1px solid ${meta.border}`,
                      color: meta.color,
                    }}
                  >
                    <span
                      className="w-1 h-1 rounded-full"
                      style={{ background: meta.color }}
                    />
                    {meta.label}
                  </span>
                </span>
                <span
                  className="text-[12px] font-mono text-right font-medium"
                  style={{ color: EMERALD }}
                >
                  {fmt(lead.value)}
                </span>
              </div>
            )
          })}
        </div>
      </Panel>

      {/* Cities */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cities.map((city, i) => {
          const vals = [94, 61, 47]
          const deltas = ["+8%", "+3%", "−2%"]
          const n = vals[i % vals.length]
          return (
            <Panel key={city} tilt>
              <div className="flex items-center justify-between mb-3">
                <span
                  className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider"
                  style={{ color: TEXT_MUTE }}
                >
                  <MapPin size={11} style={{ color: BLUE_2 }} />
                  {city}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] font-mono"
                  style={{
                    color: deltas[i % deltas.length].startsWith("+") ? EMERALD : "#f87171",
                  }}
                >
                  <ArrowUpRight
                    size={10}
                    style={{
                      transform: deltas[i % deltas.length].startsWith("+")
                        ? "rotate(0deg)"
                        : "rotate(90deg)",
                    }}
                  />
                  {deltas[i % deltas.length]}
                </span>
              </div>

              <div className="flex items-end gap-2">
                <span
                  className="font-mono font-semibold leading-none"
                  style={{
                    color: TEXT,
                    fontSize: 30,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {n}
                </span>
                <span
                  className="text-[11px] font-sans pb-1"
                  style={{ color: TEXT_DIM }}
                >
                  leads / 30d
                </span>
              </div>

              <div
                className="mt-4 h-1 rounded-full overflow-hidden"
                style={{ background: "rgba(59,130,246,0.10)" }}
              >
                <div
                  className="h-1 rounded-full"
                  style={{
                    width: `${n}%`,
                    background: `linear-gradient(90deg, ${BLUE} 0%, ${BLUE_2} 100%)`,
                    boxShadow: "0 0 8px rgba(59,130,246,0.55)",
                    transition: "width 1s ease",
                  }}
                />
              </div>
            </Panel>
          )
        })}
      </div>
    </div>
  )
}

// ── Legend dot ─────────────────────────────────────────────────
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5" style={{ color: TEXT_DIM }}>
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      />
      {label}
    </span>
  )
}

// ── Avatar (deterministic initials) ────────────────────────────
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
        width: 26,
        height: 26,
        borderRadius: 8,
        background: `linear-gradient(135deg, hsl(${hue} 55% 22%) 0%, hsl(${(hue + 40) % 360} 55% 14%) 100%)`,
        border: "1px solid rgba(255,255,255,0.06)",
        color: TEXT,
      }}
      aria-hidden
    >
      {initials}
    </span>
  )
}
