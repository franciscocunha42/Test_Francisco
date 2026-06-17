"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { vendorSchema, type VendorFormValues } from "@/lib/schemas/vendor";
import { createVendor, updateVendor } from "@/lib/actions/vendor";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useT } from "@/lib/i18n/provider";
import type { Vendor } from "@/lib/types/database";

const CATEGORIES = [
  "venue","catering","dj","music","photography","videography",
  "flowers","cake","transport","makeup","dress","suit","stationery","other",
];

const STATUSES = ["researching","contacted","shortlisted","booked","rejected"];

interface VendorFormDialogProps {
  weddingId: string;
  vendor?: Vendor;
  trigger: React.ReactNode;
  onSubmit?: (data: VendorFormValues, existing?: Vendor) => Promise<{ ok: boolean; error?: string }>;
}

export function VendorFormDialog({ weddingId, vendor, trigger, onSubmit: onSubmitProp }: VendorFormDialogProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [photosText, setPhotosText] = useState((vendor?.photos ?? []).join("\n"));
  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: vendor ?? { category: "other", status: "researching", photos: [] },
  });
  const selectedCategory = watch("category");

  async function onSubmit(data: VendorFormValues) {
    data.photos = photosText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const result = onSubmitProp
      ? await onSubmitProp(data, vendor)
      : vendor
        ? await updateVendor(weddingId, vendor.id, data)
        : await createVendor(weddingId, data);
    if (result?.ok === false) { toast.error(result.error); return; }
    toast.success(vendor ? t("suppliers.vendorUpdated") : t("suppliers.vendorCreated"));
    setOpen(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{vendor ? t("common.edit") : t("suppliers.addVendor")}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <Label>{t("suppliers.vendorName")} *</Label>
              <Input {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>{t("suppliers.vendorCategory")}</Label>
              <Select defaultValue={vendor?.category ?? "other"} onValueChange={(v) => setValue("category", v as VendorFormValues["category"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("common.status")}</Label>
              <Select defaultValue={vendor?.status ?? "researching"} onValueChange={(v) => setValue("status", v as VendorFormValues["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t("suppliers.contactName")}</Label>
              <Input {...register("contact_name")} />
            </div>
            <div className="space-y-1">
              <Label>{t("common.phone")}</Label>
              <Input {...register("phone")} />
            </div>
            <div className="space-y-1">
              <Label>{t("common.email")}</Label>
              <Input {...register("email")} />
            </div>
            <div className="space-y-1">
              <Label>{t("suppliers.website")}</Label>
              <Input {...register("website")} placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <Label>{t("suppliers.quote")}</Label>
              <Input type="number" step="0.01" {...register("quoted_price")} placeholder="0.00" />
            </div>
            <div className="space-y-1">
              <Label>{t("budget.actual")}</Label>
              <Input type="number" step="0.01" {...register("actual_cost")} placeholder="0.00" />
            </div>
          </div>
          {selectedCategory === "venue" && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("suppliers.venueType")}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label>{t("suppliers.venueType")}</Label>
                  <Select
                    defaultValue={vendor?.subcategory ?? ""}
                    onValueChange={(v) => setValue("subcategory", v || null)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quinta">{t("suppliers.subcatQuinta")}</SelectItem>
                      <SelectItem value="hotel">{t("suppliers.subcatHotel")}</SelectItem>
                      <SelectItem value="restaurante">{t("suppliers.subcatRestaurante")}</SelectItem>
                      <SelectItem value="salão">{t("suppliers.subcatSalao")}</SelectItem>
                      <SelectItem value="praia">{t("suppliers.subcatPraia")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>{t("suppliers.numberOfGuests")} (min)</Label>
                  <Input type="number" {...register("min_capacity")} />
                </div>
                <div className="space-y-1">
                  <Label>{t("suppliers.numberOfGuests")} (max)</Label>
                  <Input type="number" {...register("max_capacity")} />
                </div>
                <div className="space-y-1">
                  <Label>{t("suppliers.pricePerPerson")} (€)</Label>
                  <Input type="number" step="0.01" {...register("price_per_person")} />
                </div>
                <div className="space-y-1">
                  <Label>Rating (0–5)</Label>
                  <Input type="number" step="0.1" min="0" max="5" {...register("rating")} />
                </div>
              </div>
            </div>
          )}
          <div className="space-y-1">
            <Label>{t("common.notes")}</Label>
            <Textarea {...register("notes")} rows={2} />
          </div>
          <div className="space-y-1">
            <Label>Photos</Label>
            <Textarea
              rows={3}
              value={photosText}
              onChange={(e) => setPhotosText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? t("common.saving") : t("common.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
