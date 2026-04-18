import { P } from "../theme";

export default function Slider({ label, value, onChange, hint }) {
  const pct = Math.round(value * 100);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <label style={{ fontFamily: "'DM Sans'", fontSize: 13, fontWeight: 500, color: P.text }}>{label}</label>
        <span style={{ fontFamily: "'DM Sans'", fontSize: 12, color: P.accent, fontWeight: 600 }}>{pct}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: P.accent }}
      />
      {hint && (
        <p style={{ fontSize: 11, color: P.muted, margin: "2px 0 0", lineHeight: 1.4 }}>{hint}</p>
      )}
    </div>
  );
}
