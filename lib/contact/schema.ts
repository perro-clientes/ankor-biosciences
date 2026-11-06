import { z } from "zod";
import { contactTopics, type ContactTopic } from "@/content/site";

const topicValues = contactTopics.map((t) => t.value) as [ContactTopic, ...ContactTopic[]];

// Sin saltos de línea: el nombre va en el asunto del email.
const singleLine = (field: string) =>
  z
    .string()
    .trim()
    .refine((v) => !/[\r\n]/.test(v), `${field} must be a single line.`);

/** Schema compartido: validación en el cliente (React Hook Form) y en el servidor (Server Action). */
export const contactSchema = z.object({
  name: singleLine("Name")
    .pipe(z.string().min(2, "Please enter your full name.").max(120, "Name is too long.")),
  email: z.string().trim().email("Please enter a valid email address.").max(254),
  organization: singleLine("Organization").pipe(z.string().max(160, "Organization is too long.")),
  phone: singleLine("Phone").pipe(
    z
      .string()
      .max(40, "Phone is too long.")
      .refine((v) => v === "" || /^[+()\d\s.-]{6,}$/.test(v), "Please enter a valid phone number."),
  ),
  topic: z.enum(topicValues, { error: "Please choose a topic." }),
  message: z
    .string()
    .trim()
    .min(20, "Please write at least 20 characters.")
    .max(2000, "Please keep your message under 2000 characters."),
  privacy: z.literal(true, { error: "Please accept the Privacy Policy to continue." }),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactValues = z.output<typeof contactSchema>;
export type ContactField = keyof ContactValues;

export type ContactState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<ContactField, string>>;
    };

/** Tiempo mínimo entre la carga del formulario y el envío (antispam). */
export const MIN_FILL_MS = 3000;

/** Nombre del campo honeypot (oculto; un humano lo deja vacío). */
export const HONEYPOT_FIELD = "website";
