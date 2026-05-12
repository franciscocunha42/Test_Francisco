"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Mail, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { draftInitialOutreach, draftReply } from "@/lib/actions/vendor-email";
import { useT } from "@/lib/i18n/provider";

interface VendorEmailDialogProps {
  weddingId: string;
  vendor: { id: string; name: string; email: string | null };
  trigger?: React.ReactNode;
}

export function VendorEmailDialog({ weddingId, vendor, trigger }: VendorEmailDialogProps) {
  const t = useT();
  const [open, setOpen] = useState(false);

  // Compose tab
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [composeUsedAI, setComposeUsedAI] = useState(false);
  const [composing, startComposing] = useTransition();

  // Reply tab
  const [vendorReply, setVendorReply] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [replyUsedAI, setReplyUsedAI] = useState(false);
  const [drafting, startDrafting] = useTransition();

  function handleCompose() {
    startComposing(async () => {
      const result = await draftInitialOutreach(weddingId, vendor.id);
      if (!result.ok) { toast.error(result.error); return; }
      setSubject(result.draft.subject);
      setBody(result.draft.body);
      setComposeUsedAI(result.usedAI);
      if (!result.usedAI) {
        toast.message(t("vendorEmail.usingTemplate"));
      }
    });
  }

  function handleDraftReply() {
    if (!vendorReply.trim()) { toast.error(t("vendorEmail.pasteFirst")); return; }
    startDrafting(async () => {
      const result = await draftReply(weddingId, vendor.id, body, vendorReply);
      if (!result.ok) { toast.error(result.error); return; }
      setReplyDraft(result.body);
      setReplyUsedAI(result.usedAI);
      if (!result.usedAI) {
        toast.message(t("vendorEmail.usingTemplateReply"));
      }
    });
  }

  function copyToClipboard(text: string, label: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(
      () => toast.success(t("vendorEmail.copied").replace("{label}", label)),
      () => toast.error(t("vendorEmail.copyFailed")),
    );
  }

  function buildMailto(to: string, sub: string, content: string): string {
    const params = new URLSearchParams();
    if (sub) params.set("subject", sub);
    if (content) params.set("body", content);
    return `mailto:${to}?${params.toString()}`;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" title={t("suppliers.emailVendor")}>
            <Mail className="h-3.5 w-3.5" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {t("vendorEmail.titlePrefix")} — {vendor.name}
          </DialogTitle>
          <DialogDescription>
            {vendor.email
              ? <>{t("vendorEmail.descWithEmail")} <span className="font-medium">{vendor.email}</span>.</>
              : <>{t("vendorEmail.descNoEmail")}</>}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="compose" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="compose">{t("vendorEmail.tabCompose")}</TabsTrigger>
            <TabsTrigger value="reply">{t("vendorEmail.tabReply")}</TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-3">
            {!subject && !body ? (
              <div className="rounded-md border bg-muted/30 p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("vendorEmail.composeIntro")}
                </p>
                <Button onClick={handleCompose} disabled={composing} className="mt-3">
                  <Wand2 className="mr-1.5 h-4 w-4" />
                  {composing ? t("vendorEmail.drafting") : t("vendorEmail.draftBtn")}
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <Label htmlFor="vendor-email-subject">{t("vendorEmail.subject")}</Label>
                  <Input id="vendor-email-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="vendor-email-body">{t("vendorEmail.emailLabel")}</Label>
                  <Textarea
                    id="vendor-email-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={12}
                    className="font-sans"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {composeUsedAI ? t("vendorEmail.draftedByClaude") : t("vendorEmail.templateDraft")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleCompose} disabled={composing}>
                      <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                      {composing ? t("vendorEmail.regenerating") : t("vendorEmail.regenerate")}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(`${t("vendorEmail.subject")}: ${subject}\n\n${body}`, t("vendorEmail.emailLabel"))}>
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      {t("vendorEmail.copy")}
                    </Button>
                    {vendor.email && (
                      <Button asChild size="sm">
                        <a href={buildMailto(vendor.email, subject, body)} target="_blank" rel="noopener noreferrer">
                          <Mail className="mr-1.5 h-3.5 w-3.5" />
                          {t("vendorEmail.openInMail")}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="reply" className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {t("vendorEmail.replyIntro")}
            </p>
            <div className="space-y-1">
              <Label htmlFor="vendor-email-incoming">{t("vendorEmail.replyLabel")}</Label>
              <Textarea
                id="vendor-email-incoming"
                value={vendorReply}
                onChange={(e) => setVendorReply(e.target.value)}
                rows={6}
                placeholder={t("vendorEmail.replyPlaceholder")}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleDraftReply} disabled={drafting || !vendorReply.trim()}>
                <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                {drafting ? t("vendorEmail.drafting") : t("vendorEmail.draftReply")}
              </Button>
            </div>

            {replyDraft && (
              <div className="space-y-2 border-t pt-3">
                <Label htmlFor="vendor-email-reply">{t("vendorEmail.suggestedReply")}</Label>
                <Textarea
                  id="vendor-email-reply"
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  rows={10}
                  className="font-sans"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {replyUsedAI ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="h-3 w-3 text-emerald-500" /> {t("vendorEmail.draftedByClaude")}
                      </span>
                    ) : (
                      t("vendorEmail.templateDraft")
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(replyDraft, t("vendorEmail.draftReply"))}>
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      {t("vendorEmail.copy")}
                    </Button>
                    {vendor.email && (
                      <Button asChild size="sm">
                        <a
                          href={buildMailto(vendor.email, subject ? `Re: ${subject}` : `Re: ${t("vendorEmail.titlePrefix")}`, replyDraft)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Mail className="mr-1.5 h-3.5 w-3.5" />
                          {t("vendorEmail.openInMail")}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
