"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { X, Plus, UserPlus, ChevronDown } from "lucide-react"
import { LeadStatus, LeadSource, JobSize } from "./leads-data"

interface AddLeadModalProps {
  open: boolean
  onClose: () => void
  services?: string[]
  cities?: string[]
  onAdd?: (lead: {
    name: string; city: string; phone: string; email: string; service: string
    source: LeadSource; jobSize: JobSize; status: LeadStatus; estValue: number; notes: string
  }) => void
}

const SOURCES: { value: LeadSource; label: string }[] = [
  { value: "website",    label: "Website" },
  { value: "referral",   label: "Referral" },
  { value: "door-knock", label: "Door Knock" },
  { value: "call-in",    label: "Call-In" },
]
const JOB_SIZES: JobSize[]   = ["$", "$$", "$$$"]
const STATUSES: LeadStatus[] = ["New", "Contacted", "Estimate", "Converted", "Lost"]

const EMPTY = {
  name: "", city: "", phone: "", email: "", service: "",
  source: "website" as LeadSource, jobSize: "$" as JobSize,
  status: "New" as LeadStatus, estValue: 0, notes: "",
}

export default function AddLeadModal({ open, onClose, services = [], cities = [], onAdd }: AddLeadModalProps) {
  const [form, setForm]       = useState({ ...EMPTY })
  const [errors, setErrors]   = useState<Record<string, string>>({})
  const [mounted, setMounted] = useState(false)
  const firstInputRef         = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => firstInputRef.current?.focus(), 60)
    } else {
      setForm({ ...EMPTY })
      setErrors({})
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose])

  if (!mounted || !open) return null

  const set = (k: string, v: string | number) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => { const n = { ...e }; delete n[k]; return n })
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim())    e.name    = "Required"
    if (!form.phone.trim())   e.phone   = "Required"
    if (!form.service.trim()) e.service = "Required"
    if (!form.city.trim())    e.city    = "Required"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    onAdd?.(form)
    onClose()
  }

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
          width: "min(560px, 95vw)",
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
                Capture · Qualify · Route
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

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">

          {/* Row 1: Full Name + Phone */}
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
            <Field label="Phone" error={errors.phone} required>
              <input
                type="tel"
                placeholder="+1 555-000-0000"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                style={inputCss(!!errors.phone)}
              />
            </Field>
          </div>

          {/* Row 2: Email */}
          <Field label="Email Address">
            <input
              type="email"
              placeholder="jane@example.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              style={inputCss(false)}
            />
          </Field>

          {/* Row 3: Service + City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Service" error={errors.service} required>
              <>
                <input
                  type="text"
                  list="service-suggestions"
                  placeholder={services.length ? "Select or type…" : "e.g. Plumbing Repair"}
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
            <Field label="City / Location" error={errors.city} required>
              <>
                <input
                  type="text"
                  list="city-suggestions"
                  placeholder={cities.length ? "Select or type…" : "e.g. Austin, TX"}
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
          </div>

          {/* Row 4: Source + Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Lead Source">
              <SelectWrapper>
                <select
                  value={form.source}
                  onChange={(e) => set("source", e.target.value)}
                  style={selectCss()}
                >
                  {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </SelectWrapper>
            </Field>
            <Field label="Status">
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
          </div>

          {/* Row 5: Job Size + Est. Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Job Size">
              <div className="flex gap-2">
                {JOB_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => set("jobSize", size)}
                    style={{
                      flex: 1,
                      height: 38,
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
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
            <Field label="Est. Value (optional)">
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
          </div>

          {/* Notes */}
          <Field label="Notes">
            <textarea
              rows={3}
              placeholder="Any additional details about this lead…"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              style={{ ...inputCss(false), resize: "none", lineHeight: 1.5 }}
            />
          </Field>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
        >
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
          <button
            onClick={handleSubmit}
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
            <Plus size={13} />
            Add Lead
          </button>
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
