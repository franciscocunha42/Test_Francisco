"use client";

import { Calendar, Users, PiggyBank, Store, FileText, Heart } from "lucide-react";
import { useT } from "@/lib/i18n/provider";
import type { TranslationKey } from "@/lib/i18n/dictionary";

const features: Array<{
  icon: typeof Calendar;
  titleKey: TranslationKey;
  descKey: TranslationKey;
}> = [
  { icon: Calendar,  titleKey: "value.timeline.title",  descKey: "value.timeline.desc" },
  { icon: Users,     titleKey: "value.guests.title",    descKey: "value.guests.desc" },
  { icon: PiggyBank, titleKey: "value.budget.title",    descKey: "value.budget.desc" },
  { icon: Store,     titleKey: "value.suppliers.title", descKey: "value.suppliers.desc" },
  { icon: FileText,  titleKey: "value.forms.title",     descKey: "value.forms.desc" },
  { icon: Heart,     titleKey: "value.together.title",  descKey: "value.together.desc" },
];

export function ValueProps() {
  const t = useT();
  return (
    <section className="border-t bg-white">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-10 text-center">
          <h2 className="font-serif text-3xl font-semibold">{t("value.title")}</h2>
          <p className="mt-3 text-muted-foreground">{t("value.subtitle")}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, titleKey, descKey }) => (
            <div key={titleKey} className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-serif text-lg font-semibold">{t(titleKey)}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{t(descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
