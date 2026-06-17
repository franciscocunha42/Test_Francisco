import { createClient } from "@/lib/supabase/server";
import { requireWeddingMember } from "@/lib/auth";
import type { Guest, Form } from "@/lib/types/database";
import { GuestTable } from "@/components/GuestTable";
import { GuestFormDialog } from "@/components/GuestFormDialog";
import { GuestImportDialog } from "@/components/GuestImportDialog";
import { SendRsvpDialog } from "@/components/SendRsvpDialog";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Plus, Upload, CheckCircle2, Clock, XCircle, Mail } from "lucide-react";
import { getServerT } from "@/lib/i18n/server";

export default async function GuestsPage({ params }: { params: { weddingId: string } }) {
  const { weddingId } = params;
  await requireWeddingMember(weddingId);
  const supabase = createClient();
  const t = getServerT();

  const [guestsRes, rsvpFormRes] = await Promise.all([
    supabase.from("guests").select("*").eq("wedding_id", weddingId).order("last_name"),
    supabase.from("forms").select("id, public_slug").eq("wedding_id", weddingId).eq("type", "rsvp").eq("is_active", true).limit(1).maybeSingle(),
  ]);

  const allGuests = (guestsRes.data ?? []) as Guest[];
  const rsvpForm = rsvpFormRes.data as Pick<Form, "id" | "public_slug"> | null;

  const attending = allGuests.filter((g) => g.rsvp_status === "attending").length;
  const notAttending = allGuests.filter((g) => g.rsvp_status === "not_attending").length;
  const pending = allGuests.filter((g) => g.rsvp_status === "pending").length;
  const dietary = allGuests.filter((g) => !!g.dietary_requirements).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-semibold">{t("guests.title")}</h1>
          <p className="text-sm text-muted-foreground">{allGuests.length} {t("guests.totalSuffix")}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {rsvpForm && allGuests.length > 0 && (
            <SendRsvpDialog
              weddingId={weddingId}
              formId={rsvpForm.id}
              guests={allGuests}
              trigger={<Button variant="outline" size="sm"><Mail className="mr-1.5 h-3.5 w-3.5" />{t("guests.sendRsvp")}</Button>}
            />
          )}
          <GuestImportDialog weddingId={weddingId} trigger={<Button variant="outline" size="sm"><Upload className="mr-1.5 h-3.5 w-3.5" />{t("guests.importCsv")}</Button>} />
          <GuestFormDialog weddingId={weddingId} trigger={<Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />{t("guests.addGuest")}</Button>} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: t("guests.attending"),     value: attending,    icon: CheckCircle2, color: "text-emerald-600" },
          { label: t("guests.notAttending"),  value: notAttending, icon: XCircle,      color: "text-red-600" },
          { label: t("guests.pending"),       value: pending,      icon: Clock,        color: "text-amber-600" },
          { label: t("guests.dietaryNeeds"),  value: dietary,      icon: Users,        color: "text-sky-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <Icon className={`h-5 w-5 shrink-0 ${color}`} />
              <div>
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {allGuests.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t("guests.emptyTitle")}
          description={t("guests.emptyDesc")}
          action={
            <div className="flex gap-2">
              <GuestImportDialog weddingId={weddingId} trigger={<Button variant="outline"><Upload className="mr-1.5 h-4 w-4" />{t("guests.importCsv")}</Button>} />
              <GuestFormDialog weddingId={weddingId} trigger={<Button><Plus className="mr-1.5 h-4 w-4" />{t("guests.addGuest")}</Button>} />
            </div>
          }
        />
      ) : (
        <GuestTable guests={allGuests} weddingId={weddingId} />
      )}
    </div>
  );
}
