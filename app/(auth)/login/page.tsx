"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { ClaimGuestDataDialog } from "@/components/ClaimGuestDataDialog";
import { hasGuestData } from "@/lib/guest-store/store";
import { getPostLoginRedirect } from "@/lib/actions/auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/lib/i18n/provider";

export default function LoginPage() {
  const router = useRouter();
  const [showClaim, setShowClaim] = useState(false);
  const t = useT();

  async function handleSuccess() {
    if (hasGuestData()) {
      setShowClaim(true);
      return;
    }
    const redirect = await getPostLoginRedirect();
    router.push(redirect);
    router.refresh();
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("auth.signIn")}</CardTitle>
          <CardDescription>{t("auth.welcomeBack")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm onSuccess={handleSuccess} />
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-sm text-muted-foreground">
          <Link href="/forgot-password" className="hover:text-foreground">{t("auth.forgotPassword")}</Link>
          <p>{t("auth.noAccount")} <Link href="/signup" className="text-primary hover:underline">{t("auth.signUpLink")}</Link></p>
        </CardFooter>
      </Card>
      <ClaimGuestDataDialog
        open={showClaim}
        onClose={() => setShowClaim(false)}
        onDone={(weddingId) => {
          if (weddingId) router.push(`/${weddingId}/dashboard`);
          else router.push("/onboarding");
          router.refresh();
        }}
      />
    </>
  );
}
