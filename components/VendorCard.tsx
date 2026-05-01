"use client";

import { Pencil, Trash2, Globe, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/format";
import { capitalize } from "@/lib/utils/format";
import { deleteVendor } from "@/lib/actions/vendor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VendorFormDialog } from "@/components/VendorFormDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { Vendor } from "@/lib/types/database";
import type { VendorFormValues } from "@/lib/schemas/vendor";

const statusColors: Record<string, "default" | "secondary" | "warning" | "info" | "success" | "destructive"> = {
  researching: "secondary",
  contacted: "info",
  shortlisted: "warning",
  booked: "success",
  rejected: "destructive",
};

interface VendorCardProps {
  vendor: Vendor;
  weddingId: string;
  currency?: string;
  onEditSubmit?: (data: VendorFormValues, existing?: Vendor) => Promise<{ ok: boolean; error?: string }>;
  onDelete?: (vendorId: string) => Promise<{ ok: boolean; error?: string }>;
}

export function VendorCard({ vendor, weddingId, currency = "USD", onEditSubmit, onDelete }: VendorCardProps) {
  async function handleDelete() {
    const result = onDelete
      ? await onDelete(vendor.id)
      : await deleteVendor(weddingId, vendor.id);
    if (result?.ok === false) toast.error(result.error);
    else toast.success("Vendor removed");
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold truncate">{vendor.name}</p>
            <Badge variant={statusColors[vendor.status]} className="mt-1 text-xs">{capitalize(vendor.status)}</Badge>
          </div>
          <div className="flex gap-1 shrink-0">
            <VendorFormDialog
              weddingId={weddingId}
              vendor={vendor}
              onSubmit={onEditSubmit}
              trigger={<Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>}
            />
            <ConfirmDialog
              trigger={<Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>}
              title="Remove vendor"
              description={`Remove "${vendor.name}"?`}
              onConfirm={handleDelete}
            />
          </div>
        </div>

        {vendor.contact_name && <p className="text-sm text-muted-foreground">{vendor.contact_name}</p>}

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {vendor.email && (
            <a href={`mailto:${vendor.email}`} className="flex items-center gap-1 hover:text-foreground">
              <Mail className="h-3 w-3" />{vendor.email}
            </a>
          )}
          {vendor.phone && (
            <a href={`tel:${vendor.phone}`} className="flex items-center gap-1 hover:text-foreground">
              <Phone className="h-3 w-3" />{vendor.phone}
            </a>
          )}
          {vendor.website && (
            <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground">
              <Globe className="h-3 w-3" />Website
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-md bg-muted/50 p-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Quoted</p>
            <p className="font-medium">{vendor.quoted_price != null ? formatCurrency(vendor.quoted_price, currency) : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Actual</p>
            <p className={cn("font-medium", vendor.actual_cost != null && vendor.quoted_price != null && vendor.actual_cost > vendor.quoted_price && "text-destructive")}>
              {vendor.actual_cost != null ? formatCurrency(vendor.actual_cost, currency) : "—"}
            </p>
          </div>
        </div>

        {vendor.notes && <p className="text-xs text-muted-foreground line-clamp-2">{vendor.notes}</p>}
      </CardContent>
    </Card>
  );
}
