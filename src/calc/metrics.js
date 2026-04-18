export const PANEL_DEGRADATION = 0.005;
export const UTILITY_ESCALATION = 0.035;
export const DEFAULT_UTILITY_RATE = 0.16;

export function calcMetrics(p, utilityRate = DEFAULT_UTILITY_RATE) {
  const size = parseFloat(p.systemSize) || 0;
  const kwh = parseFloat(p.estimatedKwh) || size * 1500;
  const bat = parseFloat(p.batteryCapacity) || 0;
  const rate = parseFloat(p.loanRate) || 0;
  const price = parseFloat(p.totalPrice) || 0;
  if (!size || !price) return null;

  const ppw = price / (size * 1000);
  let totalProd = 0;
  let totalSave = 0;
  const saves = {};
  const prods = {};
  for (let y = 1; y <= 25; y++) {
    const deg = kwh * Math.pow(1 - PANEL_DEGRADATION, y - 1);
    const ur = utilityRate * Math.pow(1 + UTILITY_ESCALATION, y - 1);
    totalProd += deg;
    totalSave += deg * ur;
    if ([5, 10, 20, 25].includes(y)) {
      saves[y] = Math.round(totalSave);
      prods[y] = Math.round(totalProd);
    }
  }

  const mo = rate > 0 ? (price * (rate / 100 / 12)) / (1 - Math.pow(1 + rate / 100 / 12, -300)) : 0;
  const totalLoan = mo * 300;
  const interest = totalLoan - price;

  let breakeven = ">25";
  let paybackYear = null;
  let cumSave = 0;
  for (let y = 1; y <= 25; y++) {
    const deg = kwh * Math.pow(1 - PANEL_DEGRADATION, y - 1);
    const ur = utilityRate * Math.pow(1 + UTILITY_ESCALATION, y - 1);
    cumSave += deg * ur;
    if (cumSave >= price && breakeven === ">25") {
      breakeven = y;
      paybackYear = y;
      break;
    }
  }

  return {
    kwhYear: Math.round(kwh),
    ppw: ppw.toFixed(2),
    ppwNum: ppw,
    costPerKwh: (price / (totalProd || 1)).toFixed(3),
    monthly: Math.round(mo),
    totalLoan: Math.round(totalLoan),
    interest: Math.round(interest),
    breakeven,
    paybackYear,
    saves,
    prods,
    bat,
  };
}

export function riskScore(p, findings) {
  const sevWeight = { high: 3, med: 1.5, low: 0.5 };
  return (findings || []).reduce((sum, f) => sum + (sevWeight[f.severity] || 0), 0);
}
