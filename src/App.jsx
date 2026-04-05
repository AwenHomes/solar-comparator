import { useState, useRef } from "react";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfService from "./TermsOfService";

// ─── CONFIG ─────────────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing required environment variables: VITE_SUPABASE_URL and/or VITE_SUPABASE_KEY");
}

// ─── SECURITY UTILITIES ────────────────────────────────────────────────
const escapeHtml = (str) => String(str)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254;

const validatePhone = (phone) => {
  if (!phone) return true; // optional field
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 11 && digits[0] === "1");
};

const sanitizePhone = (phone) => phone.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1");

const validateNumericBounds = (value, min, max) => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= min && num <= max;
};

// ─── RATE LIMITER ──────────────────────────────────────────────────────
const submissionTimestamps = [];
const checkRateLimit = () => {
  const now = Date.now();
  const fiveMinAgo = now - 5 * 60 * 1000;
  while (submissionTimestamps.length && submissionTimestamps[0] < fiveMinAgo) submissionTimestamps.shift();
  if (submissionTimestamps.length >= 3) return false;
  submissionTimestamps.push(now);
  return true;
};

// ─── CONSENT LANGUAGE ──────────────────────────────────────────────────
const CONSENT_TEXT = {
  email: "I consent to receive marketing emails from Awen Energy LLC about my solar comparison, custom proposals, and energy savings tips. You can unsubscribe anytime via the link in each email or by contacting privacy@awenenergy.com.",
  sms: "I consent to receive SMS text messages from Awen Energy LLC at the phone number provided regarding my solar comparison and custom proposal. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out. Consent is not a condition of purchase.",
  calls: "I consent to receive telephone calls, including calls made using an automatic telephone dialing system or prerecorded voice, from Awen Energy LLC at the phone number provided regarding my solar comparison and custom proposal. Consent is not a condition of purchase.",
};

// ─── DETERMINISTIC CALCULATION ENGINE ───────────────────────────────────
const PANEL_DEGRADATION = 0.005;
const UTILITY_ESCALATION = 0.035;
const AVG_UTILITY_RATE = 0.16;

function calcMetrics(p) {
  const size = parseFloat(p.systemSize) || 0;
  const kwh = parseFloat(p.estimatedKwh) || size * 1500;
  const bat = parseFloat(p.batteryCapacity) || 0;
  const rate = parseFloat(p.loanRate) || 0;
  const price = parseFloat(p.totalPrice) || 0;
  if (!size || !price) return null;

  const ppw = price / (size * 1000);
  let totalProd = 0, totalSave = 0;
  const saves = {};
  const prods = {};
  for (let y = 1; y <= 25; y++) {
    const deg = kwh * Math.pow(1 - PANEL_DEGRADATION, y - 1);
    const ur = AVG_UTILITY_RATE * Math.pow(1 + UTILITY_ESCALATION, y - 1);
    totalProd += deg;
    totalSave += deg * ur;
    if ([5,10,20,25].includes(y)) { saves[y] = Math.round(totalSave); prods[y] = Math.round(totalProd); }
  }

  const mo = rate > 0 ? (price * (rate/100/12)) / (1 - Math.pow(1+rate/100/12, -300)) : 0;
  const totalLoan = mo * 300;
  const interest = totalLoan - price;

  let breakeven = ">25";
  let cumSave = 0;
  for (let y = 1; y <= 25; y++) {
    const deg = kwh * Math.pow(1 - PANEL_DEGRADATION, y - 1);
    const ur = AVG_UTILITY_RATE * Math.pow(1 + UTILITY_ESCALATION, y - 1);
    cumSave += deg * ur;
    if (cumSave >= price && breakeven === ">25") { breakeven = y; break; }
  }

  return {
    kwhYear: Math.round(kwh), ppw: ppw.toFixed(2),
    costPerKwh: (price / (totalProd || 1)).toFixed(3),
    monthly: Math.round(mo), totalLoan: Math.round(totalLoan),
    interest: Math.round(interest), breakeven,
    saves, prods, bat,
  };
}

// ─── PALETTE & FONT ─────────────────────────────────────────────────────
const P = {
  bg: "#FDFAF5", card: "#FFFFFF", accent: "#2D6A4F", accentLight: "#40916C",
  accentPale: "#D8F3DC", warm: "#E8985E", warmLight: "#FFF1E6",
  text: "#1B1B1B", muted: "#6B7280", border: "#E5E1D8",
  danger: "#DC2626", good: "#059669", goodPale: "#ECFDF5", neutral: "#F3F1EC",
};

const FONT_LINK = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Fraunces:wght@400;600;700&display=swap";

// ─── SUBCOMPONENTS (defined at module level for stable React identity) ──
const filterNumeric = (raw, { allowDecimal = true, maxDecimalPlaces = 2 } = {}) => {
  let v = raw.replace(/[^0-9.]/g, "");
  const parts = v.split(".");
  if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
  if (!allowDecimal) v = v.replace(/\./g, "");
  if (allowDecimal && v.includes(".")) {
    const [int, dec] = v.split(".");
    v = int + "." + dec.slice(0, maxDecimalPlaces);
  }
  return v;
};

const Inp = ({ label, value, onChange, placeholder, type="text", pre, suf, req, numeric, maxDecimals = 2 }) => {
  const handleChange = (e) => {
    let v = e.target.value;
    if (numeric) v = filterNumeric(v, { allowDecimal: maxDecimals > 0, maxDecimalPlaces: maxDecimals });
    onChange(v);
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 500, color: P.muted, display: "block", marginBottom: 4 }}>
        {label}{req && <span style={{ color: P.danger }}> *</span>}
      </label>
      <div style={{ position: "relative" }}>
        {pre && <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: P.muted }}>{pre}</span>}
        <input type={numeric ? "text" : type} inputMode={numeric ? "decimal" : undefined} pattern={numeric ? "[0-9]*\\.?[0-9]*" : undefined}
          value={value} onChange={handleChange} placeholder={placeholder}
          style={{
            width: "100%", padding: `9px ${suf?40:10}px 9px ${pre?24:10}px`, fontFamily: "'DM Sans'", fontSize: 14,
            border: `1.5px solid ${P.border}`, borderRadius: 8, outline: "none", background: P.bg,
            color: P.text, boxSizing: "border-box",
          }}
          onFocus={e => e.target.style.borderColor = P.accent}
          onBlur={e => e.target.style.borderColor = P.border}
        />
        {suf && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: P.muted }}>{suf}</span>}
      </div>
    </div>
  );
};

const Btn = ({ children, onClick, v="primary", disabled, style: s, full }) => {
  const base = { fontFamily: "'DM Sans'", fontWeight: 600, fontSize: 14, border: "none", borderRadius: 10, cursor: disabled?"not-allowed":"pointer", padding: "12px 24px", transition: "all 0.2s", opacity: disabled?0.5:1, width: full?"100%":undefined };
  const vars = { primary: { background: P.accent, color: "#fff" }, warm: { background: P.warm, color: "#fff" }, outline: { background: "transparent", border: `2px solid ${P.accent}`, color: P.accent }, ghost: { background: P.neutral, color: P.text } };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...vars[v], ...s }}>{children}</button>;
};

const Steps = ({ step }) => {
  const labels = ["Choose Input", "Enter Details", "Compare", "Your Proposal"];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, margin: "0 0 32px", flexWrap: "wrap" }}>
      {labels.map((l, i) => {
        const s = i + 1; const active = s === step; const done = s < step;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 64 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: done ? P.accent : active ? P.warm : P.neutral,
                color: done||active ? "#fff" : P.muted,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'DM Sans'", fontWeight: 600, fontSize: 14,
                boxShadow: active ? `0 0 0 4px ${P.warmLight}` : "none",
              }}>{done ? "✓" : s}</div>
              <span style={{ fontFamily: "'DM Sans'", fontSize: 10, fontWeight: active?600:400, color: active?P.text:P.muted, marginTop: 5, textAlign: "center" }}>{l}</span>
            </div>
            {i < 3 && <div style={{ width: 32, height: 2, background: done?P.accent:P.border, margin: "0 2px", marginBottom: 18 }} />}
          </div>
        );
      })}
    </div>
  );
};

// ─── EMPTY PROPOSAL ─────────────────────────────────────────────────────
const blank = (n) => ({ name: n || "", systemSize: "", estimatedKwh: "", batteryCapacity: "", loanRate: "", totalPrice: "", panelBrand: "" });

// ─── PDF TEXT EXTRACTION ────────────────────────────────────────────────
const readPdf = (file) => new Promise((res, rej) => {
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
    } catch (e) { rej(e); }
  };
  r.onerror = rej;
  r.readAsArrayBuffer(file);
});

const extractFromText = (text, i) => {
  const p = blank(`Uploaded Proposal ${i + 1}`);
  const sm = text.match(/(\d+\.?\d*)\s*(?:kw|kilowatt)/i) || text.match(/system\s*size[:\s]*(\d+\.?\d*)/i);
  if (sm) p.systemSize = sm[1];
  const km = text.match(/(\d{1,3}(?:,\d{3})*)\s*kwh/i);
  if (km) p.estimatedKwh = km[1].replace(/,/g, "");
  const bm = text.match(/battery[:\s]*(\d+\.?\d*)\s*kwh/i) || text.match(/(\d+\.?\d*)\s*kwh\s*battery/i);
  if (bm) p.batteryCapacity = bm[1];
  const pm = text.match(/\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g);
  if (pm) { const prices = pm.map(m => parseFloat(m.replace(/[$,]/g, ""))).filter(v => v > 5000); if (prices.length) p.totalPrice = String(Math.max(...prices)); }
  const rm = text.match(/(\d+\.?\d*)\s*%\s*(?:apr|interest|rate)/i) || text.match(/(?:apr|interest|rate)[:\s]*(\d+\.?\d*)\s*%/i);
  if (rm) p.loanRate = rm[1];
  for (const brand of ["SunPower","REC","Q CELLS","Canadian Solar","Trina","JinkoSolar","Silfab","Tesla","Aptos","LG","Panasonic","Mission Solar"]) {
    if (text.toLowerCase().includes(brand.toLowerCase())) { p.panelBrand = brand; break; }
  }
  return p;
};

// ─── MAIN APP ───────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState(null);
  const [proposals, setProposals] = useState([blank("Proposal 1")]);
  const [results, setResults] = useState(null);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [lead, setLead] = useState({ name: "", email: "", phone: "" });
  const [consent, setConsent] = useState({ email: false, sms: false, calls: false });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leadErrors, setLeadErrors] = useState({});
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const fileRef = useRef(null);

  const upd = (i, k, v) => { const c = [...proposals]; c[i] = { ...c[i], [k]: v }; setProposals(c); };
  const add = () => proposals.length < 3 && setProposals([...proposals, blank(`Proposal ${proposals.length+1}`)]);
  const rem = (i) => proposals.length > 1 && setProposals(proposals.filter((_,j) => j!==i));
  const valid = () => proposals.every(p => parseFloat(p.systemSize) > 0 && parseFloat(p.totalPrice) > 0);

  const handlePdf = async (files) => {
    setParsing(true);
    const arr = Array.from(files).slice(0, 3);
    const ext = [];
    for (let i = 0; i < arr.length; i++) {
      try { const t = await readPdf(arr[i]); ext.push(extractFromText(t, i)); }
      catch { ext.push(blank(`Uploaded Proposal ${i+1}`)); }
    }
    setProposals(ext.length ? ext : [blank("Proposal 1")]);
    setParsing(false);
    setStep(2);
  };

  const doCompare = async () => {
    const r = proposals.map(p => ({ ...p, m: calcMetrics(p) })).filter(x => x.m);
    setResults(r);
    setStep(3);
    // AI
    setAiLoading(true);
    try {
      const summaries = r.map(x => ({
        name: x.name, size: x.systemSize + "kW", price: "$" + Number(x.totalPrice).toLocaleString(),
        ppw: "$" + x.m.ppw, annualKwh: x.m.kwhYear, loanRate: x.loanRate ? x.loanRate + "%" : "N/A",
        monthly: x.m.monthly ? "$" + x.m.monthly : "N/A", interest: "$" + x.m.interest.toLocaleString(),
        battery: x.batteryCapacity ? x.batteryCapacity + "kWh" : "None", panel: x.panelBrand || "Unknown",
        breakeven: x.m.breakeven + "yr", savings25: "$" + x.m.saves[25]?.toLocaleString(),
      }));
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{ role: "user", content: `You are a friendly, knowledgeable solar energy advisor helping a homeowner compare solar proposals. You are NOT selling anything — give them honest, clear analysis.

Proposals: ${JSON.stringify(summaries, null, 2)}

Write a clear, friendly analysis covering:
1. Each proposal's strengths and weaknesses (2-3 sentences each)
2. Key differences to pay attention to (price per watt, loan costs, battery, production)
3. Red flags or hidden costs (high interest, missing battery, unrealistic production)
4. Your honest recommendation on best overall value
5. Questions they should ask each company before signing

Tone: warm, conversational — like a smart neighbor who knows solar. Plain language. No bullet points — flowing paragraphs. Under 500 words.` }],
        }),
      });
      const data = await resp.json();
      setAiText(data.content?.map(b => b.text || "").join("") || "Unable to generate analysis.");
    } catch { setAiText("We couldn't generate AI analysis right now. Review the comparison numbers above."); }
    setAiLoading(false);
  };

  const download = () => {
    if (!results) return;
    const rows = results.map(r => `<div style="flex:1;min-width:200px;padding:16px;border:1px solid #ddd;border-radius:10px;background:#fafafa;">
      <h3 style="color:#2D6A4F;margin:0 0 10px">${escapeHtml(r.name)}</h3>
      <p><b>System:</b> ${escapeHtml(r.systemSize)} kW</p><p><b>Panel:</b> ${escapeHtml(r.panelBrand||"—")}</p>
      <p><b>Price:</b> $${escapeHtml(Number(r.totalPrice).toLocaleString())}</p><p><b>$/W:</b> $${escapeHtml(r.m.ppw)}</p>
      <p><b>Annual kWh:</b> ${escapeHtml(r.m.kwhYear.toLocaleString())}</p>
      <p><b>Battery:</b> ${r.batteryCapacity?escapeHtml(r.batteryCapacity)+" kWh":"None"}</p>
      <p><b>Monthly:</b> ${r.m.monthly?"$"+escapeHtml(r.m.monthly):"N/A"}</p>
      <p><b>Interest:</b> $${escapeHtml(r.m.interest.toLocaleString())}</p>
      <p><b>Breakeven:</b> ${escapeHtml(r.m.breakeven)} yr</p>
      <p><b>25yr Savings:</b> $${escapeHtml(r.m.saves[25]?.toLocaleString())}</p></div>`).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Solar Comparison — Awen Energy</title>
    <style>body{font-family:system-ui;max-width:800px;margin:0 auto;padding:30px;color:#1b1b1b}h1{color:#2D6A4F}h2{color:#E8985E;margin-top:30px}.cards{display:flex;gap:16px;flex-wrap:wrap;margin:20px 0}p{line-height:1.6;margin:4px 0}.footer{margin-top:40px;padding-top:20px;border-top:2px solid #2D6A4F;font-size:13px;color:#888}</style></head><body>
    <h1>Your Solar Proposal Comparison</h1><p style="color:#666">Generated by Awen Energy — ${escapeHtml(new Date().toLocaleDateString())}</p>
    <h2>Side-by-Side Overview</h2><div class="cards">${rows}</div>
    <h2>Analysis</h2><div style="background:#f0fdf4;padding:20px;border-radius:10px;line-height:1.7">${escapeHtml(aiText||"Not available.").replace(/\n/g,"<br>")}</div>
    <div class="footer"><p><b>Awen Energy</b> — Helping homeowners take control of their power.</p><p>Want a free, honest third proposal? Visit awenenergy.com</p></div></body></html>`;
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([html],{type:"text/html"}));
    a.download = "solar-comparison-report.html"; a.click();
  };

  const validateLead = () => {
    const errors = {};
    if (!lead.name || lead.name.trim().length < 1) errors.name = "Name is required.";
    else if (lead.name.length > 100) errors.name = "Name must be under 100 characters.";
    if (!lead.email) errors.email = "Email is required.";
    else if (!validateEmail(lead.email)) errors.email = "Please enter a valid email address.";
    if (lead.phone && !validatePhone(lead.phone)) errors.phone = "Please enter a valid US phone number (10 digits).";
    if ((consent.sms || consent.calls) && !lead.phone) errors.phone = "Phone number is required when opting into SMS or calls.";
    setLeadErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitLead = async () => {
    if (!validateLead()) return;
    if (!checkRateLimit()) { setLeadErrors({ form: "Too many submissions. Please wait a few minutes." }); return; }
    if (!SUPABASE_URL || !SUPABASE_KEY) { setLeadErrors({ form: "Service configuration error. Please try again later." }); return; }
    setSubmitting(true);
    try {
      const cm = [];
      if (consent.email) cm.push("email");
      if (consent.sms) cm.push("sms");
      if (consent.calls) cm.push("calls");
      const consentRecords = cm.map(method => ({
        method,
        text: CONSENT_TEXT[method],
        granted_at: new Date().toISOString(),
      }));
      await fetch(`${SUPABASE_URL}/rest/v1/solar_comparisons`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: "return=minimal" },
        body: JSON.stringify({
          name: lead.name.trim(), email: lead.email.trim().toLowerCase(), phone: lead.phone ? sanitizePhone(lead.phone) : null,
          proposals: proposals.map(p => ({ name:p.name, systemSize:p.systemSize, estimatedKwh:p.estimatedKwh, batteryCapacity:p.batteryCapacity, loanRate:p.loanRate, totalPrice:p.totalPrice, panelBrand:p.panelBrand })),
          ai_analysis: aiText, calculation_results: results?.map(r => ({ name:r.name, metrics:r.m })),
          input_method: method, consent_methods: cm.join(",")||null,
          consented_at: cm.length ? new Date().toISOString() : null,
          consent_text: cm.length ? JSON.stringify(consentRecords) : null,
          consent_url: window.location.href, user_agent: navigator.userAgent, source: "solar_comparator",
        }),
      });
      setSubmitted(true);
    } catch (e) { console.error(e); setLeadErrors({ form: "Submission failed. Please try again." }); }
    setSubmitting(false);
  };

  // ─── RENDER ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: P.bg, fontFamily: "'DM Sans', sans-serif", color: P.text }}>
      <link href={FONT_LINK} rel="stylesheet" />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box}`}</style>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${P.accent} 0%, ${P.accentLight} 60%, #52B788 100%)`, padding: "32px 20px 24px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "clamp(22px,5vw,32px)", color: "#fff", margin: 0 }}>
          Solar Proposal Comparator
        </h1>
        <p style={{ fontFamily: "'DM Sans'", fontSize: "clamp(13px,3vw,15px)", color: "rgba(255,255,255,0.85)", margin: "8px auto 0", maxWidth: 440 }}>
          Compare your solar quotes side-by-side. No bias, no pressure — just clarity.
        </p>
      </div>

      <div style={{ maxWidth: 840, margin: "0 auto", padding: "24px 16px 50px" }}>
        <Steps step={step} />

        {/* ──── STEP 1 ──── */}
        {step === 1 && (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 22, margin: "0 0 6px" }}>How would you like to enter your proposals?</h2>
            <p style={{ color: P.muted, fontSize: 14, margin: "0 0 28px" }}>Compare up to 3 solar proposals you've received.</p>
            <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
              {[
                { icon: "✍️", title: "Type It In", desc: "Enter the key numbers from your proposals manually. Takes about 2 minutes.", btn: "Manual Entry", act: () => { setMethod("manual"); setStep(2); } },
                { icon: "📄", title: "Upload PDFs", desc: "Upload your proposal PDFs and we'll try to extract the key numbers for you.", btn: "Upload Files", act: () => fileRef.current?.click() },
              ].map((opt, i) => (
                <div key={i} onClick={opt.act} style={{
                  background: P.card, borderRadius: 16, border: `1px solid ${P.border}`, padding: 28,
                  flex: "1 1 240px", maxWidth: 300, cursor: "pointer", textAlign: "center",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "all 0.2s",
                }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>{opt.icon}</div>
                  <h3 style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 18, margin: "0 0 6px" }}>{opt.title}</h3>
                  <p style={{ color: P.muted, fontSize: 13, lineHeight: 1.5 }}>{opt.desc}</p>
                  <Btn v={i===0?"primary":"outline"} style={{ marginTop: 14, width: "100%" }} onClick={e => { e.stopPropagation(); opt.act(); }}>{opt.btn}</Btn>
                </div>
              ))}
            </div>
            <input ref={fileRef} type="file" accept=".pdf" multiple style={{ display: "none" }}
              onChange={e => { setMethod("pdf"); handlePdf(e.target.files); }} />
            {parsing && <div style={{ marginTop: 20, padding: 14, background: P.warmLight, borderRadius: 10, color: P.warm, fontSize: 14 }}>Reading your PDFs...</div>}
          </div>
        )}

        {/* ──── STEP 2 ──── */}
        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 20, margin: "0 0 4px", textAlign: "center" }}>
              {method === "pdf" ? "Review & Edit Extracted Data" : "Enter Your Proposal Details"}
            </h2>
            <p style={{ color: P.muted, fontSize: 13, margin: "0 0 20px", textAlign: "center" }}>
              {method === "pdf" ? "We pulled what we could. Please review and correct any numbers." : "System size and total price are required for each proposal."}
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {proposals.map((p, i) => (
                <div key={i} style={{ background: P.card, borderRadius: 14, border: `1px solid ${P.border}`, padding: "22px 20px", flex: "1 1 230px", minWidth: 230, position: "relative", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  {proposals.length > 1 && (
                    <button onClick={() => rem(i)} style={{ position: "absolute", top: 8, right: 8, background: "#FEF2F2", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer", fontSize: 12, color: P.danger, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                  )}
                  <input value={p.name} onChange={e => upd(i, "name", e.target.value)} placeholder={`Proposal ${i+1}`}
                    style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 16, border: "none", background: "transparent", color: P.accent, width: "calc(100% - 28px)", marginBottom: 14, outline: "none" }} />
                  <Inp label="System Size" value={p.systemSize} onChange={v => upd(i,"systemSize",v)} placeholder="8.5" suf="kW" req numeric />
                  <Inp label="Est. Annual Production" value={p.estimatedKwh} onChange={v => upd(i,"estimatedKwh",v)} placeholder="12750" suf="kWh" numeric maxDecimals={0} />
                  <Inp label="Battery Capacity" value={p.batteryCapacity} onChange={v => upd(i,"batteryCapacity",v)} placeholder="13.5" suf="kWh" numeric />
                  <Inp label="Loan Interest Rate" value={p.loanRate} onChange={v => upd(i,"loanRate",v)} placeholder="3.99" suf="%" numeric />
                  <Inp label="Total System Price" value={p.totalPrice} onChange={v => upd(i,"totalPrice",v)} placeholder="32000" pre="$" req numeric maxDecimals={0} />
                  <Inp label="Panel Brand" value={p.panelBrand} onChange={v => upd(i,"panelBrand",v)} placeholder="e.g. REC, Q CELLS" />
                </div>
              ))}
            </div>
            {proposals.length < 3 && <div style={{ textAlign: "center", marginTop: 14 }}><Btn v="ghost" onClick={add}>+ Add Another Proposal</Btn></div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24 }}>
              <Btn v="ghost" onClick={() => setStep(1)}>← Back</Btn>
              <Btn v="primary" onClick={doCompare} disabled={!valid()}>Compare Proposals →</Btn>
            </div>
            {!valid() && <p style={{ textAlign: "center", color: P.muted, fontSize: 12, marginTop: 8 }}>Each proposal needs system size + price.</p>}
          </div>
        )}

        {/* ──── STEP 3 ──── */}
        {step === 3 && results && (
          <div>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 20, margin: "0 0 4px", textAlign: "center" }}>Your Proposal Comparison</h2>
            <p style={{ color: P.muted, fontSize: 13, margin: "0 0 24px", textAlign: "center" }}>Here's how your proposals stack up.</p>

            {/* Table */}
            <div style={{ background: P.card, borderRadius: 14, border: `1px solid ${P.border}`, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans'", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: P.accent, color: "#fff" }}>
                      <th style={{ padding: "11px 14px", textAlign: "left", fontWeight: 600 }}>Metric</th>
                      {results.map((r, i) => <th key={i} style={{ padding: "11px 14px", textAlign: "center", fontWeight: 600 }}>{r.name}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["System Size", r => r.systemSize + " kW"],
                      ["Panel Brand", r => r.panelBrand || "—"],
                      ["Total Price", r => "$" + Number(r.totalPrice).toLocaleString(), "low"],
                      ["Price / Watt", r => "$" + r.m.ppw, "low"],
                      ["Annual Production", r => r.m.kwhYear.toLocaleString() + " kWh", "high"],
                      ["Battery", r => r.batteryCapacity ? r.batteryCapacity + " kWh" : "None"],
                      ["Loan Rate", r => r.loanRate ? r.loanRate + "%" : "N/A", "low"],
                      ["Monthly Payment", r => r.m.monthly ? "$" + r.m.monthly : "N/A"],
                      ["Total Interest", r => "$" + r.m.interest.toLocaleString(), "low"],
                      ["Cost/kWh (25yr)", r => "$" + r.m.costPerKwh, "low"],
                      ["Breakeven", r => r.m.breakeven + " yr", "low"],
                      ["5-Year Savings", r => "$" + (r.m.saves[5]||0).toLocaleString(), "high"],
                      ["10-Year Savings", r => "$" + (r.m.saves[10]||0).toLocaleString(), "high"],
                      ["25-Year Savings", r => "$" + (r.m.saves[25]||0).toLocaleString(), "high"],
                    ].map(([label, fn, hl], ri) => {
                      const vals = results.map(r => { const s = fn(r); return { display: s, num: parseFloat(s.replace(/[$,%kWhyr ]/g, "")) }; });
                      const nums = vals.map(v => v.num).filter(n => !isNaN(n) && n > 0);
                      const best = hl === "high" ? Math.max(...nums) : hl === "low" ? Math.min(...nums) : null;
                      return (
                        <tr key={ri} style={{ background: ri % 2 === 0 ? "#fff" : P.neutral }}>
                          <td style={{ padding: "9px 14px", fontWeight: 500, color: P.muted, fontSize: 12, whiteSpace: "nowrap" }}>{label}</td>
                          {vals.map((v, vi) => {
                            const isBest = best !== null && !isNaN(v.num) && v.num === best && nums.length > 1;
                            return <td key={vi} style={{ padding: "9px 14px", textAlign: "center", fontWeight: isBest?700:400, color: isBest?P.good:P.text, background: isBest?P.goodPale:"transparent" }}>{v.display}{isBest?" ✓":""}</td>;
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Analysis */}
            <div style={{ background: P.goodPale, border: `1px solid ${P.accentPale}`, borderRadius: 14, padding: "22px 24px", marginTop: 20 }}>
              <h3 style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 17, margin: "0 0 10px", color: P.accent }}>Honest Analysis</h3>
              {aiLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 18, height: 18, border: `3px solid ${P.accentPale}`, borderTopColor: P.accent, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  <span style={{ color: P.muted, fontSize: 13 }}>Our AI is reviewing your proposals...</span>
                </div>
              ) : (
                <div style={{ fontSize: 13.5, lineHeight: 1.75, color: P.text, whiteSpace: "pre-wrap" }}>{aiText}</div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
              <Btn v="ghost" onClick={() => setStep(2)}>← Edit</Btn>
              <Btn v="outline" onClick={download} disabled={aiLoading}>Download Report</Btn>
              <Btn v="warm" onClick={() => setStep(4)}>Get My Custom Proposal →</Btn>
            </div>
          </div>
        )}

        {/* ──── STEP 4 ──── */}
        {step === 4 && !submitted && (
          <div style={{ maxWidth: 440, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 44, marginBottom: 6 }}>🏠</div>
              <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 22, margin: "0 0 6px" }}>Want an Honest Third Opinion?</h2>
              <p style={{ color: P.muted, fontSize: 14, lineHeight: 1.6 }}>
                We'll put together a custom proposal designed by engineers — no pressure, no obligation.
              </p>
            </div>
            <div style={{ background: P.card, borderRadius: 14, border: `1px solid ${P.border}`, padding: "24px 22px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <Inp label="Your Name" value={lead.name} onChange={v => { setLead({...lead,name:v}); setLeadErrors({...leadErrors,name:undefined}); }} placeholder="First and last name" req />
              {leadErrors.name && <p style={{ color: P.danger, fontSize: 11, margin: "-10px 0 8px" }}>{leadErrors.name}</p>}
              <Inp label="Email" value={lead.email} onChange={v => { setLead({...lead,email:v}); setLeadErrors({...leadErrors,email:undefined}); }} placeholder="you@email.com" type="email" req />
              {leadErrors.email && <p style={{ color: P.danger, fontSize: 11, margin: "-10px 0 8px" }}>{leadErrors.email}</p>}
              <Inp label="Phone" value={lead.phone} onChange={v => { setLead({...lead,phone:v}); setLeadErrors({...leadErrors,phone:undefined}); }} placeholder="(555) 123-4567 (optional)" type="tel" />
              {leadErrors.phone && <p style={{ color: P.danger, fontSize: 11, margin: "-10px 0 8px" }}>{leadErrors.phone}</p>}

              {/* ── Communication Consent (TCPA / CAN-SPAM Compliant) ── */}
              <div style={{ margin: "18px 0 6px", padding: 14, background: P.neutral, borderRadius: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: P.text, margin: "0 0 10px", lineHeight: 1.4 }}>Communication Preferences (optional)</p>
                {[
                  { k: "email", t: CONSENT_TEXT.email },
                  { k: "sms", t: CONSENT_TEXT.sms },
                  { k: "calls", t: CONSENT_TEXT.calls },
                ].map(c => (
                  <label key={c.k} style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 10, cursor: "pointer", fontSize: 11, lineHeight: 1.5 }}>
                    <input type="checkbox" checked={consent[c.k]} onChange={e => setConsent({...consent,[c.k]:e.target.checked})} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ color: "#374151" }}>{c.t}</span>
                  </label>
                ))}
              </div>

              {/* ── Legal Disclosure ── */}
              <p style={{ fontSize: 10, color: P.muted, lineHeight: 1.6, margin: "6px 0 14px" }}>
                By submitting, you agree to our{" "}
                <span onClick={() => setShowPrivacy(true)} style={{ color: P.accent, cursor: "pointer", textDecoration: "underline" }}>Privacy Policy</span>
                {" "}and{" "}
                <span onClick={() => setShowTerms(true)} style={{ color: P.accent, cursor: "pointer", textDecoration: "underline" }}>Terms of Service</span>.
                {" "}Your information is never sold.{" "}
                For data requests: <a href="mailto:privacy@awenenergy.com" style={{ color: P.accent }}>privacy@awenenergy.com</a>.
                {" "}Awen Energy LLC.
              </p>

              {leadErrors.form && <p style={{ color: P.danger, fontSize: 12, textAlign: "center", margin: "0 0 10px" }}>{leadErrors.form}</p>}
              <Btn v="warm" full onClick={submitLead} disabled={!lead.name||!lead.email||submitting}>
                {submitting ? "Sending..." : "Request My Custom Proposal"}
              </Btn>
              <div style={{ textAlign: "center", marginTop: 10 }}>
                <Btn v="ghost" onClick={() => setStep(3)} style={{ fontSize: 12, padding: "7px 14px" }}>← Back to Comparison</Btn>
              </div>
            </div>
          </div>
        )}

        {step === 4 && submitted && (
          <div style={{ textAlign: "center", maxWidth: 440, margin: "0 auto" }}>
            <div style={{ background: P.goodPale, border: `2px solid ${P.accent}`, borderRadius: 16, padding: "32px 24px" }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>🎉</div>
              <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 22, margin: "0 0 8px", color: P.accent }}>You're All Set!</h2>
              <p style={{ fontSize: 14, lineHeight: 1.6 }}>We received your comparison and we're putting together a custom proposal for your home. You'll hear from us within 24 hours.</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
                <Btn v="outline" onClick={download}>Download Report</Btn>
                <Btn v="ghost" onClick={() => setStep(3)}>← View Comparison</Btn>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ background: P.accent, padding: "18px 20px", textAlign: "center", fontFamily: "'DM Sans'", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
        <strong style={{ color: "#fff" }}>Awen Energy</strong> — Helping homeowners take control of their power.
        <br />This tool provides estimates for informational purposes only.
        <br />
        <span onClick={() => setShowPrivacy(true)} style={{ color: "rgba(255,255,255,0.85)", cursor: "pointer", textDecoration: "underline" }}>Privacy Policy</span>
        {" | "}
        <span onClick={() => setShowTerms(true)} style={{ color: "rgba(255,255,255,0.85)", cursor: "pointer", textDecoration: "underline" }}>Terms of Service</span>
        {" | "}
        <a href="mailto:privacy@awenenergy.com" style={{ color: "rgba(255,255,255,0.85)", textDecoration: "underline" }}>privacy@awenenergy.com</a>
        <br />
        <span style={{ fontSize: 11 }}>We do not sell or share your personal information.</span>
      </div>

      {/* Legal Modals */}
      {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} palette={P} />}
      {showTerms && <TermsOfService onClose={() => setShowTerms(false)} palette={P} />}
    </div>
  );
}
