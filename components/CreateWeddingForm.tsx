"use client";

import { useState, useTransition } from "react";
import { createWedding } from "@/lib/actions/wedding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCY_OPTIONS } from "@/lib/utils/currencies";
import { Plus } from "lucide-react";
import { useT } from "@/lib/i18n/provider";

interface CreateWeddingFormProps {
  hasWeddings: boolean;
  /** When provided, the form posts to this handler instead of the
   *  createWedding server action. Used by guest mode to write into
   *  the local Zustand store. */
  onSubmit?: (data: FormData) => Promise<{ ok: boolean; error?: string }>;
  submitLabel?: string;
}

export function CreateWeddingForm({ hasWeddings, onSubmit, submitLabel }: CreateWeddingFormProps) {
  const t = useT();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>("USD");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = onSubmit ? await onSubmit(fd) : await createWedding(fd);
      if (result && !result.ok) {
        setError(result.error ?? t("common.somethingWrong"));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="partner_one_name">{t("createWedding.yourName")} *</Label>
          <Input id="partner_one_name" name="partner_one_name" required placeholder={t("createWedding.yourNamePh")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="partner_two_name">{t("createWedding.partnerName")} *</Label>
          <Input id="partner_two_name" name="partner_two_name" required placeholder={t("createWedding.partnerNamePh")} />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="name">{t("createWedding.weddingName")} *</Label>
        <Input id="name" name="name" required placeholder={t("createWedding.weddingNamePh")} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="wedding_date">{t("createWedding.weddingDate")}</Label>
          <Input id="wedding_date" name="wedding_date" type="date" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="total_budget">{t("createWedding.budget")}</Label>
          <Input id="total_budget" name="total_budget" type="number" min="0" placeholder={t("createWedding.budgetPh")} />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="currency">{t("createWedding.currency")}</Label>
        <input type="hidden" name="currency" value={currency} />
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CURRENCY_OPTIONS.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.code} — {c.label} ({c.symbol})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="venue_name">{t("createWedding.venueName")}</Label>
        <Input id="venue_name" name="venue_name" placeholder={t("createWedding.venueNamePh")} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="location">{t("createWedding.location")}</Label>
        <Input id="location" name="location" placeholder={t("createWedding.locationPh")} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          t("createWedding.creating")
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            {submitLabel ?? (hasWeddings ? t("createWedding.createNew") : t("createWedding.create"))}
          </>
        )}
      </Button>
    </form>
  );
}
