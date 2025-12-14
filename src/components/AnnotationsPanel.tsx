import { useState, useEffect } from "react";
import { Highlighter, Trash2, StickyNote, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Annotation {
  id: string;
  document_id: string;
  highlighted_text: string;
  note: string | null;
  color: string;
  created_at: string;
}

interface AnnotationsPanelProps {
  documentId: string;
  documentContent: string;
}

const HIGHLIGHT_COLORS = [
  "#fbbf24", "#34d399", "#60a5fa", "#f472b6", "#a78bfa"
];

export function AnnotationsPanel({ documentId, documentContent }: AnnotationsPanelProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [highlightedText, setHighlightedText] = useState("");
  const [note, setNote] = useState("");
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0]);

  const fetchAnnotations = async () => {
    const { data, error } = await supabase
      .from("annotations")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching annotations:", error);
    } else {
      setAnnotations(data || []);
    }
  };

  useEffect(() => {
    fetchAnnotations();
  }, [documentId]);

  const addAnnotation = async () => {
    if (!highlightedText.trim()) {
      toast.error("Please enter text to highlight");
      return;
    }

    const { error } = await supabase
      .from("annotations")
      .insert({
        document_id: documentId,
        highlighted_text: highlightedText.trim(),
        note: note.trim() || null,
        color: selectedColor,
      });

    if (error) {
      toast.error("Failed to add annotation");
    } else {
      toast.success("Annotation added");
      setHighlightedText("");
      setNote("");
      setIsAdding(false);
      fetchAnnotations();
    }
  };

  const deleteAnnotation = async (id: string) => {
    const { error } = await supabase
      .from("annotations")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete annotation");
    } else {
      toast.success("Annotation deleted");
      fetchAnnotations();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Highlighter className="h-4 w-4 text-primary" />
          <h3 className="font-medium">Highlights & Notes</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? "Cancel" : <><Plus className="h-3 w-3 mr-1" /> Add</>}
        </Button>
      </div>

      {isAdding && (
        <div className="p-3 bg-muted rounded-lg space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Text to highlight
            </label>
            <Textarea
              placeholder="Enter or paste the text you want to highlight..."
              value={highlightedText}
              onChange={(e) => setHighlightedText(e.target.value)}
              className="min-h-[60px] text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Note (optional)
            </label>
            <Input
              placeholder="Add a note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Color:</span>
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-5 h-5 rounded-full ${
                  selectedColor === color ? "ring-2 ring-offset-1 ring-primary" : ""
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <Button onClick={addAnnotation} className="w-full" size="sm">
            Save Annotation
          </Button>
        </div>
      )}

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {annotations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No highlights yet. Add your first annotation above.
          </p>
        ) : (
          annotations.map((annotation) => (
            <div
              key={annotation.id}
              className="group p-3 bg-card rounded-md border border-border"
            >
              <div className="flex items-start gap-2">
                <div
                  className="w-1 self-stretch rounded-full shrink-0"
                  style={{ backgroundColor: annotation.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ backgroundColor: `${annotation.color}40` }}>
                    "{annotation.highlighted_text}"
                  </p>
                  {annotation.note && (
                    <div className="flex items-start gap-1 mt-2">
                      <StickyNote className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">{annotation.note}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(annotation.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteAnnotation(annotation.id)}
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
