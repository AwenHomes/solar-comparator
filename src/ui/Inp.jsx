import { P } from "../theme";
import { filterNumeric } from "../security";

export default function Inp({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  pre,
  suf,
  req,
  numeric,
  maxDecimals = 2,
  hint,
}) {
  const handleChange = (e) => {
    let v = e.target.value;
    if (numeric) v = filterNumeric(v, { allowDecimal: maxDecimals > 0, maxDecimalPlaces: maxDecimals });
    onChange(v);
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          fontFamily: "'DM Sans'",
          fontSize: 12,
          fontWeight: 500,
          color: P.muted,
          display: "block",
          marginBottom: 4,
        }}
      >
        {label}
        {req && <span style={{ color: P.danger }}> *</span>}
      </label>
      <div style={{ position: "relative" }}>
        {pre && (
          <span
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 13,
              color: P.muted,
            }}
          >
            {pre}
          </span>
        )}
        <input
          type={numeric ? "text" : type}
          inputMode={numeric ? "decimal" : undefined}
          pattern={numeric ? "[0-9]*\\.?[0-9]*" : undefined}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: `9px ${suf ? 40 : 10}px 9px ${pre ? 24 : 10}px`,
            fontFamily: "'DM Sans'",
            fontSize: 14,
            border: `1.5px solid ${P.border}`,
            borderRadius: 8,
            outline: "none",
            background: P.bg,
            color: P.text,
            boxSizing: "border-box",
          }}
          onFocus={(e) => (e.target.style.borderColor = P.accent)}
          onBlur={(e) => (e.target.style.borderColor = P.border)}
        />
        {suf && (
          <span
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 12,
              color: P.muted,
            }}
          >
            {suf}
          </span>
        )}
      </div>
      {hint && (
        <p style={{ fontSize: 11, color: P.muted, margin: "4px 0 0", lineHeight: 1.4 }}>{hint}</p>
      )}
    </div>
  );
}
