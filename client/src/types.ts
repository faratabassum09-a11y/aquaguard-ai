export type RiskBand = "SAFE" | "WATCH" | "HIGH" | "CRITICAL";

export interface Lake {
  _id: string;
  slug: string;
  name: string;
  localName?: string;
  location: { lat: number; lng: number };
  area: { historicalAcres: number; currentAcres: number };
  type: "drinking_water_reservoir" | "urban_lake" | "recreational_lake";
  primaryUse: string;
  knownIssues: string[];
  population: { dependentPopulationEstimate: number };
  latest: {
    waterLevelPct: number;
    waterQualityPct: number;
    droughtRisk: number;
    pollutionRisk: number;
    ecosystemStress: number;
    overallRisk: number;
    riskBand: RiskBand;
    updatedAt: string;
  };
}

export interface RiskProfile {
  droughtRisk: number;
  pollutionRisk: number;
  ecosystemStress: number;
  overallRisk: number;
  riskBand: RiskBand;
  contributions: {
    rainfallDeficit: number;
    temperatureAnomaly: number;
    extractionStress: number;
    landUseChange: number;
    pollution: number;
  };
}

export interface ForecastPoint {
  dayOffset: number;
  predictedWaterLevelPct: number;
  lowerBound: number;
  upperBound: number;
}

export interface SatelliteObservation {
  year: number;
  waterSurfaceAcres: number;
  vegetationIndex: number;
  encroachmentNote: string;
}

export interface Intervention {
  strategy: string;
  description: string;
  cost: "Low" | "Medium" | "High";
  feasibility: "Low" | "Medium" | "High";
  riskReductionPct: number;
  projectedRisk: number;
  score: number;
}

export interface OptimizationResult {
  withoutAction: number;
  ranked: Intervention[];
  recommended: Intervention;
}

export interface ImpactEstimate {
  risk: number;
  populationAffected: number;
  waterAtRiskMl: number;
  severity: number;
}

export interface CounterfactualImpact {
  withoutAction: ImpactEstimate;
  withPlan: ImpactEstimate;
  populationProtected: number;
  waterProtectedMl: number;
}

export interface ScenarioPreset {
  id: string;
  label: string;
  description: string;
  values: {
    rainfallChangePct: number;
    temperatureChangeC: number;
    extractionChangePct: number;
    urbanizationChangePct: number;
    runoffChangePct: number;
  };
}

export interface LiveAlert {
  id: string;
  lakeId: string;
  lakeName: string;
  message: string;
  severity: "critical" | "high" | "watch" | "info";
  timestamp: string;
}

export interface RegionalLakeResult {
  lakeId: string;
  name: string;
  location: { lat: number; lng: number };
  baselineRisk: number;
  baselineBand: RiskBand;
  projectedRisk: number;
  projectedBand: RiskBand;
  delta: number;
}

export interface RegionalSimulateResult {
  scenario: ScenarioPreset["values"];
  lakes: RegionalLakeResult[];
  summary: { avgBaseline: number; avgProjected: number; newlyCritical: number };
}

export interface RegionalFundedItem {
  lakeId: string;
  lakeName: string;
  strategy: string;
  description: string;
  costInr: number;
  costLabel: "Low" | "Medium" | "High";
  riskReductionPct: number;
  currentRisk: number;
}

export interface RegionalOptimizeResult {
  budgetInr: number;
  totalSpent: number;
  remainingBudget: number;
  funded: RegionalFundedItem[];
  unfundedLakes: string[];
  totalRiskReductionPts: number;
  lakesFundedCount: number;
  lakesTotalCount: number;
}

export interface Anomaly {
  metric: string;
  label: string;
  latestValue: number;
  historicalAverage: number;
  zScore: number;
  monthOverMonthChangePct: number;
  severity: "high" | "medium";
  detectionMethod: string;
  description: string;
}

export interface CarbonCreditEstimate {
  lostAcres: number;
  restorableAcres: number;
  annualCO2Tonnes: number;
  annualValueUsd: number;
  annualValueInr: number;
  tenYearValueInr: number;
  assumptions: {
    co2TonnesPerAcrePerYear: number;
    vcmPriceUsdPerTonne: number;
    usdToInr: number;
    note: string;
  };
}

export interface ToolExecution {
  type: "simulate" | "regional_simulate" | "regional_optimize";
  scenario?: Record<string, number>;
  parseNotes?: string[];
  summary: string;
  data: any;
}

export interface TimeMachinePoint {
  date: string;
  monthIndex: number;
  waterLevelPct: number;
  pollutionIndex: number;
  rainfallMm: number;
  temperatureC: number;
  extractionMld: number;
  encroachmentPct: number;
  overallRisk: number;
  riskBand: RiskBand;
  droughtRisk: number;
  pollutionRisk: number;
  ecosystemStress: number;
}

export interface TimeMachineResponse {
  lakeId: string;
  name: string;
  slug: string;
  timeline: TimeMachinePoint[];
}

export interface RegionalTimeMachineResponse {
  months: number;
  lakes: {
    lakeId: string;
    name: string;
    slug: string;
    location: { lat: number; lng: number };
    timeline: TimeMachinePoint[];
  }[];
}

export interface CascadeEdge {
  from: string;
  to: string;
  label: string;
  weight: number;
  description: string;
}

export interface CascadeNode {
  lakeId: string;
  name: string;
  slug: string;
  location: { lat: number; lng: number };
  baselineRisk: number;
  baselineBand: RiskBand;
  projectedRisk: number;
  projectedBand: RiskBand;
  delta: number;
  cascadeAdjustment: number;
  cascadeProjectedRisk: number;
  cascadeBand: RiskBand;
  incomingFrom: { from: string; fromName: string; label: string; addedStress: number }[];
}

export interface CascadeResponse {
  scenario: ScenarioPreset["values"];
  edges: CascadeEdge[];
  nodes: CascadeNode[];
  summary: { avgBaseline: number; avgProjected: number; newlyCritical: number };
}

export interface AlertSubscriptionResponse {
  subscription: {
    _id: string;
    phoneNumber: string | null;
    email: string | null;
    channel: "sms" | "whatsapp" | "email";
    lakeId: string | null;
  };
  liveMode: boolean;
}
