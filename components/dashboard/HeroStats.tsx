"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import {
  Users2,
  TrendingUp,
  Clock4,
  Trophy,
  ArrowUpRight,
} from "lucide-react"

// ── Palette (aligned with globals.css tokens) ──────────────────
const BLUE    = "#3b82f6"
const BLUE_2  = "#60a5fa"
const EMERALD = "#10b981"
const AMBER   = "#f59e0b"
const TEXT    = "#e2e8f0"
const TEXT_DIM = "rgba(226,232,240,0.55)"
const TEXT_MUTE = "rgba(226,232,240,0.38)"

// ── hex → "r,g,b" helper ──────────────────────────────────────
function rgb(hex: string) {
  const h = hex.replace("#", "")
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16)
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
}

// ── Counting animation ────────────────────────────────────────
function useCountUp(target: number, duration = 1200, delay = 0) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf: number
    let start: number | null = null
    const timeout = setTimeout(() => {
      const step = (ts: number) => {
        if (!start) start = ts
        const elapsed = ts - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - (1 - progress) * (1 - progress)
        setValue(Math.round(eased * target))
        if (progress < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }, delay)
    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(raf)
    }
  }, [target, duration, delay])
  return value
}

// ── Glass KPI card with subtle tilt ──────────────────────────
function KpiCard({
  children,
  accent,
  delay,
  ariaLabel,
}: {
  children: React.ReactNode
  accent: string
  delay: number
  ariaLabel: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    const rotY = ((x - r.width / 2) / (r.width / 2)) * 4
    const rotX = -((y - r.height / 2) / (r.height / 2)) * 4
    el.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-2px)`
  }, [])

  const handleMouseLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)"
  }, [])

  return (
    <article
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-label={ariaLabel}
      className="relative rounded-xl p-5 flex flex-col gap-4 cursor-default overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, rgba(17,22,32,0.92) 0%, rgba(10,13,20,0.92) 100%)",
        border: `1px solid rgba(${rgb(accent)},0.18)`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: `
          0 1px 0 rgba(255,255,255,0.04) inset,
          0 24px 50px -20px rgba(0,0,0,0.6),
          0 0 0 1px rgba(${rgb(accent)},0.04)
        `,
        transformStyle: "preserve-3d",
        transition:
          "transform 0.25s ease, box-shadow 0.25s ease, opacity 0.6s ease, translate 0.6s ease",
        opacity: visible ? 1 : 0,
        translate: visible ? "0 0" : "0 24px",
        minHeight: 164,
      }}
    >
      {/* Top edge highlight */}
      <span
        aria-hidden
        className="absolute inset-x-5 top-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(${rgb(accent)},0.55), transparent)`,
        }}
      />
      {/* Corner glow */}
      <span
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: -60, right: -60,
          width: 160, height: 160,
          background: `radial-gradient(circle, rgba(${rgb(accent)},0.22), transparent 70%)`,
          filter: "blur(8px)",
        }}
      />
      {children}
    </article>
  )
}

// ── Icon tile ──────────────────────────────────────────────────
function IconTile({ Icon, accent }: { Icon: typeof Users2; accent: string }) {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        background: `rgba(${rgb(accent)},0.10)`,
        border: `1px solid rgba(${rgb(accent)},0.28)`,
        color: accent,
        boxShadow: `inset 0 0 0 1px rgba(${rgb(accent)},0.05), 0 0 14px rgba(${rgb(accent)},0.14)`,
      }}
    >
      <Icon size={15} strokeWidth={2} />
    </div>
  )
}

// ── Delta pill ─────────────────────────────────────────────────
function Delta({
  value,
  accent,
  label,
}: {
  value: string
  accent: string
  label?: string
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full text-[10px] font-mono uppercase tracking-wider"
      style={{
        height: 22,
        padding: "0 8px",
        background: `rgba(${rgb(accent)},0.10)`,
        border: `1px solid rgba(${rgb(accent)},0.28)`,
        color: accent,
      }}
    >
      <ArrowUpRight size={10} strokeWidth={2.5} />
      {value}{label ? <span className="opacity-70">· {label}</span> : null}
    </span>
  )
}

// ── Sparkline ──────────────────────────────────────────────────
const SPARK = [3, 6, 5, 8, 7, 11, 9]
function Sparkline({ accent }: { accent: string }) {
  const max = Math.max(...SPARK)
  return (
    <div className="flex items-end gap-1 h-8" aria-hidden>
      {SPARK.map((v, i) => {
        const isLast = i === SPARK.length - 1
        return (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: `${(v / max) * 100}%`,
              background: isLast ? accent : `rgba(${rgb(accent)},0.30)`,
              boxShadow: isLast ? `0 0 6px rgba(${rgb(accent)},0.7)` : undefined,
              transition: `height 0.5s ease ${i * 60}ms`,
            }}
          />
        )
      })}
    </div>
  )
}

// ── Pulse dot ──────────────────────────────────────────────────
function PulseDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2 w-2 flex-shrink-0" aria-hidden>
      <span
        className="absolute inline-flex h-full w-full rounded-full opacity-75"
        style={{
          background: color,
          animation: "heroPing 1.6s cubic-bezier(0,0,0.2,1) infinite",
        }}
      />
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
    </span>
  )
}

// ── Mini donut ─────────────────────────────────────────────────
function MiniDonut({ pct, accent }: { pct: number; accent: string }) {
  const data = [{ value: pct }, { value: Math.max(100 - pct, 0) }]
  return (
    <div style={{ width: 48, height: 48 }} aria-label={`${pct}% conversion`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={15}
            outerRadius={22}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            strokeWidth={0}
          >
            <Cell fill={accent} />
            <Cell fill={`rgba(${rgb(accent)},0.12)`} />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Stat number (large) ────────────────────────────────────────
function StatNumber({ value, color }: { value: number | string; color: string }) {
  return (
    <div
      className="font-mono font-semibold leading-none"
      style={{
        color,
        fontSize: 36,
        letterSpacing: "-0.02em",
        textShadow: `0 0 24px rgba(${rgb(color)},0.25)`,
      }}
    >
      {value}
    </div>
  )
}

// ── Cards ──────────────────────────────────────────────────────
function TotalLeadsCard() {
  const count = useCountUp(47, 1100, 0)
  return (
    <KpiCard accent={BLUE} delay={0} ariaLabel="Total Leads">
      <header className="flex items-center justify-between">
        <IconTile Icon={Users2} accent={BLUE} />
        <span
          className="inline-flex items-center h-[22px] px-2 rounded-full text-[10px] font-mono uppercase tracking-wider"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: TEXT_MUTE,
          }}
        >
          All time
        </span>
      </header>

      <div className="flex flex-col gap-1">
        <p
          className="text-[10px] font-mono uppercase tracking-[0.12em]"
          style={{ color: TEXT_MUTE }}
        >
          Total Leads
        </p>
        <StatNumber value={count} color={BLUE_2} />
      </div>

      <div className="mt-auto flex items-center justify-between gap-3">
        <Sparkline accent={BLUE} />
        <Delta value="+12%" accent={EMERALD} label="7d" />
      </div>
    </KpiCard>
  )
}

function NewThisWeekCard() {
  const count = useCountUp(11, 1100, 100)
  return (
    <KpiCard accent={EMERALD} delay={80} ariaLabel="New This Week">
      <header className="flex items-center justify-between">
        <IconTile Icon={TrendingUp} accent={EMERALD} />
        <Delta value="+22%" accent={EMERALD} label="vs last wk" />
      </header>

      <div className="flex flex-col gap-1">
        <p
          className="text-[10px] font-mono uppercase tracking-[0.12em]"
          style={{ color: TEXT_MUTE }}
        >
          New This Week
        </p>
        <StatNumber value={count} color={EMERALD} />
      </div>

      <p className="mt-auto text-[11px] font-sans" style={{ color: TEXT_DIM }}>
        Above your 30-day average of{" "}
        <span className="font-mono" style={{ color: TEXT }}>
          9.1
        </span>
      </p>
    </KpiCard>
  )
}

function FollowUpCard() {
  const count = useCountUp(8, 1100, 160)
  return (
    <KpiCard accent={AMBER} delay={160} ariaLabel="Follow-up Needed">
      <header className="flex items-center justify-between">
        <IconTile Icon={Clock4} accent={AMBER} />
        <span
          className="inline-flex items-center gap-1.5 h-[22px] px-2 rounded-full text-[10px] font-mono uppercase tracking-wider"
          style={{
            background: "rgba(245,158,11,0.10)",
            border: "1px solid rgba(245,158,11,0.28)",
            color: AMBER,
          }}
        >
          <PulseDot color={AMBER} />
          Action
        </span>
      </header>

      <div className="flex flex-col gap-1">
        <p
          className="text-[10px] font-mono uppercase tracking-[0.12em]"
          style={{ color: TEXT_MUTE }}
        >
          Follow-up Needed
        </p>
        <StatNumber value={count} color={AMBER} />
      </div>

      <div className="mt-auto">
        <div
          className="flex items-center justify-between text-[10px] font-mono mb-1.5"
          style={{ color: TEXT_MUTE }}
        >
          <span>SLA risk</span>
          <span style={{ color: AMBER }}>62%</span>
        </div>
        <div
          className="h-1 rounded-full overflow-hidden"
          style={{ background: "rgba(245,158,11,0.10)" }}
        >
          <div
            className="h-1 rounded-full"
            style={{
              width: "62%",
              background: AMBER,
              boxShadow: `0 0 8px rgba(${rgb(AMBER)},0.6)`,
              transition: "width 1.1s ease 0.4s",
            }}
          />
        </div>
      </div>
    </KpiCard>
  )
}

function ConvertedCard() {
  const count = useCountUp(14, 1100, 240)
  const pct = 30
  return (
    <KpiCard accent={EMERALD} delay={240} ariaLabel="Won deals">
      <header className="flex items-center justify-between">
        <IconTile Icon={Trophy} accent={EMERALD} />
        <Delta value={`${pct}%`} accent={EMERALD} label="conv." />
      </header>

      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p
            className="text-[10px] font-mono uppercase tracking-[0.12em]"
            style={{ color: TEXT_MUTE }}
          >
            Won Deals
          </p>
          <StatNumber value={count} color={EMERALD} />
        </div>
        <MiniDonut pct={pct} accent={EMERALD} />
      </div>

      <p
        className="mt-auto text-[11px] font-mono"
        style={{ color: TEXT_DIM }}
      >
        <span style={{ color: EMERALD }}>$18,200</span>{" "}
        <span style={{ color: TEXT_MUTE }}>est. revenue</span>
      </p>
    </KpiCard>
  )
}

// ── Hero Row ───────────────────────────────────────────────────
export default function HeroStats() {
  return (
    <>
      <style>{`
        @keyframes heroPing {
          75%, 100% { transform: scale(2.4); opacity: 0; }
        }
      `}</style>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <TotalLeadsCard />
        <NewThisWeekCard />
        <FollowUpCard />
        <ConvertedCard />
      </div>
    </>
  )
}
