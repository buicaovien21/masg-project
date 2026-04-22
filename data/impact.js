// MASG Impact data — illustrative figures for the dashboard.
// Replace with real figures as MASG publishes them.
window.MASG_IMPACT = {
  updated: "April 2026",
  years: {
    2024: {
      co2: 1820,
      repairs: 412,
      workshops: 38,
      volunteers: 145,
      retrofits: 34,
    },
    2025: {
      co2: 2210,
      repairs: 508,
      workshops: 44,
      volunteers: 165,
      retrofits: 52,
    },
    2026: {
      co2: 2610,
      repairs: 620,
      workshops: 49,
      volunteers: 180,
      retrofits: 68,
    },
  },
  // kt CO2e across the shire by year (illustrative trajectory to Net Zero 2030)
  trend: [
    { year: 2020, value: 520 },
    { year: 2022, value: 470 },
    { year: 2024, value: 395 },
    { year: 2026, value: 310 },
    { year: 2028, value: 180 },
    { year: 2030, value: 40 },
  ],
  // Share of CO2 avoided by focus area (sums to total co2 for the year)
  breakdown: {
    2024: [
      { key: "waste", label: "Waste", value: 320, color: "#2d9d6f" },
      { key: "energy", label: "Energy", value: 610, color: "#f59e0b" },
      { key: "efficiency", label: "Efficiency", value: 540, color: "#3b82f6" },
      { key: "agriculture", label: "Agriculture", value: 350, color: "#84cc16" },
    ],
    2025: [
      { key: "waste", label: "Waste", value: 390, color: "#2d9d6f" },
      { key: "energy", label: "Energy", value: 720, color: "#f59e0b" },
      { key: "efficiency", label: "Efficiency", value: 680, color: "#3b82f6" },
      { key: "agriculture", label: "Agriculture", value: 420, color: "#84cc16" },
    ],
    2026: [
      { key: "waste", label: "Waste", value: 460, color: "#2d9d6f" },
      { key: "energy", label: "Energy", value: 820, color: "#f59e0b" },
      { key: "efficiency", label: "Efficiency", value: 830, color: "#3b82f6" },
      { key: "agriculture", label: "Agriculture", value: 500, color: "#84cc16" },
    ],
  },
};
