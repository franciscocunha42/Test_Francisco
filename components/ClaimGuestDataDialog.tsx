"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useGuestStore, getGuestSnapshot } from "@/lib/guest-store/store";
import { claimGuestWedding } from "@/lib/actions/claim";
import { useT } from "@/lib/i18n/provider";

interface ClaimGuestDataDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called once the user has decided. weddingId is set if they
   *  successfully claimed; null if they discarded. */
  onDone: (weddingId: string | null) => void;
}

export function ClaimGuestDataDialog({ open, onClose, onDone }: ClaimGuestDataDialogProps) {
  const t = useT();
  const [busy, setBusy] = useState(false);

  async function handleClaim() {
    setBusy(true);
    const snapshot = getGuestSnapshot();
    const result = await claimGuestWedding(snapshot);
    setBusy(false);
    if (!result.ok) {
      toast.error(`${t("claim.failed")}: ${result.error}`);
      return;
    }
    useGuestStore.getState().reset();
    toast.success(t("claim.added"));
    onDone(result.weddingId);
  }

  function handleDiscard() {
    useGuestStore.getState().reset();
    onDone(null);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("claim.title")}</DialogTitle>
          <DialogDescription>
            {t("claim.desc")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={handleDiscard} disabled={busy}>
            {t("claim.discard")}
          </Button>
          <Button onClick={handleClaim} disabled={busy}>
            {busy ? t("common.saving") : t("claim.move")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
