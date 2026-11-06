"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { contactTopics, products, type ContactTopic } from "@/content/site";
import { submitContact } from "@/lib/contact/actions";
import {
  HONEYPOT_FIELD,
  contactSchema,
  type ContactField,
  type ContactInput,
  type ContactState,
  type ContactValues,
} from "@/lib/contact/schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

const initialState: ContactState = { status: "idle" };
const fieldOrder: ContactField[] = ["name", "email", "organization", "phone", "topic", "message", "privacy"];

function defaultsFromParams(params: URLSearchParams): Partial<ContactInput> {
  const topicParam = params.get("topic");
  const topic = contactTopics.some((t) => t.value === topicParam)
    ? (topicParam as ContactTopic)
    : undefined;
  const product = products.items.find((p) => p.slug === params.get("product"));
  return {
    topic: topic ?? (product ? "product" : undefined),
    message: product
      ? `Hello, I would like more information about ${product.name} (${product.flavour}).`
      : "",
  };
}

/** Lee ?topic= y ?product= (necesita un <Suspense> arriba). */
function ContactFormWithParams() {
  const params = useSearchParams();
  const defaults = React.useMemo(() => defaultsFromParams(params), [params]);
  return <ContactForm key={params.toString()} defaults={defaults} />;
}

function ContactForm({ defaults = {} }: { defaults?: Partial<ContactInput> }) {
  const statusRef = React.useRef<HTMLDivElement>(null);
  const startedAtRef = React.useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = React.useActionState(submitContact, initialState);
  const [, startTransition] = React.useTransition();

  const emptyValues: ContactInput = {
    name: "",
    email: "",
    organization: "",
    phone: "",
    topic: "" as ContactTopic,
    message: "",
    privacy: false as unknown as true,
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<ContactInput, unknown, ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { ...emptyValues, ...defaults },
    mode: "onTouched",
  });

  // Marca de tiempo de carga (antispam: se rechazan envíos de menos de 3 s).
  const stampStart = () => {
    if (startedAtRef.current) startedAtRef.current.value = String(Date.now());
  };
  React.useEffect(stampStart, []);

  // Respuesta del servidor: errores por campo, reset en éxito, foco.
  React.useEffect(() => {
    if (state.status === "success") {
      reset(emptyValues);
      stampStart();
      statusRef.current?.focus();
    } else if (state.status === "error") {
      const fieldErrors = state.fieldErrors ?? {};
      const first = fieldOrder.find((f) => fieldErrors[f]);
      for (const f of fieldOrder) {
        if (fieldErrors[f]) setError(f, { type: "server", message: fieldErrors[f] });
      }
      if (first) setFocus(first);
      else statusRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Validación en el cliente con el mismo schema; si pasa, se envía el FormData real a la Server Action.
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    void handleSubmit(() => {
      const formData = new FormData(form);
      startTransition(() => formAction(formData));
    })(event);
  };

  const describedBy = (field: ContactField, hint?: string) =>
    [hint, errors[field] ? `${field}-error` : null].filter(Boolean).join(" ") || undefined;

  return (
    <form
      action={formAction}
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-5"
    >
      <div
        ref={statusRef}
        tabIndex={-1}
        aria-live="polite"
        className="outline-none empty:hidden"
      >
        {state.status === "success" && (
          <p className="flex items-start gap-3 rounded-card bg-surface-tint p-4 text-body-sm font-normal text-ink-badge">
            <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-green" />
            {state.message}
          </p>
        )}
        {state.status === "error" && (
          <p className="flex items-start gap-3 rounded-card border border-destructive/30 bg-surface p-4 text-body-sm font-normal text-destructive">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            {state.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field id="name" label="Full name" required error={errors.name?.message}>
          <Input
            id="name"
            autoComplete="name"
            aria-invalid={!!errors.name}
            aria-describedby={describedBy("name")}
            aria-required
            {...register("name")}
          />
        </Field>
        <Field id="email" label="Email" required error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            aria-invalid={!!errors.email}
            aria-describedby={describedBy("email")}
            aria-required
            {...register("email")}
          />
        </Field>
        <Field id="organization" label="Organization" error={errors.organization?.message}>
          <Input
            id="organization"
            autoComplete="organization"
            aria-invalid={!!errors.organization}
            aria-describedby={describedBy("organization")}
            {...register("organization")}
          />
        </Field>
        <Field id="phone" label="Phone" error={errors.phone?.message}>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            aria-invalid={!!errors.phone}
            aria-describedby={describedBy("phone")}
            {...register("phone")}
          />
        </Field>
      </div>

      <Field id="topic" label="Topic" required error={errors.topic?.message}>
        <NativeSelect
          id="topic"
          aria-invalid={!!errors.topic}
          aria-describedby={describedBy("topic")}
          aria-required
          {...register("topic")}
        >
          <option value="" disabled>
            Select a topic
          </option>
          {contactTopics.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field id="message" label="Message" required error={errors.message?.message}>
        <Textarea
          id="message"
          rows={6}
          maxLength={2000}
          aria-invalid={!!errors.message}
          aria-describedby={describedBy("message", "message-hint")}
          aria-required
          {...register("message")}
        />
        <p id="message-hint" className="text-sm font-normal text-ink-muted">
          Between 20 and 2000 characters.
        </p>
      </Field>

      <div className="flex flex-col gap-1.5">
        {/* El control visible es role="checkbox": toma su nombre de privacy-label; el <label> amplía el área clickeable. */}
        <Label className="flex items-start gap-3 font-body text-body-sm leading-snug font-normal">
          <Controller
            name="privacy"
            control={control}
            render={({ field }) => (
              <Checkbox
                name="privacy"
                ref={field.ref}
                checked={field.value === true}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                onBlur={field.onBlur}
                aria-labelledby="privacy-label"
                aria-invalid={!!errors.privacy}
                aria-describedby={describedBy("privacy")}
                aria-required
                className="mt-0.5"
              />
            )}
          />
          <span id="privacy-label">
            I have read and accept the{" "}
            <Link
              href="/legal/privacy"
              className="font-medium text-brand-green underline underline-offset-2 hover:text-brand-ink"
            >
              Privacy Policy
            </Link>
            . <span aria-hidden="true">*</span>
          </span>
        </Label>
        <FieldError id="privacy" message={errors.privacy?.message} />
      </div>

      {/* Antispam: honeypot (oculto para personas y lectores) + marca de tiempo. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={HONEYPOT_FIELD}>Leave this field empty</label>
        <input id={HONEYPOT_FIELD} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {/* Sin value/defaultValue: React reescribe el atributo de un hidden en cada render y borraría la marca. */}
      <input ref={startedAtRef} type="hidden" name="startedAt" />
      {/* TODO: widget de Cloudflare Turnstile acá (ver verifyTurnstile en lib/contact/actions.ts). */}

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <Button
          type="submit"
          disabled={pending}
          icon={pending ? LoaderCircle : undefined}
          className={pending ? "[&_svg]:animate-spin" : undefined}
        >
          {pending ? "Sending…" : "Send message"}
        </Button>
        <p className="text-sm font-normal text-ink-muted">
          Fields marked with <span aria-hidden="true">*</span>
          <span className="sr-only">an asterisk</span> are required.
        </p>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: ContactField;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true">*</span>}
      </Label>
      {children}
      <FieldError id={id} message={error} />
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} className="flex items-center gap-1.5 text-sm font-normal text-destructive">
      <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
      {message}
    </p>
  );
}

export { ContactForm, ContactFormWithParams };
