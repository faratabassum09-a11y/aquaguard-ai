/**
 * aiService.js
 *
 * This is Layer 5 of AQUAGUARD's pipeline (see README):
 * Data -> Models -> Simulation -> Optimization -> LLM.
 *
 * IMPORTANT: the LLM is only ever used to narrate structured numbers that
 * were already computed by riskService/simulationService/optimizationService.
 * It is never asked to invent a risk score. If no API key is configured,
 * AQUAGUARD falls back to a deterministic template engine so the full
 * product still works offline for a demo.
 */

const PROVIDER = (process.env.LLM_PROVIDER || "").toLowerCase();
const API_KEY = process.env.LLM_API_KEY || "";
const MODEL = process.env.LLM_MODEL || "claude-sonnet-4-6";

async function callAnthropic(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 700,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data?.content?.map((c) => c.text || "").join("\n") || "";
}

async function callOpenAI(prompt) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 700,
    }),
  });
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || "";
}

// Google Gemini via Google AI Studio - genuinely free tier, no credit card
// required (unlike Anthropic/OpenAI trial credits). Uses the classic
// generateContent REST endpoint, which Google states remains fully
// supported even as newer interfaces roll out.
async function callGemini(prompt) {
  const model = MODEL && MODEL !== "claude-sonnet-4-6" ? MODEL : "gemini-3.6-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "Gemini request failed");
  return data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("\n") || "";
}

async function generateWithLLM(prompt) {
  if (!API_KEY || !PROVIDER) return null;
  try {
    if (PROVIDER === "anthropic") return await callAnthropic(prompt);
    if (PROVIDER === "openai") return await callOpenAI(prompt);
    if (PROVIDER === "gemini") return await callGemini(prompt);
    return null;
  } catch (err) {
    console.error("[aiService] LLM call failed, falling back to template:", err.message);
    return null;
  }
}

// ---------- Fallback templated explanations (fully offline) ----------

function templatedExplanation(lake, risk) {
  const top = Object.entries(risk.contributions).sort((a, b) => b[1] - a[1]);
  const [topFactor, topValue] = top[0];
  const label = {
    rainfallDeficit: "below-average rainfall",
    temperatureAnomaly: "rising temperatures",
    extractionStress: "excess water extraction",
    landUseChange: "land-use change / encroachment",
    pollution: "pollution and untreated inflow",
  }[topFactor];

  return (
    `${lake.name} is currently rated ${risk.riskBand} risk (${risk.overallRisk}/100). ` +
    `The single largest contributor is ${label}, accounting for roughly ${topValue} of the 100-point scale. ` +
    `Drought risk stands at ${risk.droughtRisk}%, pollution risk at ${risk.pollutionRisk}%, and ecosystem stress at ${risk.ecosystemStress}%. ` +
    `${lake.knownIssues && lake.knownIssues.length ? "Documented local context: " + lake.knownIssues[0] + ". " : ""}` +
    `This is a decision-support estimate based on historical and simulated environmental relationships, not a certified hydrological forecast.`
  );
}

function templatedActionPlan(lake, risk, optimization) {
  const rec = optimization.recommended;
  const lines = optimization.ranked
    .slice(0, 3)
    .map(
      (i, idx) =>
        `Priority ${idx + 1}: ${i.strategy} — estimated risk reduction ${i.riskReductionPct} pts (cost: ${i.cost}, feasibility: ${i.feasibility})`
    )
    .join("\n");

  return (
    `30-DAY WATER CRISIS PREVENTION PLAN — ${lake.name}\n\n` +
    `Current status: ${risk.riskBand} risk (${risk.overallRisk}/100).\n\n` +
    `${lines}\n\n` +
    `Recommended combined action: ${rec.strategy}.\n` +
    `Without intervention, projected risk remains at ${optimization.withoutAction}%. ` +
    `With the recommended plan, projected risk falls to approximately ${rec.projectedRisk}%.\n\n` +
    `This plan is a hackathon-stage decision-support recommendation. For deployment, ` +
    `it should be validated against hydrological survey data and reviewed by the relevant water authority.`
  );
}

async function explainRisk(lake, risk) {
  const prompt =
    `You are AQUAGUARD AI, a water-resource decision-support assistant. ` +
    `Explain in plain, non-alarmist English (3-4 sentences, no invented numbers) why ${lake.name} in Hyderabad ` +
    `has an overall risk score of ${risk.overallRisk}/100 (${risk.riskBand}), given this breakdown: ` +
    `${JSON.stringify(risk.contributions)}. Drought risk ${risk.droughtRisk}%, pollution risk ${risk.pollutionRisk}%, ` +
    `ecosystem stress ${risk.ecosystemStress}%. Known local context: ${(lake.knownIssues || []).join("; ")}. ` +
    `End by noting this is a decision-support estimate, not a certified forecast.`;

  const llmText = await generateWithLLM(prompt);
  return llmText || templatedExplanation(lake, risk);
}

async function generateActionPlan(lake, risk, optimization) {
  const prompt =
    `You are AQUAGUARD AI. Using ONLY the structured data below (do not invent numbers), ` +
    `write a concise "30-Day Water Crisis Prevention Plan" for ${lake.name}, Hyderabad, for a municipal water authority audience. ` +
    `Current risk: ${risk.overallRisk}/100 (${risk.riskBand}). ` +
    `Ranked interventions: ${JSON.stringify(optimization.ranked.slice(0, 3))}. ` +
    `Without action projected risk: ${optimization.withoutAction}%. ` +
    `With recommended plan projected risk: ${optimization.recommended.projectedRisk}%. ` +
    `Format with a short status line, top 3 priorities, and an expected-impact summary.`;

  const llmText = await generateWithLLM(prompt);
  return llmText || templatedActionPlan(lake, risk, optimization);
}

// Offline fallback that actually reads the question instead of always
// returning the same canned risk summary. Covers the handful of question
// shapes judges/users ask most (identity, report, forecast, why/cause,
// intervention cost) before falling back to a generic overview.
function templatedAnswerFallback(lake, risk, optimization, forecast, question, toolExecution) {
  if (toolExecution) {
    return (
      `${toolExecution.summary} ` +
      `(Live computation run just now via AQUAGUARD's simulation/optimization engine — connect a working ` +
      `LLM_API_KEY in server/.env for more conversational answers.)`
    );
  }

  const q = (question || "").toLowerCase();

  if (/which lake|what lake|name of (the )?lake|what is this/.test(q)) {
    return (
      `You're looking at ${lake.name}${lake.localName && lake.localName !== lake.name ? ` (${lake.localName})` : ""}. ` +
      `It's currently rated ${risk.riskBand} risk at ${risk.overallRisk}/100.`
    );
  }

  if (/report|summary|summarize|brief|municipal|authority|document/.test(q)) {
    const top = optimization?.ranked?.slice(0, 3) || [];
    return (
      `📋 Status report — ${lake.name}\n` +
      `Overall risk: ${risk.overallRisk}/100 (${risk.riskBand}).\n` +
      `Breakdown — Drought: ${risk.droughtRisk}% · Pollution: ${risk.pollutionRisk}% · Ecosystem stress: ${risk.ecosystemStress}%.\n` +
      `${lake.knownIssues?.length ? `Documented issues: ${lake.knownIssues[0]}.\n` : ""}` +
      `Recommended interventions, ranked: ${
        top
          .map((o, i) => `${i + 1}) ${o.strategy} (cost: ${o.cost}, projected risk: ${o.projectedRisk}%)`)
          .join("; ") || "none required at this time"
      }.\n` +
      `${
        forecast?.length
          ? `Forecast: water level trending toward ${
              forecast[forecast.length - 1]?.predictedWaterLevelPct ?? forecast[0]?.predictedWaterLevelPct
            }% over the next ${forecast.length} period(s).`
          : ""
      }`
    );
  }

  if (/forecast|predict|next month|trend|future/.test(q)) {
    if (!forecast?.length) return `No forecast data is available for ${lake.name} right now.`;
    return (
      `Forecast for ${lake.name}: water level is projected to move to about ` +
      `${forecast[forecast.length - 1].predictedWaterLevelPct}% by the end of the forecast window ` +
      `(currently modeling ${forecast.length} period(s) ahead).`
    );
  }

  if (/why|cause|reason|driver|contribut/.test(q)) {
    const top = Object.entries(risk.contributions || {}).sort((a, b) => b[1] - a[1])[0];
    const label = {
      rainfallDeficit: "below-average rainfall",
      temperatureAnomaly: "rising temperatures",
      extractionStress: "excess water extraction",
      landUseChange: "land-use change / encroachment",
      pollution: "pollution and untreated inflow",
    }[top?.[0]];
    return (
      `The biggest driver of ${lake.name}'s current ${risk.overallRisk}/100 (${risk.riskBand}) risk is ${
        label || "a combination of factors"
      }${top ? `, contributing roughly ${top[1]} of the 100-point scale` : ""}.`
    );
  }

  if (/cost|cheap|expensive|budget|₹|rupee|crore|lakh/.test(q)) {
    const rec = optimization?.recommended;
    return rec
      ? `The cheapest effective intervention for ${lake.name} is "${rec.strategy}" — cost: ${rec.cost}, feasibility: ${rec.feasibility}, projected to bring risk down to ${rec.projectedRisk}%.`
      : `No intervention cost data is available for ${lake.name} right now.`;
  }

  // Generic fallback — still grounded in real numbers, just labeled as generic.
  return (
    `Based on current data for ${lake.name}: overall risk is ${risk.overallRisk}/100 (${risk.riskBand}). ` +
    `The top recommended intervention is "${optimization?.recommended?.strategy}", ` +
    `projected to bring risk down to ${optimization?.recommended?.projectedRisk}%. ` +
    `(Connect a working LLM_API_KEY in server/.env for fully free-form conversational answers.)`
  );
}

async function answerQuestion(lake, risk, optimization, forecast, question, toolExecution) {
  const context = {
    lake: lake.name,
    risk,
    optimization: optimization?.ranked?.slice(0, 3),
    forecast: forecast?.slice(0, 3),
    // If the agentic layer (agentService.js) actually executed a live
    // simulation/optimization for this question, its real result is
    // injected here so the LLM narrates real numbers, not a guess.
    liveComputationJustExecuted: toolExecution
      ? { type: toolExecution.type, summary: toolExecution.summary, scenario: toolExecution.scenario || null }
      : null,
  };
  const prompt =
    `You are AQUAGUARD AI, embedded in a live hackathon demo. Answer the judge's question ONLY using this ` +
    `structured context (never invent numbers not present here): ${JSON.stringify(context)}. ` +
    `${
      toolExecution
        ? `IMPORTANT: you just actually EXECUTED a live computation to answer this question, not a guess. Lead with ` +
          `its real result ("${toolExecution.summary}") before adding brief interpretation. `
        : ""
    }` +
    `Question: "${question}". Answer in 2-4 sentences, plain English.`;

  const llmText = await generateWithLLM(prompt);
  if (llmText) return llmText;

  return templatedAnswerFallback(lake, risk, optimization, forecast, question, toolExecution);
}

module.exports = { explainRisk, generateActionPlan, answerQuestion };