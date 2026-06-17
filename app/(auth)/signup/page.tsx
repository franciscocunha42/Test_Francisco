"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignupForm } from "@/components/auth/SignupForm";
import { ClaimGuestDataDialog } from "@/components/ClaimGuestDataDialog";
import { hasGuestData } from "@/lib/guest-store/store";
import { getPostLoginRedirect } from "@/lib/actions/auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/lib/i18n/provider";

export default function SignupPage() {
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
          <CardTitle>{t("auth.createAccount")}</CardTitle>
          <CardDescription>{t("auth.startPerfectWedding")}</CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm onSuccess={handleSuccess} />
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          {t("auth.alreadyHaveAccount")} <Link href="/login" className="ml-1 text-primary hover:underline">{t("auth.signInLink")}</Link>
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
