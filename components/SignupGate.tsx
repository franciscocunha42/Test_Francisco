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
import { useT } from "@/lib/i18n/provider";

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
  const t = useT();
  const [mode, setMode] = useState<"signup" | "login">("signup");

  async function handleAuthSuccess() {
    if (hasGuestData()) {
      const snapshot = getGuestSnapshot();
      const result = await claimGuestWedding(snapshot);
      if (!result.ok) {
        toast.error(`${t("signupGate.failedSave")}: ${result.error}`);
        return;
      }
      useGuestStore.getState().reset();
      toast.success(t("signupGate.savedToast"));
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

  const titleTemplate = mode === "signup" ? t("signupGate.createAccountToLabel") : t("signupGate.signInToLabel");

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {titleTemplate.replace("{label}", actionLabel)}
          </DialogTitle>
          <DialogDescription>
            {mode === "signup" ? t("signupGate.descSignup") : t("signupGate.descLogin")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {mode === "signup" ? (
            <SignupForm onSuccess={handleAuthSuccess} submitLabel={t("signupGate.submitSignup")} />
          ) : (
            <LoginForm onSuccess={handleAuthSuccess} submitLabel={t("signupGate.submitLogin")} />
          )}
          <div className="text-center text-sm text-muted-foreground">
            {mode === "signup" ? (
              <>
                {t("auth.alreadyHaveAccount")}{" "}
                <Button variant="link" className="p-0 h-auto" onClick={() => setMode("login")}>
                  {t("auth.signInLink")}
                </Button>
              </>
            ) : (
              <>
                {t("signupGate.newPrompt")}{" "}
                <Button variant="link" className="p-0 h-auto" onClick={() => setMode("signup")}>
                  {t("signupGate.createAccount")}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
