"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignupFormProps {
  /** Called once auth.signUp succeeds. The form has no opinion on
   *  navigation — the caller decides what to do next (redirect to
   *  /onboarding, run the claim migration, etc.). */
  onSuccess?: () => void | Promise<void>;
  submitLabel?: string;
}

export function SignupForm({ onSuccess, submitLabel = "Create account" }: SignupFormProps) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }
    await onSuccess?.();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="signup-name">Full Name</Label>
        <Input id="signup-name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="signup-email">Email</Label>
        <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="signup-password">Password</Label>
        <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account..." : submitLabel}
      </Button>
    </form>
  );
}
