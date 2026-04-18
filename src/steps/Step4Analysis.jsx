import { useMemo } from "react";
import { P } from "../theme";
import Btn from "../ui/Btn";
import FindingBadge from "../ui/FindingBadge";
import Inp from "../ui/Inp";
import { escapeHtml, validateEmail, validatePhone } from "../security";
import { sortFindings } from "../calc/criticalAnalysis";
import { directionalBullets } from "../calc/directionalPreview";
import { STATES, STATE_LABELS } from "../data/states";

const CONSENT_TEXT = {
  email:
    "I consent to receive marketing emails from Awen Energy LLC about my solar comparison, custom proposals, and energy savings tips. You can unsubscribe anytime via the link in each email or by contacting privacy@awenenergy.com.",
  sms:
    "I consent to receive SMS text messages from Awen Energy LLC at the phone number provided regarding my solar comparison and custom proposal. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out. Consent is not a condition of purchase.",
  calls:
    "I consent to receive telephone calls, including calls made using an automatic telephone dialing system or prerecorded voice, from Awen Energy LLC at the phone number provided regarding my solar comparison and custom proposal. Consent is not a condition of purchase.",
};

function buildComparisonRows(results, userInfo) {
  const rate = parseFloat(userInfo?.utilityRate) || STATES[userInfo?.state]?.avgUtilityRate || 0.16;
  return [
    ["System Size", (r) => `${r.systemSize} kW`, null],
    ["Panel Brand", (r) => r.panelBrand || "—", null],
    ["Inverter", (r) => r.inverterBrand || "—", null],
    ["Orientation", (r) => (r.orientation !== "" && r.orientation != null ? `${r.orientation}°` : "—"), null],
    ["Tilt", (r) => (r.tilt !== "" && r.tilt != null ? `${r.tilt}°` : "—"), null],
    ["Panel Warranty", (r) => (r.warrantyYears ? `${r.warrantyYears} yr` : "—"), "high"],
    ["Production Guarantee", (r) => (r.productionGuarantee ? `${r.productionGuarantee}%` : "—"), "high"],
    ["Financing", (r) => (r.financingType ? r.financingType.toUpperCase() : "—"), null],
    ["Total Price", (r) => `$${Number(r.totalPrice).toLocaleString()}`, "low"],
    ["Price / Watt", (r) => `$${r.m.ppw}`, "low"],
    ["Annual Production", (r) => `${r.m.kwhYear.toLocaleString()} kWh`, "high"],
    ["Modeled Production", (r) => (r.modeled ? `${Math.round(r.modeled.annualKwh).toLocaleString()} kWh${r.modeled.estimate ? "*" : ""}` : "—"), null],
    ["Battery", (r) => (r.batteryCapacity ? `${r.batteryCapacity} kWh` : "None"), null],
    ["Loan Rate", (r) => (r.loanRate ? `${r.loanRate}%` : "N/A"), "low"],
    ["Monthly Payment", (r) => (r.m.monthly ? `$${r.m.monthly}` : "N/A"), null],
    ["Breakeven", (r) => `${r.m.breakeven} yr`, "low"],
    ["25-Year Savings", (r) => `$${(r.m.saves[25] || 0).toLocaleString()}`, "high"],
    ["Findings (severity)", (r) => {
      const counts = { high: 0, med: 0, low: 0 };
      (r.findings || []).forEach((f) => (counts[f.severity] = (counts[f.severity] || 0) + 1));
      return `${counts.high}H · ${counts.med}M · ${counts.low}L`;
    }, "low"],
  ].map((row) => ({ label: row[0], fn: row[1], hl: row[2] }));
}

function ProposalFindings({ r }) {
  const sorted = sortFindings(r.findings || []);
  if (!sorted.length) {
    return <p style={{ fontSize: 13, color: P.good, margin: 0 }}>No red flags detected in this proposal.</p>;
  }
  return (
    <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
      {sorted.map((f, i) => (
        <li key={i} style={{ borderTop: i ? `1px solid ${P.border}` : "none", padding: "10px 0", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <FindingBadge severity={f.severity} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'DM Sans'", fontWeight: 600, fontSize: 13, color: P.text }}>{f.label}</div>
            <div style={{ fontFamily: "'DM Sans'", fontSize: 12, color: P.muted, marginTop: 2 }}>
              <span>In this proposal: <b style={{ color: P.text }}>{f.cite}</b></span>
              {" · "}
              <span>Benchmark: <b style={{ color: P.text }}>{f.modeled}</b></span>
            </div>
            <div style={{ fontFamily: "'DM Sans'", fontSize: 12, color: P.muted, marginTop: 4, lineHeight: 1.5 }}>{f.detail}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Narrative({ aiText, aiLoading }) {
  return (
    <div style={{ background: P.goodPale, border: `1px solid ${P.accentPale}`, borderRadius: 14, padding: "22px 24px", marginTop: 20 }}>
      <h3 style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 17, margin: "0 0 10px", color: P.accent }}>Honest Take</h3>
      {aiLoading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 18, height: 18, border: `3px solid ${P.accentPale}`, borderTopColor: P.accent, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <span style={{ color: P.muted, fontSize: 13 }}>Our analyst is reviewing your proposals...</span>
        </div>
      ) : (
        <div style={{ fontSize: 13.5, lineHeight: 1.75, color: P.text, whiteSpace: "pre-wrap" }}>{aiText}</div>
      )}
    </div>
  );
}

function DirectionalPreview({ findingsByProposal }) {
  const bullets = useMemo(() => directionalBullets(findingsByProposal), [findingsByProposal]);
  return (
    <div style={{ marginTop: 18 }}>
      <h4 style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 16, margin: "0 0 10px", color: P.accent }}>
        Here's how Awen + Powur would address your audit
      </h4>
      <p style={{ fontSize: 12, color: P.muted, margin: "0 0 14px" }}>
        These are directional — your formal proposal (sizing, equipment, pricing, incentives, ROI) is built on the
        Powur platform and sent to you within 24 hours.
      </p>
      <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ padding: "12px 0", borderTop: i ? `1px solid ${P.border}` : "none" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <FindingBadge severity={b.severity} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: P.text }}>Finding: {b.finding}</div>
                <div style={{ fontSize: 13, color: P.muted, marginTop: 4, lineHeight: 1.55 }}>
                  <b style={{ color: P.accent }}>Awen response:</b> {b.response}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LeadForm({ lead, setLead, consent, setConsent, errors, setErrors, submitting, onSubmit, onShowPrivacy, onShowTerms }) {
  return (
    <>
      <Inp
        label="Your Name"
        value={lead.name}
        onChange={(v) => { setLead({ ...lead, name: v }); setErrors({ ...errors, name: undefined }); }}
        placeholder="First and last name"
        req
      />
      {errors.name && <p style={{ color: P.danger, fontSize: 11, margin: "-10px 0 8px" }}>{errors.name}</p>}
      <Inp
        label="Email"
        value={lead.email}
        onChange={(v) => { setLead({ ...lead, email: v }); setErrors({ ...errors, email: undefined }); }}
        placeholder="you@email.com"
        type="email"
        req
      />
      {errors.email && <p style={{ color: P.danger, fontSize: 11, margin: "-10px 0 8px" }}>{errors.email}</p>}
      <Inp
        label="Phone"
        value={lead.phone}
        onChange={(v) => { setLead({ ...lead, phone: v }); setErrors({ ...errors, phone: undefined }); }}
        placeholder="(555) 123-4567 (optional)"
        type="tel"
      />
      {errors.phone && <p style={{ color: P.danger, fontSize: 11, margin: "-10px 0 8px" }}>{errors.phone}</p>}

      <div style={{ margin: "18px 0 6px", padding: 14, background: P.neutral, borderRadius: 10 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: P.text, margin: "0 0 10px", lineHeight: 1.4 }}>
          Communication Preferences (optional)
        </p>
        {[
          { k: "email", t: CONSENT_TEXT.email },
          { k: "sms", t: CONSENT_TEXT.sms },
          { k: "calls", t: CONSENT_TEXT.calls },
        ].map((c) => (
          <label key={c.k} style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 10, cursor: "pointer", fontSize: 11, lineHeight: 1.5 }}>
            <input
              type="checkbox"
              checked={consent[c.k]}
              onChange={(e) => setConsent({ ...consent, [c.k]: e.target.checked })}
              style={{ marginTop: 2, flexShrink: 0 }}
            />
            <span style={{ color: "#374151" }}>{c.t}</span>
          </label>
        ))}
      </div>

      <p style={{ fontSize: 10, color: P.muted, lineHeight: 1.6, margin: "6px 0 14px" }}>
        By submitting, you agree to our{" "}
        <span onClick={onShowPrivacy} style={{ color: P.accent, cursor: "pointer", textDecoration: "underline" }}>Privacy Policy</span>
        {" "}and{" "}
        <span onClick={onShowTerms} style={{ color: P.accent, cursor: "pointer", textDecoration: "underline" }}>Terms of Service</span>.
        {" "}Your information is never sold.{" "}
        For data requests: <a href="mailto:privacy@awenenergy.com" style={{ color: P.accent }}>privacy@awenenergy.com</a>. Awen Energy LLC.
      </p>

      {errors.form && <p style={{ color: P.danger, fontSize: 12, textAlign: "center", margin: "0 0 10px" }}>{errors.form}</p>}
      <Btn v="warm" full onClick={onSubmit} disabled={!lead.name || !lead.email || submitting}>
        {submitting ? "Sending..." : "Unlock the Awen preview + request my formal proposal"}
      </Btn>
    </>
  );
}

export default function Step4Analysis(props) {
  const {
    results,
    userInfo,
    aiText,
    aiLoading,
    onBack,
    onDownload,
    submitted,
    lead,
    setLead,
    consent,
    setConsent,
    leadErrors,
    setLeadErrors,
    submitting,
    onSubmitLead,
    onShowPrivacy,
    onShowTerms,
  } = props;

  if (!results) return null;

  const rows = buildComparisonRows(results, userInfo);
  const findingsByProposal = results.map((r) => ({ proposalName: r.name, findings: r.findings || [] }));
  const anyModeledEstimate = results.some((r) => r.modeled?.estimate);

  return (
    <div>
      <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 20, margin: "0 0 4px", textAlign: "center" }}>
        Your Proposal Comparison
      </h2>
      <p style={{ color: P.muted, fontSize: 13, margin: "0 0 18px", textAlign: "center" }}>
        {userInfo?.state ? `Analyzed for ${STATE_LABELS[userInfo.state]}${userInfo.zip ? ` · ZIP ${userInfo.zip}` : ""}` : "Side-by-side breakdown"}
      </p>

      {/* Table */}
      <div style={{ background: P.card, borderRadius: 14, border: `1px solid ${P.border}`, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans'", fontSize: 13 }}>
            <thead>
              <tr style={{ background: P.accent, color: "#fff" }}>
                <th style={{ padding: "11px 14px", textAlign: "left", fontWeight: 600 }}>Metric</th>
                {results.map((r, i) => (
                  <th key={i} style={{ padding: "11px 14px", textAlign: "center", fontWeight: 600 }}>{r.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => {
                const vals = results.map((r) => {
                  const s = row.fn(r);
                  return { display: s, num: parseFloat(String(s).replace(/[$,%kWhyr* ]/g, "")) };
                });
                const nums = vals.map((v) => v.num).filter((n) => !isNaN(n) && n > 0);
                const best = row.hl === "high" ? Math.max(...nums) : row.hl === "low" ? Math.min(...nums) : null;
                return (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? "#fff" : P.neutral }}>
                    <td style={{ padding: "9px 14px", fontWeight: 500, color: P.muted, fontSize: 12, whiteSpace: "nowrap" }}>{row.label}</td>
                    {vals.map((v, vi) => {
                      const isBest = best !== null && !isNaN(v.num) && v.num === best && nums.length > 1;
                      return (
                        <td
                          key={vi}
                          style={{
                            padding: "9px 14px",
                            textAlign: "center",
                            fontWeight: isBest ? 700 : 400,
                            color: isBest ? P.good : P.text,
                            background: isBest ? P.goodPale : "transparent",
                          }}
                        >
                          {v.display}{isBest ? " ✓" : ""}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {anyModeledEstimate && (
          <p style={{ fontSize: 11, color: P.muted, padding: "8px 14px", margin: 0, borderTop: `1px solid ${P.border}`, background: P.neutral }}>
            * Modeled production marked with an asterisk uses a state-average fallback (PVWatts unavailable).
          </p>
        )}
      </div>

      {/* Critical Analysis */}
      <div style={{ marginTop: 22 }}>
        <h3 style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 17, margin: "0 0 10px" }}>Critical Analysis</h3>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {results.map((r, i) => (
            <div
              key={i}
              style={{
                flex: "1 1 300px",
                background: P.card,
                border: `1px solid ${P.border}`,
                borderRadius: 14,
                padding: "18px 20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <h4 style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 15, margin: "0 0 10px", color: P.accent }}>
                {r.name}
              </h4>
              <ProposalFindings r={r} />
            </div>
          ))}
        </div>
      </div>

      {/* AI narrative */}
      <Narrative aiText={aiText} aiLoading={aiLoading} />

      {/* Gated Awen preview */}
      <div
        style={{
          background: submitted ? P.goodPale : P.warmLight,
          border: `2px solid ${submitted ? P.accent : P.warm}`,
          borderRadius: 16,
          padding: "24px 24px",
          marginTop: 22,
        }}
      >
        {!submitted ? (
          <>
            <h3 style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 19, margin: "0 0 6px", color: P.warm }}>
              Want to see how Awen + Powur would address these findings?
            </h3>
            <p style={{ fontSize: 13.5, color: P.text, lineHeight: 1.65, margin: "0 0 16px" }}>
              We'll build you a formal third proposal on the Powur platform —
              right-sized to your usage, properly tilted for your latitude,
              warranty-backed, and with every incentive itemized. No pressure,
              no obligation, sent within 24 hours.
            </p>
            <div style={{ maxWidth: 440 }}>
              <LeadForm
                lead={lead}
                setLead={setLead}
                consent={consent}
                setConsent={setConsent}
                errors={leadErrors}
                setErrors={setLeadErrors}
                submitting={submitting}
                onSubmit={onSubmitLead}
                onShowPrivacy={onShowPrivacy}
                onShowTerms={onShowTerms}
              />
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 28 }}>🎉</span>
              <h3 style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 19, margin: 0, color: P.accent }}>
                You're all set — here's the preview
              </h3>
            </div>
            <p style={{ fontSize: 13.5, color: P.text, lineHeight: 1.65, margin: "0 0 6px" }}>
              We've received your comparison. Our team will build your formal
              proposal on the Powur platform and reach out within 24 hours.
            </p>
            <DirectionalPreview findingsByProposal={findingsByProposal} />
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
        <Btn v="ghost" onClick={onBack}>← Edit</Btn>
        <Btn v="outline" onClick={onDownload} disabled={aiLoading}>Download Report</Btn>
      </div>
    </div>
  );
}

// HTML report download — exported so App.jsx can wire it without circular imports.
export function buildReportHtml({ results, aiText, userInfo }) {
  const stateLabel = userInfo?.state ? STATE_LABELS[userInfo.state] : "";
  const findingsBlock = results
    .map(
      (r) => `
      <div style="margin: 18px 0;">
        <h3 style="color:#2D6A4F;margin:0 0 8px">${escapeHtml(r.name)}</h3>
        <p><b>System:</b> ${escapeHtml(r.systemSize)} kW &nbsp;·&nbsp;
           <b>Price:</b> $${escapeHtml(Number(r.totalPrice).toLocaleString())} &nbsp;·&nbsp;
           <b>$/W:</b> $${escapeHtml(r.m.ppw)} &nbsp;·&nbsp;
           <b>Claimed:</b> ${escapeHtml(r.m.kwhYear.toLocaleString())} kWh &nbsp;·&nbsp;
           <b>Modeled:</b> ${r.modeled ? escapeHtml(Math.round(r.modeled.annualKwh).toLocaleString()) + " kWh" : "—"}</p>
        ${
          (r.findings || []).length
            ? `<ul>${(r.findings || [])
                .map(
                  (f) =>
                    `<li><b>[${escapeHtml(f.severity.toUpperCase())}] ${escapeHtml(f.label)}</b> — cited: ${escapeHtml(f.cite)}; benchmark: ${escapeHtml(f.modeled)}. ${escapeHtml(f.detail)}</li>`,
                )
                .join("")}</ul>`
            : "<p><i>No red flags detected in this proposal.</i></p>"
        }
      </div>`,
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Solar Comparison — Awen Energy</title>
    <style>body{font-family:system-ui;max-width:820px;margin:0 auto;padding:30px;color:#1b1b1b}h1{color:#2D6A4F}h2{color:#E8985E;margin-top:28px}p{line-height:1.6;margin:4px 0}ul{line-height:1.65}.footer{margin-top:40px;padding-top:20px;border-top:2px solid #2D6A4F;font-size:13px;color:#888}</style></head><body>
    <h1>Your Solar Proposal Audit</h1>
    <p style="color:#666">Generated by Awen Energy — ${escapeHtml(new Date().toLocaleDateString())}${stateLabel ? " · " + escapeHtml(stateLabel) : ""}</p>
    <h2>Critical Analysis</h2>
    ${findingsBlock}
    <h2>Honest Take</h2>
    <div style="background:#f0fdf4;padding:18px;border-radius:10px;line-height:1.7">${escapeHtml(aiText || "Not available.").replace(/\n/g, "<br>")}</div>
    <div class="footer"><p><b>Awen Energy</b> — Helping homeowners take control of their power.</p><p>Want a free, honest third proposal? Visit awenenergy.com</p></div>
    </body></html>`;
}

export function validateLeadShape(lead, consent) {
  const errors = {};
  if (!lead.name || lead.name.trim().length < 1) errors.name = "Name is required.";
  else if (lead.name.length > 100) errors.name = "Name must be under 100 characters.";
  if (!lead.email) errors.email = "Email is required.";
  else if (!validateEmail(lead.email)) errors.email = "Please enter a valid email address.";
  if (lead.phone && !validatePhone(lead.phone)) errors.phone = "Please enter a valid US phone number (10 digits).";
  if ((consent.sms || consent.calls) && !lead.phone) errors.phone = "Phone number is required when opting into SMS or calls.";
  return errors;
}

export { CONSENT_TEXT };
