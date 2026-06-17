"use client";

import { Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";

interface VerifyEmailDialogProps {
  open: boolean;
  email: string;
  onClose: () => void;
}

export function VerifyEmailDialog({ open, email, onClose }: VerifyEmailDialogProps) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary sm:mx-0">
            <Mail className="h-5 w-5" />
          </div>
          <DialogTitle>{t("auth.checkEmail")}</DialogTitle>
          <DialogDescription>
            {t("auth.verifySent").replace("{email}", email)}
          </DialogDescription>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          {t("auth.fromSupabase")}
        </p>
        <DialogFooter>
          <Button onClick={onClose} className="w-full sm:w-auto">{t("auth.gotIt")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
