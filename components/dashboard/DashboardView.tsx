"use client"

import TiltCard from "./TiltCard"
import HeroStats from "./HeroStats"
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
} from "recharts"


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

const STATUS_STYLES: Record<string, string> = {
  hot:  "badge-green",
  warm: "badge-cyan",
  new:  "badge-red",
}

export default function DashboardView({ config }: { config: DashboardConfig }) {
  const { accentColor, currency, services, cities } = config

  const serviceData = services.map((s, i) => ({
    name: s,
    value: [42, 28, 30][i % 3],
  }))

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n)

  return (
    <div className="flex flex-col gap-5">
      {/* Hero KPI cards */}
      <HeroStats />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <TiltCard className="p-5 lg:col-span-2" intensity={4}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold font-sans" style={{ color: "#e8f4f8" }}>
                Weekly Lead Flow
              </p>
              <p className="text-xs font-mono mt-0.5" style={{ color: "rgba(232,244,248,0.4)" }}>
                Leads vs. Closed
              </p>
            </div>
            <span className="badge-cyan text-xs px-2 py-0.5 rounded-full">Live</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={WEEKLY_DATA} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00F5FF" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#00F5FF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gClosed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#39FF14" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#39FF14" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: "rgba(232,244,248,0.4)", fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(232,244,248,0.4)", fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "rgba(5,8,16,0.95)",
                  border: "1px solid rgba(0,245,255,0.2)",
                  borderRadius: 8,
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "#e8f4f8",
                }}
                cursor={{ stroke: "rgba(0,245,255,0.15)", strokeWidth: 1 }}
              />
              <Area type="monotone" dataKey="leads" stroke="#00F5FF" strokeWidth={2} fill="url(#gLeads)" dot={false} />
              <Area type="monotone" dataKey="closed" stroke="#39FF14" strokeWidth={2} fill="url(#gClosed)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </TiltCard>

        {/* Service bar chart */}
        <TiltCard className="p-5" intensity={4}>
          <p className="text-sm font-semibold font-sans mb-1" style={{ color: "#e8f4f8" }}>
            By Service
          </p>
          <p className="text-xs font-mono mb-4" style={{ color: "rgba(232,244,248,0.4)" }}>
            Lead distribution
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={serviceData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: "rgba(232,244,248,0.4)", fontSize: 10, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: "rgba(5,8,16,0.95)",
                  border: "1px solid rgba(0,245,255,0.2)",
                  borderRadius: 8,
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "#e8f4f8",
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {serviceData.map((_, i) => (
                  <Cell key={i} fill={i % 2 === 0 ? "#00F5FF" : "#39FF14"} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </TiltCard>
      </div>

      {/* Recent Leads table */}
      <TiltCard className="p-5" intensity={2}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold font-sans" style={{ color: "#e8f4f8" }}>Recent Leads</p>
          <button className="text-xs font-mono" style={{ color: accentColor }}>View all →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-sans">
            <thead>
              <tr style={{ color: "rgba(232,244,248,0.4)" }}>
                <th className="text-left pb-3 font-medium pr-4">Name</th>
                <th className="text-left pb-3 font-medium pr-4">Service</th>
                <th className="text-left pb-3 font-medium pr-4">City</th>
                <th className="text-left pb-3 font-medium pr-4">Status</th>
                <th className="text-right pb-3 font-medium font-mono">Est. Value</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_LEADS.map((lead, i) => (
                <tr
                  key={i}
                  style={{ borderTop: "1px solid rgba(0,245,255,0.06)", color: "rgba(232,244,248,0.85)" }}
                >
                  <td className="py-2.5 pr-4 font-medium">{lead.name}</td>
                  <td className="py-2.5 pr-4" style={{ color: "rgba(232,244,248,0.55)" }}>{lead.service}</td>
                  <td className="py-2.5 pr-4" style={{ color: "rgba(232,244,248,0.55)" }}>{lead.city}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`${STATUS_STYLES[lead.status]} px-2 py-0.5 rounded-full text-xs`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-mono" style={{ color: "#39FF14" }}>
                    {fmt(lead.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TiltCard>

      {/* Cities mini-grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cities.map((city, i) => {
          const vals = [94, 61, 47]
          return (
            <TiltCard key={city} className="p-4" intensity={7}>
              <p className="text-xs font-mono mb-2" style={{ color: "rgba(232,244,248,0.45)" }}>
                {city}
              </p>
              <p className="text-lg font-bold font-mono glow-cyan">{vals[i % vals.length]}</p>
              <p className="text-xs font-sans mt-0.5" style={{ color: "rgba(232,244,248,0.4)" }}>
                leads this month
              </p>
              <div className="mt-3 h-1 rounded-full" style={{ background: "rgba(0,245,255,0.1)" }}>
                <div
                  className="h-1 rounded-full stage-bar"
                  style={{ width: `${Math.floor((vals[i % vals.length] / 100) * 100)}%` }}
                />
              </div>
            </TiltCard>
          )
        })}
      </div>
    </div>
  )
}
