"use client";

import { GuestAppShell } from "@/components/GuestAppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Lock } from "lucide-react";
import { useRequireAuth } from "@/lib/guest-store/use-require-auth";

export default function GuestFormsPage() {
  const { guard } = useRequireAuth();

  return (
    <GuestAppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Forms</h1>
          <p className="text-sm text-muted-foreground">Custom RSVP and survey forms for your guests</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h2 className="font-serif text-lg font-semibold flex items-center justify-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Sign up to create RSVP forms
              </h2>
              <p className="text-sm text-muted-foreground">
                RSVP forms have a public share link, so they need a real
                account. We&apos;ll save everything you&apos;ve planned so far.
              </p>
            </div>
            <Button onClick={() => guard("create RSVP forms")}>
              Create your account
            </Button>
          </CardContent>
        </Card>
      </div>
    </GuestAppShell>
  );
}
