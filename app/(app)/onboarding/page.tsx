import { redirect } from "next/navigation";
import { requireUser, getUserWeddings, getLatestWeddingId } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { CreateWeddingForm } from "@/components/CreateWeddingForm";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { new?: string };
}) {
  await requireUser();
  const memberships = await getUserWeddings();

  // Auto-redirect returning users to their most recent wedding unless they
  // explicitly want to create a new one (?new=1 from WeddingSwitcher).
  if (memberships.length > 0 && searchParams.new !== "1") {
    const latestId = await getLatestWeddingId();
    if (latestId) redirect(`/${latestId}/dashboard`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-champagne-50 to-white p-4">
      <div className="mb-8 flex items-center gap-2">
        <Heart className="h-6 w-6 text-primary fill-primary" />
        <span className="font-serif text-2xl font-semibold text-primary">VowPlan</span>
      </div>

      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>{memberships.length > 0 ? "Create New Wedding" : "Create Your Wedding"}</CardTitle>
            <CardDescription>Set up your wedding workspace to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateWeddingForm hasWeddings={memberships.length > 0} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
