import { Calendar, Users, PiggyBank, Store, FileText, Heart } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Smart timeline",
    description: "Auto-generated checklist based on your wedding date, with priorities you can drag and drop.",
  },
  {
    icon: Users,
    title: "Guest list & RSVP",
    description: "Track invitations, dietary needs, plus-ones, and meal choices — all in one searchable table.",
  },
  {
    icon: PiggyBank,
    title: "Budget tracker",
    description: "Planned vs. actual spend at a glance, with category breakdowns and over-budget alerts.",
  },
  {
    icon: Store,
    title: "Suppliers & quotes",
    description: "Compare vendors side-by-side. Move them through your pipeline from researching to booked.",
  },
  {
    icon: FileText,
    title: "Custom RSVP forms",
    description: "Build a public RSVP form with your own questions. Share with one link.",
  },
  {
    icon: Heart,
    title: "Plan together",
    description: "Invite your partner and your planner. Everyone stays in sync.",
  },
];

export function ValueProps() {
  return (
    <section className="border-t bg-white">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-10 text-center">
          <h2 className="font-serif text-3xl font-semibold">Everything you need, nothing you don&apos;t.</h2>
          <p className="mt-3 text-muted-foreground">Built for couples who want one place to keep it all.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-serif text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
