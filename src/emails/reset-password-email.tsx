import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface ResetPasswordEmailProps {
  resetLink: string;
}

export function ResetPasswordEmail({ resetLink }: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your Lotus password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <div style={logoBadge}>Lo</div>
            <span style={logoText}>Lotus</span>
          </Section>

          <Heading style={heading}>Reset your password</Heading>
          <Text style={subheading}>
            We received a request to reset your password. Click the button below to choose a new one.
          </Text>

          <Section style={buttonSection}>
            <Button style={button} href={resetLink}>
              Reset Password
            </Button>
          </Section>

          <Text style={fallback}>
            Or copy and paste this link into your browser:
            <br />
            <a href={resetLink} style={link}>
              {resetLink}
            </a>
          </Text>

          <Text style={notice}>
            This link expires in <strong>1 hour</strong>. If you did not
            request a password reset, you can safely ignore this email.
          </Text>

          <Text style={footer}>
            &copy; {new Date().getFullYear()} Lotus. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ResetPasswordEmail;

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
  lineHeight: "24px",
  margin: "0 0 32px",
};

const buttonSection: React.CSSProperties = {
  margin: "0 0 24px",
  textAlign: "center",
};

const button: React.CSSProperties = {
  backgroundColor: "#0d9488",
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: 600,
  padding: "12px 32px",
  textDecoration: "none",
};

const fallback: React.CSSProperties = {
  color: "#475569",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 24px",
};

const link: React.CSSProperties = {
  color: "#0d9488",
  wordBreak: "break-all",
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
