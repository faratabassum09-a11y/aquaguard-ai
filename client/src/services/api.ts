import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const getLakes = () => api.get("/lakes").then((r) => r.data);
export const getLake = (id: string) => api.get(`/lakes/${id}`).then((r) => r.data);
export const getSatellite = (id: string) => api.get(`/lakes/${id}/satellite`).then((r) => r.data);
export const getExplanation = (id: string) => api.get(`/lakes/${id}/explain`).then((r) => r.data);
export const getActionPlan = (id: string) => api.get(`/lakes/${id}/action-plan`).then((r) => r.data);

export const runSimulation = (payload: {
  lakeId: string;
  rainfallChangePct: number;
  temperatureChangeC: number;
  extractionChangePct: number;
  urbanizationChangePct: number;
  runoffChangePct: number;
}) => api.post("/simulate", payload).then((r) => r.data);

export const getOptimization = (lakeId: string, projectedRisk?: number) =>
  api
    .get(`/optimize/${lakeId}`, { params: projectedRisk ? { projectedRisk } : {} })
    .then((r) => r.data);

export const askAssistant = (lakeId: string, question: string) =>
  api.post("/assistant/ask", { lakeId, question }).then((r) => r.data);

export const getTimeMachine = (lakeId: string) => api.get(`/lakes/${lakeId}/timemachine`).then((r) => r.data);

export const getRegionalTimeMachine = () => api.get("/regional/timemachine").then((r) => r.data);

export const runCascade = (payload: {
  rainfallChangePct: number;
  temperatureChangeC: number;
  extractionChangePct: number;
  urbanizationChangePct: number;
  runoffChangePct: number;
}) => api.post("/regional/cascade", payload).then((r) => r.data);

export const getScenarioPresets = () => api.get("/simulate/presets").then((r) => r.data);

export const regionalSimulate = (payload: {
  rainfallChangePct: number;
  temperatureChangeC: number;
  extractionChangePct: number;
  urbanizationChangePct: number;
  runoffChangePct: number;
}) => api.post("/regional/simulate", payload).then((r) => r.data);

export const regionalOptimize = (budgetInr: number) =>
  api.post("/regional/optimize", { budgetInr }).then((r) => r.data);

export const getAnomalies = (lakeId: string) => api.get(`/lakes/${lakeId}/anomalies`).then((r) => r.data);

export const getCarbonCredit = (lakeId: string) => api.get(`/lakes/${lakeId}/carbon-credit`).then((r) => r.data);

export const subscribeAlert = (payload: {
  phoneNumber?: string;
  email?: string;
  channel: "sms" | "whatsapp" | "email";
  lakeId?: string;
}) => api.post("/alerts/subscribe", payload).then((r) => r.data);

export const triggerAlert = (lakeId: string) => api.post(`/alerts/${lakeId}/trigger`).then((r) => r.data);

export default api;
