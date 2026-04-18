import { P } from "../theme";
import Btn from "../ui/Btn";

export default function Step1Method({ onManual, onPdfClick, fileRef, onPdfFiles, parsing }) {
  const options = [
    {
      icon: "✍️",
      title: "Type It In",
      desc: "Enter the key numbers from your proposals manually. Takes about 2 minutes.",
      btn: "Manual Entry",
      primary: true,
      act: onManual,
    },
    {
      icon: "📄",
      title: "Upload PDFs",
      desc: "Upload your proposal PDFs and we'll try to extract the key numbers for you.",
      btn: "Upload Files",
      primary: false,
      act: onPdfClick,
    },
  ];

  return (
    <div style={{ textAlign: "center" }}>
      <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 22, margin: "0 0 6px" }}>
        How would you like to enter your proposals?
      </h2>
      <p style={{ color: P.muted, fontSize: 14, margin: "0 0 28px" }}>
        Compare up to 3 solar proposals you've received.
      </p>
      <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
        {options.map((opt, i) => (
          <div
            key={i}
            onClick={opt.act}
            style={{
              background: P.card,
              borderRadius: 16,
              border: `1px solid ${P.border}`,
              padding: 28,
              flex: "1 1 240px",
              maxWidth: 300,
              cursor: "pointer",
              textAlign: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              transition: "all 0.2s",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>{opt.icon}</div>
            <h3 style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 18, margin: "0 0 6px" }}>
              {opt.title}
            </h3>
            <p style={{ color: P.muted, fontSize: 13, lineHeight: 1.5 }}>{opt.desc}</p>
            <Btn
              v={opt.primary ? "primary" : "outline"}
              style={{ marginTop: 14, width: "100%" }}
              onClick={(e) => {
                e.stopPropagation();
                opt.act();
              }}
            >
              {opt.btn}
            </Btn>
          </div>
        ))}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf"
        multiple
        style={{ display: "none" }}
        onChange={(e) => onPdfFiles(e.target.files)}
      />
      {parsing && (
        <div
          style={{
            marginTop: 20,
            padding: 14,
            background: P.warmLight,
            borderRadius: 10,
            color: P.warm,
            fontSize: 14,
          }}
        >
          Reading your PDFs...
        </div>
      )}
    </div>
  );
}
