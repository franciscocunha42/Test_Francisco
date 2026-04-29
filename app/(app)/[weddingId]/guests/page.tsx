import { createClient } from "@/lib/supabase/server";
import { requireWeddingMember } from "@/lib/auth";
import type { Guest } from "@/lib/types/database";
import { GuestTable } from "@/components/GuestTable";
import { GuestFormDialog } from "@/components/GuestFormDialog";
import { GuestImportDialog } from "@/components/GuestImportDialog";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Plus, Upload, CheckCircle2, Clock, XCircle } from "lucide-react";

export default async function GuestsPage({ params }: { params: { weddingId: string } }) {
  const { weddingId } = params;
  await requireWeddingMember(weddingId);
  const supabase = createClient();

  const { data: guestsData } = await supabase
    .from("guests")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("last_name");

  const allGuests = (guestsData ?? []) as Guest[];
  const attending = allGuests.filter((g) => g.rsvp_status === "attending").length;
  const notAttending = allGuests.filter((g) => g.rsvp_status === "not_attending").length;
  const pending = allGuests.filter((g) => g.rsvp_status === "pending").length;
  const dietary = allGuests.filter((g) => !!g.dietary_requirements).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Guests & RSVP</h1>
          <p className="text-sm text-muted-foreground">{allGuests.length} guests total</p>
        </div>
        <div className="flex gap-2">
          <GuestImportDialog weddingId={weddingId} trigger={<Button variant="outline" size="sm"><Upload className="mr-1.5 h-3.5 w-3.5" />Import CSV</Button>} />
          <GuestFormDialog weddingId={weddingId} trigger={<Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />Add Guest</Button>} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Attending",     value: attending,    icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Not Attending", value: notAttending, icon: XCircle,      color: "text-red-600" },
          { label: "Pending",       value: pending,      icon: Clock,        color: "text-amber-600" },
          { label: "Dietary Needs", value: dietary,      icon: Users,        color: "text-sky-600" },
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
          title="No guests yet"
          description="Add guests manually or import from a CSV file."
          action={
            <div className="flex gap-2">
              <GuestImportDialog weddingId={weddingId} trigger={<Button variant="outline"><Upload className="mr-1.5 h-4 w-4" />Import CSV</Button>} />
              <GuestFormDialog weddingId={weddingId} trigger={<Button><Plus className="mr-1.5 h-4 w-4" />Add Guest</Button>} />
            </div>
          }
        />
      ) : (
        <GuestTable guests={allGuests} weddingId={weddingId} />
      )}
    </div>
  );
}
