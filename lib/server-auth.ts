import { NextRequest } from "next/server";

import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

export function getAuthenticatedUserId(request: NextRequest): number | null {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = verifyAuthToken(token);
  return payload?.userId ?? null;
}
