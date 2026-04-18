// Map the deterministic findings into the directional language we show on
// Step 4 AFTER the user has submitted contact info. By design this does
// NOT produce numeric claims about Awen's proposal — the formal numbers
// come from the Powur build we send later.

const RESPONSES = {
  inflated_production: {
    finding: "Production claim runs above what the sun actually delivers at your location.",
    response:
      "We model every array against NREL PVWatts for your exact latitude and roof geometry, then back the final number with a written production guarantee.",
  },
  weak_warranty: {
    finding: "Warranty is shorter than the panels' useful life.",
    response:
      "Our standard tier ships with a 25-year panel product warranty, 25-year performance warranty, and 25-year Awen workmanship warranty — all from a single point of accountability.",
  },
  suboptimal_orientation: {
    finding: "Panels face a direction that sacrifices annual production.",
    response:
      "Powur's design team lays out arrays by roof plane, sun path, and shading model — south-facing primary with micro-inverters or optimizers on any shaded plane.",
  },
  suboptimal_tilt: {
    finding: "Roof pitch isn't a great match for year-round yield.",
    response:
      "We factor seasonal production into sizing and, where roof pitch is a real constraint, model tilt-adjusted racking to recover the loss.",
  },
  high_apr: {
    finding: "Loan APR is well above the competitive 2026 range.",
    response:
      "We shop across lenders on the Powur platform and only present loan options in the 5.99–7.49% band where qualifying, so the panels — not the interest — are what you're paying for.",
  },
  lease_or_ppa: {
    finding: "Lease / PPA forfeits the 30% federal tax credit and complicates future home sales.",
    response:
      "Our default proposals are ownership-based (cash or loan) so you capture the ITC, keep SRECs where available, and avoid lender-consent issues at resale.",
  },
  missing_battery_nem_cliff: {
    finding: "Your state's export rates no longer pay retail — without storage, midday over-production is nearly wasted.",
    response:
      "We'll pair the array with a correctly-sized battery (Tesla Powerwall 3 or Enphase IQ Battery 10C) so self-consumption captures the full retail value of every kWh.",
  },
  missing_federal_itc: {
    finding: "Quoted price doesn't make the 30% federal tax credit explicit.",
    response:
      "Our proposal itemizes the 30% federal Investment Tax Credit line-by-line, alongside any state/utility incentives, so the net number you sign is the net number you pay.",
  },
  missing_state_incentive: {
    finding: "A state or utility incentive you qualify for isn't reflected in the net price.",
    response:
      "We apply every program we can confirm you're eligible for — tax credits, rebates, SRECs — and show the source for each so you can verify independently.",
  },
  no_production_guarantee: {
    finding: "No written production guarantee was cited.",
    response:
      "Every Awen proposal ships with a 90% 10-year production guarantee — if the array under-produces, we cut a check.",
  },
  undersized_system: {
    finding: "System as quoted leaves a meaningful utility bill in place.",
    response:
      "We size to 100–110% of your measured usage (weighted by your priority sliders) so the bill lands at or near zero without over-building capacity that can't be exported.",
  },
};

export function directionalBullets(findingsByProposal) {
  const seen = new Set();
  const bullets = [];
  for (const { proposalName, findings } of findingsByProposal) {
    for (const f of findings) {
      if (seen.has(f.id)) continue;
      seen.add(f.id);
      const tpl = RESPONSES[f.id];
      if (!tpl) continue;
      bullets.push({
        id: f.id,
        from: proposalName,
        finding: tpl.finding,
        response: tpl.response,
        severity: f.severity,
      });
    }
  }
  if (!bullets.length) {
    bullets.push({
      id: "no_findings",
      from: null,
      finding: "Your submitted proposals look solid on the fundamentals.",
      response:
        "We'd still build you a clean, no-pressure Awen proposal on the Powur platform so you have a true apples-to-apples ownership comparison.",
      severity: "low",
    });
  }
  return bullets;
}
