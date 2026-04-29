"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ConfirmDialogProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: "destructive" | "default";
  /** If set, user must type this exact string to confirm */
  confirmText?: string;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  trigger, title, description, confirmLabel = "Confirm",
  confirmVariant = "destructive", confirmText, onConfirm,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [loading, setLoading] = useState(false);

  const canConfirm = confirmText ? typed === confirmText : true;

  async function handleConfirm() {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    setOpen(false);
    setTyped("");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setTyped(""); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {confirmText && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Type <span className="font-mono font-medium text-foreground">{confirmText}</span> to confirm.
            </p>
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={confirmText} />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant={confirmVariant} disabled={!canConfirm || loading} onClick={handleConfirm}>
            {loading ? "..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
