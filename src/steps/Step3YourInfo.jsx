import { useMemo } from "react";
import { P } from "../theme";
import Inp from "../ui/Inp";
import Btn from "../ui/Btn";
import Slider from "../ui/Slider";
import { STATE_CODES, STATE_LABELS, STATES } from "../data/states";
import { resolveZip } from "../data/zipCentroids";
import { validateZip } from "../security";

const NEM_OPTIONS = [
  { value: "", label: "Use my state's default" },
  { value: "full", label: "Full retail (1:1 net metering)" },
  { value: "avoided", label: "Avoided cost / post-NEM" },
  { value: "none", label: "No export credit" },
];

export default function Step3YourInfo({ userInfo, setUserInfo, onNext, onBack }) {
  const upd = (k, v) => setUserInfo({ ...userInfo, [k]: v });

  const stateData = userInfo.state ? STATES[userInfo.state] : null;
  const approx = useMemo(
    () => resolveZip(userInfo.zip, userInfo.state),
    [userInfo.zip, userInfo.state],
  );

  const zipValid = !userInfo.zip || validateZip(userInfo.zip);
  const canNext = !!userInfo.state && zipValid;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 20, margin: "0 0 4px", textAlign: "center" }}>
        Tell us about your place
      </h2>
      <p style={{ color: P.muted, fontSize: 13, margin: "0 0 20px", textAlign: "center" }}>
        Location and priorities let us run the audit against your real utility,
        sun hours, and net-metering policy.
      </p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 320px", background: P.card, borderRadius: 14, border: `1px solid ${P.border}`, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <h3 style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 15, margin: "0 0 12px" }}>Location & utility</h3>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 500, color: P.muted, display: "block", marginBottom: 4 }}>
              State <span style={{ color: P.danger }}>*</span>
            </label>
            <select
              value={userInfo.state || ""}
              onChange={(e) => upd("state", e.target.value)}
              style={{
                width: "100%",
                padding: "9px 10px",
                fontFamily: "'DM Sans'",
                fontSize: 14,
                border: `1.5px solid ${P.border}`,
                borderRadius: 8,
                background: P.bg,
                color: P.text,
                outline: "none",
              }}
            >
              <option value="">Select a state…</option>
              {STATE_CODES.map((code) => (
                <option key={code} value={code}>{STATE_LABELS[code]}</option>
              ))}
            </select>
          </div>

          <Inp
            label="ZIP Code"
            value={userInfo.zip || ""}
            onChange={(v) => upd("zip", v.replace(/\D/g, "").slice(0, 5))}
            placeholder="92101"
            hint={approx ? `Approx. ${approx[2]} — lat ${approx[0].toFixed(2)}, long ${approx[1].toFixed(2)}` : undefined}
          />
          {!zipValid && <p style={{ color: P.danger, fontSize: 11, margin: "-10px 0 10px" }}>ZIP must be 5 digits.</p>}

          <Inp label="Utility Name" value={userInfo.utilityName || ""} onChange={(v) => upd("utilityName", v)} placeholder="e.g. SDG&E, PG&E, ConEd" />
          <Inp
            label="Your Utility Rate"
            value={userInfo.utilityRate || ""}
            onChange={(v) => upd("utilityRate", v)}
            placeholder={stateData ? String(stateData.avgUtilityRate) : "0.16"}
            pre="$"
            suf="/kWh"
            numeric
            maxDecimals={3}
            hint={stateData ? `State typical: $${stateData.avgUtilityRate.toFixed(2)}/kWh` : "We'll use the state average if you leave this blank."}
          />
          <Inp
            label="Current Monthly Bill"
            value={userInfo.monthlyBillDollars || ""}
            onChange={(v) => upd("monthlyBillDollars", v)}
            placeholder="225"
            pre="$"
            numeric
            maxDecimals={0}
            hint="Optional — helps us check if the proposals are sized to your usage."
          />

          <div style={{ marginBottom: 6 }}>
            <label style={{ fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 500, color: P.muted, display: "block", marginBottom: 4 }}>
              Net-metering policy
            </label>
            <select
              value={userInfo.netMetering || ""}
              onChange={(e) => upd("netMetering", e.target.value)}
              style={{
                width: "100%",
                padding: "9px 10px",
                fontFamily: "'DM Sans'",
                fontSize: 14,
                border: `1.5px solid ${P.border}`,
                borderRadius: 8,
                background: P.bg,
                color: P.text,
                outline: "none",
              }}
            >
              {NEM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {stateData && !userInfo.netMetering && (
              <p style={{ fontSize: 11, color: P.muted, margin: "4px 0 0" }}>
                State default: {stateData.netMetering === "full" ? "full retail" : stateData.netMetering === "avoided" ? "avoided cost (post-NEM)" : "no export credit"}
              </p>
            )}
          </div>
        </div>

        <div style={{ flex: "1 1 320px", background: P.card, borderRadius: 14, border: `1px solid ${P.border}`, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <h3 style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 15, margin: "0 0 4px" }}>What matters to you?</h3>
          <p style={{ fontSize: 12, color: P.muted, margin: "0 0 16px" }}>
            Drag each slider to how much that priority matters. We weight the final
            recommendation and Powur build accordingly.
          </p>

          <Slider label="Cost Savings" value={userInfo.weights.cost} onChange={(v) => upd("weights", { ...userInfo.weights, cost: v })} hint="Lowest 25-year net cost, even if payback takes longer." />
          <Slider label="Fast Payback" value={userInfo.weights.payback} onChange={(v) => upd("weights", { ...userInfo.weights, payback: v })} hint="Recover the investment as quickly as possible." />
          <Slider label="Long-Term Reliability" value={userInfo.weights.reliability} onChange={(v) => upd("weights", { ...userInfo.weights, reliability: v })} hint="Tier-1 panels, 25-yr warranties, trusted inverters." />
          <Slider label="Sustainability" value={userInfo.weights.sustainability} onChange={(v) => upd("weights", { ...userInfo.weights, sustainability: v })} hint="Maximize clean generation; battery-ready by default." />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24 }}>
        <Btn v="ghost" onClick={onBack}>← Back</Btn>
        <Btn v="primary" onClick={onNext} disabled={!canNext}>Run the Analysis →</Btn>
      </div>
      {!canNext && (
        <p style={{ textAlign: "center", color: P.muted, fontSize: 12, marginTop: 8 }}>
          State is required; ZIP is optional but sharpens the lat/long check.
        </p>
      )}
    </div>
  );
}
