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
      `You're looking at ${lake.name}${lake.location ? `, in ${lake.location}` : ""}. ` +
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