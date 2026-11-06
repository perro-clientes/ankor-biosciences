"use server";

import { Resend } from "resend";
import { render } from "react-email";
import { contact, contactTopics } from "@/content/site";
import { ContactEmail } from "@/components/contact/contact-email";
import {
  HONEYPOT_FIELD,
  MIN_FILL_MS,
  contactSchema,
  type ContactField,
  type ContactState,
} from "./schema";

/**
 * Lugar preparado para Cloudflare Turnstile. Cuando se active:
 * 1. Agregar TURNSTILE_SECRET_KEY y NEXT_PUBLIC_TURNSTILE_SITE_KEY a .env.
 * 2. Renderizar el widget en ContactForm (envía `cf-turnstile-response`).
 * 3. Verificar acá contra https://challenges.cloudflare.com/turnstile/v0/siteverify.
 */
async function verifyTurnstile(token: FormDataEntryValue | null): Promise<boolean> {
  if (!process.env.TURNSTILE_SECRET_KEY) return true;
  // TODO: verificar el token contra siteverify. Por ahora solo exige que exista.
  return typeof token === "string" && token.length > 0;
}

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // ── Antispam ──
  // Honeypot completo: respondemos "éxito" para no darle señales al bot.
  if (str(formData.get(HONEYPOT_FIELD)).trim() !== "") {
    return { status: "success", message: "Thanks! Your message has been sent." };
  }
  const startedAt = Number(str(formData.get("startedAt")));
  if (!Number.isFinite(startedAt) || startedAt <= 0 || Date.now() - startedAt < MIN_FILL_MS) {
    return {
      status: "error",
      message: "That was quick! Please take a moment to review your message and try again.",
    };
  }
  if (!(await verifyTurnstile(formData.get("cf-turnstile-response")))) {
    return { status: "error", message: "We couldn't verify your request. Please try again." };
  }

  // ── Validación (mismo schema que el cliente) ──
  const parsed = contactSchema.safeParse({
    name: str(formData.get("name")),
    email: str(formData.get("email")),
    organization: str(formData.get("organization")),
    phone: str(formData.get("phone")),
    topic: str(formData.get("topic")),
    message: str(formData.get("message")),
    privacy: formData.get("privacy") === "on",
  });

  if (!parsed.success) {
    const fieldErrors: Partial<Record<ContactField, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as ContactField;
      fieldErrors[key] ??= issue.message;
    }
    return { status: "error", message: "Please review the highlighted fields.", fieldErrors };
  }

  // ── Envío ──
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL || contact.email;
  if (!apiKey || !from) {
    console.error("[contact] Falta RESEND_API_KEY o CONTACT_FROM_EMAIL.");
    return {
      status: "error",
      message: `We couldn't send your message right now. Please email us at ${contact.email}.`,
    };
  }

  const values = parsed.data;
  const topicLabel = contactTopics.find((t) => t.value === values.topic)?.label ?? values.topic;
  const email = ContactEmail({ ...values, topicLabel });

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: values.email,
      subject: `[ankor-bio.com] ${topicLabel} — ${values.name}`,
      html: await render(email),
      text: await render(email, { plainText: true }),
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    console.error("[contact] Error al enviar con Resend:", err);
    return {
      status: "error",
      message: `We couldn't send your message right now. Please try again or email us at ${contact.email}.`,
    };
  }

  return {
    status: "success",
    message: "Thanks! Your message has been sent. Our team will get back to you soon.",
  };
}
