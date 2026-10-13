import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const COOKIE = "rivon_sid";

/**
 * One id per browser, set server-side and httpOnly so page scripts cannot read
 * or forge it. Two browsers therefore never share a session, which is what
 * keeps one customer's chat out of another's.
 */
export async function getSessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing) return existing;

  const id = randomUUID();
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return id;
}
