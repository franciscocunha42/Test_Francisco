import { getUser } from "@/lib/auth";
import { Hero } from "@/components/marketing/Hero";
import { ValueProps } from "@/components/marketing/ValueProps";
import { Testimonials } from "@/components/marketing/Testimonials";
import {
  LandingHeader,
  LandingCallToAction,
  LandingFooter,
} from "@/components/marketing/LandingChrome";

export default async function LandingPage() {
  const user = await getUser();
  const isAuthed = !!user;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <LandingHeader isAuthed={isAuthed} />
      <Hero isAuthed={isAuthed} />
      <ValueProps />
      <Testimonials />
      <LandingCallToAction isAuthed={isAuthed} />
      <LandingFooter />
    </div>
  );
}
