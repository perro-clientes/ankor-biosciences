import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "react-email";
import type { ContactValues } from "@/lib/contact/schema";

type Props = Omit<ContactValues, "privacy"> & { topicLabel: string };

// Los clientes de email no leen CSS variables: los colores van inline, copiados
// de los tokens de app/globals.css (brand-ink, brand-green, surface-muted, ink-muted).
const colors = {
  ink: "#162311",
  green: "#517A5F",
  muted: "#3D4A40",
  surface: "#F4F7F4",
  line: "#E2EBE4",
};

/** Email interno que recibe el equipo de Ankor con cada consulta del formulario. */
export function ContactEmail({ name, email, organization, phone, topicLabel, message }: Props) {
  const rows: [string, string][] = [
    ["Topic", topicLabel],
    ["Name", name],
    ["Email", email],
    ["Organization", organization || "—"],
    ["Phone", phone || "—"],
  ];

  return (
    <Html lang="en">
      <Head />
      <Preview>{`${topicLabel} — ${name}`}</Preview>
      <Body style={{ backgroundColor: colors.surface, fontFamily: "Arial, sans-serif", margin: 0 }}>
        <Container style={{ backgroundColor: "#FFFFFF", padding: "32px", margin: "24px auto", maxWidth: "560px" }}>
          <Text style={{ color: colors.green, fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
            ankor-bio.com · Contact form
          </Text>
          <Heading as="h1" style={{ color: colors.ink, fontSize: "22px", margin: "8px 0 24px" }}>
            New inquiry: {topicLabel}
          </Heading>
          <Section>
            {rows.map(([label, value]) => (
              <Text key={label} style={{ color: colors.ink, fontSize: "14px", margin: "0 0 6px" }}>
                <strong style={{ color: colors.muted }}>{label}:</strong> {value}
              </Text>
            ))}
          </Section>
          <Hr style={{ borderColor: colors.line, margin: "24px 0" }} />
          <Text style={{ color: colors.ink, fontSize: "15px", lineHeight: "1.6", whiteSpace: "pre-wrap", margin: 0 }}>
            {message}
          </Text>
          <Hr style={{ borderColor: colors.line, margin: "24px 0" }} />
          <Text style={{ color: colors.muted, fontSize: "12px", margin: 0 }}>
            Reply to this email to answer {name} directly.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
