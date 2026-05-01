import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth";
import { Hero } from "@/components/marketing/Hero";
import { ValueProps } from "@/components/marketing/ValueProps";
import { Testimonials } from "@/components/marketing/Testimonials";

export default async function LandingPage() {
  const user = await getUser();
  const isAuthed = !!user;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-primary fill-primary" />
          <span className="font-serif text-base font-semibold text-primary">VowPlan</span>
        </Link>
        <div className="flex items-center gap-2">
          {isAuthed ? (
            <Button size="sm" variant="ghost" asChild>
              <Link href="/onboarding">Workspace</Link>
            </Button>
          ) : (
            <>
              <Button size="sm" variant="ghost" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/plan">Start Planning</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <Hero isAuthed={isAuthed} />
      <ValueProps />
      <Testimonials />

      <section className="border-t bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="font-serif text-3xl font-semibold">Ready to start?</h2>
          <p className="mt-3 text-muted-foreground">No credit card. No commitment. Save to the cloud whenever you&apos;re ready.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {isAuthed ? (
              <Button size="lg" asChild>
                <Link href="/onboarding">Continue to your workspace</Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link href="/plan">Start Planning My Wedding</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">Log In</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} VowPlan</span>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground">Log In</Link>
            <Link href="/signup" className="hover:text-foreground">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
