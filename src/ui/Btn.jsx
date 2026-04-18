import { P } from "../theme";

export default function Btn({ children, onClick, v = "primary", disabled, style: s, full, type = "button" }) {
  const base = {
    fontFamily: "'DM Sans'",
    fontWeight: 600,
    fontSize: 14,
    border: "none",
    borderRadius: 10,
    cursor: disabled ? "not-allowed" : "pointer",
    padding: "12px 24px",
    transition: "all 0.2s",
    opacity: disabled ? 0.5 : 1,
    width: full ? "100%" : undefined,
  };
  const vars = {
    primary: { background: P.accent, color: "#fff" },
    warm: { background: P.warm, color: "#fff" },
    outline: { background: "transparent", border: `2px solid ${P.accent}`, color: P.accent },
    ghost: { background: P.neutral, color: P.text },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...vars[v], ...s }}>
      {children}
    </button>
  );
}
