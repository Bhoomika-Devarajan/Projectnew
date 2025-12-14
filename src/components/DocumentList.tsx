import { FileText, Trash2, MessageSquare, BookOpen, HelpCircle, FolderInput, Highlighter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ShareDialog } from "./ShareDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Folder {
  id: string;
  name: string;
  color: string;
}

interface Document {
  id: string;
  title: string;
  file_type: string;
  file_size: number;
  created_at: string;
  file_path: string;
  folder_id?: string | null;
}

interface DocumentListProps {
  documents: Document[];
  folders: Folder[];
  selectedFolderId: string | null;
  onRefresh: () => void;
  onSelectDocument: (doc: Document, action: "chat" | "summarize" | "quiz" | "annotate") => void;
}

export function DocumentList({ documents, folders, selectedFolderId, onRefresh, onSelectDocument }: DocumentListProps) {
  const deleteDocument = async (doc: Document) => {
    try {
      await supabase.storage.from("documents").remove([doc.file_path]);
      const { error } = await supabase.from("documents").delete().eq("id", doc.id);
      if (error) throw error;

      toast.success("Document deleted");
      onRefresh();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document");
    }
  };

  const moveToFolder = async (docId: string, folderId: string | null) => {
    const { error } = await supabase
      .from("documents")
      .update({ folder_id: folderId })
      .eq("id", docId);

    if (error) {
      toast.error("Failed to move document");
    } else {
      toast.success(folderId ? "Moved to folder" : "Removed from folder");
      onRefresh();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const filteredDocuments = selectedFolderId
    ? documents.filter((doc) => doc.folder_id === selectedFolderId)
    : documents;

  if (filteredDocuments.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">
          {selectedFolderId ? "No documents in this folder" : "No documents yet"}
        </p>
        <p className="text-sm text-muted-foreground">
          Upload your first study material above
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredDocuments.map((doc) => {
        const folder = folders.find((f) => f.id === doc.folder_id);
        return (
          <div
            key={doc.id}
            className="group p-3 bg-muted/50 rounded-lg border border-border hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 min-w-0">
                <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h3 className="font-medium text-foreground text-sm truncate">{doc.title}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(doc.file_size)} • {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                    </p>
                    {folder && (
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ backgroundColor: `${folder.color}20`, color: folder.color }}
                      >
                        {folder.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <FolderInput className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => moveToFolder(doc.id, null)}>
                      No folder
                    </DropdownMenuItem>
                    {folders.map((f) => (
                      <DropdownMenuItem key={f.id} onClick={() => moveToFolder(doc.id, f.id)}>
                        <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: f.color }} />
                        {f.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteDocument(doc)}
                  className="h-7 w-7 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onSelectDocument(doc, "chat")}
                className="text-xs h-8"
              >
                <MessageSquare className="h-3 w-3" />
                Ask AI
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onSelectDocument(doc, "summarize")}
                className="text-xs h-8"
              >
                <BookOpen className="h-3 w-3" />
                Summarize
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onSelectDocument(doc, "quiz")}
                className="text-xs h-8"
              >
                <HelpCircle className="h-3 w-3" />
                Quiz
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onSelectDocument(doc, "annotate")}
                className="text-xs h-8"
              >
                <Highlighter className="h-3 w-3" />
                Notes
              </Button>
              <ShareDialog documentId={doc.id} documentTitle={doc.title} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
