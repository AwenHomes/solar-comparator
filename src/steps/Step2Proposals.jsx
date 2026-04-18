import { P } from "../theme";
import Inp from "../ui/Inp";
import Btn from "../ui/Btn";
import { blank } from "../pdf";
import { STATES, STATE_LABELS } from "../data/states";

const FINANCING_OPTIONS = [
  { value: "", label: "—" },
  { value: "cash", label: "Cash" },
  { value: "loan", label: "Loan" },
  { value: "lease", label: "Lease" },
  { value: "ppa", label: "PPA" },
];

// Shared with step 4 so the incentive checklist reflects the user's state.
export function availableIncentivesForState(stateCode) {
  const base = [{ id: "federal_itc", name: "Federal 30% ITC" }];
  if (stateCode && STATES[stateCode]?.incentives) {
    for (const inc of STATES[stateCode].incentives) base.push({ id: inc.id, name: inc.name });
  }
  return base;
}

export default function Step2Proposals({ proposals, setProposals, method, userState, onNext, onBack }) {
  const upd = (i, k, v) => {
    const c = [...proposals];
    c[i] = { ...c[i], [k]: v };
    setProposals(c);
  };

  const toggleIncentive = (i, incentiveId) => {
    const c = [...proposals];
    const current = new Set(c[i].incentivesIncluded || []);
    if (current.has(incentiveId)) current.delete(incentiveId);
    else current.add(incentiveId);
    c[i] = { ...c[i], incentivesIncluded: [...current] };
    setProposals(c);
  };

  const add = () => proposals.length < 3 && setProposals([...proposals, blank(`Proposal ${proposals.length + 1}`)]);
  const rem = (i) => proposals.length > 1 && setProposals(proposals.filter((_, j) => j !== i));

  const valid = () =>
    proposals.every((p) => parseFloat(p.systemSize) > 0 && parseFloat(p.totalPrice) > 0);

  const incentiveOptions = availableIncentivesForState(userState);

  return (
    <div>
      <h2
        style={{
          fontFamily: "'Fraunces',serif",
          fontWeight: 600,
          fontSize: 20,
          margin: "0 0 4px",
          textAlign: "center",
        }}
      >
        {method === "pdf" ? "Review & Edit Extracted Data" : "Enter Your Proposal Details"}
      </h2>
      <p style={{ color: P.muted, fontSize: 13, margin: "0 0 20px", textAlign: "center" }}>
        {method === "pdf"
          ? "We pulled what we could. Please review and correct any numbers."
          : "System size and total price are required. Extra fields sharpen the audit — leave any you're unsure of blank."}
      </p>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {proposals.map((p, i) => (
          <div
            key={i}
            style={{
              background: P.card,
              borderRadius: 14,
              border: `1px solid ${P.border}`,
              padding: "22px 20px",
              flex: "1 1 240px",
              minWidth: 240,
              position: "relative",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            {proposals.length > 1 && (
              <button
                onClick={() => rem(i)}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "#FEF2F2",
                  border: "none",
                  borderRadius: "50%",
                  width: 24,
                  height: 24,
                  cursor: "pointer",
                  fontSize: 12,
                  color: P.danger,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            )}
            <input
              value={p.name}
              onChange={(e) => upd(i, "name", e.target.value)}
              placeholder={`Proposal ${i + 1}`}
              style={{
                fontFamily: "'Fraunces',serif",
                fontWeight: 600,
                fontSize: 16,
                border: "none",
                background: "transparent",
                color: P.accent,
                width: "calc(100% - 28px)",
                marginBottom: 14,
                outline: "none",
              }}
            />

            <Inp label="System Size" value={p.systemSize} onChange={(v) => upd(i, "systemSize", v)} placeholder="8.5" suf="kW" req numeric />
            <Inp label="Est. Annual Production" value={p.estimatedKwh} onChange={(v) => upd(i, "estimatedKwh", v)} placeholder="12750" suf="kWh" numeric maxDecimals={0} />
            <Inp label="Battery Capacity" value={p.batteryCapacity} onChange={(v) => upd(i, "batteryCapacity", v)} placeholder="13.5" suf="kWh" numeric />
            <Inp label="Total System Price" value={p.totalPrice} onChange={(v) => upd(i, "totalPrice", v)} placeholder="32000" pre="$" req numeric maxDecimals={0} />

            <div style={{ height: 1, background: P.border, margin: "12px 0" }} />
            <p style={{ fontSize: 11, fontWeight: 600, color: P.muted, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Optional — sharpens the audit
            </p>

            <Inp label="Panel Brand" value={p.panelBrand} onChange={(v) => upd(i, "panelBrand", v)} placeholder="e.g. REC, Q CELLS" />
            <Inp label="Inverter Brand" value={p.inverterBrand} onChange={(v) => upd(i, "inverterBrand", v)} placeholder="e.g. Enphase, SolarEdge" />
            <Inp label="Panel Warranty" value={p.warrantyYears} onChange={(v) => upd(i, "warrantyYears", v)} placeholder="25" suf="yr" numeric maxDecimals={0} />
            <Inp label="Array Orientation (azimuth)" value={p.orientation} onChange={(v) => upd(i, "orientation", v)} placeholder="180 = south" suf="°" numeric maxDecimals={0} hint="North=0, East=90, South=180, West=270" />
            <Inp label="Array Tilt" value={p.tilt} onChange={(v) => upd(i, "tilt", v)} placeholder="matches latitude" suf="°" numeric maxDecimals={0} />
            <Inp label="Loan Interest Rate" value={p.loanRate} onChange={(v) => upd(i, "loanRate", v)} placeholder="6.99" suf="%" numeric />
            <Inp label="Production Guarantee" value={p.productionGuarantee} onChange={(v) => upd(i, "productionGuarantee", v)} placeholder="90" suf="%" numeric maxDecimals={0} />

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 500, color: P.muted, display: "block", marginBottom: 4 }}>
                Financing Type
              </label>
              <select
                value={p.financingType}
                onChange={(e) => upd(i, "financingType", e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  fontFamily: "'DM Sans'",
                  fontSize: 14,
                  border: `1.5px solid ${P.border}`,
                  borderRadius: 8,
                  outline: "none",
                  background: P.bg,
                  color: P.text,
                  boxSizing: "border-box",
                }}
              >
                {FINANCING_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 6 }}>
              <label style={{ fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 500, color: P.muted, display: "block", marginBottom: 6 }}>
                Incentives reflected in price {userState ? `(${STATE_LABELS[userState]})` : "(set state on next step for more)"}
              </label>
              {incentiveOptions.map((inc) => {
                const checked = (p.incentivesIncluded || []).includes(inc.id);
                return (
                  <label key={inc.id} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12, marginBottom: 4, cursor: "pointer", color: P.text, lineHeight: 1.4 }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleIncentive(i, inc.id)} style={{ marginTop: 2 }} />
                    <span>{inc.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {proposals.length < 3 && (
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <Btn v="ghost" onClick={add}>+ Add Another Proposal</Btn>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24 }}>
        <Btn v="ghost" onClick={onBack}>← Back</Btn>
        <Btn v="primary" onClick={onNext} disabled={!valid()}>Next: Your Info →</Btn>
      </div>
      {!valid() && (
        <p style={{ textAlign: "center", color: P.muted, fontSize: 12, marginTop: 8 }}>
          Each proposal needs system size + price.
        </p>
      )}
    </div>
  );
}
