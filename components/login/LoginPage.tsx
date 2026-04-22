"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Eye, EyeOff, User, Briefcase } from "lucide-react"
import { authenticate } from "@/lib/users"

const WireframeSphere = dynamic(() => import("./WireframeSphere"), { ssr: false })

export interface LoginConfig {
  clientName: string
  accentColor?: string
}

interface LoginPageProps {
  config: LoginConfig
  onLogin: (role: "owner" | "partner", email: string) => void
}

export default function LoginPage({ config, onLogin }: LoginPageProps) {
  const [role, setRole] = useState<"owner" | "partner">("owner")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    await new Promise((r) => setTimeout(r, 800))

    const user = authenticate(email, password, role)
    if (user) {
      onLogin(role, user.email)
    } else {
      setError("Invalid credentials. Use the demo credentials below.")
    }
    setLoading(false)
  }

  return (
    <div
      className="relative flex items-center justify-center min-h-screen w-full overflow-hidden"
      style={{ background: "#06060a" }}
    >
      {/* Animated grid */}
      <div
        className="grid-bg absolute inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      />

      {/* Radial blue ambient glow behind sphere */}
      <div
        aria-hidden="true"
        className="absolute pointer-events-none"
        style={{
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 0,
        }}
      />

      {/* Wireframe sphere */}
      <WireframeSphere />

      {/* Card - Glass morphism with light transparency */}
      <div
        className="login-card login-card-enter relative z-10 w-full"
        style={{
          maxWidth: 400,
          margin: "0 16px",
          background: "rgba(12, 12, 16, 0.35)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(59, 130, 246, 0.15)",
          borderRadius: "12px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        }}
      >
        <div className="p-8 flex flex-col gap-6">
          {/* Role selector - starts here */}
          <div>
            <p className="config-label text-center mb-3">Sign in as</p>
            <div className="grid grid-cols-2 gap-3">
              {(["owner", "partner"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r)
                    setError("")
                  }}
                  className={`role-card flex flex-col items-center gap-2 py-4 px-3${role === r ? " selected" : ""}`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background:
                        role === r ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.04)",
                      border:
                        role === r
                          ? "1px solid rgba(59,130,246,0.30)"
                          : "1px solid rgba(255,255,255,0.07)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {r === "owner" ? (
                      <User
                        size={16}
                        style={{
                          color: role === r ? "#60a5fa" : "rgba(200,205,216,0.4)",
                        }}
                      />
                    ) : (
                      <Briefcase
                        size={16}
                        style={{
                          color: role === r ? "#60a5fa" : "rgba(200,205,216,0.4)",
                        }}
                      />
                    )}
                  </div>
                  <span
                    className="text-sm font-semibold font-sans capitalize"
                    style={{
                      color: role === r ? "#93c5fd" : "rgba(200,205,216,0.50)",
                    }}
                  >
                    {r}
                  </span>
                  {role === r && (
                    <span
                      className="text-xs font-mono"
                      style={{ color: "rgba(147,197,253,0.50)", fontSize: 10 }}
                    >
                      {r === "owner" ? "Full access" : "Partner view"}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="config-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="login-input"
                placeholder={`${role}@demo.com`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="config-label" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  className="login-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{
                    color: "rgba(200,205,216,0.35)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p
                className="text-xs font-sans px-3 py-2 rounded-lg"
                style={{
                  color: "#fca5a5",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.18)",
                }}
              >
                {error}
              </p>
            )}

            <button type="submit" className="login-btn mt-1" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeOpacity="0.25"
                    />
                    <path
                      d="M12 2a10 10 0 0 1 10 10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Demo hint */}
          <div
            className="rounded-lg px-3 py-2.5 flex flex-col gap-1"
            style={{
              background: "rgba(59,130,246,0.05)",
              border: "1px solid rgba(59,130,246,0.12)",
            }}
          >
            <p className="text-xs font-mono" style={{ color: "rgba(147,197,253,0.60)" }}>
              Demo credentials
            </p>
            <p className="text-xs font-mono" style={{ color: "rgba(147,197,253,0.45)" }}>
              owner@demo.com / demo1234
            </p>
            <p className="text-xs font-mono" style={{ color: "rgba(147,197,253,0.45)" }}>
              partner@demo.com / demo1234
            </p>
          </div>
        </div>

        {/* Footer branding */}
        <div
          className="px-8 py-3 flex items-center justify-center"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <span className="text-xs font-mono" style={{ color: "rgba(200,205,216,0.22)" }}>
            Powered by{" "}
            <span style={{ color: "rgba(96,165,250,0.45)" }}>LeadOS</span>
          </span>
        </div>
      </div>
    </div>
  )
}
