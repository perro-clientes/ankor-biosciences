import "server-only";

import { headers } from "next/headers";
import { AUTH_CALLBACK_PATH } from "./routing";

/** Origen de la request (localhost, preview de Vercel o producción). */
export async function requestOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

/** URL del callback de links de email (invitación, recupero) para este origen. */
export async function emailCallbackUrl(next: string) {
  const url = new URL(AUTH_CALLBACK_PATH, await requestOrigin());
  url.searchParams.set("next", next);
  return url.toString();
}
