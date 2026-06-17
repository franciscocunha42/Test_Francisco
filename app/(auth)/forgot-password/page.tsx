"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/lib/i18n/provider";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const t = useT();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/login`,
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("forgot.title")}</CardTitle>
        <CardDescription>{t("forgot.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <p className="text-sm text-muted-foreground">{t("forgot.sent")}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("forgot.sending") : t("forgot.send")}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="text-sm">
        <Link href="/login" className="text-primary hover:underline">{t("forgot.backToSignIn")}</Link>
      </CardFooter>
    </Card>
  );
}
