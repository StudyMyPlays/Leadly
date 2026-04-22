export type LeadStatus = "New" | "Contacted" | "Estimate" | "Converted" | "Lost"
export type LeadSource = "website" | "referral" | "door-knock" | "call-in" | "craigslist" | "google" | "signage" | "jobboard" | "other"
export type JobSize   = "$" | "$$" | "$$$"
export type Priority  = "High" | "Medium" | "Low"
export type ContactMethod = "Call" | "Text" | "Email" | "In-Person"

export interface ActivityEntry {
  id: string
  timestamp: string
  text: string
}

export interface Lead {
  // Core info
  id: number
  name: string
  businessName: string
  phone: string
  email?: string
  address?: string
  city: string

  // Source & campaign
  service: string
  source: LeadSource
  sourceUrl?: string
  campaign?: string
  
  // Pipeline & status
  status: LeadStatus
  priority: Priority
  jobSize: JobSize
  followUpDate?: string
  nextAction?: string
  assignedTo?: string

  // Engagement
  dateAdded: string
  firstContactedDate?: string
  lastContactDate?: string
  contactMethod?: ContactMethod
  numberOfTouchpoints: number

  // Deal value
  estValue: number
  notes: string

  // Outcome
  converted: boolean
  conversionDate?: string
  revenue?: number
  reasonLost?: string

  // Activity trail
  activity: ActivityEntry[]
}

// ── Status display config ────────────────────────────────────────
export const STATUS_CONFIG: Record<LeadStatus, { label: string; badge: string; color: string }> = {
  New:       { label: "New",       badge: "badge-cyan",   color: "#60a5fa" },
  Contacted: { label: "Contacted", badge: "badge-blue",   color: "#4D9FFF" },
  Estimate:  { label: "Estimate",  badge: "badge-purple", color: "#9B59FF" },
  Converted: { label: "Converted", badge: "badge-green",  color: "#22c55e" },
  Lost:      { label: "Lost",      badge: "badge-dim",    color: "rgba(212,216,224,0.35)" },
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  High:   { label: "High",   color: "#ff4455" },
  Medium: { label: "Medium", color: "#FFB800" },
  Low:    { label: "Low",    color: "#60a5fa" },
}

export const SOURCE_LABELS: Record<LeadSource, string> = {
  "website":    "Website",
  "referral":   "Referral",
  "door-knock": "Door Knock",
  "call-in":    "Call-In",
  "craigslist": "Craigslist",
  "google":     "Google Search",
  "signage":    "Signage",
  "jobboard":   "Job Board",
  "other":      "Other",
}

// Generic service color palette — new services get assigned from this pool
export const SERVICE_COLOR_POOL = [
  "#3b82f6",
  "#9B59FF",
  "#22c55e",
  "#FFB800",
  "#f472b6",
  "#60a5fa",
]

export function getServiceColor(service: string, allServices: string[]): string {
  const idx = allServices.indexOf(service)
  return SERVICE_COLOR_POOL[idx % SERVICE_COLOR_POOL.length]
}

// Deterministic lookup: any service name → a stable color from the pool.
function hashServiceName(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export const SERVICE_COLORS = new Proxy({} as Record<string, string>, {
  get(_target, key: string | symbol) {
    if (typeof key !== "string") return undefined
    return SERVICE_COLOR_POOL[hashServiceName(key) % SERVICE_COLOR_POOL.length]
  },
})

// ── Generic sample leads ─────────────────────────────────────────
export const SAMPLE_LEADS: Lead[] = [
  {
    id: 1,
    name: "Robert Martinez",
    businessName: "Martinez Construction",
    phone: "212-555-0142",
    email: "robert@martinez.com",
    address: "123 Main St, New York, NY 10001",
    city: "New York",
    service: "Installation",
    source: "website",
    sourceUrl: "https://leados.app",
    campaign: "Spring Promo 2025",
    status: "Contacted",
    priority: "High",
    jobSize: "$$$",
    dateAdded: "Apr 10, 2025",
    firstContactedDate: "Apr 10, 2025",
    lastContactDate: "Apr 11, 2025",
    contactMethod: "Call",
    numberOfTouchpoints: 2,
    estValue: 1850,
    notes: "Wants a full installation quote by end of week.",
    converted: false,
    followUpDate: "Apr 14, 2025",
    nextAction: "Send estimate",
    assignedTo: "John Smith",
    activity: [
      { id: "a1", timestamp: "Apr 10 9:02am",  text: "Lead created via website form." },
      { id: "a2", timestamp: "Apr 10 11:15am", text: "Called — left voicemail." },
      { id: "a3", timestamp: "Apr 11 8:40am",  text: "Customer called back. Estimate scheduled for Apr 14." },
    ],
  },
  {
    id: 2,
    name: "Sarah Kim",
    businessName: "Kim Design Studio",
    phone: "312-555-0287",
    email: "sarah@kimdesign.com",
    address: "456 Oak Ave, Chicago, IL 60601",
    city: "Chicago",
    service: "Consultation",
    source: "referral",
    campaign: "Referral Program",
    status: "Estimate",
    priority: "Medium",
    jobSize: "$",
    dateAdded: "Apr 10, 2025",
    firstContactedDate: "Apr 10, 2025",
    lastContactDate: "Apr 10, 2025",
    contactMethod: "Text",
    numberOfTouchpoints: 1,
    estValue: 420,
    notes: "Referred by David Park. Quick consult needed.",
    converted: false,
    followUpDate: "Apr 12, 2025",
    nextAction: "Schedule consultation",
    assignedTo: "Jane Doe",
    activity: [
      { id: "b1", timestamp: "Apr 10 2:17pm", text: "Lead created via referral (David Park)." },
      { id: "b2", timestamp: "Apr 10 3:30pm", text: "Texted — confirmed estimate for Apr 12." },
    ],
  },
  {
    id: 3,
    name: "James O'Brien",
    businessName: "O'Brien & Associates",
    phone: "323-555-0364",
    email: "james@obrien.com",
    address: "789 Elm St, Los Angeles, CA 90001",
    city: "Los Angeles",
    service: "Maintenance",
    source: "door-knock",
    status: "New",
    priority: "Low",
    jobSize: "$",
    dateAdded: "Apr 9, 2025",
    numberOfTouchpoints: 0,
    estValue: 310,
    notes: "Interested in an annual maintenance contract.",
    converted: false,
    activity: [
      { id: "c1", timestamp: "Apr 9 4:52pm", text: "Lead created via door knock." },
    ],
  },
  {
    id: 4,
    name: "Priya Patel",
    businessName: "Patel Tech Solutions",
    phone: "347-555-0519",
    email: "priya@pateltech.com",
    address: "321 Park Ave, New York, NY 10022",
    city: "New York",
    service: "Emergency",
    source: "call-in",
    status: "Contacted",
    priority: "High",
    jobSize: "$$$",
    dateAdded: "Apr 9, 2025",
    firstContactedDate: "Apr 9, 2025",
    lastContactDate: "Apr 9, 2025",
    contactMethod: "Call",
    numberOfTouchpoints: 1,
    estValue: 2200,
    notes: "Urgent request. Needs same-day response.",
    converted: false,
    followUpDate: "Apr 9, 2025",
    nextAction: "On-site visit",
    assignedTo: "John Smith",
    activity: [
      { id: "d1", timestamp: "Apr 9 6:10am", text: "Lead created via website — urgent flag." },
      { id: "d2", timestamp: "Apr 9 8:00am", text: "Called. On-site visit booked for today 2pm." },
    ],
  },
  {
    id: 5,
    name: "Carlos Rivera",
    businessName: "Rivera Logistics",
    phone: "773-555-0631",
    email: "carlos@riveralogistics.com",
    address: "654 River Rd, Chicago, IL 60614",
    city: "Chicago",
    service: "Maintenance",
    source: "referral",
    status: "New",
    priority: "Low",
    jobSize: "$",
    dateAdded: "Apr 8, 2025",
    numberOfTouchpoints: 0,
    estValue: 275,
    notes: "",
    converted: false,
    activity: [
      { id: "e1", timestamp: "Apr 8 1:22pm", text: "Lead created via referral." },
    ],
  },
  {
    id: 6,
    name: "Emily Thompson",
    businessName: "Thompson Events",
    phone: "646-555-0748",
    email: "emily@thompsonevents.com",
    address: "987 Fifth Ave, New York, NY 10128",
    city: "New York",
    service: "Installation",
    source: "google",
    sourceUrl: "https://www.google.com/search?q=installation+services+nyc",
    campaign: "Google Ads - Installation",
    status: "Converted",
    priority: "High",
    jobSize: "$$$",
    dateAdded: "Apr 8, 2025",
    firstContactedDate: "Apr 8, 2025",
    lastContactDate: "Apr 9, 2025",
    contactMethod: "Email",
    numberOfTouchpoints: 3,
    estValue: 1640,
    converted: true,
    conversionDate: "Apr 9, 2025",
    revenue: 1640,
    notes: "Closed! Deposit received Apr 9. Job scheduled Apr 17.",
    assignedTo: "John Smith",
    activity: [
      { id: "f1", timestamp: "Apr 8 10:00am", text: "Lead created." },
      { id: "f2", timestamp: "Apr 8 3:00pm",  text: "Estimate sent — $1,640." },
      { id: "f3", timestamp: "Apr 9 9:45am",  text: "Customer accepted. Deposit paid $500." },
    ],
  },
  {
    id: 7,
    name: "Marcus Johnson",
    businessName: "Johnson Real Estate",
    phone: "310-555-0855",
    email: "marcus@johnsonre.com",
    address: "147 Sunset Blvd, Los Angeles, CA 90001",
    city: "Los Angeles",
    service: "Consultation",
    source: "call-in",
    status: "New",
    priority: "Medium",
    jobSize: "$",
    dateAdded: "Apr 7, 2025",
    numberOfTouchpoints: 0,
    estValue: 390,
    notes: "Called in from Google ad.",
    converted: false,
    activity: [
      { id: "g1", timestamp: "Apr 7 11:30am", text: "Inbound call — lead created." },
    ],
  },
  {
    id: 8,
    name: "Olivia Chen",
    businessName: "Chen Manufacturing",
    phone: "312-555-0974",
    email: "olivia@chenmanuf.com",
    address: "258 Industrial Way, Chicago, IL 60622",
    city: "Chicago",
    service: "Installation",
    source: "referral",
    status: "Estimate",
    priority: "High",
    jobSize: "$$$",
    dateAdded: "Apr 7, 2025",
    firstContactedDate: "Apr 7, 2025",
    lastContactDate: "Apr 9, 2025",
    contactMethod: "In-Person",
    numberOfTouchpoints: 3,
    estValue: 3100,
    notes: "High-value job. In negotiation.",
    converted: false,
    followUpDate: "Apr 12, 2025",
    nextAction: "Final negotiation",
    assignedTo: "Jane Doe",
    activity: [
      { id: "h1", timestamp: "Apr 7 2:00pm",  text: "Lead created via referral." },
      { id: "h2", timestamp: "Apr 8 10:00am", text: "On-site visit completed." },
      { id: "h3", timestamp: "Apr 9 9:00am",  text: "Estimate sent — $3,100." },
    ],
  },
  {
    id: 9,
    name: "David Park",
    businessName: "Park Ventures",
    phone: "917-555-1082",
    email: "david@parkventures.com",
    address: "369 Madison Ave, New York, NY 10017",
    city: "New York",
    service: "Maintenance",
    source: "website",
    status: "Contacted",
    priority: "Medium",
    jobSize: "$",
    dateAdded: "Apr 6, 2025",
    firstContactedDate: "Apr 6, 2025",
    lastContactDate: "Apr 6, 2025",
    contactMethod: "Call",
    numberOfTouchpoints: 1,
    estValue: 220,
    notes: "Repeat customer, seasonal maintenance.",
    converted: false,
    followUpDate: "Apr 20, 2025",
    nextAction: "Schedule maintenance",
    assignedTo: "John Smith",
    activity: [
      { id: "i1", timestamp: "Apr 6 8:15am", text: "Lead created." },
      { id: "i2", timestamp: "Apr 6 9:00am", text: "Called — confirmed for April." },
    ],
  },
  {
    id: 10,
    name: "Natasha Gomez",
    businessName: "Gomez & Co",
    phone: "818-555-1190",
    email: "natasha@gomezco.com",
    address: "741 Laurel Canyon, Los Angeles, CA 90046",
    city: "Los Angeles",
    service: "Consultation",
    source: "craigslist",
    sourceUrl: "https://losangeles.craigslist.org",
    status: "Lost",
    priority: "Medium",
    jobSize: "$$",
    dateAdded: "Apr 5, 2025",
    firstContactedDate: "Apr 5, 2025",
    lastContactDate: "Apr 8, 2025",
    contactMethod: "Email",
    numberOfTouchpoints: 2,
    estValue: 510,
    converted: false,
    reasonLost: "Went with competitor. Price was the issue.",
    notes: "Went with competitor. Price was the issue.",
    activity: [
      { id: "j1", timestamp: "Apr 5 4:00pm",  text: "Lead created." },
      { id: "j2", timestamp: "Apr 6 11:00am", text: "Estimate sent — $510." },
      { id: "j3", timestamp: "Apr 8 2:00pm",  text: "Customer chose competitor." },
    ],
  },
  {
    id: 11,
    name: "Brennan Walsh",
    businessName: "Walsh Emergency Services",
    phone: "212-555-1234",
    email: "brennan@walshemergency.com",
    address: "852 Broadway, New York, NY 10003",
    city: "New York",
    service: "Emergency",
    source: "call-in",
    status: "Estimate",
    priority: "High",
    jobSize: "$$$",
    dateAdded: "Apr 5, 2025",
    firstContactedDate: "Apr 5, 2025",
    lastContactDate: "Apr 6, 2025",
    contactMethod: "Call",
    numberOfTouchpoints: 2,
    estValue: 4800,
    notes: "Large scope emergency job.",
    converted: false,
    followUpDate: "Apr 10, 2025",
    nextAction: "Finalize estimate",
    assignedTo: "John Smith",
    activity: [
      { id: "k1", timestamp: "Apr 5 10:00am", text: "Inbound call." },
      { id: "k2", timestamp: "Apr 6 1:00pm",  text: "Site visit completed." },
    ],
  },
  {
    id: 12,
    name: "Aisha Williams",
    businessName: "Williams & Associates",
    phone: "773-555-1377",
    email: "aisha@williamsandassoc.com",
    address: "963 N. Michigan Ave, Chicago, IL 60611",
    city: "Chicago",
    service: "Installation",
    source: "door-knock",
    status: "Converted",
    priority: "Medium",
    jobSize: "$$",
    dateAdded: "Apr 4, 2025",
    firstContactedDate: "Apr 4, 2025",
    lastContactDate: "Apr 7, 2025",
    contactMethod: "In-Person",
    numberOfTouchpoints: 3,
    estValue: 980,
    converted: true,
    conversionDate: "Apr 7, 2025",
    revenue: 980,
    notes: "Job completed Apr 11. Full payment received.",
    assignedTo: "Jane Doe",
    activity: [
      { id: "l1", timestamp: "Apr 4 3:30pm", text: "Lead created — door knock." },
      { id: "l2", timestamp: "Apr 5 9:00am", text: "Called, estimate booked." },
      { id: "l3", timestamp: "Apr 7 8:00am", text: "Job completed. $980 collected." },
    ],
  },
]
