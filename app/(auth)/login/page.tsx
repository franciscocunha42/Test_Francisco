"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { ClaimGuestDataDialog } from "@/components/ClaimGuestDataDialog";
import { hasGuestData } from "@/lib/guest-store/store";
import { getPostLoginRedirect } from "@/lib/actions/auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [showClaim, setShowClaim] = useState(false);

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
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Welcome back to VowPlan</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm onSuccess={handleSuccess} />
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-sm text-muted-foreground">
          <Link href="/forgot-password" className="hover:text-foreground">Forgot password?</Link>
          <p>Don&apos;t have an account? <Link href="/signup" className="text-primary hover:underline">Sign up</Link></p>
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
