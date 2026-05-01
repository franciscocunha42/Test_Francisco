"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useGuestStore, getGuestSnapshot } from "@/lib/guest-store/store";
import { claimGuestWedding } from "@/lib/actions/claim";

interface ClaimGuestDataDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called once the user has decided. weddingId is set if they
   *  successfully claimed; null if they discarded. */
  onDone: (weddingId: string | null) => void;
}

export function ClaimGuestDataDialog({ open, onClose, onDone }: ClaimGuestDataDialogProps) {
  const [busy, setBusy] = useState(false);

  async function handleClaim() {
    setBusy(true);
    const snapshot = getGuestSnapshot();
    const result = await claimGuestWedding(snapshot);
    setBusy(false);
    if (!result.ok) {
      toast.error(`Couldn't move your guest data: ${result.error}`);
      return;
    }
    useGuestStore.getState().reset();
    toast.success("Your guest planning has been added to your account");
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
          <DialogTitle>You started planning as a guest</DialogTitle>
          <DialogDescription>
            We found a wedding you started planning before signing in. Move it
            into your account so you can keep editing it from any device, or
            discard it and start fresh.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={handleDiscard} disabled={busy}>
            Discard guest data
          </Button>
          <Button onClick={handleClaim} disabled={busy}>
            {busy ? "Saving..." : "Move into my account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
