"use client";

import {
  Star, Users, Plus, CheckCircle2,
  TreeDeciduous, Building2, Utensils, Sparkles, Waves,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import type { DefaultVenue } from "@/lib/data/default-porto-venues";

const SUBCAT_CONFIG: Record<string, {
  label: string;
  gradient: string;
  Icon: React.ElementType;
}> = {
  quinta:      { label: "Quinta",       gradient: "from-emerald-500 to-green-700",  Icon: TreeDeciduous },
  hotel:       { label: "Hotel",        gradient: "from-indigo-500 to-blue-700",    Icon: Building2 },
  restaurante: { label: "Restaurante",  gradient: "from-orange-400 to-amber-600",   Icon: Utensils },
  "salão":     { label: "Salão",        gradient: "from-purple-500 to-violet-700",  Icon: Sparkles },
  praia:       { label: "Praia",        gradient: "from-cyan-400 to-sky-600",       Icon: Waves },
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

  return (
    <div
      className={cn(
        "flex rounded-xl border bg-card overflow-hidden transition-shadow hover:shadow-md",
        isSaved && "border-emerald-400/60 bg-emerald-50/20",
      )}
    >
      {/* Coloured photo placeholder */}
      <div
        className={cn(
          "hidden sm:flex w-44 shrink-0 flex-col items-center justify-center gap-2 bg-gradient-to-br",
          cfg.gradient,
        )}
      >
        <Icon className="h-10 w-10 text-white/70" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
          {cfg.label}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4 min-w-0">
        {/* Name + CTA */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-base leading-snug">{venue.name}</h3>
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
              Adicionado
            </Button>
          ) : (
            <Button size="sm" className="shrink-0" onClick={onAdd} disabled={isAdding}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {isAdding ? "A adicionar…" : "Adicionar"}
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
                ? `A partir de €${venue.price_per_person}/pessoa`
                : `A partir de €${venue.quoted_price!.toLocaleString()}`}
            </span>
          )}
          {(venue.min_capacity != null || venue.max_capacity != null) && (
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {venue.min_capacity != null && venue.max_capacity != null
                ? `${venue.min_capacity} a ${venue.max_capacity}`
                : venue.max_capacity != null
                ? `Até ${venue.max_capacity}`
                : `A partir de ${venue.min_capacity}`}{" "}
              Convidados
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
