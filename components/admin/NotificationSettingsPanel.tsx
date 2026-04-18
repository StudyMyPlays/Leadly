"use client"

import { useMemo, useState } from "react"
import {
  ArrowLeft,
  Mail,
  Bell,
  Webhook,
  Save,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Copy,
  ChevronDown,
  UserPlus,
  Repeat,
  TrendingUp,
  CalendarDays,
  FileBarChart,
  Zap,
  Boxes,
  ExternalLink,
} from "lucide-react"

// ─────────────────────────────────────────────────────────────────
// Design tokens (scoped — same system as UserManagement / Routing)
// ─────────────────────────────────────────────────────────────────
const EMERALD = "#10b981"
const EMERALD_SOFT = "rgba(16,185,129,0.10)"
const EMERALD_BORDER = "rgba(16,185,129,0.28)"
const EMERALD_GLOW = "0 0 0 1px rgba(16,185,129,0.22), 0 0 20px rgba(16,185,129,0.14)"

const SLATE_BG = "#0b0f14"
const SLATE_PANEL = "rgba(17,23,31,0.92)"
const SLATE_BORDER = "rgba(255,255,255,0.06)"
const SLATE_BORDER_STRONG = "rgba(255,255,255,0.10)"
const TEXT = "#e2e8f0"
const TEXT_DIM = "rgba(226,232,240,0.55)"
const TEXT_MUTE = "rgba(226,232,240,0.35)"

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────
type Recipient = "Owner" | "Partner" | "Both"
type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"
type EventKey =
  | "new_lead"
  | "status_change"
  | "lead_assigned"
  | "weekly_summary"
  | "monthly_digest"

interface EmailSetting {
  enabled: boolean
  recipient?: Recipient
  dayOfWeek?: DayOfWeek
}

type EmailSettings = Record<EventKey, EmailSetting>
type InAppSettings = Record<EventKey, boolean>

interface WebhookEventTriggers {
  new_lead: boolean
  status_change: boolean
  converted: boolean
}

interface Toast {
  id: number
  tone: "success" | "error" | "info"
  text: string
}

// ─────────────────────────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────────────────────────
const DEFAULT_EMAIL: EmailSettings = {
  new_lead:        { enabled: true,  recipient: "Both" },
  status_change:   { enabled: true },
  lead_assigned:   { enabled: true },
  weekly_summary:  { enabled: true,  dayOfWeek: "Mon" },
  monthly_digest:  { enabled: false },
}

const DEFAULT_IN_APP: InAppSettings = {
  new_lead:        true,
  status_change:   true,
  lead_assigned:   true,
  weekly_summary:  false,
  monthly_digest:  false,
}

const EVENT_META: Record<EventKey, { label: string; desc: string; icon: typeof UserPlus }> = {
  new_lead: {
    label: "New lead received",
    desc: "Fire whenever a new lead enters the system.",
    icon: UserPlus,
  },
  status_change: {
    label: "Lead status changed",
    desc: "Any transition across pipeline stages.",
    icon: Repeat,
  },
  lead_assigned: {
    label: "Lead assigned to user",
    desc: "When routing assigns a lead to a team member.",
    icon: TrendingUp,
  },
  weekly_summary: {
    label: "Weekly summary report",
    desc: "Top-level performance recap sent every week.",
    icon: CalendarDays,
  },
  monthly_digest: {
    label: "Monthly analytics digest",
    desc: "Deep-dive analytics, MoM deltas, conversion.",
    icon: FileBarChart,
  },
}

const DAYS: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const RECIPIENTS: Recipient[] = ["Owner", "Partner", "Both"]

// ─────────────────────────────────────────────────────────────────
// Small primitives
// ─────────────────────────────────────────────────────────────────
function Switch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className="relative flex-shrink-0 transition-all"
      style={{
        width: 34,
        height: 20,
        borderRadius: 999,
        background: checked ? EMERALD : "rgba(255,255,255,0.08)",
        border: checked ? `1px solid ${EMERALD_BORDER}` : `1px solid ${SLATE_BORDER_STRONG}`,
        boxShadow: checked ? "0 0 12px rgba(16,185,129,0.35)" : "none",
        cursor: "pointer",
      }}
    >
      <span
        className="absolute top-1/2 transition-all"
        style={{
          width: 14,
          height: 14,
          borderRadius: 999,
          background: checked ? "#06150a" : "#c8cdd8",
          left: checked ? 17 : 3,
          transform: "translateY(-50%)",
        }}
      />
    </button>
  )
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T
  onChange: (v: T) => void
  options: readonly T[]
  ariaLabel: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 p-0.5 rounded-lg"
      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${SLATE_BORDER}` }}
    >
      {options.map((opt) => {
        const active = value === opt
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt)}
            className="px-2.5 h-7 rounded-md text-[11px] font-mono font-semibold uppercase tracking-wider transition-all"
            style={{
              background: active ? EMERALD_SOFT : "transparent",
              border: `1px solid ${active ? EMERALD_BORDER : "transparent"}`,
              color: active ? EMERALD : TEXT_DIM,
              boxShadow: active ? "inset 0 0 0 1px rgba(16,185,129,0.10)" : "none",
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

function Checkbox({
  checked,
  onChange,
  label,
  ariaLabel,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  ariaLabel?: string
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none group">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={ariaLabel ?? label}
        onClick={() => onChange(!checked)}
        className="flex items-center justify-center flex-shrink-0 transition-all"
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          background: checked ? EMERALD : "rgba(255,255,255,0.03)",
          border: `1px solid ${checked ? EMERALD_BORDER : SLATE_BORDER_STRONG}`,
          boxShadow: checked ? "0 0 8px rgba(16,185,129,0.3)" : "none",
        }}
      >
        {checked && <Check size={11} strokeWidth={3} style={{ color: "#06150a" }} />}
      </button>
      <span
        className="text-[13px] font-sans transition-colors"
        style={{ color: checked ? TEXT : TEXT_DIM }}
      >
        {label}
      </span>
    </label>
  )
}

// ─────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────
export default function NotificationSettingsPanel({
  onBack,
}: {
  onBack?: () => void
}) {
  const [emailSettings, setEmailSettings] = useState<EmailSettings>(DEFAULT_EMAIL)
  const [inAppSettings, setInAppSettings] = useState<InAppSettings>(DEFAULT_IN_APP)

  const [webhookUrl, setWebhookUrl] = useState("")
  const [webhookTriggers, setWebhookTriggers] = useState<WebhookEventTriggers>({
    new_lead: true,
    status_change: false,
    converted: true,
  })
  const [testingWebhook, setTestingWebhook] = useState(false)

  const [zapierConnected, setZapierConnected] = useState(false)
  const [makeConnected, setMakeConnected] = useState(false)

  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  // ── helpers ────────────────────────────────────────────────────
  const pushToast = (tone: Toast["tone"], text: string) => {
    const id = Date.now() + Math.random()
    setToasts((p) => [...p, { id, tone, text }])
    window.setTimeout(() => {
      setToasts((p) => p.filter((t) => t.id !== id))
    }, 3200)
  }

  const updateEmail = (key: EventKey, patch: Partial<EmailSetting>) => {
    setEmailSettings((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }))
    setDirty(true)
  }

  const updateInApp = (key: EventKey, enabled: boolean) => {
    setInAppSettings((prev) => ({ ...prev, [key]: enabled }))
    setDirty(true)
  }

  const updateWebhookTrigger = (k: keyof WebhookEventTriggers, v: boolean) => {
    setWebhookTriggers((p) => ({ ...p, [k]: v }))
    setDirty(true)
  }

  const isValidUrl = useMemo(() => {
    if (!webhookUrl.trim()) return false
    try {
      const u = new URL(webhookUrl.trim())
      return u.protocol === "http:" || u.protocol === "https:"
    } catch {
      return false
    }
  }, [webhookUrl])

  const testWebhook = async () => {
    if (!isValidUrl) {
      pushToast("error", "Enter a valid https:// webhook URL first.")
      return
    }
    setTestingWebhook(true)
    // Simulate request
    await new Promise((r) => setTimeout(r, 900))
    // Deterministic "success" for demo, but surface the error path realistically:
    const ok = Math.random() > 0.15
    setTestingWebhook(false)
    if (ok) {
      pushToast("success", "Test payload delivered — 200 OK from endpoint.")
    } else {
      pushToast("error", "Test failed — endpoint returned 502. Check the URL.")
    }
  }

  const copySample = async () => {
    const sample = JSON.stringify(
      {
        event: "new_lead",
        timestamp: new Date().toISOString(),
        lead: {
          id: "lead_01H9",
          name: "Robert Martinez",
          email: "robert@example.com",
          service: "Installation",
          city: "New York",
          value: 1850,
          status: "new",
        },
      },
      null,
      2,
    )
    try {
      await navigator.clipboard.writeText(sample)
      pushToast("success", "Sample payload copied to clipboard.")
    } catch {
      pushToast("error", "Copy failed — clipboard unavailable.")
    }
  }

  const toggleZapier = () => {
    setZapierConnected((v) => {
      pushToast(v ? "info" : "success", v ? "Zapier disconnected." : "Zapier connected.")
      return !v
    })
    setDirty(true)
  }

  const toggleMake = () => {
    setMakeConnected((v) => {
      pushToast(v ? "info" : "success", v ? "Make.com disconnected." : "Make.com connected.")
      return !v
    })
    setDirty(true)
  }

  const saveAll = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 700))
    setSaving(false)
    setDirty(false)
    pushToast("success", "Notification settings saved.")
  }

  const enabledEmailCount = Object.values(emailSettings).filter((s) => s.enabled).length
  const enabledInAppCount = Object.values(inAppSettings).filter(Boolean).length
  const enabledWebhookCount =
    Number(webhookTriggers.new_lead) +
    Number(webhookTriggers.status_change) +
    Number(webhookTriggers.converted)

  // ─────────────────────────────────────────────────────────────
  return (
    <div
      className="relative min-h-screen w-full font-sans"
      style={{
        background: SLATE_BG,
        color: TEXT,
        backgroundImage: [
          "radial-gradient(900px 500px at 100% -10%, rgba(16,185,129,0.06), transparent 60%)",
          "radial-gradient(700px 400px at -10% 110%, rgba(16,185,129,0.04), transparent 60%)",
        ].join(","),
        paddingBottom: 96, // room for sticky save bar
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-6 h-14"
        style={{
          background: "rgba(11,15,20,0.85)",
          borderBottom: `1px solid ${SLATE_BORDER}`,
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center flex-shrink-0 transition-colors"
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${SLATE_BORDER_STRONG}`,
                color: TEXT_DIM,
              }}
              aria-label="Back"
            >
              <ArrowLeft size={14} />
            </button>
          )}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: EMERALD_SOFT,
                border: `1px solid ${EMERALD_BORDER}`,
                color: EMERALD,
              }}
            >
              <Bell size={14} />
            </div>
            <div className="min-w-0">
              <h1 className="text-[15px] font-semibold truncate" style={{ color: TEXT }}>
                Notification Settings
              </h1>
              <p
                className="text-[11px] font-mono uppercase tracking-wider truncate"
                style={{ color: TEXT_MUTE }}
              >
                Email · In-App · Webhooks
              </p>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <StatPill label="Email" count={enabledEmailCount} total={5} icon={Mail} />
          <StatPill label="In-App" count={enabledInAppCount} total={5} icon={Bell} />
          <StatPill
            label="Webhook"
            count={enabledWebhookCount}
            total={3}
            icon={Webhook}
          />
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-5xl px-6 py-7 flex flex-col gap-8">
        {/* 1. EMAIL */}
        <Section
          icon={Mail}
          title="Email Notifications"
          subtitle="Delivered to the team inbox with full lead context."
          meta={`${enabledEmailCount} of 5 active`}
        >
          <div className="flex flex-col gap-3">
            {(Object.keys(EVENT_META) as EventKey[]).map((key) => {
              const meta = EVENT_META[key]
              const setting = emailSettings[key]
              return (
                <EmailToggleCard
                  key={key}
                  eventKey={key}
                  icon={meta.icon}
                  label={meta.label}
                  description={meta.desc}
                  setting={setting}
                  onChange={(patch) => updateEmail(key, patch)}
                />
              )
            })}
          </div>
        </Section>

        {/* 2. IN-APP */}
        <Section
          icon={Bell}
          title="In-App Notifications"
          subtitle="Shown in the bell menu and as transient toasts inside LeadOS."
          meta={`${enabledInAppCount} of 5 active`}
        >
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: SLATE_PANEL, border: `1px solid ${SLATE_BORDER}` }}
          >
            {(Object.keys(EVENT_META) as EventKey[]).map((key, idx, arr) => {
              const meta = EVENT_META[key]
              const Icon = meta.icon
              const enabled = inAppSettings[key]
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 px-4 py-3 transition-colors"
                  style={{
                    borderBottom: idx < arr.length - 1 ? `1px solid ${SLATE_BORDER}` : "none",
                    background: enabled ? "rgba(16,185,129,0.025)" : "transparent",
                  }}
                >
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: enabled ? EMERALD_SOFT : "rgba(255,255,255,0.03)",
                      border: `1px solid ${enabled ? EMERALD_BORDER : SLATE_BORDER_STRONG}`,
                      color: enabled ? EMERALD : TEXT_DIM,
                    }}
                  >
                    <Icon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium" style={{ color: TEXT }}>
                      {meta.label}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: TEXT_MUTE }}>
                      {meta.desc}
                    </p>
                  </div>
                  <Switch
                    checked={enabled}
                    onChange={(v) => updateInApp(key, v)}
                    ariaLabel={`Toggle in-app notifications for ${meta.label}`}
                  />
                </div>
              )
            })}
          </div>
        </Section>

        {/* 3. WEBHOOKS & INTEGRATIONS */}
        <Section
          icon={Webhook}
          title="Webhook & Integrations"
          subtitle="Stream events to your own endpoint or to no-code platforms."
          meta={`${enabledWebhookCount} triggers · ${
            (zapierConnected ? 1 : 0) + (makeConnected ? 1 : 0)
          } integration${(zapierConnected ? 1 : 0) + (makeConnected ? 1 : 0) === 1 ? "" : "s"}`}
        >
          {/* Custom webhook */}
          <div
            className="rounded-xl p-5 flex flex-col gap-5"
            style={{ background: SLATE_PANEL, border: `1px solid ${SLATE_BORDER}` }}
          >
            <div className="flex flex-col gap-2">
              <label
                className="text-[11px] font-mono uppercase tracking-wider"
                style={{ color: TEXT_MUTE }}
              >
                Webhook URL
              </label>
              <div
                className="flex items-center gap-2 h-10 px-3 rounded-lg transition-all"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: `1px solid ${
                    webhookUrl && !isValidUrl ? "rgba(248,113,113,0.35)" : SLATE_BORDER_STRONG
                  }`,
                }}
              >
                <Webhook size={14} style={{ color: TEXT_MUTE, flexShrink: 0 }} />
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => {
                    setWebhookUrl(e.target.value)
                    setDirty(true)
                  }}
                  placeholder="https://hooks.yourdomain.com/leados"
                  className="flex-1 bg-transparent outline-none text-[13px] font-mono"
                  style={{ color: TEXT }}
                  aria-label="Webhook URL"
                />
                {webhookUrl && isValidUrl && (
                  <span
                    className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider flex-shrink-0"
                    style={{ color: EMERALD }}
                  >
                    <Check size={11} /> valid
                  </span>
                )}
                {webhookUrl && !isValidUrl && (
                  <span
                    className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider flex-shrink-0"
                    style={{ color: "#f87171" }}
                  >
                    <AlertTriangle size={11} /> invalid
                  </span>
                )}
              </div>
            </div>

            {/* Triggers */}
            <div className="flex flex-col gap-2.5">
              <label
                className="text-[11px] font-mono uppercase tracking-wider"
                style={{ color: TEXT_MUTE }}
              >
                Trigger Events
              </label>
              <div className="flex flex-wrap gap-x-7 gap-y-2.5">
                <Checkbox
                  checked={webhookTriggers.new_lead}
                  onChange={(v) => updateWebhookTrigger("new_lead", v)}
                  label="New lead"
                />
                <Checkbox
                  checked={webhookTriggers.status_change}
                  onChange={(v) => updateWebhookTrigger("status_change", v)}
                  label="Status change"
                />
                <Checkbox
                  checked={webhookTriggers.converted}
                  onChange={(v) => updateWebhookTrigger("converted", v)}
                  label="Lead converted"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={testWebhook}
                disabled={testingWebhook || !isValidUrl}
                className="flex items-center gap-2 px-3.5 h-9 rounded-lg text-[12px] font-semibold font-sans transition-all disabled:cursor-not-allowed"
                style={{
                  background: isValidUrl ? EMERALD_SOFT : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isValidUrl ? EMERALD_BORDER : SLATE_BORDER_STRONG}`,
                  color: isValidUrl ? EMERALD : TEXT_MUTE,
                  boxShadow: isValidUrl && !testingWebhook ? EMERALD_GLOW : "none",
                  opacity: testingWebhook ? 0.7 : 1,
                }}
              >
                {testingWebhook ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Zap size={13} />
                )}
                {testingWebhook ? "Sending test…" : "Test Webhook"}
              </button>
              <button
                type="button"
                onClick={copySample}
                className="flex items-center gap-2 px-3.5 h-9 rounded-lg text-[12px] font-sans transition-colors"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${SLATE_BORDER_STRONG}`,
                  color: TEXT_DIM,
                }}
              >
                <Copy size={12} /> Copy sample payload
              </button>
              <span
                className="ml-auto text-[11px] font-mono"
                style={{ color: TEXT_MUTE }}
              >
                Payload is POSTed as JSON with signature header.
              </span>
            </div>
          </div>

          {/* Integration tiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <IntegrationTile
              name="Zapier"
              tagline="5,000+ apps · no-code automation"
              icon={Zap}
              color="#ff9a3c"
              connected={zapierConnected}
              onToggle={toggleZapier}
            />
            <IntegrationTile
              name="Make.com"
              tagline="Visual scenarios · advanced logic"
              icon={Boxes}
              color="#a78bfa"
              connected={makeConnected}
              onToggle={toggleMake}
            />
          </div>
        </Section>
      </main>

      {/* Sticky save bar */}
      <div
        className="fixed left-0 right-0 bottom-0 z-30 flex items-center justify-between gap-4 px-6 py-3"
        style={{
          background: "rgba(11,15,20,0.92)",
          borderTop: `1px solid ${SLATE_BORDER_STRONG}`,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider"
            style={{ color: dirty ? "#fbbf24" : TEXT_MUTE }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: dirty ? "#fbbf24" : EMERALD,
                boxShadow: dirty
                  ? "0 0 6px rgba(251,191,36,0.6)"
                  : "0 0 6px rgba(16,185,129,0.45)",
              }}
            />
            {dirty ? "Unsaved changes" : "All changes saved"}
          </span>
        </div>
        <button
          type="button"
          onClick={saveAll}
          disabled={!dirty || saving}
          className="flex items-center gap-2 px-4 h-10 rounded-lg text-[13px] font-semibold font-sans transition-all disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: dirty ? EMERALD : "rgba(255,255,255,0.04)",
            border: `1px solid ${dirty ? EMERALD_BORDER : SLATE_BORDER_STRONG}`,
            color: dirty ? "#06150a" : TEXT_MUTE,
            boxShadow: dirty && !saving ? EMERALD_GLOW : "none",
            minWidth: 150,
            justifyContent: "center",
          }}
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Save size={14} /> Save Changes
            </>
          )}
        </button>
      </div>

      {/* Toasts */}
      <div
        className="fixed bottom-20 right-6 z-40 flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-[12px] font-sans shadow-xl"
            style={{
              background:
                t.tone === "success"
                  ? "rgba(6,21,13,0.98)"
                  : t.tone === "error"
                    ? "rgba(28,10,10,0.98)"
                    : "rgba(15,21,28,0.98)",
              border: `1px solid ${
                t.tone === "success"
                  ? EMERALD_BORDER
                  : t.tone === "error"
                    ? "rgba(248,113,113,0.32)"
                    : SLATE_BORDER_STRONG
              }`,
              color:
                t.tone === "success"
                  ? "#a7f3d0"
                  : t.tone === "error"
                    ? "#fecaca"
                    : TEXT_DIM,
              boxShadow:
                t.tone === "success"
                  ? "0 12px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(16,185,129,0.12)"
                  : "0 12px 30px rgba(0,0,0,0.5)",
              minWidth: 240,
              maxWidth: 360,
            }}
          >
            {t.tone === "success" && <Check size={13} style={{ color: EMERALD, flexShrink: 0 }} />}
            {t.tone === "error" && (
              <AlertTriangle size={13} style={{ color: "#f87171", flexShrink: 0 }} />
            )}
            {t.tone === "info" && <Bell size={13} style={{ color: TEXT_DIM, flexShrink: 0 }} />}
            <span className="flex-1">{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  subtitle,
  meta,
  children,
}: {
  icon: typeof Mail
  title: string
  subtitle: string
  meta?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: EMERALD_SOFT,
              border: `1px solid ${EMERALD_BORDER}`,
              color: EMERALD,
            }}
          >
            <Icon size={15} />
          </div>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold" style={{ color: TEXT }}>
              {title}
            </h2>
            <p className="text-[12px]" style={{ color: TEXT_DIM }}>
              {subtitle}
            </p>
          </div>
        </div>
        {meta && (
          <span
            className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full flex-shrink-0"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${SLATE_BORDER_STRONG}`,
              color: TEXT_MUTE,
            }}
          >
            {meta}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}

function StatPill({
  label,
  count,
  total,
  icon: Icon,
}: {
  label: string
  count: number
  total: number
  icon: typeof Mail
}) {
  const active = count > 0
  return (
    <div
      className="flex items-center gap-2 px-2.5 h-8 rounded-lg"
      style={{
        background: active ? EMERALD_SOFT : "rgba(255,255,255,0.03)",
        border: `1px solid ${active ? EMERALD_BORDER : SLATE_BORDER_STRONG}`,
      }}
    >
      <Icon size={12} style={{ color: active ? EMERALD : TEXT_MUTE }} />
      <span
        className="text-[11px] font-mono uppercase tracking-wider"
        style={{ color: active ? EMERALD : TEXT_DIM }}
      >
        {label}
      </span>
      <span
        className="text-[11px] font-mono font-semibold"
        style={{ color: active ? EMERALD : TEXT_DIM }}
      >
        {count}/{total}
      </span>
    </div>
  )
}

function EmailToggleCard({
  eventKey,
  icon: Icon,
  label,
  description,
  setting,
  onChange,
}: {
  eventKey: EventKey
  icon: typeof Mail
  label: string
  description: string
  setting: EmailSetting
  onChange: (patch: Partial<EmailSetting>) => void
}) {
  const enabled = setting.enabled
  return (
    <div
      className="rounded-xl p-4 transition-all"
      style={{
        background: enabled ? "rgba(16,185,129,0.035)" : SLATE_PANEL,
        border: `1px solid ${enabled ? EMERALD_BORDER : SLATE_BORDER}`,
        boxShadow: enabled ? EMERALD_GLOW : "none",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: enabled ? EMERALD_SOFT : "rgba(255,255,255,0.03)",
            border: `1px solid ${enabled ? EMERALD_BORDER : SLATE_BORDER_STRONG}`,
            color: enabled ? EMERALD : TEXT_DIM,
          }}
        >
          <Icon size={15} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-medium" style={{ color: TEXT }}>
                {label}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: TEXT_MUTE }}>
                {description}
              </p>
            </div>
            <Switch
              checked={enabled}
              onChange={(v) => onChange({ enabled: v })}
              ariaLabel={`Toggle email notifications for ${label}`}
            />
          </div>

          {/* Contextual controls */}
          {enabled && eventKey === "new_lead" && setting.recipient && (
            <div
              className="flex items-center flex-wrap gap-3 mt-3 pt-3"
              style={{ borderTop: `1px dashed ${SLATE_BORDER_STRONG}` }}
            >
              <label className="text-[11px] font-mono uppercase tracking-wider" style={{ color: TEXT_MUTE }}>
                Deliver to
              </label>
              <Segmented
                value={setting.recipient}
                onChange={(v) => onChange({ recipient: v })}
                options={RECIPIENTS}
                ariaLabel="Recipient selector"
              />
            </div>
          )}

          {enabled && eventKey === "weekly_summary" && setting.dayOfWeek && (
            <div
              className="flex items-center flex-wrap gap-3 mt-3 pt-3"
              style={{ borderTop: `1px dashed ${SLATE_BORDER_STRONG}` }}
            >
              <label
                className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider"
                style={{ color: TEXT_MUTE }}
              >
                <CalendarDays size={11} /> Sends every
              </label>
              <div className="flex items-center gap-1 flex-wrap">
                {DAYS.map((d) => {
                  const active = setting.dayOfWeek === d
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => onChange({ dayOfWeek: d })}
                      aria-pressed={active}
                      className="h-7 px-2.5 rounded-md text-[11px] font-mono font-semibold uppercase tracking-wider transition-all"
                      style={{
                        background: active ? EMERALD_SOFT : "rgba(255,255,255,0.03)",
                        border: `1px solid ${active ? EMERALD_BORDER : SLATE_BORDER}`,
                        color: active ? EMERALD : TEXT_DIM,
                      }}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function IntegrationTile({
  name,
  tagline,
  icon: Icon,
  color,
  connected,
  onToggle,
}: {
  name: string
  tagline: string
  icon: typeof Zap
  color: string
  connected: boolean
  onToggle: () => void
}) {
  return (
    <div
      className="flex items-center gap-3 p-4 rounded-xl transition-all"
      style={{
        background: connected ? "rgba(16,185,129,0.035)" : SLATE_PANEL,
        border: `1px solid ${connected ? EMERALD_BORDER : SLATE_BORDER}`,
        boxShadow: connected ? EMERALD_GLOW : "none",
      }}
    >
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `${color}15`,
          border: `1px solid ${color}44`,
          color,
        }}
      >
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-semibold" style={{ color: TEXT }}>
            {name}
          </p>
          {connected && (
            <span
              className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full"
              style={{
                background: EMERALD_SOFT,
                border: `1px solid ${EMERALD_BORDER}`,
                color: EMERALD,
              }}
            >
              <span
                className="w-1 h-1 rounded-full"
                style={{ background: EMERALD, boxShadow: "0 0 4px rgba(16,185,129,0.7)" }}
              />
              Connected
            </span>
          )}
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: TEXT_MUTE }}>
          {tagline}
        </p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[11px] font-mono font-semibold uppercase tracking-wider transition-all flex-shrink-0"
        style={{
          background: connected ? "rgba(255,255,255,0.03)" : EMERALD_SOFT,
          border: `1px solid ${connected ? SLATE_BORDER_STRONG : EMERALD_BORDER}`,
          color: connected ? TEXT_DIM : EMERALD,
        }}
      >
        {connected ? (
          <>
            <X size={11} /> Disconnect
          </>
        ) : (
          <>
            <ExternalLink size={11} /> Connect
          </>
        )}
      </button>
    </div>
  )
}
