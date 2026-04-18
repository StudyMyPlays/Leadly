"use client"

import { useState } from "react"
import LoginPage from "@/components/login/LoginPage"
import Dashboard from "@/components/dashboard/Dashboard"

const CLIENT_CONFIG = {
  clientName: "LeadOS",
  accentColor: "#3b82f6",
}

export default function Home() {
  const [session, setSession] = useState<{ role: "owner" | "partner"; email: string } | null>(null)

  if (!session) {
    return (
      <LoginPage
        config={CLIENT_CONFIG}
        onLogin={(role, email) => setSession({ role, email })}
      />
    )
  }

  return (
    <Dashboard
      role={session.role}
      userEmail={session.email}
      onLogout={() => setSession(null)}
    />
  )
}
