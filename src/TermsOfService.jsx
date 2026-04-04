export default function TermsOfService({ onClose, palette: P }) {
  const overlay = {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex",
    alignItems: "center", justifyContent: "center", padding: 20,
  };
  const modal = {
    background: "#fff", borderRadius: 16, maxWidth: 720, width: "100%",
    maxHeight: "85vh", overflow: "auto", padding: "32px 28px",
    fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.7,
    color: "#1B1B1B", position: "relative",
  };
  const h2 = { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 20, color: P.accent, margin: "24px 0 8px" };
  const p = { margin: "8px 0", color: "#374151" };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 16, background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6B7280" }}>&times;</button>

        <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 24, color: P.accent, margin: "0 0 4px" }}>Terms of Service</h1>
        <p style={{ ...p, fontSize: 12, color: "#9CA3AF" }}>Last Updated: April 4, 2026</p>
        <p style={p}>These Terms of Service ("Terms") govern your use of the Solar Proposal Comparator tool ("Service") operated by Awen Energy LLC ("we," "us," or "our"). By using the Service, you agree to be bound by these Terms.</p>

        <h2 style={h2}>1. Service Description</h2>
        <p style={p}>The Solar Proposal Comparator is a free tool that allows homeowners to compare solar energy proposals side-by-side. The Service includes:</p>
        <ul style={{ paddingLeft: 20, ...p }}>
          <li>Manual entry or PDF upload of solar proposal details</li>
          <li>Automated calculations comparing cost, savings, and system metrics</li>
          <li>AI-powered analysis and recommendations</li>
          <li>Option to request a custom proposal from Awen Energy LLC</li>
        </ul>

        <h2 style={h2}>2. Disclaimer of Warranties</h2>
        <p style={p}><strong>The Service is provided "AS IS" and "AS AVAILABLE" for informational purposes only.</strong> We make no warranties, express or implied, regarding:</p>
        <ul style={{ paddingLeft: 20, ...p }}>
          <li>The accuracy, completeness, or reliability of calculations, estimates, or AI-generated analysis</li>
          <li>The suitability of any solar proposal or system for your specific circumstances</li>
          <li>The availability or uninterrupted operation of the Service</li>
        </ul>
        <p style={p}>All figures, projections, and analyses are estimates based on general assumptions (e.g., 0.5% annual panel degradation, 3.5% utility rate escalation, $0.16/kWh average utility rate). Actual results will vary based on your location, utility provider, roof conditions, and other factors. <strong>Do not make purchasing decisions based solely on the output of this tool.</strong></p>

        <h2 style={h2}>3. User Responsibilities</h2>
        <p style={p}>By using the Service, you agree to:</p>
        <ul style={{ paddingLeft: 20, ...p }}>
          <li>Provide accurate information when entering proposal details or personal data</li>
          <li>Use the Service only for lawful, personal, non-commercial comparison purposes</li>
          <li>Not attempt to reverse engineer, scrape, or misuse the Service</li>
          <li>Not submit false, misleading, or malicious content</li>
          <li>Not use automated bots or scripts to interact with the Service</li>
        </ul>

        <h2 style={h2}>4. Personal Information & Consent</h2>
        <p style={p}>If you choose to submit personal information (name, email, phone), your data will be handled in accordance with our <strong>Privacy Policy</strong>. Communication consent is separate from use of the comparison tool — you are not required to consent to communications to use the free comparison features.</p>

        <h2 style={h2}>5. Intellectual Property</h2>
        <p style={p}>The Service, including its design, code, and content, is owned by Awen Energy LLC. You may download and share your personal comparison reports for non-commercial use. You may not reproduce, distribute, or create derivative works from the Service itself.</p>

        <h2 style={h2}>6. Limitation of Liability</h2>
        <p style={p}>To the maximum extent permitted by applicable law, Awen Energy LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from:</p>
        <ul style={{ paddingLeft: 20, ...p }}>
          <li>Your use or inability to use the Service</li>
          <li>Any errors, inaccuracies, or omissions in calculations or AI analysis</li>
          <li>Any purchasing decisions made based on the Service's output</li>
          <li>Unauthorized access to or alteration of your data</li>
        </ul>
        <p style={p}>Our total liability for any claims arising from the Service shall not exceed $100 USD.</p>

        <h2 style={h2}>7. Indemnification</h2>
        <p style={p}>You agree to indemnify and hold harmless Awen Energy LLC and its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.</p>

        <h2 style={h2}>8. Modifications</h2>
        <p style={p}>We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the modified Terms. Material changes will be indicated by updating the "Last Updated" date.</p>

        <h2 style={h2}>9. Termination</h2>
        <p style={p}>We may suspend or terminate access to the Service at any time, for any reason, without prior notice. Upon termination, your right to use the Service ceases immediately.</p>

        <h2 style={h2}>10. Governing Law</h2>
        <p style={p}>These Terms shall be governed by and construed in accordance with the laws of the State of Texas, United States, without regard to conflict of law provisions. Any disputes shall be resolved in the courts located in Texas.</p>

        <h2 style={h2}>11. Severability</h2>
        <p style={p}>If any provision of these Terms is found to be unenforceable, the remaining provisions shall remain in full force and effect.</p>

        <h2 style={h2}>12. Contact</h2>
        <p style={p}>
          <strong>Awen Energy LLC</strong><br />
          Email: <a href="mailto:privacy@awenenergy.com" style={{ color: P.accent }}>privacy@awenenergy.com</a>
        </p>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <button onClick={onClose} style={{ fontFamily: "'DM Sans'", fontWeight: 600, fontSize: 14, background: P.accent, color: "#fff", border: "none", borderRadius: 10, padding: "10px 28px", cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}
