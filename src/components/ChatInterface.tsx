import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  documentId: string;
  documentTitle: string;
  documentContent: string;
  onBack: () => void;
}

export function ChatInterface({ documentId, documentTitle, documentContent, onBack }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("document_id", documentId)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(data.map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content })));
      }
    };
    loadMessages();
  }, [documentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    
    const tempUserMsg: Message = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content: userMessage,
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const { data: savedUserMsg } = await supabase
        .from("chat_messages")
        .insert({ document_id: documentId, role: "user", content: userMessage })
        .select()
        .single();

      if (savedUserMsg) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempUserMsg.id ? { ...m, id: savedUserMsg.id } : m))
        );
      }

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          action: "chat",
          content: userMessage,
          context: documentContent,
          documentTitle,
        },
      });

      if (error) throw error;

      const assistantContent = data.result;

      const { data: savedAssistantMsg } = await supabase
        .from("chat_messages")
        .insert({ document_id: documentId, role: "assistant", content: assistantContent })
        .select()
        .single();

      setMessages((prev) => [
        ...prev,
        {
          id: savedAssistantMsg?.id || `temp-assistant-${Date.now()}`,
          role: "assistant",
          content: assistantContent,
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get AI response");
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="font-semibold text-foreground">Chat with AI</h2>
          <p className="text-sm text-muted-foreground truncate max-w-[250px]">{documentTitle}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="font-medium text-foreground">Ask me anything!</p>
            <p className="text-sm text-muted-foreground">
              I can answer questions about "{documentTitle}"
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 ${message.role === "user" ? "justify-end" : ""}`}
          >
            {message.role === "assistant" && (
              <div className="p-1.5 rounded bg-primary/10 h-fit">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[80%] p-3 rounded-lg text-sm ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === "user" && (
              <div className="p-1.5 rounded bg-muted h-fit">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="p-1.5 rounded bg-primary/10 h-fit">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            className="min-h-[40px] max-h-[100px] resize-none"
            disabled={loading}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            size="icon"
            className="h-[40px] w-[40px] shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
