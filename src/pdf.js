export const blank = (n) => ({
  name: n || "",
  systemSize: "",
  estimatedKwh: "",
  batteryCapacity: "",
  loanRate: "",
  totalPrice: "",
  panelBrand: "",
  inverterBrand: "",
  orientation: "",
  tilt: "",
  warrantyYears: "",
  financingType: "",
  productionGuarantee: "",
  incentivesIncluded: [],
});

export const readPdf = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const b = new Uint8Array(r.result);
        let t = "";
        for (let i = 0; i < b.length; i++) {
          const c = b[i];
          if (c >= 32 && c <= 126) t += String.fromCharCode(c);
          else if (c === 10 || c === 13) t += " ";
        }
        res(t.replace(/\/\w+/g, " ").replace(/\s+/g, " "));
      } catch (e) {
        rej(e);
      }
    };
    r.onerror = rej;
    r.readAsArrayBuffer(file);
  });

const PANEL_BRANDS = [
  "SunPower", "Maxeon", "REC", "Q CELLS", "Canadian Solar", "Trina",
  "JinkoSolar", "Silfab", "Tesla", "Aptos", "LG", "Panasonic", "Mission Solar",
];

const INVERTER_BRANDS = ["Enphase", "SolarEdge", "SMA", "Tesla", "Fronius", "Generac"];

export const extractFromText = (text, i) => {
  const p = blank(`Uploaded Proposal ${i + 1}`);

  const sm = text.match(/(\d+\.?\d*)\s*(?:kw|kilowatt)/i) || text.match(/system\s*size[:\s]*(\d+\.?\d*)/i);
  if (sm) p.systemSize = sm[1];

  const km = text.match(/(\d{1,3}(?:,\d{3})*)\s*kwh\s*(?:\/|per)?\s*year/i) ||
             text.match(/annual\s*production[:\s]*(\d{1,3}(?:,\d{3})*)/i) ||
             text.match(/(\d{1,3}(?:,\d{3})*)\s*kwh/i);
  if (km) p.estimatedKwh = km[1].replace(/,/g, "");

  const bm = text.match(/battery[:\s]*(\d+\.?\d*)\s*kwh/i) || text.match(/(\d+\.?\d*)\s*kwh\s*battery/i);
  if (bm) p.batteryCapacity = bm[1];

  const pm = text.match(/\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g);
  if (pm) {
    const prices = pm.map((m) => parseFloat(m.replace(/[$,]/g, ""))).filter((v) => v > 5000);
    if (prices.length) p.totalPrice = String(Math.max(...prices));
  }

  const rm = text.match(/(\d+\.?\d*)\s*%\s*(?:apr|interest|rate)/i) ||
             text.match(/(?:apr|interest|rate)[:\s]*(\d+\.?\d*)\s*%/i);
  if (rm) p.loanRate = rm[1];

  const tm = text.match(/tilt[:\s]*(\d+)\s*[°\s]/i) || text.match(/(\d+)\s*°\s*tilt/i);
  if (tm) p.tilt = tm[1];

  const am = text.match(/azimuth[:\s]*(\d+)\s*[°\s]/i) ||
             text.match(/orientation[:\s]*(\d+)\s*°/i);
  if (am) p.orientation = am[1];

  const wm = text.match(/(\d{2})[-\s]*year\s*(?:product|warranty)/i) ||
             text.match(/warranty[:\s]*(\d{2})\s*year/i);
  if (wm) p.warrantyYears = wm[1];

  const pgm = text.match(/production\s*guarantee[:\s]*(\d{2,3})\s*%/i);
  if (pgm) p.productionGuarantee = pgm[1];

  if (/\blease\b/i.test(text)) p.financingType = "lease";
  else if (/\bppa\b/i.test(text) || /power\s*purchase/i.test(text)) p.financingType = "ppa";
  else if (p.loanRate) p.financingType = "loan";
  else if (/cash\s*(purchase|payment)/i.test(text)) p.financingType = "cash";

  for (const brand of PANEL_BRANDS) {
    if (text.toLowerCase().includes(brand.toLowerCase())) {
      p.panelBrand = brand;
      break;
    }
  }
  for (const brand of INVERTER_BRANDS) {
    if (text.toLowerCase().includes(brand.toLowerCase())) {
      p.inverterBrand = brand;
      break;
    }
  }

  if (/federal\s*(itc|tax\s*credit)/i.test(text) || /30\s*%\s*(federal|tax)/i.test(text)) {
    p.incentivesIncluded.push("federal_itc");
  }

  return p;
};
