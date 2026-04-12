"use client"

import { useState } from "react"
import LeadsTable from "./LeadsTable"
import LeadDrawer from "./LeadDrawer"
import AddLeadModal from "./AddLeadModal"
import { Lead, SAMPLE_LEADS } from "./leads-data"

interface LeadsViewProps {
  config: {
    accentColor: string
    currency: string
    services: string[]
    cities: string[]
  }
  leads?: Lead[]
}

export default function LeadsView({ config, leads = SAMPLE_LEADS }: LeadsViewProps) {
  const [allLeads, setAllLeads]         = useState<Lead[]>(leads)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [modalOpen, setModalOpen]       = useState(false)

  const handleAddLead = (form: {
    name: string; city: string; phone: string; email: string; service: string
    source: Lead["source"]; jobSize: Lead["jobSize"]
    status: Lead["status"]; estValue: number; notes: string
  }) => {
    const newLead: Lead = {
      id: Date.now(),
      ...form,
      estValue: form.estValue || 0,
      dateAdded: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      activity: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
          text: "Lead created manually.",
        },
      ],
    }
    setAllLeads((prev) => [newLead, ...prev])
  }

  return (
    <>
      <div className="flex flex-col gap-1 mb-4">
        <h1 className="text-lg font-semibold font-sans" style={{ color: "#d4d8e0" }}>
          All Leads
        </h1>
        <p className="text-xs font-mono" style={{ color: "rgba(212,216,224,0.35)" }}>
          {allLeads.length} total leads across {config.cities.join(", ")}
        </p>
      </div>

      <LeadsTable
        leads={allLeads}
        currency={config.currency}
        onViewLead={setSelectedLead}
        onAddLead={() => setModalOpen(true)}
        allServices={config.services}
      />

      <LeadDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        currency={config.currency}
      />

      <AddLeadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        services={config.services}
        cities={config.cities}
        onAdd={handleAddLead}
      />
    </>
  )
}
