"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SignupForm } from "@/components/auth/SignupForm";
import { LoginForm } from "@/components/auth/LoginForm";
import { useGuestStore, getGuestSnapshot, hasGuestData } from "@/lib/guest-store/store";
import { claimGuestWedding } from "@/lib/actions/claim";

interface SignupGateProps {
  open: boolean;
  actionLabel: string;
  onClose: () => void;
  /** Runs after auth + (if applicable) successful claim migration.
   *  If the user is now in the authed app at a wedding workspace, the
   *  caller can use this to run their original deferred action — but
   *  most callers just rely on navigation. */
  onAuthed?: (weddingId: string | null) => void | Promise<void>;
}

export function SignupGate({ open, actionLabel, onClose, onAuthed }: SignupGateProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "login">("signup");

  async function handleAuthSuccess() {
    if (hasGuestData()) {
      const snapshot = getGuestSnapshot();
      const result = await claimGuestWedding(snapshot);
      if (!result.ok) {
        toast.error(`Couldn't save your data: ${result.error}`);
        return;
      }
      useGuestStore.getState().reset();
      toast.success("Your wedding has been saved");
      await onAuthed?.(result.weddingId);
      onClose();
      router.push(`/${result.weddingId}/dashboard`);
      router.refresh();
      return;
    }
    await onAuthed?.(null);
    onClose();
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "signup" ? "Create an account to" : "Sign in to"} {actionLabel}
          </DialogTitle>
          <DialogDescription>
            {mode === "signup"
              ? "Your wedding planning so far will be saved to your new account."
              : "We'll move your guest planning into your account."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {mode === "signup" ? (
            <SignupForm onSuccess={handleAuthSuccess} submitLabel="Create account & continue" />
          ) : (
            <LoginForm onSuccess={handleAuthSuccess} submitLabel="Sign in & continue" />
          )}
          <div className="text-center text-sm text-muted-foreground">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <Button variant="link" className="p-0 h-auto" onClick={() => setMode("login")}>
                  Sign in
                </Button>
              </>
            ) : (
              <>
                New to VowPlan?{" "}
                <Button variant="link" className="p-0 h-auto" onClick={() => setMode("signup")}>
                  Create an account
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
