"use client";

import { Star } from "lucide-react";
import { useT } from "@/lib/i18n/provider";

const testimonials = [
  {
    quote:
      "We planned our entire wedding from VowPlan. The timeline kept us on track and the budget tracker stopped us going wild on flowers.",
    name: "Avery & Jordan",
    location: "Napa Valley, CA",
  },
  {
    quote:
      "I tried three other wedding apps. This is the only one that didn't make me create an account just to look around. Loved that.",
    name: "Priya & Sam",
    location: "Brooklyn, NY",
  },
  {
    quote:
      "The RSVP form alone saved us a week of back-and-forth on text messages. Everyone could just reply through one link.",
    name: "Chloe & Marco",
    location: "London, UK",
  },
];

export function Testimonials() {
  const t = useT();
  return (
    <section className="border-t bg-champagne-50/50">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-10 text-center">
          <h2 className="font-serif text-3xl font-semibold">{t("testimonials.title")}</h2>
          <p className="mt-3 text-muted-foreground">{t("testimonials.subtitle")}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((tst) => (
            <figure key={tst.name} className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-3 flex gap-0.5 text-primary">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="text-sm text-foreground/90">&ldquo;{tst.quote}&rdquo;</blockquote>
              <figcaption className="mt-4 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{tst.name}</span>
                <span className="mx-1.5">·</span>
                <span>{tst.location}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
