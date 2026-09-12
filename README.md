# 🌊 AQUAGUARD AI
### Predictive Water-Resource Intelligence & Decision Support — Hyderabad Pilot

AQUAGUARD AI is a MERN-stack platform that goes beyond monitoring: it **observes** environmental
conditions, **predicts** future water risk, **explains** what's driving that risk, lets you
**simulate** what-if scenarios, and **optimizes** which intervention will prevent a crisis —
grounded in five real, documented Hyderabad water bodies.

```
DATA → DETECTION → PREDICTION → EXPLANATION → SIMULATION → OPTIMIZATION → ACTION
```

## The 5 lakes (real, documented)

| Lake | Type | Real documented context used in this build |
|---|---|---|
| **Hussain Sagar** | Urban lake | Hyderabad's original water source; now receives heavy untreated sewage/industrial inflow |
| **Durgam Cheruvu** | Urban lake | Documented shrinkage from ~160 → ~116 acres from encroachment (NRSC satellite imagery); ~half the surface affected by water hyacinth from sewage overload (HYDRAA, Jan 2026) |
| **Osman Sagar** (Gandipet) | Drinking-water reservoir | Protected under **GO 111**; primary drinking-water source, highly rainfall-sensitive |
| **Himayat Sagar** | Drinking-water reservoir | Twin reservoir to Osman Sagar, also under GO 111, built 1927 for flood control + supply |
| **Shamirpet Lake** | Recreational lake | Northern Hyderabad, growing urbanization pressure along the Outer Ring Road corridor |

The month-by-month measurements and yearly satellite-surface-area series are **illustrative
synthetic data calibrated to match each lake's real, reported situation** — not live sensor or
satellite feeds. This is intentional and stated up front (see "Scientific honesty" below);
swapping in a live data source only requires changing what feeds the `measurements` collection.

## 🏆 Round 2 additions (new since shortlisting)

Four genuinely new capabilities, each backed by real computation (not just UI polish):

- **🤖 Agentic AI Assistant** (`server/services/agentService.js`) — the assistant no longer just
  narrates pre-loaded context. Ask *"what if rainfall drops 30%?"* on any lake page and it
  **actually parses and runs a live simulation** through the same `simulationService.js` used by
  the What-If Simulator, then reports the real computed before/after risk numbers. Ask a
  watershed-wide question ("what if rainfall drops 30% across all lakes?") and it runs the
  region-wide scenario; mention a rupee/crore/lakh budget and it runs the cross-lake budget
  optimizer. Every parsed scenario is shown back to the user transparently (`parseNotes`), and if
  no LLM key is configured it still reports the real numbers via a deterministic template — the
  computation is real either way, only the prose narration changes.
- **⏳ Watershed Time Machine** (`/timemachine`) — scrub a slider (or hit play) across 24 months
  of each lake's real measurement history and watch the entire map, and every lake's risk score,
  evolve live. Each month's score is computed using only the data that would have been available
  up to that point (a trailing average), the same methodology the live dashboard uses — no
  hindsight, no re-interpretation (`server/services/timeMachineService.js`).
- **🕸️ Watershed Cascade Network** (`/cascade`) — models the real, documented hydrological
  connection between Hyderabad's reservoirs: Osman Sagar and Himayat Sagar are the twin Musi-river
  headwater reservoirs; Hussain Sagar sits downstream in that same historic drainage chain through
  the city core. Run a scenario and watch simulated upstream stress propagate downstream along
  that real connection, on top of Hussain Sagar's own local simulation — while Durgam Cheruvu and
  Shamirpet (genuinely separate catchments) stay visibly independent (`server/services/cascadeService.js`).
- **🎤 Voice input** — tap the mic on the AI assistant and speak your question instead of typing,
  via the browser's built-in Speech Recognition API (no API cost, pairs with the existing "Listen"
  text-to-speech button for a full voice loop).

## ⭐ Standout features (the "wow" layer)

Beyond the core observe→predict→explain→simulate→optimize→act flow, this build adds:

- **🌍 Regional What-If** (`/regional`) — apply one climate/urbanization scenario to *all five
  lakes simultaneously* and watch the whole watershed map react in real time. Most single-site
  dashboards can't do this; it's the difference between "a lake dashboard" and "a watershed
  command center."
- **💰 Cross-Lake Budget Optimizer** (`/regional/optimize`) — given a limited rupee budget,
  decides which intervention to fund at *which* lakes to maximize total watershed-wide risk
  reduction (an efficiency-ranked knapsack allocation across lake × intervention pairs). This is
  a genuinely different, harder problem than optimizing a single site.
- **📡 Live Alert Feed** (Socket.IO) — a real-time-feeling pulsing feed of monitoring alerts on
  the dashboard, so the app feels like a live command center rather than a static report.
  Clearly documented as a simulated demo heartbeat, not real sensor telemetry.
- **📅 Historical/future scenario presets** — one-click buttons ("2015-Style Deficient Monsoon",
  "2050 Climate Stress Outlook", "Rapid Urbanization Shock") calibrated to real, reported
  Telangana climate patterns, so judges can explore realistic scenarios instantly.
- **👥 Human impact counterfactuals** — every simulation and action plan shows *population
  affected* and *water volume at risk (ML/yr)*, not just abstract risk percentages, comparing
  "without action" vs "with AQUAGUARD's plan."
- **🔊 Voice narration** — a "Listen" button reads AI explanations and action plans aloud using
  the browser's built-in speech synthesis (no API cost, works offline).
- **⬇️ One-click PDF export** of the action plan (client-side, via jsPDF — no server round-trip).
- **Water Security Index gauge** — an animated radial gauge summarizing watershed health at a glance.
- **🧠 Automatic anomaly detection** — real statistical detection (z-score + month-over-month change)
  over each lake's actual measurement history, not random alerts. Two of the five seeded lakes carry
  a deliberately injected "recent event" (a sewage-overflow-style pollution spike at Hussain Sagar,
  a sudden water-level drop at Durgam Cheruvu) so the detector has genuine signal to catch — fully
  explainable, no LLM involved.
- **📱 WhatsApp/SMS critical alerts** — subscribe a phone number on any lake page; when that lake's
  real computed risk crosses into CRITICAL, AQUAGUARD automatically dispatches a WhatsApp/SMS alert
  via Twilio. No Twilio account configured? It logs a clearly-labeled **simulated** send instead, so
  the full subscribe → critical → dispatch flow still demos end to end with zero setup.
- **🌱 Carbon/ecosystem credit estimator** — estimates the climate-finance potential of restoring a
  lake's lost vegetation: acres restorable, tCO2e sequestered annually, and an illustrative INR value
  at voluntary-carbon-market pricing. Ties lake restoration to climate finance — a genuinely different
  angle from a typical water-monitoring pitch.


## Architecture

```
React (Vite+TS+Tailwind+Recharts+Leaflet)
        │
        ▼
Node/Express REST API
        │
   ┌────┼─────────────┐
   ▼    ▼             ▼
MongoDB  riskService  aiService (LLM, optional)
         simulationService
         optimizationService
         forecastService
```

- **riskService** — transparent, weighted, *explainable* risk model (not a black box)
- **simulationService** — scenario-based decision-support model for "what-if" sliders
- **optimizationService** — ranks candidate interventions by risk reduction / cost / feasibility
- **forecastService** — trend-based 30-day water-level forecast with a confidence band
- **aiService** — narrates the *already-computed* numbers in plain English. Never asked to invent
  a score. Works fully offline with a templated fallback; add an API key to upgrade to live LLM text.

## Quick start

### 1. Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`) or a free MongoDB Atlas cluster

### 2. Backend
```bash
cd server
npm install
cp .env.example .env       # edit MONGO_URI if needed
npm run seed                # seeds the 5 Hyderabad lakes + 24 months of data
npm run dev                 # starts API on http://localhost:5000
```

### 3. Frontend
```bash
cd client
npm install
npm run dev                 # starts UI on http://localhost:5173
```

Open **http://localhost:5173** — it proxies `/api` calls to the backend automatically.

### 4. (Optional) Enable live LLM explanations
By default, AI explanations and action plans use a built-in template engine so the whole
app works with **zero API cost, fully offline**. To use a real LLM instead, edit `server/.env`:

**Recommended — Google Gemini (genuinely free, no credit card required):**
```
LLM_PROVIDER=gemini
LLM_API_KEY=your-key-from-aistudio.google.com
LLM_MODEL=gemini-3.6-flash
```
Get a free key at **https://aistudio.google.com/apikey** — no payment method needed. Google
renames/retires Gemini model versions fairly often; if you ever see a "model no longer available"
error in the server logs, the error message itself names the current replacement — just paste
that name into `LLM_MODEL` and restart the backend.

**Alternatives (Claude or GPT — usually require a card on file for a trial credit):**
```
LLM_PROVIDER=anthropic        # or "openai"
LLM_API_KEY=sk-...
LLM_MODEL=claude-sonnet-4-6   # or e.g. gpt-4o-mini
```

### 5. (Optional) Enable real critical alerts — email, WhatsApp, or SMS
By default, subscribing and triggering a CRITICAL alert on any channel logs a clearly-labeled
**simulated** send to the server console — the full flow demos end to end with zero setup.

**Recommended — Email via Gmail (genuinely easiest, no compliance requirements):**
```
EMAIL_USER=youraddress@gmail.com
EMAIL_APP_PASSWORD=your-16-char-app-password
```
Get a free App Password at **https://myaccount.google.com/apppasswords** (requires 2-Step
Verification enabled on your Google account first). No billing, no phone verification, no message
template approval — unlike SMS/WhatsApp, which carry real regulatory requirements in some countries
(e.g. India's TRAI sender-registration rules for SMS, and WhatsApp Business Content Template
approval) that a free trial account often cannot satisfy.

**Alternative — WhatsApp/SMS via Twilio:**
```
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+14155238886   # your Twilio number (or WhatsApp sandbox number)
```
All three channels are independent — configure any combination you like, and each falls back to
simulated mode on its own if its credentials aren't set.

## Demo script (judge-ready)

1. Open the **Command Center** — the map shows all 5 lakes color-coded by risk, plus a Water
   Security gauge and a **live alert feed** ticking in real time (blending real anomaly detections
   with routine monitoring heartbeats).
2. Click **Durgam Cheruvu** (🔴 highest risk) — show its real documented context, satellite
   timeline (160 → 116 acres), the **automatic anomaly detector** flagging its real water-level
   drop, and the risk breakdown ("why is this risk high?"). Hit **🔊 Listen** to have AQUAGUARD
   read the explanation aloud.
3. On the same page, **subscribe a phone number for WhatsApp alerts** — since Durgam Cheruvu is
   already CRITICAL, the next live-alert cycle will auto-dispatch a real (or simulated) alert.
4. Go to **Simulate** — pick the **"2015-Style Deficient Monsoon"** preset (or drag sliders
   manually), click **SIMULATE**. Watch risk jump toward CRITICAL, with population/water-volume
   impact shown alongside.
5. Click **Optimize Response** — AQUAGUARD ranks interventions and recommends a combined
   strategy, showing risk drop and how many people/ML of water are protected.
6. Open **Action Plan** — a generated "30-Day Water Crisis Prevention Plan," now also showing
   the **carbon-credit / climate-finance estimate** for restoring the lake's lost vegetation.
   Click **⬇ Download PDF Report** to hand judges a real artifact.
7. Now zoom out: go to **🌍 Regional What-If** — apply the *same* drought scenario to the
   *entire watershed at once*. Watch the whole map shift color and see which lakes newly
   tip into CRITICAL.
8. Go to **💰 Cross-Lake Budget Optimizer** — pick a budget (e.g. ₹50 lakh) and show how
   AQUAGUARD allocates it across all 5 lakes for maximum total risk reduction — the
   government's real decision problem.
9. Use the **AI assistant** on any lake page to answer live judge questions ("what if rainfall
   drops 40%?", "which intervention is cheapest?").

## Scientific honesty (say this to judges)

> "AQUAGUARD is a decision-support prototype, not a certified hydrological model. We use
> documented historical facts and a calibrated scenario model to demonstrate the full
> observe → predict → explain → simulate → optimize → act workflow. For production deployment,
> the forecasting layer would be validated against domain-specific hydrological models and
> real sensor/satellite feeds."

## Project structure

```
aquaguard-ai/
├── server/
│   ├── models/          Lake, Measurement, SatelliteObservation, Simulation, Intervention,
│   │                     AlertSubscription
│   ├── controllers/      request handlers (incl. regionalController, alertController, carbonController)
│   ├── routes/           /api/lakes, /api/simulate, /api/optimize, /api/assistant, /api/regional,
│   │                     /api/alerts
│   ├── services/         riskService, simulationService, optimizationService, forecastService,
│   │                     aiService, impactService, scenarioPresets, liveAlerts (Socket.IO),
│   │                     anomalyService, alertDispatchService (Twilio), carbonCreditService
│   └── seed/             lakes.js (real data) + generators for measurements/satellite history
│                         (includes deliberately injected "recent event" anomalies)
└── client/
    └── src/
        ├── components/   RiskMap, RiskCard, ForecastChart, SatelliteTimeline, ScenarioSlider,
        │                 InterventionPanel, AIAssistant, LiveAlertFeed, SecurityGauge,
        │                 SpeakButton, CounterfactualImpact, AnomalyPanel, AlertSubscribeForm,
        │                 CarbonCreditCard
        ├── pages/         Landing, Dashboard, LakeDetail, Simulation, ActionPlan,
        │                 RegionalCommand, RegionalOptimizer
        └── services/     api.ts, socket.ts
```

## What's next (roadmap, not built yet)
- Replace synthetic measurements with live sensor/IMD rainfall feeds
- Replace the satellite-area interpolation with real Sentinel-2/NRSC imagery + CV surface-area detection
- Replace the linear forecast with an XGBoost/Prophet model trained on historical data
- Replace the greedy cross-lake budget allocation with an exact DP knapsack for larger watersheds
- Real MRV (measurement, reporting, verification) pipeline to back actual tradeable carbon credits
- User accounts / role-based access for different water authorities
