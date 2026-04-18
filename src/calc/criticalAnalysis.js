// Deterministic audit of a single proposal against its modeled production
// and the user's location/utility context. All numbers cited come from the
// input payload; the function never invents values.

import { NEM_CLIFF_STATES, STATES, federalITCRate } from "../data/states";

const FINDING_LABELS = {
  inflated_production: "Inflated production estimate",
  weak_warranty: "Weak warranty coverage",
  suboptimal_orientation: "Suboptimal panel orientation",
  suboptimal_tilt: "Suboptimal panel tilt",
  high_apr: "High loan interest rate",
  lease_or_ppa: "Lease / PPA financing",
  missing_battery_nem_cliff: "No battery in reduced-net-metering state",
  missing_federal_itc: "Federal ITC not applied",
  missing_state_incentive: "State incentive not applied",
  no_production_guarantee: "No written production guarantee",
  undersized_system: "System likely undersized vs usage",
};

const finding = (id, severity, cite, modeled, detail) => ({
  id,
  label: FINDING_LABELS[id],
  severity,
  cite,
  modeled,
  detail,
});

// proposal: { systemSize, estimatedKwh, batteryCapacity, loanRate, totalPrice,
//             warrantyYears, orientation, tilt, financingType,
//             incentivesIncluded, productionGuarantee }
// userInfo: { state, lat, utilityRate, monthlyBillDollars }
// modeled:  { annualKwh, estimate?: boolean }   from location-solar Edge Function
export function auditProposal(proposal, userInfo, modeled) {
  const findings = [];
  const estimatedKwh = parseFloat(proposal.estimatedKwh) || null;
  const systemSize = parseFloat(proposal.systemSize) || null;
  const totalPrice = parseFloat(proposal.totalPrice) || null;
  const warrantyYears = parseFloat(proposal.warrantyYears) || null;
  const orientation = proposal.orientation !== "" ? parseFloat(proposal.orientation) : null;
  const tilt = proposal.tilt !== "" ? parseFloat(proposal.tilt) : null;
  const loanRate = parseFloat(proposal.loanRate) || null;
  const bat = parseFloat(proposal.batteryCapacity) || 0;
  const financing = (proposal.financingType || "").toLowerCase();
  const incentivesIncluded = proposal.incentivesIncluded || [];
  const productionGuarantee = parseFloat(proposal.productionGuarantee) || null;

  // 1. Inflated production estimate
  if (estimatedKwh && modeled?.annualKwh) {
    const threshold = modeled.estimate ? 1.20 : 1.10;
    const ratio = estimatedKwh / modeled.annualKwh;
    if (ratio > threshold) {
      const overagePct = Math.round((ratio - 1) * 100);
      const sev = ratio > threshold + 0.10 ? "high" : "med";
      findings.push(
        finding(
          "inflated_production",
          sev,
          `${estimatedKwh.toLocaleString()} kWh/yr claimed`,
          `${modeled.annualKwh.toLocaleString()} kWh/yr modeled${modeled.estimate ? " (state avg fallback)" : " (PVWatts)"}`,
          `Claimed production is ${overagePct}% above what solar irradiance at this lat/long supports for a ${systemSize || "?"} kW system.`,
        ),
      );
    }
  }

  // 2. Weak warranty
  if (warrantyYears !== null && warrantyYears < 25) {
    const sev = warrantyYears < 20 ? "high" : "med";
    findings.push(
      finding(
        "weak_warranty",
        sev,
        `${warrantyYears}-year warranty`,
        "25-year industry standard",
        "Panels typically run 25+ years; shorter warranty shifts late-life risk to you.",
      ),
    );
  }

  // 3. Orientation
  if (orientation !== null && (orientation < 135 || orientation > 225)) {
    findings.push(
      finding(
        "suboptimal_orientation",
        "med",
        `${orientation}° azimuth`,
        "135–225° (south-facing) optimal",
        "Orientation this far off south loses 10–20% annual production vs a south-facing array.",
      ),
    );
  }

  // 4. Tilt (needs latitude)
  const lat = userInfo?.lat;
  if (tilt !== null && lat != null && Math.abs(tilt - lat) > 20) {
    findings.push(
      finding(
        "suboptimal_tilt",
        "low",
        `${tilt}° tilt`,
        `${Math.round(lat)}° optimal for your latitude`,
        "Tilt far from latitude reduces annual yield; may be driven by roof pitch rather than design intent.",
      ),
    );
  }

  // 5. High APR
  if (loanRate !== null && loanRate > 7.99) {
    const sev = loanRate > 9.99 ? "high" : "med";
    findings.push(
      finding(
        "high_apr",
        sev,
        `${loanRate}% APR`,
        "~6.5–7.5% competitive in 2026",
        "High APR means most of your 'savings' go to interest — often more than the panels cost.",
      ),
    );
  }

  // 6. Lease or PPA
  if (financing === "lease" || financing === "ppa") {
    findings.push(
      finding(
        "lease_or_ppa",
        "high",
        financing.toUpperCase(),
        "Ownership (cash or loan)",
        "Leases/PPAs forfeit the 30% federal tax credit and complicate future home sales.",
      ),
    );
  }

  // 7. Battery missing in NEM-cliff state
  const stateCode = userInfo?.state;
  if (stateCode && NEM_CLIFF_STATES.has(stateCode) && bat === 0) {
    findings.push(
      finding(
        "missing_battery_nem_cliff",
        "high",
        "No battery included",
        `${stateCode} export credits are below retail rate`,
        "Without storage, midday exports pay only a fraction of what you pay for evening consumption.",
      ),
    );
  }

  // 8. Federal ITC
  const itcRate = federalITCRate();
  const claimsITC = incentivesIncluded.includes("federal_itc") || financing === "lease" || financing === "ppa";
  if (itcRate > 0 && !claimsITC && financing !== "lease" && financing !== "ppa") {
    findings.push(
      finding(
        "missing_federal_itc",
        "high",
        "Quoted price does not reference ITC",
        `${Math.round(itcRate * 100)}% federal tax credit available`,
        "The federal Investment Tax Credit is worth thousands — confirm it's reflected in net pricing.",
      ),
    );
  }

  // 9. State incentive
  if (stateCode && STATES[stateCode]?.incentives?.length) {
    for (const inc of STATES[stateCode].incentives) {
      if (!incentivesIncluded.includes(inc.id)) {
        findings.push(
          finding(
            "missing_state_incentive",
            "med",
            `${inc.name} not applied`,
            inc.note,
            "Ask the installer whether this incentive is reflected in your net price.",
          ),
        );
      }
    }
  }

  // 10. Production guarantee
  if (!productionGuarantee) {
    findings.push(
      finding(
        "no_production_guarantee",
        "low",
        "No production guarantee cited",
        "Strong installers write a 90%+ 10-year production guarantee",
        "Without a guarantee, underperformance is your financial problem, not the installer's.",
      ),
    );
  }

  // 11. Undersized vs monthly bill
  const monthlyBill = parseFloat(userInfo?.monthlyBillDollars) || 0;
  const utilityRate = parseFloat(userInfo?.utilityRate) || STATES[stateCode]?.avgUtilityRate || 0.16;
  if (monthlyBill > 0 && utilityRate > 0 && estimatedKwh) {
    const annualUsageKwh = (monthlyBill / utilityRate) * 12;
    if (estimatedKwh < annualUsageKwh * 0.7) {
      findings.push(
        finding(
          "undersized_system",
          "med",
          `${estimatedKwh.toLocaleString()} kWh/yr`,
          `~${Math.round(annualUsageKwh).toLocaleString()} kWh/yr estimated usage`,
          "System covers well under your usage — you'll keep a significant utility bill.",
        ),
      );
    }
  }

  return findings;
}

export function sortFindings(findings) {
  const order = { high: 0, med: 1, low: 2 };
  return [...findings].sort((a, b) => order[a.severity] - order[b.severity]);
}
