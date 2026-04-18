// Per-state solar reference data.
//
// Values are curated from publicly available sources (EIA residential retail
// rates ~2024-2025, NREL solar resource maps for daily peak sun hours, and
// DSIRE-documented state incentive programs). Numbers are intentionally
// coarse and used for directional analysis — always stated as "typical" in
// the UI, never as precise quotes.

export const FEDERAL_ITC_RATE = 0.30; // IRA schedule: 30% through 2032
export const FEDERAL_ITC_EXPIRES = 2032;

// netMetering values:
//   "full"    — 1:1 retail-rate export credit
//   "avoided" — export credited at wholesale / avoided-cost (post-NEM 3.0 style)
//   "none"    — no export compensation (self-consumption only)
const S = (avgUtilityRate, peakSunHours, netMetering, incentives = []) => ({
  avgUtilityRate,
  peakSunHours,
  netMetering,
  incentives,
});

// Well-known state incentive programs. Shape:
//   { id, name, type: "rebate"|"credit"|"srec"|"exemption", note }
const IN = (id, name, type, note) => ({ id, name, type, note });

export const STATES = {
  AL: S(0.14, 4.7, "none"),
  AK: S(0.24, 3.3, "full"),
  AZ: S(0.13, 6.5, "avoided", [
    IN("az_residential_credit", "AZ Residential Solar Tax Credit", "credit", "25% of system cost, up to $1,000"),
  ]),
  AR: S(0.12, 5.0, "full"),
  CA: S(0.29, 5.6, "avoided", [
    IN("ca_sgip", "CA SGIP Battery Rebate", "rebate", "Up to $1,000/kWh for qualifying battery storage"),
    IN("ca_property_exempt", "CA Property Tax Exclusion", "exemption", "Excludes system value from property tax"),
  ]),
  CO: S(0.14, 5.5, "full", [
    IN("co_sales_tax", "CO Sales Tax Exemption", "exemption", "State sales tax waived on PV equipment"),
  ]),
  CT: S(0.28, 4.5, "full", [
    IN("ct_res", "CT Residential Solar Investment Program", "rebate", "Performance-based rebate for qualifying installs"),
  ]),
  DE: S(0.15, 4.6, "full", [
    IN("de_grant", "Delaware Green Energy Fund", "rebate", "Up to $5,000 per residential install"),
    IN("de_srec", "Delaware SRECs", "srec", "Tradable credits; value fluctuates with market"),
  ]),
  FL: S(0.15, 5.3, "full", [
    IN("fl_property", "FL Property Tax Exemption", "exemption", "100% property tax exemption on residential PV"),
    IN("fl_sales_tax", "FL Sales Tax Exemption", "exemption", "State sales tax waived on PV equipment"),
  ]),
  GA: S(0.13, 5.0, "avoided"),
  HI: S(0.42, 5.5, "avoided", [
    IN("hi_credit", "HI Renewable Energy Tax Credit", "credit", "35% of system cost, up to $5,000 residential"),
  ]),
  ID: S(0.11, 5.1, "full", [
    IN("id_deduction", "ID Solar Tax Deduction", "credit", "40% deduction year 1, 20% next 3 years"),
  ]),
  IL: S(0.16, 4.2, "full", [
    IN("il_adjust", "Illinois Shines (Adjustable Block)", "srec", "15-year SREC contract at state-set prices"),
  ]),
  IN: S(0.15, 4.5, "avoided"),
  IA: S(0.14, 4.6, "full"),
  KS: S(0.14, 5.0, "avoided"),
  KY: S(0.13, 4.5, "full"),
  LA: S(0.12, 5.0, "full"),
  ME: S(0.24, 4.2, "full"),
  MD: S(0.17, 4.5, "full", [
    IN("md_grant", "MD Residential Clean Energy Grant", "rebate", "$1,000 flat grant per residential install"),
    IN("md_srec", "Maryland SRECs", "srec", "Tradable credits; value fluctuates with market"),
  ]),
  MA: S(0.30, 4.3, "full", [
    IN("ma_credit", "MA Residential Energy Credit", "credit", "15% of system cost, up to $1,000"),
    IN("ma_smart", "Massachusetts SMART", "rebate", "10-year performance-based incentive"),
  ]),
  MI: S(0.18, 4.2, "avoided"),
  MN: S(0.15, 4.4, "full"),
  MS: S(0.13, 5.0, "avoided"),
  MO: S(0.13, 4.8, "full"),
  MT: S(0.12, 4.6, "full", [
    IN("mt_credit", "MT Alternative Energy Credit", "credit", "Up to $500 against state income tax"),
  ]),
  NE: S(0.12, 4.8, "avoided"),
  NV: S(0.14, 6.2, "avoided"),
  NH: S(0.25, 4.3, "full", [
    IN("nh_rebate", "NH Residential Solar Rebate", "rebate", "$0.20/W up to $1,000"),
  ]),
  NJ: S(0.19, 4.4, "full", [
    IN("nj_trec", "NJ SuCRE / TREC-II", "srec", "Transition credits; value varies by year"),
    IN("nj_sales_tax", "NJ Sales Tax Exemption", "exemption", "State sales tax waived on PV equipment"),
  ]),
  NM: S(0.15, 5.8, "full", [
    IN("nm_credit", "NM Solar Market Development Tax Credit", "credit", "10% of system cost, up to $6,000"),
  ]),
  NY: S(0.23, 4.3, "full", [
    IN("ny_credit", "NY Residential Solar Tax Credit", "credit", "25% of system cost, up to $5,000"),
    IN("ny_nyserda", "NYSERDA NY-Sun", "rebate", "Per-watt rebate varies by region"),
  ]),
  NC: S(0.13, 5.0, "full"),
  ND: S(0.12, 4.5, "avoided"),
  OH: S(0.15, 4.3, "full"),
  OK: S(0.12, 5.2, "avoided"),
  OR: S(0.12, 4.0, "full", [
    IN("or_rebate", "Oregon Solar + Storage Rebate", "rebate", "Up to $5,000 for qualifying households"),
  ]),
  PA: S(0.16, 4.3, "full", [
    IN("pa_srec", "Pennsylvania SRECs", "srec", "Tradable credits; value fluctuates with market"),
  ]),
  RI: S(0.24, 4.3, "full", [
    IN("ri_re_grant", "RI Renewable Energy Fund Grant", "rebate", "$0.85/W up to $7,000"),
  ]),
  SC: S(0.14, 5.0, "full", [
    IN("sc_credit", "SC Solar Tax Credit", "credit", "25% of system cost, up to $3,500/yr"),
  ]),
  SD: S(0.12, 4.6, "avoided"),
  TN: S(0.13, 4.8, "avoided"),
  TX: S(0.14, 5.3, "avoided"),
  UT: S(0.11, 5.5, "full", [
    IN("ut_credit", "UT Residential Energy Systems Credit", "credit", "25% of system cost, up to $400"),
  ]),
  VT: S(0.20, 4.2, "full"),
  VA: S(0.13, 4.7, "full"),
  WA: S(0.11, 3.8, "full", [
    IN("wa_sales_tax", "WA Sales Tax Exemption", "exemption", "State sales tax waived on PV ≤10 kW"),
  ]),
  WV: S(0.13, 4.3, "avoided"),
  WI: S(0.15, 4.3, "full", [
    IN("wi_focus", "Focus on Energy Residential Rewards", "rebate", "Flat rebate per residential install"),
  ]),
  WY: S(0.11, 5.2, "avoided"),
  DC: S(0.15, 4.4, "full", [
    IN("dc_srec", "DC SRECs", "srec", "Among the highest-value SREC markets in the US"),
    IN("dc_solar_for_all", "DC Solar for All", "rebate", "Income-qualified full-cost install"),
  ]),
};

// States where net metering was substantially reduced — battery pays off
// more materially. Used by criticalAnalysis for `missing_battery_nem_cliff`.
export const NEM_CLIFF_STATES = new Set(["CA", "HI", "AZ", "NV"]);

export const STATE_LABELS = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
};

export const STATE_CODES = Object.keys(STATE_LABELS).sort();

// Current federal ITC rate (date-guarded for the post-2032 step-down).
export function federalITCRate(now = new Date()) {
  const y = now.getFullYear();
  if (y <= FEDERAL_ITC_EXPIRES) return FEDERAL_ITC_RATE;
  if (y === 2033) return 0.26;
  if (y === 2034) return 0.22;
  return 0;
}

export function stateData(code) {
  return STATES[code] || null;
}
