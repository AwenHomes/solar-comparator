export default function PrivacyPolicy({ onClose, palette: P }) {
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
  const h3 = { fontWeight: 600, fontSize: 15, margin: "16px 0 6px", color: "#1B1B1B" };
  const p = { margin: "8px 0", color: "#374151" };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 16, background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6B7280" }}>&times;</button>

        <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 24, color: P.accent, margin: "0 0 4px" }}>Privacy Policy</h1>
        <p style={{ ...p, fontSize: 12, color: "#9CA3AF" }}>Last Updated: April 4, 2026</p>
        <p style={p}>Awen Energy LLC ("we," "us," or "our") operates the Solar Proposal Comparator tool. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.</p>

        <h2 style={h2}>1. Information We Collect</h2>
        <h3 style={h3}>Personal Information You Provide</h3>
        <ul style={{ paddingLeft: 20, ...p }}>
          <li><strong>Contact information:</strong> Name, email address, and phone number (optional)</li>
          <li><strong>Solar proposal data:</strong> System size, pricing, panel brands, battery capacity, loan rates, and estimated production values</li>
          <li><strong>Communication preferences:</strong> Your consent choices for email, SMS, and phone contact</li>
        </ul>
        <h3 style={h3}>Information Collected Automatically</h3>
        <ul style={{ paddingLeft: 20, ...p }}>
          <li><strong>Device information:</strong> Browser type and user agent string</li>
          <li><strong>Usage data:</strong> Page URL at time of submission, input method (manual or PDF upload)</li>
        </ul>

        <h2 style={h2}>2. How We Use Your Information</h2>
        <ul style={{ paddingLeft: 20, ...p }}>
          <li>To generate your solar proposal comparison and AI-powered analysis</li>
          <li>To prepare and deliver a custom solar proposal if requested</li>
          <li>To contact you via your selected communication methods (email, SMS, phone) only with your explicit consent</li>
          <li>To improve our tools and services</li>
          <li>To comply with legal obligations</li>
        </ul>

        <h2 style={h2}>3. Third-Party Service Providers</h2>
        <p style={p}>We use the following third-party services to operate our tool:</p>
        <ul style={{ paddingLeft: 20, ...p }}>
          <li><strong>Supabase:</strong> Cloud database provider for secure data storage. Data is encrypted in transit (TLS) and at rest.</li>
          <li><strong>Anthropic (Claude AI):</strong> AI analysis provider. Your proposal data (not personal contact information) is sent to generate comparison analysis. Anthropic's data usage policies apply.</li>
          <li><strong>Google Fonts:</strong> Font delivery service. No personal data is shared; standard HTTP request headers are transmitted.</li>
        </ul>

        <h2 style={h2}>4. Data Retention</h2>
        <p style={p}>We retain your personal information for as long as necessary to fulfill the purposes described in this policy, typically no longer than 24 months from the date of collection. You may request deletion at any time (see Section 7).</p>

        <h2 style={h2}>5. Data Security</h2>
        <p style={p}>We implement reasonable technical and organizational measures to protect your information, including:</p>
        <ul style={{ paddingLeft: 20, ...p }}>
          <li>Encryption in transit (HTTPS/TLS) for all data transmissions</li>
          <li>Encryption at rest for stored data via our database provider</li>
          <li>Access controls limiting who can access personal data</li>
          <li>Input validation and sanitization to prevent common web vulnerabilities</li>
        </ul>

        <h2 style={h2}>6. Sale of Personal Information</h2>
        <p style={p}><strong>We do not sell or share your personal information</strong> with third parties for monetary or other valuable consideration. We do not sell personal information of consumers under 16 years of age.</p>

        <h2 style={h2}>7. Your Privacy Rights (CCPA/CPRA)</h2>
        <p style={p}>If you are a California resident, you have the following rights under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA):</p>
        <ul style={{ paddingLeft: 20, ...p }}>
          <li><strong>Right to Know:</strong> You may request disclosure of the categories and specific pieces of personal information we have collected about you.</li>
          <li><strong>Right to Delete:</strong> You may request deletion of your personal information, subject to certain exceptions.</li>
          <li><strong>Right to Correct:</strong> You may request correction of inaccurate personal information.</li>
          <li><strong>Right to Opt-Out:</strong> You have the right to opt out of the sale or sharing of your personal information. We do not sell your data.</li>
          <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights.</li>
          <li><strong>Right to Limit Use of Sensitive Personal Information:</strong> You may limit how we use sensitive personal information, if applicable.</li>
        </ul>
        <p style={p}>To exercise any of these rights, contact us at <strong>privacy@awenenergy.com</strong>. We will respond within 45 days as required by law. We may need to verify your identity before processing your request.</p>

        <h2 style={h2}>8. Communication Preferences</h2>
        <p style={p}>We only contact you via methods you have explicitly consented to:</p>
        <ul style={{ paddingLeft: 20, ...p }}>
          <li><strong>Email:</strong> Unsubscribe anytime via the link in any email or by contacting privacy@awenenergy.com</li>
          <li><strong>SMS:</strong> Reply STOP to any message to opt out</li>
          <li><strong>Phone:</strong> Request removal from call lists by contacting privacy@awenenergy.com</li>
        </ul>

        <h2 style={h2}>9. Cookies and Tracking</h2>
        <p style={p}>Our tool does not use cookies, tracking pixels, or analytics services. We load Google Fonts for display purposes, which involves standard HTTP requests to Google's servers. No personal data is shared via this mechanism beyond standard request headers.</p>

        <h2 style={h2}>10. Children's Privacy</h2>
        <p style={p}>Our services are not directed to individuals under 18 years of age. We do not knowingly collect personal information from children.</p>

        <h2 style={h2}>11. Changes to This Policy</h2>
        <p style={p}>We may update this Privacy Policy periodically. We will notify you of material changes by posting the updated policy with a new "Last Updated" date.</p>

        <h2 style={h2}>12. Contact Us</h2>
        <p style={p}>For privacy-related inquiries, data requests, or complaints:</p>
        <p style={p}>
          <strong>Awen Energy LLC</strong><br />
          Email: <a href="mailto:privacy@awenenergy.com" style={{ color: P.accent }}>privacy@awenenergy.com</a><br />
          Subject Line: "Privacy Request — Solar Comparator"
        </p>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <button onClick={onClose} style={{ fontFamily: "'DM Sans'", fontWeight: 600, fontSize: 14, background: P.accent, color: "#fff", border: "none", borderRadius: 10, padding: "10px 28px", cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}
