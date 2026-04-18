"use client"

import { useRouter } from "next/navigation"
import LeadRoutingPanel from "@/components/admin/LeadRoutingPanel"

export default function AdminRoutingPage() {
  const router = useRouter()
  return <LeadRoutingPanel onBack={() => router.push("/")} />
}
