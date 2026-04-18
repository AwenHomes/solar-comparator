import { P } from "../theme";

const COLORS = {
  high: { bg: P.dangerPale, fg: P.danger, label: "High" },
  med: { bg: P.warningPale, fg: P.warning, label: "Medium" },
  low: { bg: P.goodPale, fg: P.good, label: "Low" },
};

export default function FindingBadge({ severity }) {
  const c = COLORS[severity] || COLORS.low;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        fontFamily: "'DM Sans'",
        fontSize: 10,
        fontWeight: 600,
        background: c.bg,
        color: c.fg,
        borderRadius: 999,
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}
    >
      {c.label}
    </span>
  );
}
