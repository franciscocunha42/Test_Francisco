"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Cloud, Download, Mail, Save } from "lucide-react";
import { GuestAppShell } from "@/components/GuestAppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGuestStore } from "@/lib/guest-store/store";
import { useRequireAuth } from "@/lib/guest-store/use-require-auth";
import { exportToCsv } from "@/lib/utils/csv";

export default function GuestSettingsPage() {
  const router = useRouter();
  const { guard } = useRequireAuth();
  const wedding = useGuestStore((s) => s.wedding);
  const updateWedding = useGuestStore((s) => s.updateWedding);
  const guests = useGuestStore((s) => s.guests);
  const expenses = useGuestStore((s) => s.expenses);

  const [name, setName] = useState("");
  const [partnerOne, setPartnerOne] = useState("");
  const [partnerTwo, setPartnerTwo] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("0");
  const [currency, setCurrency] = useState("USD");
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    if (!wedding) {
      router.replace("/plan");
      return;
    }
    setName(wedding.name);
    setPartnerOne(wedding.partner_one_name);
    setPartnerTwo(wedding.partner_two_name);
    setDate(wedding.wedding_date ?? "");
    setVenue(wedding.venue_name ?? "");
    setLocation(wedding.location ?? "");
    setBudget(String(wedding.total_budget));
    setCurrency(wedding.currency);
  }, [wedding, router]);

  if (!wedding) return null;

  function handleSaveLocal() {
    updateWedding({
      name,
      partner_one_name: partnerOne,
      partner_two_name: partnerTwo,
      wedding_date: date || null,
      venue_name: venue || null,
      location: location || null,
      total_budget: Number(budget) || 0,
      currency,
    });
    toast.success("Saved on this device");
  }

  return (
    <GuestAppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">Edit your wedding details and save your work</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Save your wedding to the cloud</CardTitle>
            <CardDescription>
              Right now your planning lives on this device only. Save to the
              cloud to access from anywhere and share with your partner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => guard("save your wedding")}>
              <Cloud className="mr-2 h-4 w-4" />
              Save to cloud
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Wedding Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Your Name</Label>
                <Input value={partnerOne} onChange={(e) => setPartnerOne(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Partner&apos;s Name</Label>
                <Input value={partnerTwo} onChange={(e) => setPartnerTwo(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Wedding Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Wedding Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Budget</Label>
                <Input type="number" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Currency</Label>
                <Input value={currency} maxLength={3} onChange={(e) => setCurrency(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Venue</Label>
                <Input value={venue} onChange={(e) => setVenue(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div>
              <Button onClick={handleSaveLocal} variant="outline">
                <Save className="mr-2 h-4 w-4" />
                Save changes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite a partner or planner</CardTitle>
            <CardDescription>Sign up first so we can send invitations.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="partner@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <Button onClick={() => guard("invite a partner or planner")}>
                <Mail className="mr-2 h-4 w-4" />
                Invite
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Export Data</CardTitle>
            <CardDescription>Download your guest list or expenses as CSV.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => guard("export your guest list", () => {
                  exportToCsv(guests as unknown as Record<string, unknown>[], "guests.csv");
                })}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Guests CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => guard("export your expenses", () => {
                  exportToCsv(expenses as unknown as Record<string, unknown>[], "expenses.csv");
                })}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Expenses CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </GuestAppShell>
  );
}
