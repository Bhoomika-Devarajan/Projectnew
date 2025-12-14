import { useState, useEffect } from "react";
import { Share2, Copy, Check, Link, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ShareDialogProps {
  documentId: string;
  documentTitle: string;
}

function generateShareCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function ShareDialog({ documentId, documentTitle }: ShareDialogProps) {
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  const fetchOrCreateShare = async () => {
    setLoading(true);
    
    const { data: existing } = await supabase
      .from("shares")
      .select("share_code")
      .eq("document_id", documentId)
      .maybeSingle();

    if (existing) {
      setShareCode(existing.share_code);
    } else {
      const newCode = generateShareCode();
      const { error } = await supabase
        .from("shares")
        .insert({
          document_id: documentId,
          share_code: newCode,
          share_type: "document",
        });

      if (error) {
        toast.error("Failed to create share link");
      } else {
        setShareCode(newCode);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrCreateShare();
  }, [documentId]);

  const shareUrl = shareCode 
    ? `${window.location.origin}?share=${shareCode}` 
    : "";

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaEmail = () => {
    if (!email.trim()) {
      toast.error("Please enter an email");
      return;
    }
    const subject = encodeURIComponent(`Check out: ${documentTitle}`);
    const body = encodeURIComponent(
      `I wanted to share this study material with you:\n\n${documentTitle}\n\nView it here: ${shareUrl}`
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
    toast.success("Opening email...");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs h-8">
          <Share2 className="h-3 w-3" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
          <DialogDescription>
            Share "{documentTitle}" with classmates
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Link className="h-4 w-4" />
              Share Link
            </label>
            <div className="flex gap-2">
              <Input
                value={loading ? "Generating..." : shareUrl}
                readOnly
                className="flex-1 text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                disabled={loading || !shareCode}
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can view the document
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <label className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Share via Email
            </label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="classmate@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 text-sm"
              />
              <Button onClick={shareViaEmail} disabled={!shareCode} size="sm">
                Send
              </Button>
            </div>
          </div>

          {shareCode && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center">
                Share Code: <span className="font-mono font-bold">{shareCode}</span>
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
