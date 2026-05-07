"use client";

import Image from "next/image";
import {
  Star, Users, Plus, CheckCircle2, Camera,
  TreeDeciduous, Building2, Utensils, Sparkles, Waves,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { VenueDetailDialog } from "@/components/VenueDetailDialog";
import type { DefaultVenue } from "@/lib/data/default-porto-venues";

const SUBCAT_CONFIG: Record<string, {
  label: string;
  gradient: string;
  Icon: React.ElementType;
}> = {
  quinta:      { label: "Quinta",      gradient: "from-emerald-500 to-green-700",  Icon: TreeDeciduous },
  hotel:       { label: "Hotel",       gradient: "from-indigo-500 to-blue-700",    Icon: Building2 },
  restaurante: { label: "Restaurant",  gradient: "from-orange-400 to-amber-600",   Icon: Utensils },
  "salão":     { label: "Ballroom",    gradient: "from-purple-500 to-violet-700",  Icon: Sparkles },
  praia:       { label: "Beach",       gradient: "from-cyan-400 to-sky-600",       Icon: Waves },
};

interface VenueDirectoryCardProps {
  venue: DefaultVenue;
  isSaved: boolean;
  isAdding: boolean;
  onAdd: () => void;
}

export function VenueDirectoryCard({ venue, isSaved, isAdding, onAdd }: VenueDirectoryCardProps) {
  const cfg = SUBCAT_CONFIG[venue.subcategory] ?? {
    label: venue.subcategory,
    gradient: "from-gray-400 to-gray-600",
    Icon: Building2,
  };
  const { Icon } = cfg;
  const heroPhoto = venue.photos?.[0];
  const photoCount = venue.photos?.length ?? 0;

  return (
    <div
      className={cn(
        "flex rounded-xl border bg-card overflow-hidden transition-shadow hover:shadow-md",
        isSaved && "border-emerald-400/60 bg-emerald-50/20",
      )}
    >
      {/* Photo or coloured placeholder */}
      <VenueDetailDialog
        venue={venue}
        isSaved={isSaved}
        isAdding={isAdding}
        onAdd={onAdd}
        trigger={
          <button
            type="button"
            className="hidden sm:block relative w-44 shrink-0 cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`View details for ${venue.name}`}
          >
            {heroPhoto ? (
              <Image
                src={heroPhoto}
                alt={venue.name}
                fill
                sizes="176px"
                className="object-cover transition-transform hover:scale-105"
              />
            ) : (
              <div
                className={cn(
                  "flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br",
                  cfg.gradient,
                )}
              >
                <Icon className="h-10 w-10 text-white/70" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
                  {cfg.label}
                </span>
              </div>
            )}
            {photoCount > 0 && (
              <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
                <Camera className="h-3 w-3" />
                Photos · {photoCount}
              </span>
            )}
          </button>
        }
      />

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4 min-w-0">
        {/* Name + CTA */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <VenueDetailDialog
              venue={venue}
              isSaved={isSaved}
              isAdding={isAdding}
              onAdd={onAdd}
              trigger={
                <button
                  type="button"
                  className="text-left font-semibold text-base leading-snug hover:underline focus:outline-none"
                >
                  {venue.name}
                </button>
              }
            />
            {venue.rating != null && (
              <span className="mt-0.5 flex items-center gap-1 text-sm text-amber-500">
                <Star className="h-3.5 w-3.5 fill-amber-400" />
                {venue.rating.toFixed(1)}
              </span>
            )}
          </div>

          {isSaved ? (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="shrink-0 border-emerald-300 text-emerald-600 hover:text-emerald-600"
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Added
            </Button>
          ) : (
            <Button size="sm" className="shrink-0" onClick={onAdd} disabled={isAdding}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {isAdding ? "Adding…" : "Add"}
            </Button>
          )}
        </div>

        {/* Description */}
        {venue.notes && (
          <p className="text-sm text-muted-foreground line-clamp-2">{venue.notes}</p>
        )}

        {/* Price + capacity */}
        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-1 pt-1 text-sm text-muted-foreground">
          {(venue.price_per_person != null || venue.quoted_price != null) && (
            <span className="flex items-center gap-1.5">
              <span className="text-base">⛺</span>
              {venue.price_per_person != null
                ? `From €${venue.price_per_person}/person`
                : `From €${venue.quoted_price!.toLocaleString()}`}
            </span>
          )}
          {(venue.min_capacity != null || venue.max_capacity != null) && (
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {venue.min_capacity != null && venue.max_capacity != null
                ? `${venue.min_capacity}–${venue.max_capacity}`
                : venue.max_capacity != null
                ? `Up to ${venue.max_capacity}`
                : `From ${venue.min_capacity}`}{" "}
              guests
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
