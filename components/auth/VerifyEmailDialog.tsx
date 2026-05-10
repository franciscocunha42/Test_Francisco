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

interface VerifyEmailDialogProps {
  open: boolean;
  email: string;
  onClose: () => void;
}

export function VerifyEmailDialog({ open, email, onClose }: VerifyEmailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary sm:mx-0">
            <Mail className="h-5 w-5" />
          </div>
          <DialogTitle>Check your email</DialogTitle>
          <DialogDescription>
            We sent a verification link to <span className="font-medium text-foreground">{email}</span>.
            Click the link to activate your account, then come back and sign in.
          </DialogDescription>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          The email will come from <span className="font-medium">Supabase Auth</span>{" "}
          (<code className="rounded bg-muted px-1 py-0.5 text-[11px]">noreply@mail.app.supabase.io</code>).
          If you don&apos;t see it within a minute, check your spam folder.
        </p>
        <DialogFooter>
          <Button onClick={onClose} className="w-full sm:w-auto">Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
