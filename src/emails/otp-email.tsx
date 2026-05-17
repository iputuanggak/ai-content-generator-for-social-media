import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface OtpEmailProps {
  code: string;
  purpose?: string;
}

export function OtpEmail({ code, purpose = "verify your email address" }: OtpEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Lotus verification code: {code}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <div style={logoBadge}>C</div>
            <span style={logoText}>Lotus</span>
          </Section>

          <Heading style={heading}>Your verification code</Heading>
          <Text style={subheading}>
            Use the code below to {purpose}.
          </Text>

          <Section style={codeSection}>
            <Text style={codeText}>{code}</Text>
          </Section>

          <Text style={notice}>
            This code expires in <strong>5 minutes</strong>. If you did not
            request this, you can safely ignore this email.
          </Text>

          <Text style={footer}>
            &copy; {new Date().getFullYear()} Lotus. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default OtpEmail;

// ─── Styles ──────────────────────────────────────────────────────────────────

const main: React.CSSProperties = {
  backgroundColor: "#f0fdfa",
  fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  padding: "40px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  border: "1px solid #ccfbf1",
  maxWidth: "480px",
  margin: "0 auto",
  padding: "40px",
};

const logoSection: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  marginBottom: "32px",
};

const logoBadge: React.CSSProperties = {
  backgroundColor: "#0d9488",
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: 700,
  height: "32px",
  lineHeight: "32px",
  marginRight: "8px",
  textAlign: "center",
  width: "32px",
};

const logoText: React.CSSProperties = {
  color: "#134e4a",
  fontSize: "18px",
  fontWeight: 600,
};

const heading: React.CSSProperties = {
  color: "#0f172a",
  fontSize: "24px",
  fontWeight: 600,
  margin: "0 0 8px",
};

const subheading: React.CSSProperties = {
  color: "#64748b",
  fontSize: "14px",
  margin: "0 0 32px",
};

const codeSection: React.CSSProperties = {
  backgroundColor: "#f0fdfa",
  borderRadius: "12px",
  border: "1px solid #99f6e4",
  margin: "0 0 24px",
  padding: "24px",
  textAlign: "center",
};

const codeText: React.CSSProperties = {
  color: "#0d9488",
  fontSize: "40px",
  fontWeight: 700,
  letterSpacing: "12px",
  margin: 0,
};

const notice: React.CSSProperties = {
  color: "#475569",
  fontSize: "13px",
  margin: "0 0 32px",
};

const footer: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "12px",
  margin: 0,
};
