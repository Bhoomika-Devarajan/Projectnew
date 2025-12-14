import { useState, useEffect } from "react";
import { Folder, Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FolderType {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

interface FolderManagerProps {
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
}

const FOLDER_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", 
  "#f97316", "#eab308", "#22c55e", "#06b6d4"
];

export function FolderManager({ selectedFolderId, onSelectFolder }: FolderManagerProps) {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);

  const fetchFolders = async () => {
    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching folders:", error);
    } else {
      setFolders(data || []);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    const { error } = await supabase
      .from("folders")
      .insert({ name: newFolderName.trim(), color: selectedColor });

    if (error) {
      toast.error("Failed to create folder");
    } else {
      toast.success("Folder created");
      setNewFolderName("");
      setIsCreating(false);
      fetchFolders();
    }
  };

  const deleteFolder = async (folderId: string) => {
    const { error } = await supabase
      .from("folders")
      .delete()
      .eq("id", folderId);

    if (error) {
      toast.error("Failed to delete folder");
    } else {
      toast.success("Folder deleted");
      if (selectedFolderId === folderId) {
        onSelectFolder(null);
      }
      fetchFolders();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Folders</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCreating(!isCreating)}
          className="h-7 w-7 p-0"
        >
          {isCreating ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      {isCreating && (
        <div className="p-3 bg-muted rounded-lg space-y-3">
          <Input
            placeholder="Folder name..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createFolder()}
            className="h-8"
          />
          <div className="flex gap-1">
            {FOLDER_COLORS.map((color) => (
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
          <Button size="sm" onClick={createFolder} className="w-full h-8">
            <Check className="h-3 w-3 mr-1" /> Create
          </Button>
        </div>
      )}

      <div className="space-y-1">
        <button
          onClick={() => onSelectFolder(null)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
            selectedFolderId === null
              ? "bg-primary/10 text-primary"
              : "hover:bg-muted text-muted-foreground"
          }`}
        >
          <Folder className="h-4 w-4" />
          All Documents
        </button>
        {folders.map((folder) => (
          <div
            key={folder.id}
            className={`group flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer ${
              selectedFolderId === folder.id
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted text-muted-foreground"
            }`}
            onClick={() => onSelectFolder(folder.id)}
          >
            <Folder className="h-4 w-4" style={{ color: folder.color }} />
            <span className="flex-1 truncate">{folder.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteFolder(folder.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded"
            >
              <X className="h-3 w-3 text-destructive" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
