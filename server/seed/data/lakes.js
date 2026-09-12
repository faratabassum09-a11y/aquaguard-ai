/**
 * Five real Hyderabad water bodies, chosen to give AQUAGUARD a believable,
 * regionally-grounded demo (per the "pick ONE city + ONE watershed system"
 * guidance). Coordinates and documented facts are real; month-by-month
 * measurements generated in generateMeasurements.js are illustrative
 * synthetic data calibrated to match each lake's real, reported situation
 * (e.g. Durgam Cheruvu's documented shrinkage from ~160 to ~116 acres).
 */

module.exports = [
  {
    slug: "hussain-sagar",
    name: "Hussain Sagar",
    localName: "Tank Bund Lake",
    location: { lat: 17.4239, lng: 78.4738 },
    area: { historicalAcres: 1600, currentAcres: 1450 },
    type: "urban_lake",
    primaryUse: "Urban landmark, flood buffer, recreation (Buddha statue, Tank Bund)",
    knownIssues: [
      "Was Hyderabad's original drinking-water source before Osman Sagar and Himayat Sagar were built, and now receives heavy untreated sewage and industrial inflow from surrounding nalas.",
      "Frequent fish kills and algal blooms reported during low-flow summer months.",
      "High footfall recreational lake in the heart of the city, so pollution has direct public-health visibility.",
    ],
    population: { dependentPopulationEstimate: 900000 },
  },
  {
    slug: "durgam-cheruvu",
    name: "Durgam Cheruvu",
    localName: "Secret Lake",
    location: { lat: 17.42886, lng: 78.387794 },
    area: { historicalAcres: 160, currentAcres: 116 },
    type: "urban_lake",
    primaryUse: "Urban lake, HITEC City / Jubilee Hills groundwater recharge, tourism",
    knownIssues: [
      "Documented shrinkage from ~160 acres to ~116 acres due to encroachment from three sides, confirmed by NRSC satellite imagery.",
      "Nearly half the lake surface has been affected by water-hyacinth growth, a direct indicator of untreated sewage / nutrient overload (HYDRAA inspection, Jan 2026).",
      "Located between Jubilee Hills, Madhapur and Raidurg — three of Hyderabad's fastest-urbanizing localities.",
    ],
    population: { dependentPopulationEstimate: 250000 },
  },
  {
    slug: "osman-sagar",
    name: "Osman Sagar",
    localName: "Gandipet Lake",
    location: { lat: 17.3667, lng: 78.2833 },
    area: { historicalAcres: 3600, currentAcres: 3550 },
    type: "drinking_water_reservoir",
    primaryUse: "Primary drinking-water reservoir for Hyderabad, built on the Musi river",
    knownIssues: [
      "One of two reservoirs (with Himayat Sagar) protected under GO 111, which restricts construction in its catchment to protect drinking-water quality.",
      "Reservoir levels are highly sensitive to monsoon rainfall performance year to year.",
      "Proposals to repeal GO 111 have raised concern from conservation groups and the Nizam's descendants about future encroachment risk.",
    ],
    population: { dependentPopulationEstimate: 1500000 },
  },
  {
    slug: "himayat-sagar",
    name: "Himayat Sagar",
    localName: null,
    location: { lat: 17.3333, lng: 78.3667 },
    area: { historicalAcres: 2800, currentAcres: 2760 },
    type: "drinking_water_reservoir",
    primaryUse: "Twin drinking-water reservoir to Osman Sagar; flood protection for the Musi river",
    knownIssues: [
      "Built in 1927 specifically to protect Hyderabad from Musi river floods and to supply drinking water.",
      "Also protected under GO 111; groundwater recharge for surrounding areas depends on the reservoir remaining undeveloped.",
      "Long-term supply pressure as the city's population has grown far beyond 1961-era demand levels.",
    ],
    population: { dependentPopulationEstimate: 1300000 },
  },
  {
    slug: "shamirpet-lake",
    name: "Shamirpet Lake",
    localName: null,
    location: { lat: 17.5833, lng: 78.5667 },
    area: { historicalAcres: 900, currentAcres: 840 },
    type: "recreational_lake",
    primaryUse: "Recreation, groundwater recharge, weekend tourism for northern Hyderabad",
    knownIssues: [
      "Rapid real-estate development in the northern Outer Ring Road corridor is increasing catchment urbanization.",
      "Popular weekend tourist destination, making ecosystem health directly tied to local tourism revenue.",
      "Historically used for irrigation and groundwater recharge for nearby villages, now under growing residential-development pressure.",
    ],
    population: { dependentPopulationEstimate: 150000 },
  },
];
