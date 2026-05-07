"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Star, Users, Plus, CheckCircle2, Camera,
  TreeDeciduous, Building2, Utensils, Sparkles, Waves,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { DefaultVenue } from "@/lib/data/default-porto-venues";

const SUBCAT_CONFIG: Record<string, {
  label: string;
  gradient: string;
  Icon: React.ElementType;
}> = {
  quinta:      { label: "Quinta",      gradient: "from-emerald-500 to-green-700",  Icon: TreeDeciduous },
  hotel:       { label: "Hotel",       gradient: "from-indigo-500 to-blue-700",    Icon: Building2 },
  restaurante: { label: "Restaurante", gradient: "from-orange-400 to-amber-600",   Icon: Utensils },
  "salão":     { label: "Salão",       gradient: "from-purple-500 to-violet-700",  Icon: Sparkles },
  praia:       { label: "Praia",       gradient: "from-cyan-400 to-sky-600",       Icon: Waves },
};

interface VenueDetailDialogProps {
  venue: DefaultVenue;
  isSaved: boolean;
  isAdding: boolean;
  onAdd: () => void;
  trigger: React.ReactNode;
}

export function VenueDetailDialog({ venue, isSaved, isAdding, onAdd, trigger }: VenueDetailDialogProps) {
  const [open, setOpen] = useState(false);
  const cfg = SUBCAT_CONFIG[venue.subcategory] ?? {
    label: venue.subcategory,
    gradient: "from-gray-400 to-gray-600",
    Icon: Building2,
  };
  const { Icon } = cfg;
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
          {cfg.label} · {venue.notes ?? "Wedding venue details"}
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
              cfg.gradient,
            )}
          >
            <Icon className="h-16 w-16 text-white/70" />
            <span className="text-sm font-semibold uppercase tracking-wider text-white/80">
              {cfg.label}
            </span>
          </div>
        )}

        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-serif text-2xl font-semibold leading-tight">{venue.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{cfg.label} principal</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                {venue.rating != null && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <Star className="h-4 w-4 fill-amber-400" />
                    {venue.rating.toFixed(1)}
                  </span>
                )}
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Camera className="h-3.5 w-3.5" />
                  Ver Fotos · {venue.photos?.length ?? 0}
                </span>
              </div>
            </div>

            {isSaved ? (
              <Button variant="outline" disabled className="border-emerald-300 text-emerald-600">
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Adicionado
              </Button>
            ) : (
              <Button onClick={handleAdd} disabled={isAdding}>
                <Plus className="mr-1.5 h-4 w-4" />
                {isAdding ? "A adicionar…" : "Adicionar ao meu casamento"}
              </Button>
            )}
          </div>

          {/* Dados de interesse */}
          {features.length > 0 && (
            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Dados de interesse
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
                <p className="text-xs uppercase text-muted-foreground">Capacidade</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium">
                  <Users className="h-4 w-4" />
                  {venue.min_capacity != null && venue.max_capacity != null
                    ? `${venue.min_capacity} a ${venue.max_capacity} convidados`
                    : venue.max_capacity != null
                    ? `Até ${venue.max_capacity} convidados`
                    : `A partir de ${venue.min_capacity} convidados`}
                </p>
              </div>
            )}
            {(venue.price_per_person != null || venue.quoted_price != null) && (
              <div className="rounded-lg border p-3">
                <p className="text-xs uppercase text-muted-foreground">Preço</p>
                <p className="mt-0.5 text-sm font-medium">
                  {venue.price_per_person != null
                    ? `A partir de €${venue.price_per_person}/pessoa`
                    : `A partir de €${venue.quoted_price!.toLocaleString()}`}
                </p>
              </div>
            )}
          </section>

          {/* Informação */}
          {venue.notes && (
            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Informação
              </h3>
              <p className="text-sm leading-relaxed text-foreground/90">{venue.notes}</p>
            </section>
          )}

          {/* Photo gallery */}
          {hasPhotos && (
            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Galeria
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {venue.photos!.map((src, i) => (
                  <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={src}
                      alt={`${venue.name} foto ${i + 1}`}
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
