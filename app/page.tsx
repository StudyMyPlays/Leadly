"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import LoginPage from "@/components/login/LoginPage"
import Dashboard from "@/components/dashboard/Dashboard"

const CLIENT_CONFIG = {
  clientName: "LeadOS",
  accentColor: "#3b82f6",
}

const SESSION_KEY = "leadosSession"
const ACTIVE_SECTION_KEY = "leadosActiveSection"

type Session = { role: "owner" | "partner"; email: string }

const VALID_SECTIONS = new Set(["dashboard", "analytics"])

export default function Home() {
  const router = useRouter()

  const [session, setSession] = useState<Session | null>(null)
  const [initialSection, setInitialSection] = useState<string>("dashboard")
  const [hydrated, setHydrated] = useState(false)

  // Hydrate session + (optionally) the section we were on before jumping to /admin/*.
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(SESSION_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Session
        if (parsed?.email && (parsed.role === "owner" || parsed.role === "partner")) {
          setSession(parsed)
        }
      }

      // Check for ?returnTo=admin (set by AdminPageHeader's back button) and
      // restore the last active dashboard section from sessionStorage.
      const params = new URLSearchParams(window.location.search)
      if (params.get("returnTo") === "admin") {
        const saved = window.sessionStorage.getItem(ACTIVE_SECTION_KEY)
        if (saved && VALID_SECTIONS.has(saved)) {
          setInitialSection(saved)
        }
        // Clean the URL so a refresh doesn't retrigger this flow.
        router.replace("/")
      }
    } catch {
      // ignore
    }

    setHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = (role: "owner" | "partner", email: string) => {
    const next: Session = { role, email }
    setSession(next)
    try {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  const handleLogout = () => {
    setSession(null)
    try {
      window.sessionStorage.removeItem(SESSION_KEY)
      window.sessionStorage.removeItem(ACTIVE_SECTION_KEY)
    } catch {
      // ignore
    }
  }

  // Avoid a flash of Login before sessionStorage is read.
  if (!hydrated) return null

  if (!session) {
    return (
      <LoginPage
        config={CLIENT_CONFIG}
        onLogin={handleLogin}
      />
    )
  }

  return (
    <Dashboard
      role={session.role}
      userEmail={session.email}
      onLogout={handleLogout}
      initialSection={initialSection}
    />
  )
}
