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
      "The app-router shell is ready for landing, auth, dashboard, generation, and export flows without mixing shared UI into route files.",
  },
  {
    title: "Template-aware UX",
    accentLabel: "Product prep",
    description:
      "The component structure leaves space for template browsers, preview cards, and premium gating tied to backend plan checks.",
  },
  {
    title: "Integration-first helpers",
    accentLabel: "Developer speed",
    description:
      "Supabase auth and backend request utilities are already prepared so the next step is wiring real credentials and feature pages.",
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
      "Topic, notes, and PDF flows can each become their own route segment while keeping shared cards, forms, and section layouts reusable.",
    accent: "linear-gradient(135deg, #95ff70 0%, #c8ff83 100%)",
  },
  {
    title: "Call the FastAPI backend",
    description:
      "Typed fetch helpers already point at the API base URL so templates, plan reads, and generation requests stay centralized.",
    accent: "linear-gradient(135deg, #8f7cff 0%, #64cfff 100%)",
  },
];
