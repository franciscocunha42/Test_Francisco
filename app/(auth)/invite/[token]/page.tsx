import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createAuthClient } from "@/lib/supabase/server";
import { acceptInvitation } from "@/lib/actions/invitations";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getServerT } from "@/lib/i18n/server";

export default async function InviteAcceptPage({ params }: { params: { token: string } }) {
  const supabase = createClient();
  const t = getServerT();
  const { data: invitation } = await supabase
    .from("wedding_invitations")
    .select("*, weddings(name, partner_one_name, partner_two_name)")
    .eq("token", params.token)
    .maybeSingle();

  if (!invitation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("invite.notFoundTitle")}</CardTitle>
          <CardDescription>{t("invite.notFoundDesc")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const expired = new Date(invitation.expires_at) < new Date();
  const wedding = invitation.weddings as
    | { name: string; partner_one_name: string; partner_two_name: string }
    | null;

  if (invitation.status === "revoked") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("invite.revokedTitle")}</CardTitle>
          <CardDescription>{t("invite.revokedDesc")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (expired) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("invite.expiredTitle")}</CardTitle>
          <CardDescription>{t("invite.expiredDesc")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Already accepted? Just send the user to the dashboard.
  if (invitation.status === "accepted") {
    redirect(`/${invitation.wedding_id}/dashboard`);
  }

  // Check if user is signed in (and as the right email).
  const auth = createAuthClient();
  const { data: { user } } = await auth.auth.getUser();

  const ownerLine = wedding ? `${wedding.partner_one_name} & ${wedding.partner_two_name}` : "VowPlan";
  const accessLabel = invitation.role === "viewer" ? t("invite.viewAccess") : t("invite.editAccess");

  // Not signed in — prompt to sign in or sign up with the invited email.
  if (!user) {
    const next = encodeURIComponent(`/invite/${params.token}`);
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("invite.invitedTitle")}</CardTitle>
          <CardDescription>
            {ownerLine} — <span className="font-medium">{invitation.email}</span> — <span className="font-medium">{accessLabel}</span>
            {wedding ? <> · &ldquo;{wedding.name}&rdquo;</> : null}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t("invite.signinPrompt").replace("{email}", invitation.email)}
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button asChild className="flex-1">
            <Link href={`/login?next=${next}`}>{t("invite.signIn")}</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/signup?next=${next}`}>{t("invite.createAccount")}</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Signed in but the email doesn't match — block accept.
  const userEmail = (user.email ?? "").toLowerCase();
  if (userEmail && userEmail !== invitation.email.toLowerCase()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("invite.wrongAccountTitle")}</CardTitle>
          <CardDescription>
            {t("invite.wrongAccountDesc").replace("{email}", invitation.email).replace("{other}", user.email ?? "")}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">{t("invite.switchAccount")}</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Signed in correctly — accept and redirect.
  const result = await acceptInvitation(params.token);
  if (!result.ok) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("invite.acceptFailed")}</CardTitle>
          <CardDescription>{result.error ?? t("common.somethingWrong")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  redirect(`/${result.weddingId}/dashboard`);
}
