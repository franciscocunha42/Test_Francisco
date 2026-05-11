"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n/provider";

interface LoginFormProps {
  onSuccess?: () => void | Promise<void>;
  submitLabel?: string;
}

function mapLoginError(err: unknown): string {
  if (err instanceof TypeError) {
    return "Can't reach the server. Check your internet connection and try again.";
  }
  const message = (err as { message?: string } | null)?.message ?? "";
  const status = (err as { status?: number } | null)?.status;

  if (/failed to fetch|networkerror|fetch failed|network request failed/i.test(message)) {
    return "Can't reach the server. Check your internet connection and try again.";
  }
  if (/invalid login credentials|invalid email or password/i.test(message)) {
    return "Email or password is incorrect.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Your email isn't verified yet. Open the link in the email from Supabase, then try again.";
  }
  if (status === 429 || /rate limit/i.test(message)) {
    return "Too many attempts. Wait a minute and try again.";
  }
  return message || "Something went wrong. Please try again.";
}

export function LoginForm({ onSuccess, submitLabel }: LoginFormProps) {
  const supabase = createClient();
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const resolvedSubmitLabel = submitLabel ?? t("auth.signIn");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoading(false);
        setError(mapLoginError(error));
        return;
      }
      await onSuccess?.();
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(mapLoginError(err));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="login-email">{t("auth.email")}</Label>
        <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="login-password">{t("auth.password")}</Label>
        <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t("auth.signingIn") : resolvedSubmitLabel}
      </Button>
    </form>
  );
}
