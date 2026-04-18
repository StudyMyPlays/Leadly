"use client"

import { useRouter } from "next/navigation"
import UserManagementPanel from "@/components/admin/UserManagementPanel"

export default function AdminUsersPage() {
  const router = useRouter()
  return <UserManagementPanel onBack={() => router.push("/")} />
}
