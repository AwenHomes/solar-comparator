import { P } from "../theme";

const LABELS = ["Choose Input", "Enter Details", "Your Info", "Compare", "Your Proposal"];

export default function Steps({ step }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        margin: "0 0 32px",
        flexWrap: "wrap",
      }}
    >
      {LABELS.map((l, i) => {
        const s = i + 1;
        const active = s === step;
        const done = s < step;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 58 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: done ? P.accent : active ? P.warm : P.neutral,
                  color: done || active ? "#fff" : P.muted,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'DM Sans'",
                  fontWeight: 600,
                  fontSize: 13,
                  boxShadow: active ? `0 0 0 4px ${P.warmLight}` : "none",
                }}
              >
                {done ? "✓" : s}
              </div>
              <span
                style={{
                  fontFamily: "'DM Sans'",
                  fontSize: 10,
                  fontWeight: active ? 600 : 400,
                  color: active ? P.text : P.muted,
                  marginTop: 5,
                  textAlign: "center",
                  maxWidth: 70,
                }}
              >
                {l}
              </span>
            </div>
            {i < LABELS.length - 1 && (
              <div
                style={{
                  width: 20,
                  height: 2,
                  background: done ? P.accent : P.border,
                  margin: "0 2px",
                  marginBottom: 18,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
