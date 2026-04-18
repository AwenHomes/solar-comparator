import { useState, useRef } from "react";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfService from "./TermsOfService";
import { P, FONT_LINK } from "./theme";
import { sanitizePhone, checkRateLimit } from "./security";
import Steps from "./ui/Steps";
import Btn from "./ui/Btn";
import { readPdf, extractFromText, blank } from "./pdf";
import { calcMetrics } from "./calc/metrics";
import { auditProposal } from "./calc/criticalAnalysis";
import { STATES } from "./data/states";
import { resolveZip } from "./data/zipCentroids";
import Step1Method from "./steps/Step1Method";
import Step2Proposals from "./steps/Step2Proposals";
import Step3YourInfo from "./steps/Step3YourInfo";
import Step4Analysis, {
  buildReportHtml,
  CONSENT_TEXT,
  validateLeadShape,
} from "./steps/Step4Analysis";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing required environment variables: VITE_SUPABASE_URL and/or VITE_SUPABASE_KEY");
}

const DEFAULT_WEIGHTS = { cost: 0.5, payback: 0.5, reliability: 0.5, sustainability: 0.5 };

async function modelProduction(userInfo, proposal) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  const size = parseFloat(proposal.systemSize);
  if (!size || size <= 0) return null;

  const body = {
    zip: userInfo.zip || null,
    state: userInfo.state || null,
    systemSizeKw: size,
    tilt: proposal.tilt !== "" && proposal.tilt != null ? parseFloat(proposal.tilt) : null,
    azimuth: proposal.orientation !== "" && proposal.orientation != null ? parseFloat(proposal.orientation) : 180,
  };

  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/location-solar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error(`location-solar ${resp.status}`);
    return await resp.json();
  } catch (e) {
    console.warn("location-solar failed, using state-lookup fallback", e);
    const sd = STATES[userInfo.state];
    if (!sd) return null;
    const annualKwh = Math.round(sd.peakSunHours * 365 * 0.77 * size);
    const coord = resolveZip(userInfo.zip, userInfo.state);
    return {
      lat: coord?.[0] ?? null,
      long: coord?.[1] ?? null,
      city: coord?.[2] ?? null,
      state: userInfo.state,
      annualKwh,
      estimate: true,
      source: "state_lookup",
    };
  }
}

export default function App() {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState(null);
  const [proposals, setProposals] = useState([blank("Proposal 1")]);
  const [userInfo, setUserInfo] = useState({
    state: "",
    zip: "",
    utilityName: "",
    utilityRate: "",
    monthlyBillDollars: "",
    netMetering: "",
    weights: { ...DEFAULT_WEIGHTS },
  });
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

  const handlePdf = async (files) => {
    setParsing(true);
    setMethod("pdf");
    const arr = Array.from(files).slice(0, 3);
    const ext = [];
    for (let i = 0; i < arr.length; i++) {
      try {
        const t = await readPdf(arr[i]);
        ext.push(extractFromText(t, i));
      } catch {
        ext.push(blank(`Uploaded Proposal ${i + 1}`));
      }
    }
    setProposals(ext.length ? ext : [blank("Proposal 1")]);
    setParsing(false);
    setStep(2);
  };

  const goManual = () => {
    setMethod("manual");
    setStep(2);
  };

  const runAnalysis = async () => {
    setStep(4);
    setAiLoading(true);

    const latLong = resolveZip(userInfo.zip, userInfo.state);
    const userLat = latLong?.[0] ?? null;
    const enrichedUserInfo = { ...userInfo, lat: userLat };

    const modeledPerProposal = await Promise.all(proposals.map((p) => modelProduction(userInfo, p)));

    const rate =
      parseFloat(userInfo.utilityRate) ||
      STATES[userInfo.state]?.avgUtilityRate ||
      0.16;

    const r = proposals
      .map((p, i) => {
        const m = calcMetrics(p, rate);
        if (!m) return null;
        const modeled = modeledPerProposal[i];
        const findings = auditProposal(p, enrichedUserInfo, modeled);
        return { ...p, m, modeled, findings };
      })
      .filter(Boolean);

    setResults(r);

    // Claude narrative
    try {
      const existingProposals = r.map((x) => ({
        name: x.name,
        systemSize: x.systemSize,
        estimatedKwh: x.estimatedKwh,
        batteryCapacity: x.batteryCapacity,
        loanRate: x.loanRate,
        totalPrice: x.totalPrice,
        panelBrand: x.panelBrand,
        inverterBrand: x.inverterBrand,
        orientation: x.orientation,
        tilt: x.tilt,
        warrantyYears: x.warrantyYears,
        financingType: x.financingType,
        productionGuarantee: x.productionGuarantee,
        incentivesIncluded: x.incentivesIncluded,
        metrics: {
          ppw: x.m.ppw,
          annualKwh: x.m.kwhYear,
          monthly: x.m.monthly,
          interest: x.m.interest,
          breakeven: x.m.breakeven,
          savings25: x.m.saves[25],
        },
        modeled: x.modeled,
      }));

      const findings = r.map((x) => ({ proposalName: x.name, findings: x.findings }));

      const resp = await fetch(`${SUPABASE_URL}/functions/v1/solar-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          userInfo: {
            state: userInfo.state,
            zip: userInfo.zip,
            utilityName: userInfo.utilityName,
            utilityRate: rate,
            netMetering: userInfo.netMetering || STATES[userInfo.state]?.netMetering || "full",
            monthlyBillDollars: userInfo.monthlyBillDollars,
            weights: userInfo.weights,
          },
          existingProposals,
          findings,
        }),
      });
      if (!resp.ok) throw new Error("Analysis request failed");
      const data = await resp.json();
      setAiText(data.text || "Unable to generate analysis.");
    } catch (e) {
      console.warn(e);
      setAiText("We couldn't generate AI narrative right now. Review the critical analysis and comparison above.");
    }
    setAiLoading(false);
  };

  const download = () => {
    if (!results) return;
    const html = buildReportHtml({ results, aiText, userInfo });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    a.download = "solar-comparison-report.html";
    a.click();
  };

  const submitLead = async () => {
    const errs = validateLeadShape(lead, consent);
    if (Object.keys(errs).length) {
      setLeadErrors(errs);
      return;
    }
    if (!checkRateLimit()) {
      setLeadErrors({ form: "Too many submissions. Please wait a few minutes." });
      return;
    }
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      setLeadErrors({ form: "Service configuration error. Please try again later." });
      return;
    }
    setSubmitting(true);
    try {
      const cm = [];
      if (consent.email) cm.push("email");
      if (consent.sms) cm.push("sms");
      if (consent.calls) cm.push("calls");
      const consentRecords = cm.map((m) => ({
        method: m,
        text: CONSENT_TEXT[m],
        granted_at: new Date().toISOString(),
      }));

      await fetch(`${SUPABASE_URL}/rest/v1/solar_comparisons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          name: lead.name.trim(),
          email: lead.email.trim().toLowerCase(),
          phone: lead.phone ? sanitizePhone(lead.phone) : null,
          proposals: proposals.map((p) => ({
            name: p.name,
            systemSize: p.systemSize,
            estimatedKwh: p.estimatedKwh,
            batteryCapacity: p.batteryCapacity,
            loanRate: p.loanRate,
            totalPrice: p.totalPrice,
            panelBrand: p.panelBrand,
            inverterBrand: p.inverterBrand,
            orientation: p.orientation,
            tilt: p.tilt,
            warrantyYears: p.warrantyYears,
            financingType: p.financingType,
            productionGuarantee: p.productionGuarantee,
            incentivesIncluded: p.incentivesIncluded,
          })),
          user_info: {
            state: userInfo.state,
            zip: userInfo.zip,
            utilityName: userInfo.utilityName,
            utilityRate: userInfo.utilityRate,
            monthlyBillDollars: userInfo.monthlyBillDollars,
            netMetering: userInfo.netMetering,
            weights: userInfo.weights,
          },
          findings: results?.map((r) => ({ name: r.name, findings: r.findings })) || [],
          ai_analysis: aiText,
          calculation_results: results?.map((r) => ({ name: r.name, metrics: r.m, modeled: r.modeled })),
          input_method: method,
          consent_methods: cm.join(",") || null,
          consented_at: cm.length ? new Date().toISOString() : null,
          consent_text: cm.length ? JSON.stringify(consentRecords) : null,
          consent_url: window.location.href,
          user_agent: navigator.userAgent,
          source: "solar_comparator",
        }),
      });
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      setLeadErrors({ form: "Submission failed. Please try again." });
    }
    setSubmitting(false);
  };

  const stepperStep = submitted ? 5 : step;

  return (
    <div style={{ minHeight: "100vh", background: P.bg, fontFamily: "'DM Sans', sans-serif", color: P.text }}>
      <link href={FONT_LINK} rel="stylesheet" />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box}`}</style>

      <div style={{ background: `linear-gradient(135deg, ${P.accent} 0%, ${P.accentLight} 60%, #52B788 100%)`, padding: "32px 20px 24px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "clamp(22px,5vw,32px)", color: "#fff", margin: 0 }}>
          Solar Proposal Comparator
        </h1>
        <p style={{ fontFamily: "'DM Sans'", fontSize: "clamp(13px,3vw,15px)", color: "rgba(255,255,255,0.85)", margin: "8px auto 0", maxWidth: 460 }}>
          Upload your quotes. Get a deterministic audit, an honest take, and a directional Awen preview — no hype.
        </p>
      </div>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "24px 16px 50px" }}>
        <Steps step={stepperStep} />

        {step === 1 && (
          <Step1Method
            onManual={goManual}
            onPdfClick={() => fileRef.current?.click()}
            fileRef={fileRef}
            onPdfFiles={handlePdf}
            parsing={parsing}
          />
        )}

        {step === 2 && (
          <Step2Proposals
            proposals={proposals}
            setProposals={setProposals}
            method={method}
            userState={userInfo.state}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <Step3YourInfo
            userInfo={userInfo}
            setUserInfo={setUserInfo}
            onNext={runAnalysis}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && (
          <Step4Analysis
            results={results}
            userInfo={userInfo}
            aiText={aiText}
            aiLoading={aiLoading}
            onBack={() => setStep(3)}
            onDownload={download}
            submitted={submitted}
            lead={lead}
            setLead={setLead}
            consent={consent}
            setConsent={setConsent}
            leadErrors={leadErrors}
            setLeadErrors={setLeadErrors}
            submitting={submitting}
            onSubmitLead={submitLead}
            onShowPrivacy={() => setShowPrivacy(true)}
            onShowTerms={() => setShowTerms(true)}
          />
        )}
      </div>

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

      {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} palette={P} />}
      {showTerms && <TermsOfService onClose={() => setShowTerms(false)} palette={P} />}
    </div>
  );
}
