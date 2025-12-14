import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, BookOpen, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SummaryViewProps {
  documentId: string;
  documentTitle: string;
  documentContent: string;
  onBack: () => void;
}

export function SummaryView({ documentId, documentTitle, documentContent, onBack }: SummaryViewProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadOrGenerateSummary = async () => {
      const { data: existingSummary } = await supabase
        .from("summaries")
        .select("content")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existingSummary) {
        setSummary(existingSummary.content);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("ai-assistant", {
          body: {
            action: "summarize",
            content: documentContent,
            documentTitle,
          },
        });

        if (error) throw error;

        const summaryContent = data.result;
        setSummary(summaryContent);

        await supabase.from("summaries").insert({
          document_id: documentId,
          content: summaryContent,
        });
      } catch (error) {
        console.error("Summary error:", error);
        toast.error("Failed to generate summary");
      } finally {
        setLoading(false);
      }
    };

    loadOrGenerateSummary();
  }, [documentId, documentContent, documentTitle]);

  const copySummary = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="font-semibold text-foreground">Document Summary</h2>
            <p className="text-sm text-muted-foreground truncate max-w-[250px]">{documentTitle}</p>
          </div>
        </div>
        {summary && (
          <Button variant="secondary" size="sm" onClick={copySummary}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="font-medium">Generating summary...</p>
            <p className="text-sm text-muted-foreground">This may take a moment</p>
          </div>
        ) : summary ? (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Key Points</h3>
            </div>
            <div className="whitespace-pre-wrap text-foreground leading-relaxed">
              {summary}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Unable to generate summary</p>
          </div>
        )}
      </div>
    </div>
  );
}
