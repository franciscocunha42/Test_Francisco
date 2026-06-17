"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Star, Users, Plus, CheckCircle2, Camera, Globe, MapPin, Mail,
  TreeDeciduous, Building2, Utensils, Sparkles, Waves,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { DefaultVenue } from "@/lib/data/default-porto-venues";

const SUBCAT_CONFIG: Record<string, {
  labelKey: TranslationKey;
  gradient: string;
  Icon: React.ElementType;
}> = {
  quinta:      { labelKey: "suppliers.subcatLabelQuinta",     gradient: "from-emerald-500 to-green-700", Icon: TreeDeciduous },
  hotel:       { labelKey: "suppliers.subcatLabelHotel",      gradient: "from-indigo-500 to-blue-700",   Icon: Building2 },
  restaurante: { labelKey: "suppliers.subcatLabelRestaurant", gradient: "from-orange-400 to-amber-600",  Icon: Utensils },
  "salão":     { labelKey: "suppliers.subcatLabelBallroom",   gradient: "from-purple-500 to-violet-700", Icon: Sparkles },
  praia:       { labelKey: "suppliers.subcatLabelBeach",      gradient: "from-cyan-400 to-sky-600",      Icon: Waves },
};

interface VenueDetailDialogProps {
  venue: DefaultVenue;
  isSaved: boolean;
  isAdding: boolean;
  onAdd: () => void;
  trigger: React.ReactNode;
}

export function VenueDetailDialog({ venue, isSaved, isAdding, onAdd, trigger }: VenueDetailDialogProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const cfg = SUBCAT_CONFIG[venue.subcategory];
  const Icon = cfg?.Icon ?? Building2;
  const subcatLabel = cfg ? t(cfg.labelKey) : venue.subcategory;
  const gradient = cfg?.gradient ?? "from-gray-400 to-gray-600";
  const hasPhotos = (venue.photos?.length ?? 0) > 0;
  const features = venue.features ?? [];

  function handleAdd() {
    onAdd();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogTitle className="sr-only">{venue.name}</DialogTitle>
        <DialogDescription className="sr-only">
          {subcatLabel} · {venue.notes ?? t("venue.detailsDesc")}
        </DialogDescription>

        {/* Hero photo / placeholder */}
        {hasPhotos ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
            <Image
              src={venue.photos![0]}
              alt={venue.name}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div
            className={cn(
              "flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 bg-gradient-to-br",
              gradient,
            )}
          >
            <Icon className="h-16 w-16 text-white/70" />
            <span className="text-sm font-semibold uppercase tracking-wider text-white/80">
              {subcatLabel}
            </span>
          </div>
        )}

        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-serif text-2xl font-semibold leading-tight">{venue.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{subcatLabel}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                {venue.rating != null && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <Star className="h-4 w-4 fill-amber-400" />
                    {venue.rating.toFixed(1)}
                  </span>
                )}
                {venue.location && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {venue.location}
                  </span>
                )}
                {(venue.photos?.length ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Camera className="h-3.5 w-3.5" />
                    {t("venue.photos")} · {venue.photos!.length}
                  </span>
                )}
                {venue.website && (
                  <a
                    href={venue.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {t("suppliers.website")}
                  </a>
                )}
                {venue.email && (
                  <a
                    href={`mailto:${venue.email}`}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {venue.email}
                  </a>
                )}
              </div>
            </div>

            {isSaved ? (
              <Button variant="outline" disabled className="border-emerald-300 text-emerald-600">
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                {t("venue.added")}
              </Button>
            ) : (
              <Button onClick={handleAdd} disabled={isAdding}>
                <Plus className="mr-1.5 h-4 w-4" />
                {isAdding ? t("venue.adding") : t("venue.addToWedding")}
              </Button>
            )}
          </div>

          {/* Highlights */}
          {features.length > 0 && (
            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("venue.highlights")}
              </h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Capacity & price summary */}
          <section className="grid gap-3 sm:grid-cols-2">
            {(venue.min_capacity != null || venue.max_capacity != null) && (
              <div className="rounded-lg border p-3">
                <p className="text-xs uppercase text-muted-foreground">{t("venue.capacity")}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium">
                  <Users className="h-4 w-4" />
                  {venue.min_capacity != null && venue.max_capacity != null
                    ? `${venue.min_capacity}–${venue.max_capacity} ${t("suppliers.guests")}`
                    : venue.max_capacity != null
                    ? `${t("venue.upTo")} ${venue.max_capacity} ${t("suppliers.guests")}`
                    : `${t("venue.from")} ${venue.min_capacity} ${t("suppliers.guests")}`}
                </p>
              </div>
            )}
            {(venue.price_per_person != null || venue.quoted_price != null) && (
              <div className="rounded-lg border p-3">
                <p className="text-xs uppercase text-muted-foreground">{t("venue.price")}</p>
                <p className="mt-0.5 text-sm font-medium">
                  {venue.price_per_person != null
                    ? t("venue.priceFromPerPerson").replace("{price}", String(venue.price_per_person))
                    : t("venue.priceFromTotal").replace("{price}", venue.quoted_price!.toLocaleString())}
                </p>
              </div>
            )}
          </section>

          {/* About */}
          {venue.notes && (
            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("venue.about")}
              </h3>
              <p className="text-sm leading-relaxed text-foreground/90">{venue.notes}</p>
            </section>
          )}

          {/* Photo gallery */}
          {hasPhotos && (
            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("venue.gallery")}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {venue.photos!.map((src, i) => (
                  <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={src}
                      alt={`${venue.name} photo ${i + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
