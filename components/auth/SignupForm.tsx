"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VerifyEmailDialog } from "@/components/auth/VerifyEmailDialog";
import { useT } from "@/lib/i18n/provider";

interface SignupFormProps {
  /** Called once auth.signUp succeeds AND a session is returned (i.e.
   *  email confirmation is disabled in Supabase). When confirmation is
   *  required the form shows a "check your email" dialog instead and
   *  this callback is not invoked. */
  onSuccess?: () => void | Promise<void>;
  submitLabel?: string;
}

const DUPLICATE_USER_MESSAGE =
  "An account with this email already exists. Please sign in instead, or use a different email.";

function isDuplicateUserError(message: string | undefined): boolean {
  if (!message) return false;
  return /already (registered|exists)|user with this email|email.*already/i.test(message);
}

export function SignupForm({ onSuccess, submitLabel }: SignupFormProps) {
  const supabase = createClient();
  const t = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const resolvedSubmitLabel = submitLabel ?? t("auth.createAccount");

  function resetForm() {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("auth.passwordsDontMatch"));
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (error) {
      setLoading(false);
      setError(isDuplicateUserError(error.message) ? DUPLICATE_USER_MESSAGE : error.message);
      return;
    }

    // Supabase's anti-enumeration response: returns a "user" object with no
    // identities when the email is already registered. Treat as duplicate.
    if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
      setLoading(false);
      setError(DUPLICATE_USER_MESSAGE);
      return;
    }

    // If confirmation is disabled the project returns a session and the user
    // is already logged in — preserve the original onSuccess flow.
    if (data?.session) {
      await onSuccess?.();
      setLoading(false);
      return;
    }

    // Otherwise the user must verify before they can sign in.
    setVerifyEmail(email);
    resetForm();
    setLoading(false);
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="signup-name">{t("auth.fullName")}</Label>
          <Input id="signup-name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="signup-email">{t("auth.email")}</Label>
          <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="signup-password">{t("auth.password")}</Label>
          <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="signup-password-confirm">{t("auth.confirmPassword")}</Label>
          <Input
            id="signup-password-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t("auth.creatingAccount") : resolvedSubmitLabel}
        </Button>
      </form>
      <VerifyEmailDialog
        open={verifyEmail !== null}
        email={verifyEmail ?? ""}
        onClose={() => setVerifyEmail(null)}
      />
    </>
  );
}
