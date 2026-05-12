"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCY_OPTIONS } from "@/lib/utils/currencies";
import { scaleDefaultCategories, DEFAULT_BUDGET_CATEGORY_RATIOS } from "@/lib/utils/default-budget";
import { formatCurrency } from "@/lib/utils/format";
import { patchWeddingInline } from "@/lib/actions/wedding";
import { applyDefaultBudgetSplit } from "@/lib/actions/budget";
import { useT } from "@/lib/i18n/provider";

interface SetBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weddingId: string;
  initialBudget?: number;
  initialCurrency?: string;
  weddingDetails: {
    name: string;
    partner_one_name: string;
    partner_two_name: string;
    wedding_date: string | null;
    venue_name: string | null;
    location: string | null;
  };
  /** Guest mode: when provided, called instead of the server actions. */
  onSubmit?: (totalBudget: number, currency: string) => Promise<{ ok: boolean; error?: string }>;
  onSaved?: () => void;
}

export function SetBudgetDialog({
  open,
  onOpenChange,
  weddingId,
  initialBudget = 0,
  initialCurrency = "USD",
  weddingDetails,
  onSubmit,
  onSaved,
}: SetBudgetDialogProps) {
  const router = useRouter();
  const t = useT();
  const [budget, setBudget] = useState<number>(initialBudget || 0);
  const [currency, setCurrency] = useState<string>(initialCurrency);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setBudget(initialBudget || 0);
      setCurrency(initialCurrency);
      setError(null);
    }
  }, [open, initialBudget, initialCurrency]);

  const preview = scaleDefaultCategories(budget);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (budget <= 0) {
      setError(t("budgetBanner.enterMore"));
      return;
    }
    setError(null);
    startTransition(async () => {
      if (onSubmit) {
        const result = await onSubmit(budget, currency);
        if (!result.ok) { setError(result.error ?? t("budgetBanner.failedSave")); return; }
      } else {
        const wedRes = await patchWeddingInline(weddingId, {
          ...weddingDetails,
          total_budget: budget,
          currency,
        });
        if (!wedRes.ok) { setError(wedRes.error ?? t("budgetBanner.failedSave")); return; }
        const splitRes = await applyDefaultBudgetSplit(weddingId, budget);
        if (!splitRes.ok) { setError(splitRes.error ?? t("budgetBanner.failedCategories")); return; }
        router.refresh();
      }
      toast.success(t("budgetBanner.toastSet"));
      onSaved?.();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("budgetBanner.title")}</DialogTitle>
          <DialogDescription>
            {t("budgetBanner.dialogDesc")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="set-budget-currency">{t("settings.currency")}</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="set-budget-currency"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} — {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="set-budget-amount">{t("budgetBanner.totalBudget")}</Label>
              <Input
                id="set-budget-amount"
                type="number"
                min={0}
                step={100}
                value={budget || ""}
                onChange={(e) => setBudget(Number(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          <div className="rounded-md border bg-muted/30 p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("budgetBanner.howSplit")}
            </p>
            <ul className="space-y-1 text-sm">
              {preview.map((c, i) => {
                const pct = Math.round(DEFAULT_BUDGET_CATEGORY_RATIOS[i].ratio * 100);
                return (
                  <li key={c.name} className="flex items-baseline justify-between gap-2">
                    <span className="text-foreground/90">{c.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {pct}% · {formatCurrency(c.planned_amount, currency)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? t("common.savingChanges") : t("budgetBanner.cta")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
