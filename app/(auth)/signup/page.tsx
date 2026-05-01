"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignupForm } from "@/components/auth/SignupForm";
import { ClaimGuestDataDialog } from "@/components/ClaimGuestDataDialog";
import { hasGuestData } from "@/lib/guest-store/store";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  const router = useRouter();
  const [showClaim, setShowClaim] = useState(false);

  async function handleSuccess() {
    if (hasGuestData()) {
      setShowClaim(true);
      return;
    }
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Start planning your perfect wedding</CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm onSuccess={handleSuccess} />
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Already have an account? <Link href="/login" className="ml-1 text-primary hover:underline">Sign in</Link>
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
