import { useState, useEffect } from "react";
import { Upload, FileText, MessageSquare, BookOpen, HelpCircle, Calendar, Folder } from "lucide-react";
import { DocumentUpload } from "@/components/DocumentUpload";
import { DocumentList } from "@/components/DocumentList";
import { ChatInterface } from "@/components/ChatInterface";
import { SummaryView } from "@/components/SummaryView";
import { QuizView } from "@/components/QuizView";
import { FolderManager } from "@/components/FolderManager";
import { AnnotationsPanel } from "@/components/AnnotationsPanel";
import { StudyPlanner } from "@/components/StudyPlanner";
import { supabase } from "@/integrations/supabase/client";

interface Document {
  id: string;
  title: string;
  file_type: string;
  file_size: number;
  created_at: string;
  file_path: string;
  content: string | null;
  folder_id?: string | null;
}

interface FolderType {
  id: string;
  name: string;
  color: string;
}

type ViewMode = "home" | "chat" | "summary" | "quiz" | "annotate";

const Index = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("home");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showPlanner, setShowPlanner] = useState(false);

  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
    } else {
      setDocuments(data || []);
    }
    setLoading(false);
  };

  const fetchFolders = async () => {
    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error) {
      setFolders(data || []);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchFolders();
  }, []);

  const handleSelectDocument = async (doc: Document, action: "chat" | "summarize" | "quiz" | "annotate") => {
    let documentWithContent = doc;
    if (!doc.content) {
      documentWithContent = {
        ...doc,
        content: `Document: ${doc.title}\nType: ${doc.file_type}\nNote: This is a ${doc.file_type} file.`,
      };
    }

    setSelectedDocument(documentWithContent);
    if (action === "chat") setViewMode("chat");
    else if (action === "summarize") setViewMode("summary");
    else if (action === "quiz") setViewMode("quiz");
    else if (action === "annotate") setViewMode("annotate");
  };

  const handleBack = () => {
    setViewMode("home");
    setSelectedDocument(null);
  };

  // Chat View
  if (viewMode === "chat" && selectedDocument) {
    return (
      <div className="min-h-screen bg-background">
        <ChatInterface
          documentId={selectedDocument.id}
          documentTitle={selectedDocument.title}
          documentContent={selectedDocument.content || ""}
          onBack={handleBack}
        />
      </div>
    );
  }

  // Summary View
  if (viewMode === "summary" && selectedDocument) {
    return (
      <div className="min-h-screen bg-background">
        <SummaryView
          documentId={selectedDocument.id}
          documentTitle={selectedDocument.title}
          documentContent={selectedDocument.content || ""}
          onBack={handleBack}
        />
      </div>
    );
  }

  // Quiz View
  if (viewMode === "quiz" && selectedDocument) {
    return (
      <div className="min-h-screen bg-background">
        <QuizView
          documentId={selectedDocument.id}
          documentTitle={selectedDocument.title}
          documentContent={selectedDocument.content || ""}
          onBack={handleBack}
        />
      </div>
    );
  }

  // Annotate View
  if (viewMode === "annotate" && selectedDocument) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-3xl">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            ← Back to documents
          </button>
          <div className="bg-card rounded-lg border border-border p-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {selectedDocument.title}
            </h2>
            <AnnotationsPanel
              documentId={selectedDocument.id}
              documentContent={selectedDocument.content || ""}
            />
          </div>
        </div>
      </div>
    );
  }

  // Main Home View
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-foreground">Smart Campus Assistant</h1>
          <p className="text-muted-foreground mt-1">
            Upload study materials and use AI to learn faster
          </p>
        </div>
      </header>

      {/* Features */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="p-3 bg-card border border-border rounded-lg text-center">
            <Upload className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Upload Files</p>
            <p className="text-xs text-muted-foreground">PDF, DOCX, PPTX</p>
          </div>
          <div className="p-3 bg-card border border-border rounded-lg text-center">
            <MessageSquare className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Ask AI</p>
            <p className="text-xs text-muted-foreground">Get answers</p>
          </div>
          <div className="p-3 bg-card border border-border rounded-lg text-center">
            <BookOpen className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Summarize</p>
            <p className="text-xs text-muted-foreground">Key points</p>
          </div>
          <div className="p-3 bg-card border border-border rounded-lg text-center">
            <HelpCircle className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Quiz</p>
            <p className="text-xs text-muted-foreground">Test yourself</p>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Folders */}
            <div className="bg-card border border-border rounded-lg p-4">
              <FolderManager
                selectedFolderId={selectedFolderId}
                onSelectFolder={(id) => {
                  setSelectedFolderId(id);
                  fetchFolders();
                }}
              />
            </div>

            {/* Study Planner Toggle */}
            <button
              onClick={() => setShowPlanner(!showPlanner)}
              className={`w-full flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                showPlanner
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-foreground hover:bg-muted"
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Study Planner</span>
            </button>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Study Planner */}
            {showPlanner && (
              <div className="bg-card border border-border rounded-lg p-4">
                <StudyPlanner documents={documents} />
              </div>
            )}

            {/* Upload Section */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Upload Materials</h2>
              </div>
              <DocumentUpload onUploadComplete={() => { fetchDocuments(); fetchFolders(); }} />
            </div>

            {/* Documents Section */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Your Materials</h2>
                </div>
                {documents.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {selectedFolderId
                      ? `${documents.filter((d) => d.folder_id === selectedFolderId).length} in folder`
                      : `${documents.length} total`}
                  </span>
                )}
              </div>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                </div>
              ) : (
                <DocumentList
                  documents={documents}
                  folders={folders}
                  selectedFolderId={selectedFolderId}
                  onRefresh={() => { fetchDocuments(); fetchFolders(); }}
                  onSelectDocument={handleSelectDocument}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Smart Campus Assistant - AI Study Helper
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
