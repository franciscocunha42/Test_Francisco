import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createAuthClient } from "@/lib/supabase/server";
import { acceptInvitation } from "@/lib/actions/invitations";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function InviteAcceptPage({ params }: { params: { token: string } }) {
  const supabase = createClient();
  const { data: invitation } = await supabase
    .from("wedding_invitations")
    .select("*, weddings(name, partner_one_name, partner_two_name)")
    .eq("token", params.token)
    .maybeSingle();

  if (!invitation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invitation not found</CardTitle>
          <CardDescription>
            This invitation link is invalid or has been removed.
          </CardDescription>
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
          <CardTitle>Invitation revoked</CardTitle>
          <CardDescription>
            The workspace owner has cancelled this invitation. Ask them to send a new one if you still need access.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (expired) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invitation expired</CardTitle>
          <CardDescription>
            This invitation expired on {new Date(invitation.expires_at).toLocaleDateString()}. Ask the workspace owner to send a new one.
          </CardDescription>
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

  const ownerLine = wedding ? `${wedding.partner_one_name} & ${wedding.partner_two_name}` : "Wedding workspace";
  const accessLabel = invitation.role === "viewer" ? "view" : "edit and view";

  // Not signed in — prompt to sign in or sign up with the invited email.
  if (!user) {
    const next = encodeURIComponent(`/invite/${params.token}`);
    return (
      <Card>
        <CardHeader>
          <CardTitle>You&apos;ve been invited</CardTitle>
          <CardDescription>
            {ownerLine} have invited <span className="font-medium">{invitation.email}</span> to{" "}
            <span className="font-medium">{accessLabel}</span> their wedding workspace
            {wedding ? <> — &ldquo;{wedding.name}&rdquo;</> : null}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sign in or create an account with <span className="font-medium">{invitation.email}</span> to accept.
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button asChild className="flex-1">
            <Link href={`/login?next=${next}`}>Sign in</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/signup?next=${next}`}>Create account</Link>
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
          <CardTitle>Wrong account</CardTitle>
          <CardDescription>
            This invitation was sent to <span className="font-medium">{invitation.email}</span>,
            but you&apos;re signed in as <span className="font-medium">{user.email}</span>.
            Sign out and sign back in with the invited email to accept.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Switch account</Link>
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
          <CardTitle>Couldn&apos;t accept invitation</CardTitle>
          <CardDescription>{result.error ?? "Something went wrong."}</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  redirect(`/${result.weddingId}/dashboard`);
}
