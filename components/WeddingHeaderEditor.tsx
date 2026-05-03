"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Heart, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WeddingDetailsDialog } from "@/components/WeddingDetailsDialog";
import type { WeddingDetailsInput } from "@/components/WeddingDetailsDialog";
import { WeddingSwitcher } from "@/components/WeddingSwitcher";
import { formatDate } from "@/lib/utils/format";
import { patchWeddingInline } from "@/lib/actions/wedding";
import type { Wedding } from "@/lib/types/database";

interface WeddingHeaderEditorProps {
  wedding: Wedding;
  weddingId: string;
  allWeddings: Pick<Wedding, "id" | "name" | "wedding_date">[];
}

export function WeddingHeaderEditor({ wedding, weddingId, allWeddings }: WeddingHeaderEditorProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  async function handleSave(data: WeddingDetailsInput) {
    const result = await patchWeddingInline(weddingId, data);
    if (!result.ok) throw new Error(result.error ?? "Failed to save");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary fill-primary" />
          <h1 className="font-serif text-2xl font-semibold">{wedding.name ?? "Dashboard"}</h1>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setEditOpen(true)}
            aria-label="Edit wedding details"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {wedding.partner_one_name && wedding.partner_two_name && (
            <span>{wedding.partner_one_name} &amp; {wedding.partner_two_name}</span>
          )}
          {wedding.wedding_date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(wedding.wedding_date)}
            </span>
          )}
          {(wedding.venue_name || wedding.location) && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {wedding.venue_name ?? wedding.location}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <WeddingSwitcher currentWeddingId={weddingId} weddings={allWeddings} />
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${weddingId}/settings`}>Settings</Link>
        </Button>
      </div>

      <WeddingDetailsDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        defaultValues={{
          name: wedding.name ?? "",
          partner_one_name: wedding.partner_one_name ?? "",
          partner_two_name: wedding.partner_two_name ?? "",
          wedding_date: wedding.wedding_date ?? null,
          venue_name: wedding.venue_name ?? null,
          location: wedding.location ?? null,
          total_budget: wedding.total_budget ?? 0,
          currency: wedding.currency ?? "USD",
        }}
        onSave={handleSave}
        requireNames
      />
    </div>
  );
}
