"use server";

import { getLatestWeddingId } from "@/lib/auth";

export async function getPostLoginRedirect(): Promise<string> {
  const weddingId = await getLatestWeddingId();
  return weddingId ? `/${weddingId}/dashboard` : "/onboarding";
}
