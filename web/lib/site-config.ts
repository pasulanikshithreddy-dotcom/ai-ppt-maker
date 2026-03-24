export const marketingNav = [
  { href: "/#workflow", label: "Workflow" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#integrations", label: "Integrations" },
];

export const workspaceNav = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Home" },
  { href: "/create", label: "Create", shortLabel: "Create" },
  { href: "/templates", label: "Templates", shortLabel: "Templates" },
  { href: "/history", label: "History", shortLabel: "History" },
  { href: "/profile", label: "Profile", shortLabel: "Profile" },
];

export const coreFeatures = [
  {
    title: "Focus-mode interface",
    accentLabel: "Visual tone",
    description:
      "A dark layout with high-contrast accents and roomy panels that feels natural during evening study sessions and quick revision sprints.",
  },
  {
    title: "Reusable route structure",
    accentLabel: "Architecture",
    description:
      "Marketing, auth, and workspace pages each have their own shell so the product can grow without turning into one oversized page file.",
  },
  {
    title: "Template-aware UX",
    accentLabel: "Product prep",
    description:
      "The interface already leaves room for template browsing, premium gating, generation flows, and export-ready deck previews.",
  },
  {
    title: "Integration-first helpers",
    accentLabel: "Developer speed",
    description:
      "Supabase auth and backend request utilities are prepared so real credentials and API hooks can slide in cleanly.",
  },
];

export const workflowSteps = [
  {
    title: "Sign in with Supabase",
    description:
      "Use the prepared browser client helper to connect auth UI, sessions, and profile-aware navigation once credentials are added.",
    accent: "linear-gradient(135deg, #0accff 0%, #55dcff 100%)",
  },
  {
    title: "Choose a generation mode",
    description:
      "Topic, notes, and PDF flows each have a clear home in the workspace so students can move from idea to export without friction.",
    accent: "linear-gradient(135deg, #95ff70 0%, #c8ff83 100%)",
  },
  {
    title: "Call the FastAPI backend",
    description:
      "Typed request helpers already point at the API base URL so templates, plan reads, and generation requests stay centralized.",
    accent: "linear-gradient(135deg, #8f7cff 0%, #64cfff 100%)",
  },
];

export const dashboardStats = [
  {
    label: "Decks this week",
    value: "12",
    change: "+4 vs last week",
  },
  {
    label: "Average creation time",
    value: "6 min",
    change: "Fast enough for class crunch",
  },
  {
    label: "Template saves",
    value: "8",
    change: "Three premium-ready favorites",
  },
];

export const recentDecks = [
  {
    title: "Thermodynamics revision sprint",
    mode: "Topic to PPT",
    status: "Ready to export",
    template: "Night Scholar",
    updatedAt: "12 minutes ago",
  },
  {
    title: "Internship pitch polish",
    mode: "Notes to PPT",
    status: "Awaiting review",
    template: "Pitch Pulse",
    updatedAt: "Today, 3:20 PM",
  },
  {
    title: "Data structures recap",
    mode: "PDF to PPT",
    status: "Uploaded to cloud",
    template: "Boardroom Luxe",
    updatedAt: "Yesterday",
  },
];

export const createModes = [
  {
    title: "Topic to PPT",
    description: "Start from a prompt and let AI outline the deck structure.",
  },
  {
    title: "Notes to PPT",
    description: "Turn class notes, brainstorms, or research summaries into slides.",
  },
  {
    title: "PDF to PPT",
    description: "Transform dense reference documents into a clean presentation draft.",
  },
];

export const templateLibrary = [
  {
    name: "Night Scholar",
    category: "Study-ready",
    accent: "Free",
    description: "High contrast, focused typography, and calm cyan accents for revision decks.",
  },
  {
    name: "Pitch Pulse",
    category: "Startup",
    accent: "Pro",
    description: "Sharp gradients, bold metric callouts, and premium presentation energy.",
  },
  {
    name: "Orbit Notes",
    category: "Lecture",
    accent: "Free",
    description: "Clean section dividers and space for detailed speaker notes.",
  },
  {
    name: "Boardroom Luxe",
    category: "Premium",
    accent: "Pro",
    description: "Glass panels, confident typography, and executive summary framing.",
  },
  {
    name: "Exam Edge",
    category: "Student",
    accent: "Free",
    description: "Built for memory aids, concept drills, and summary-first slide decks.",
  },
  {
    name: "Lab Session",
    category: "Research",
    accent: "Pro",
    description: "Ideal for experiments, analysis, findings, and literature review slides.",
  },
];

export const historyItems = [
  {
    title: "AI ethics seminar",
    date: "Mar 24",
    mode: "Topic",
    status: "Completed",
    template: "Orbit Notes",
  },
  {
    title: "Microeconomics case study",
    date: "Mar 23",
    mode: "Notes",
    status: "Completed",
    template: "Night Scholar",
  },
  {
    title: "Operating systems summary",
    date: "Mar 22",
    mode: "PDF",
    status: "Completed",
    template: "Exam Edge",
  },
  {
    title: "Club sponsorship pitch",
    date: "Mar 20",
    mode: "Notes",
    status: "Shared",
    template: "Pitch Pulse",
  },
];

export const pricingPlans = [
  {
    name: "Free",
    price: "0",
    cadence: "/month",
    accent: "Starter",
    featured: false,
    features: [
      "Topic to PPT drafts",
      "Free templates",
      "Watermarked exports",
      "Student-friendly dashboard access",
    ],
  },
  {
    name: "Pro",
    price: "₹999",
    cadence: "/month",
    accent: "Most popular",
    featured: true,
    features: [
      "Notes and PDF generation",
      "Premium template library",
      "No watermark on exports",
      "Priority processing and richer history",
    ],
  },
  {
    name: "Team",
    price: "₹2,999",
    cadence: "/month",
    accent: "Collaboration",
    featured: false,
    features: [
      "Shared deck libraries",
      "Brand-ready templates",
      "Higher generation limits",
      "Profile and workspace management",
    ],
  },
];
