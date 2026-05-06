"use client";

import { Star, Users, Plus, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DefaultVenue } from "@/lib/data/default-porto-venues";

const SUBCATEGORY_LABELS: Record<string, string> = {
  quinta: "Quinta",
  hotel: "Hotel",
  restaurante: "Restaurante",
  salão: "Salão",
  praia: "Praia",
};

interface VenueDirectoryCardProps {
  venue: DefaultVenue;
  isSaved: boolean;
  isAdding: boolean;
  onAdd: () => void;
}

export function VenueDirectoryCard({ venue, isSaved, isAdding, onAdd }: VenueDirectoryCardProps) {
  return (
    <Card className={cn("overflow-hidden flex flex-col", isSaved && "ring-1 ring-emerald-500/30")}>
      <CardContent className="p-4 flex flex-col gap-3 flex-1">
        {/* Header */}
        <div>
          <p className="font-semibold leading-tight">{venue.name}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-xs">
              {SUBCATEGORY_LABELS[venue.subcategory] ?? venue.subcategory}
            </Badge>
            {venue.rating != null && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {venue.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* Capacity + price */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {(venue.min_capacity != null || venue.max_capacity != null) && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {venue.min_capacity != null && venue.max_capacity != null
                ? `${venue.min_capacity}–${venue.max_capacity} guests`
                : venue.max_capacity != null
                  ? `Up to ${venue.max_capacity} guests`
                  : `From ${venue.min_capacity} guests`}
            </span>
          )}
          {venue.price_per_person != null && (
            <span>From €{venue.price_per_person}/person</span>
          )}
          {venue.quoted_price != null && (
            <span>Venue rental from €{venue.quoted_price.toLocaleString()}</span>
          )}
        </div>

        {/* Description */}
        {venue.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{venue.notes}</p>
        )}

        {/* CTA */}
        {isSaved ? (
          <Button variant="outline" size="sm" disabled className="w-full mt-auto">
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
            Added to My Wedding
          </Button>
        ) : (
          <Button size="sm" className="w-full mt-auto" onClick={onAdd} disabled={isAdding}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {isAdding ? "Adding…" : "Add to My Wedding"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
