import Anthropic from "@anthropic-ai/sdk";

let cached: Anthropic | null = null;

/** Returns a shared Anthropic client, or null when ANTHROPIC_API_KEY isn't set.
 *  Callers should fall back to a template-based response in the null case
 *  so the feature still works (just less smartly) without AI configuration. */
export function getAnthropicClient(): Anthropic | null {
  if (cached) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  cached = new Anthropic({ apiKey });
  return cached;
}

export const ANTHROPIC_EMAIL_MODEL = "claude-opus-4-7" as const;
