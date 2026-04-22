# MASG Web Layout — Next Feature Plan

Three proposed features to close the digital engagement gaps identified in the *Technology and Innovation Analysis Research* document and the La Trobe project brief.

---

## 1. Interactive Impact Dashboard

**Gap addressed:** "Limited metrics / no visible impact data" — the current MASG site presents information passively and does not quantify community outcomes.

**Goal:** Show MASG's real, measurable impact at a glance to build trust, motivate participation, and demonstrate value to funders.

### Content
- **Headline KPIs (animated counters)**
  - Tonnes of CO₂ avoided
  - Items repaired at Repair Cafe
  - Workshops run
  - Active volunteers
  - Households retrofitted
- **Trend chart:** Emissions progress vs. the Net Zero 2030 target (line or area chart).
- **Breakdown chart:** Impact by focus area — Waste / Energy / Efficiency / Agriculture (donut or bar chart).
- **Last updated** timestamp for credibility.

### UX / Interaction
- KPI tiles animate on scroll into view (reuse existing `data-count` pattern).
- Charts fade/draw in when visible (Intersection Observer).
- Hover a chart segment → tooltip with exact number + short context line.
- Year toggle (2024 / 2025 / 2026) to compare progress.
- Fully responsive; charts collapse to stacked cards on mobile.

### Technical approach
- Pure HTML/CSS/JS — no heavy library needed.
- Charts drawn with inline SVG (or a tiny library like **Chart.js** if we want polish fast).
- Data lives in a `dashboard-data.js` file so MASG staff can update numbers without touching logic.
- Accessible: each chart has a visually hidden `<table>` fallback for screen readers.

### Placement
New section between **Focus Areas** and **Resources**, titled **"Our Impact"**.

---

## 2. Map of Local Projects

**Gap addressed:** "Passive UX / no community map / low spatial visibility" — users cannot see *where* MASG is active across the Mount Alexander Shire.

**Goal:** Make MASG's work feel physically present and local by plotting every program and event on an interactive map of the shire.

### Content
- Pins for each active project (Repair Cafe, Bright Sparks workshops, Retrofit sites, Regenerative Agriculture farms, etc.).
- Pin color coded by focus area category (reuse the chips from the Focus Areas filter).
- Click a pin → side card with project title, short description, address, next event date, and a CTA button ("Get involved" / "View program").

### UX / Interaction
- Filter the map using the **same chip bar** used in Focus Areas (consistent UI pattern).
- Search box to find a town (Castlemaine, Maldon, Newstead, Campbells Creek…).
- "Near me" button uses the browser geolocation API (with permission).
- Mobile: map collapses to a scrollable list of cards with small static map previews.

### Technical approach
- **Library:** [Leaflet.js](https://leafletjs.com/) + OpenStreetMap tiles (free, lightweight, open source — aligns with MASG values).
- Data in a `projects.json` file — `[{ id, title, category, lat, lng, description, link }]`.
- Custom SVG pin icons matched to site color palette.
- Respects dark mode by swapping to a dark OSM tile provider.
- Keyboard accessible: Tab through pins, Enter to open popup.

### Placement
New section after **Our Impact**, titled **"Projects across the Shire"**.

---

## 3. Youth Track Mini-Section

**Gap addressed:** "Multi-generational engagement / youth participation" — flagged in the brief as a strategic priority and a known weakness of MASG's current digital channels.

**Goal:** Create an obvious, friendly on-ramp for people aged 14–25 to learn, volunteer, and lead, without forcing them through the main adult content flow.

### Content
- Short, energetic intro: "Sustainability is your future. Shape it."
- Three clear pathways:
  1. **Learn** — micro-lessons (5-minute explainer cards on climate, energy, waste, regenerative agriculture).
  2. **Volunteer** — age-appropriate volunteering options (events, social media, repair assistant, school ambassador).
  3. **Lead** — Youth Advisory seat, peer-workshop training, Bright Sparks junior track.
- Quote / story from a current young volunteer.
- Bold CTA: "Join the Youth Network."

### UX / Interaction
- Distinct visual treatment — brighter accent color, rounded cards, slightly more playful type.
- "Learn" cards expand on click to reveal a 30-second explainer (accordion pattern).
- Progress badges on completed micro-lessons stored in `localStorage` (gamification without accounts).
- Responsive, mobile-first — this cohort is mobile-dominant.

### Technical approach
- Pure HTML/CSS/JS.
- Reuse existing `card` and `reveal` patterns, plus a new `youth` theme class that slightly overrides variables for the section only.
- Optional: a tiny "XP bar" component driven by `localStorage`.

### Placement
New section after **News**, titled **"Youth Network"**, or folded into **Get Involved** as a highlighted sub-section — TBD with user.

---

## Build Order (suggested)

1. **Impact Dashboard** — biggest perceived jump in credibility and polish; directly answers "limited metrics" critique.
2. **Projects Map** — visually striking; proves the local-first positioning.
3. **Youth Track** — action the multi-generational priority from the brief.

Each feature is self-contained and can be shipped independently without breaking existing layout.

---

## Files that will be touched / added

| Feature              | HTML             | CSS              | JS                       | New data file        | New dependency     |
| -------------------- | ---------------- | ---------------- | ------------------------ | -------------------- | ------------------ |
| Impact Dashboard     | `index.html`     | `styles.css`     | `script.js`              | `dashboard-data.js`  | *(optional)* Chart.js |
| Projects Map         | `index.html`     | `styles.css`     | `script.js`              | `projects.json`      | Leaflet.js + OSM   |
| Youth Track          | `index.html`     | `styles.css`     | `script.js`              | —                    | —                  |

---

## Acceptance criteria (per feature)

- Works in light and dark mode.
- Fully responsive down to 360 px.
- Keyboard navigable and screen-reader friendly.
- Respects `prefers-reduced-motion`.
- No external paid services; all assets free/open for MASG.
