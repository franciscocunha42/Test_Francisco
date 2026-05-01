import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  isAuthed: boolean;
}

export function Hero({ isAuthed }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-champagne-50 via-white to-white">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24 text-center">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Heart className="h-5 w-5 text-primary fill-primary" />
          <span className="font-serif text-xl font-semibold text-primary">VowPlan</span>
        </div>
        <h1 className="font-serif text-4xl md:text-6xl font-semibold tracking-tight text-foreground">
          Your whole wedding,
          <br />
          planned in one place.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base md:text-lg text-muted-foreground">
          Build your timeline, manage your guest list, track your budget, and
          collect RSVPs — without paying a planner. Free to start, no
          credit card, no commitment.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {isAuthed ? (
            <Button size="lg" asChild>
              <Link href="/onboarding">
                Continue to your workspace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button size="lg" asChild>
                <Link href="/plan">
                  Start Planning My Wedding
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Log In</Link>
              </Button>
            </>
          )}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          {isAuthed
            ? "You're signed in."
            : "No account needed to start. Save your work to the cloud whenever you're ready."}
        </p>
      </div>
    </section>
  );
}
