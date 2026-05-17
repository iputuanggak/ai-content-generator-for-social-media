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

interface InvitationEmailProps {
  invitedByUsername: string;
  teamName: string;
  inviteLink: string;
}

export function InvitationEmail({
  invitedByUsername,
  teamName,
  inviteLink,
}: InvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {invitedByUsername} invited you to join {teamName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <div style={logoBadge}>Lo</div>
            <span style={logoText}>Lotus</span>
          </Section>

          <Heading style={heading}>You&apos;re invited!</Heading>
          <Text style={subheading}>
            <strong>{invitedByUsername}</strong> has invited you to join the{" "}
            <strong>{teamName}</strong> team on Lotus.
          </Text>

          <Section style={buttonSection}>
            <Button style={button} href={inviteLink}>
              Accept Invitation
            </Button>
          </Section>

          <Text style={fallback}>
            Or copy and paste this link into your browser:
            <br />
            <a href={inviteLink} style={link}>
              {inviteLink}
            </a>
          </Text>

          <Text style={notice}>
            This invitation expires in <strong>7 days</strong>. If you did not
            expect this invitation, you can safely ignore this email.
          </Text>

          <Text style={footer}>
            &copy; {new Date().getFullYear()} Lotus. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default InvitationEmail;

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
