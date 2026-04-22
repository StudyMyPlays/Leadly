"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { X, Plus, UserPlus, ChevronDown, ArrowRight } from "lucide-react"
import { LeadStatus, LeadSource, JobSize, Priority, ContactMethod, SOURCE_LABELS } from "./leads-data"

interface AddLeadModalProps {
  open: boolean
  onClose: () => void
  services?: string[]
  cities?: string[]
  onAdd?: (lead: any) => void
}

const SOURCES: { value: LeadSource; label: string }[] = [
  { value: "website",    label: "Website" },
  { value: "referral",   label: "Referral" },
  { value: "door-knock", label: "Door Knock" },
  { value: "call-in",    label: "Call-In" },
  { value: "craigslist", label: "Craigslist" },
  { value: "google",     label: "Google Search" },
  { value: "signage",    label: "Signage" },
  { value: "jobboard",   label: "Job Board" },
  { value: "other",      label: "Other" },
]
const JOB_SIZES: JobSize[]   = ["$", "$$", "$$$"]
const STATUSES: LeadStatus[] = ["New", "Contacted", "Estimate", "Converted", "Lost"]
const PRIORITIES: Priority[] = ["Low", "Medium", "High"]
const CONTACT_METHODS: ContactMethod[] = ["Call", "Text", "Email", "In-Person"]

const EMPTY = {
  // Basic Info
  name: "", businessName: "", phone: "", email: "", address: "", city: "",
  // Source & Service
  service: "", source: "website" as LeadSource, sourceUrl: "", campaign: "",
  // Pipeline & Status
  status: "New" as LeadStatus, priority: "Medium" as Priority, jobSize: "$" as JobSize,
  followUpDate: "", nextAction: "", assignedTo: "",
  // Engagement
  firstContactedDate: "", lastContactDate: "", contactMethod: "Call" as ContactMethod,
  numberOfTouchpoints: 0,
  // Deal value
  estValue: 0, notes: "",
  // Outcome
  converted: false, conversionDate: "", revenue: 0, reasonLost: "",
}

export default function AddLeadModal({ open, onClose, services = [], cities = [], onAdd }: AddLeadModalProps) {
  const [step, setStep]       = useState(1)
  const [form, setForm]       = useState({ ...EMPTY })
  const [errors, setErrors]   = useState<Record<string, string>>({})
  const [mounted, setMounted] = useState(false)
  const firstInputRef         = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (open) {
      setStep(1)
      setTimeout(() => firstInputRef.current?.focus(), 60)
    } else {
      setForm({ ...EMPTY })
      setErrors({})
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "Enter") {
        e.preventDefault()
        step < 4 ? nextStep() : handleSubmit()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose, step])

  if (!mounted || !open) return null

  const set = (k: string, v: any) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => { const n = { ...e }; delete n[k]; return n })
  }

  const validateStep = (stepNum: number) => {
    const e: Record<string, string> = {}
    if (stepNum === 1) {
      if (!form.name.trim())         e.name = "Required"
      if (!form.phone.trim())        e.phone = "Required"
      if (!form.businessName.trim()) e.businessName = "Required"
      if (!form.city.trim())         e.city = "Required"
    } else if (stepNum === 2) {
      if (!form.service.trim())      e.service = "Required"
      if (!form.source.trim())       e.source = "Required"
    } else if (stepNum === 3) {
      // Optional validation
    } else if (stepNum === 4) {
      // Optional validation
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const nextStep = () => {
    if (validateStep(step)) {
      if (step < 4) setStep(step + 1)
    }
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = () => {
    if (!validateStep(step)) return
    onAdd?.(form)
    onClose()
  }

  const stepTitles = [
    "Basic Information",
    "Source & Service",
    "Pipeline & Follow-up",
    "Deal Value & Outcome",
  ]

  const modal = (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed", inset: 0, zIndex: 9998,
          background: "rgba(0,0,0,0.78)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add new lead"
        style={{
          position: "fixed",
          zIndex: 9999,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(620px, 95vw)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#0c0c10",
          border: "1px solid rgba(59,130,246,0.22)",
          borderRadius: 14,
          boxShadow: "0 0 0 1px rgba(59,130,246,0.06), 0 28px 80px rgba(0,0,0,0.85)",
          animation: "modalSlideUp 0.22s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center"
              style={{
                width: 30, height: 30,
                borderRadius: 8,
                background: "rgba(59,130,246,0.14)",
                border: "1px solid rgba(59,130,246,0.32)",
                color: "#60a5fa",
              }}
            >
              <UserPlus size={14} />
            </div>
            <div>
              <h2 className="text-sm font-semibold font-sans leading-none" style={{ color: "#e2e8f0" }}>
                Add New Lead
              </h2>
              <p className="text-[10px] font-mono uppercase tracking-wider mt-1" style={{ color: "rgba(226,232,240,0.38)" }}>
                Step {step} of 4 • {stepTitles[step - 1]}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center"
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(226,232,240,0.5)",
              cursor: "pointer",
            }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 2, background: "rgba(255,255,255,0.05)" }}>
          <div
            style={{
              height: "100%",
              width: `${(step / 4) * 100}%`,
              background: "rgba(59,130,246,0.6)",
              transition: "width 0.2s ease",
            }}
          />
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4" style={{ minHeight: 300 }}>
          {step === 1 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name" error={errors.name} required>
                  <input
                    ref={firstInputRef}
                    type="text"
                    placeholder="Jane Smith"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    style={inputCss(!!errors.name)}
                  />
                </Field>
                <Field label="Business Name" error={errors.businessName} required>
                  <input
                    type="text"
                    placeholder="Acme Corp"
                    value={form.businessName}
                    onChange={(e) => set("businessName", e.target.value)}
                    style={inputCss(!!errors.businessName)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Phone" error={errors.phone} required>
                  <input
                    type="tel"
                    placeholder="+1 555-000-0000"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    style={inputCss(!!errors.phone)}
                  />
                </Field>
                <Field label="Email Address">
                  <input
                    type="email"
                    placeholder="jane@example.com"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    style={inputCss(false)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="City / Location" error={errors.city} required>
                  <>
                    <input
                      type="text"
                      list="city-suggestions"
                      placeholder={cities.length ? "Select or type…" : "Austin, TX"}
                      value={form.city}
                      onChange={(e) => set("city", e.target.value)}
                      style={inputCss(!!errors.city)}
                      autoComplete="off"
                    />
                    {cities.length > 0 && (
                      <datalist id="city-suggestions">
                        {cities.map((c) => <option key={c} value={c} />)}
                      </datalist>
                    )}
                  </>
                </Field>
                <Field label="Street Address">
                  <input
                    type="text"
                    placeholder="123 Main St"
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    style={inputCss(false)}
                  />
                </Field>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Service / Job Type" error={errors.service} required>
                  <>
                    <input
                      type="text"
                      list="service-suggestions"
                      placeholder={services.length ? "Select or type…" : "Plumbing, Electrical, etc."}
                      value={form.service}
                      onChange={(e) => set("service", e.target.value)}
                      style={inputCss(!!errors.service)}
                      autoComplete="off"
                    />
                    {services.length > 0 && (
                      <datalist id="service-suggestions">
                        {services.map((s) => <option key={s} value={s} />)}
                      </datalist>
                    )}
                  </>
                </Field>
                <Field label="Lead Source" error={errors.source} required>
                  <SelectWrapper>
                    <select
                      value={form.source}
                      onChange={(e) => set("source", e.target.value)}
                      style={selectCss()}
                    >
                      <option value="">Choose a source…</option>
                      {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </SelectWrapper>
                </Field>
              </div>

              <Field label="Source URL or Listing Link">
                <input
                  type="url"
                  placeholder="https://example.com/listing"
                  value={form.sourceUrl}
                  onChange={(e) => set("sourceUrl", e.target.value)}
                  style={inputCss(false)}
                />
              </Field>

              <Field label="Campaign or Keyword">
                <input
                  type="text"
                  placeholder="Spring 2025 Promo, Google Ads, etc."
                  value={form.campaign}
                  onChange={(e) => set("campaign", e.target.value)}
                  style={inputCss(false)}
                />
              </Field>

              <Field label="Notes / Description">
                <textarea
                  rows={3}
                  placeholder="Any additional details about this lead…"
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  style={{ ...inputCss(false), resize: "none", lineHeight: 1.5 }}
                />
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Lead Status">
                  <SelectWrapper>
                    <select
                      value={form.status}
                      onChange={(e) => set("status", e.target.value)}
                      style={selectCss()}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </SelectWrapper>
                </Field>
                <Field label="Priority">
                  <SelectWrapper>
                    <select
                      value={form.priority}
                      onChange={(e) => set("priority", e.target.value)}
                      style={selectCss()}
                    >
                      {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </SelectWrapper>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Job Size">
                  <div className="flex gap-2">
                    {JOB_SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => set("jobSize", size)}
                        style={{
                          flex: 1, height: 38, borderRadius: 8,
                          fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)",
                          cursor: "pointer",
                          background: form.jobSize === size ? "rgba(245,158,11,0.14)" : "rgba(255,255,255,0.04)",
                          border: form.jobSize === size ? "1px solid rgba(245,158,11,0.40)" : "1px solid rgba(255,255,255,0.08)",
                          color: form.jobSize === size ? "#f59e0b" : "rgba(226,232,240,0.38)",
                          boxShadow: form.jobSize === size ? "0 0 8px rgba(245,158,11,0.18)" : "none",
                          transition: "all 0.12s ease",
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Assigned To">
                  <input
                    type="text"
                    placeholder="Team member name"
                    value={form.assignedTo}
                    onChange={(e) => set("assignedTo", e.target.value)}
                    style={inputCss(false)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Follow-up Date">
                  <input
                    type="date"
                    value={form.followUpDate}
                    onChange={(e) => set("followUpDate", e.target.value)}
                    style={inputCss(false)}
                  />
                </Field>
                <Field label="Next Action">
                  <input
                    type="text"
                    placeholder="Send quote, Call back, etc."
                    value={form.nextAction}
                    onChange={(e) => set("nextAction", e.target.value)}
                    style={inputCss(false)}
                  />
                </Field>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Est. Deal Value">
                  <div style={{ position: "relative" }}>
                    <span
                      style={{
                        position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                        fontSize: 12, fontFamily: "var(--font-mono)",
                        color: "rgba(226,232,240,0.35)",
                      }}
                    >
                      $
                    </span>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={form.estValue || ""}
                      onChange={(e) => set("estValue", Number(e.target.value) || 0)}
                      style={{ ...inputCss(false), paddingLeft: 24 }}
                    />
                  </div>
                </Field>
                <Field label="Converted?">
                  <SelectWrapper>
                    <select
                      value={form.converted ? "yes" : "no"}
                      onChange={(e) => set("converted", e.target.value === "yes")}
                      style={selectCss()}
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </SelectWrapper>
                </Field>
              </div>

              {form.converted && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Conversion Date">
                      <input
                        type="date"
                        value={form.conversionDate}
                        onChange={(e) => set("conversionDate", e.target.value)}
                        style={inputCss(false)}
                      />
                    </Field>
                    <Field label="Revenue / Deal Amount">
                      <div style={{ position: "relative" }}>
                        <span
                          style={{
                            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                            fontSize: 12, fontFamily: "var(--font-mono)",
                            color: "rgba(226,232,240,0.35)",
                          }}
                        >
                          $
                        </span>
                        <input
                          type="number"
                          min={0}
                          placeholder="0"
                          value={form.revenue || ""}
                          onChange={(e) => set("revenue", Number(e.target.value) || 0)}
                          style={{ ...inputCss(false), paddingLeft: 24 }}
                        />
                      </div>
                    </Field>
                  </div>
                </>
              )}

              {!form.converted && (
                <Field label="Reason Lost">
                  <textarea
                    rows={2}
                    placeholder="Price, went with competitor, etc."
                    value={form.reasonLost}
                    onChange={(e) => set("reasonLost", e.target.value)}
                    style={{ ...inputCss(false), resize: "none", lineHeight: 1.5 }}
                  />
                </Field>
              )}

              <Field label="First Contact Date">
                <input
                  type="date"
                  value={form.firstContactedDate}
                  onChange={(e) => set("firstContactedDate", e.target.value)}
                  style={inputCss(false)}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Last Contact Date">
                  <input
                    type="date"
                    value={form.lastContactDate}
                    onChange={(e) => set("lastContactDate", e.target.value)}
                    style={inputCss(false)}
                  />
                </Field>
                <Field label="Contact Method">
                  <SelectWrapper>
                    <select
                      value={form.contactMethod}
                      onChange={(e) => set("contactMethod", e.target.value)}
                      style={selectCss()}
                    >
                      {CONTACT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </SelectWrapper>
                </Field>
              </div>

              <Field label="Number of Touchpoints">
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.numberOfTouchpoints}
                  onChange={(e) => set("numberOfTouchpoints", Number(e.target.value) || 0)}
                  style={inputCss(false)}
                />
              </Field>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between gap-3 px-6 py-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
        >
          <button
            onClick={prevStep}
            disabled={step === 1}
            style={{
              height: 36, padding: "0 18px", borderRadius: 8,
              fontSize: 12, fontWeight: 500, fontFamily: "var(--font-sans)",
              background: step === 1 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: step === 1 ? "rgba(226,232,240,0.25)" : "rgba(226,232,240,0.55)",
              cursor: step === 1 ? "not-allowed" : "pointer",
              opacity: step === 1 ? 0.5 : 1,
            }}
          >
            ← Back
          </button>

          <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "rgba(226,232,240,0.35)" }}>
            {step} / 4
          </div>

          <div style={{ display: "flex", gap: 2 }}>
            <button
              onClick={onClose}
              style={{
                height: 36, padding: "0 18px", borderRadius: 8,
                fontSize: 12, fontWeight: 500, fontFamily: "var(--font-sans)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(226,232,240,0.55)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            {step < 4 ? (
              <button
                onClick={nextStep}
                style={{
                  height: 36, padding: "0 18px", borderRadius: 8,
                  fontSize: 12, fontWeight: 600, fontFamily: "var(--font-sans)",
                  background: "rgba(59,130,246,0.16)",
                  border: "1px solid rgba(59,130,246,0.38)",
                  color: "#93c5fd",
                  boxShadow: "0 0 16px rgba(59,130,246,0.18)",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                  transition: "box-shadow 0.15s ease, background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background  = "rgba(59,130,246,0.24)"
                  e.currentTarget.style.boxShadow   = "0 0 24px rgba(59,130,246,0.32)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background  = "rgba(59,130,246,0.16)"
                  e.currentTarget.style.boxShadow   = "0 0 16px rgba(59,130,246,0.18)"
                }}
              >
                Next <ArrowRight size={13} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                style={{
                  height: 36, padding: "0 18px", borderRadius: 8,
                  fontSize: 12, fontWeight: 600, fontFamily: "var(--font-sans)",
                  background: "rgba(16, 185, 129, 0.16)",
                  border: "1px solid rgba(16, 185, 129, 0.38)",
                  color: "#6ee7b7",
                  boxShadow: "0 0 16px rgba(16, 185, 129, 0.18)",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                  transition: "box-shadow 0.15s ease, background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background  = "rgba(16, 185, 129, 0.24)"
                  e.currentTarget.style.boxShadow   = "0 0 24px rgba(16, 185, 129, 0.32)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background  = "rgba(16, 185, 129, 0.16)"
                  e.currentTarget.style.boxShadow   = "0 0 16px rgba(16, 185, 129, 0.18)"
                }}
              >
                <Plus size={13} />
                Add Lead
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )

  return createPortal(modal, document.body)
}

// ── Field wrapper ────────────────────────────────────────────────
function Field({
  label, error, required, children,
}: {
  label: string; error?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        style={{
          fontSize: 10,
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(226,232,240,0.42)",
        }}
      >
        {label}{required && <span style={{ color: "#f87171", marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && (
        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#f87171" }}>
          {error}
        </span>
      )}
    </div>
  )
}

// ── Select wrapper with chevron ─────────────────────────────────
function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "relative" }}>
      {children}
      <ChevronDown
        size={14}
        style={{
          position: "absolute",
          right: 10,
          top: "50%",
          transform: "translateY(-50%)",
          color: "rgba(226,232,240,0.4)",
          pointerEvents: "none",
        }}
      />
    </div>
  )
}

// ── Style helpers ────────────────────────────────────────────────
const inputCss = (hasError: boolean): React.CSSProperties => ({
  width: "100%",
  height: 38,
  background: "rgba(255,255,255,0.04)",
  border: `1px solid ${hasError ? "rgba(248,113,113,0.40)" : "rgba(255,255,255,0.09)"}`,
  borderRadius: 8,
  padding: "0 12px",
  fontSize: 13,
  fontFamily: "var(--font-sans)",
  color: "#e2e8f0",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
})

const selectCss = (): React.CSSProperties => ({
  ...inputCss(false),
  cursor: "pointer",
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  paddingRight: 32,
})
