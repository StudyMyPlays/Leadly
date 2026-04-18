"use client"

import { useRouter } from "next/navigation"
import NotificationSettingsPanel from "@/components/admin/NotificationSettingsPanel"

export default function AdminNotificationsPage() {
  const router = useRouter()
  return <NotificationSettingsPanel onBack={() => router.push("/")} />
}
