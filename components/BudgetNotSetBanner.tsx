"use client";

import { useState } from "react";
import { PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SetBudgetDialog } from "@/components/SetBudgetDialog";
import type { Wedding } from "@/lib/types/database";

interface Props {
  wedding: Wedding;
  weddingId: string;
  /** Guest mode override. */
  onSubmit?: (totalBudget: number, currency: string) => Promise<{ ok: boolean; error?: string }>;
}

export function BudgetNotSetBanner({ wedding, weddingId, onSubmit }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/15 p-2 text-primary">
              <PiggyBank className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium leading-tight">Set your wedding budget</p>
              <p className="text-sm text-muted-foreground">
                Tell us how much you plan to spend and we&apos;ll split it across categories for you.
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>Set budget</Button>
        </CardContent>
      </Card>
      <SetBudgetDialog
        open={open}
        onOpenChange={setOpen}
        weddingId={weddingId}
        initialBudget={wedding.total_budget}
        initialCurrency={wedding.currency}
        weddingDetails={{
          name: wedding.name,
          partner_one_name: wedding.partner_one_name,
          partner_two_name: wedding.partner_two_name,
          wedding_date: wedding.wedding_date ?? null,
          venue_name: wedding.venue_name ?? null,
          location: wedding.location ?? null,
        }}
        onSubmit={onSubmit}
      />
    </>
  );
}
