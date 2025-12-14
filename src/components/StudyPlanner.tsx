import { useState, useEffect } from "react";
import { Calendar, Clock, Plus, Trash2, Check, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";

interface StudyPlan {
  id: string;
  title: string;
  document_id: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  duration_minutes: number;
  completed: boolean;
  notes: string | null;
  created_at: string;
}

interface Document {
  id: string;
  title: string;
}

interface StudyPlannerProps {
  documents: Document[];
}

export function StudyPlanner({ documents }: StudyPlannerProps) {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<string>("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [notes, setNotes] = useState("");

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from("study_plans")
      .select("*")
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true });

    if (error) {
      console.error("Error fetching study plans:", error);
    } else {
      setPlans(data || []);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const createPlan = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    const { error } = await supabase.from("study_plans").insert({
      title: title.trim(),
      document_id: selectedDocument || null,
      scheduled_date: date,
      scheduled_time: time || null,
      duration_minutes: parseInt(duration) || 30,
      notes: notes.trim() || null,
    });

    if (error) {
      toast.error("Failed to create study plan");
    } else {
      toast.success("Study session scheduled!");
      setTitle("");
      setSelectedDocument("");
      setTime("");
      setDuration("30");
      setNotes("");
      setIsAdding(false);
      fetchPlans();
    }
  };

  const toggleComplete = async (plan: StudyPlan) => {
    const { error } = await supabase
      .from("study_plans")
      .update({ completed: !plan.completed })
      .eq("id", plan.id);

    if (error) {
      toast.error("Failed to update");
    } else {
      fetchPlans();
    }
  };

  const deletePlan = async (id: string) => {
    const { error } = await supabase.from("study_plans").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Study session removed");
      fetchPlans();
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  };

  const groupedPlans = plans.reduce((acc, plan) => {
    const key = plan.scheduled_date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(plan);
    return acc;
  }, {} as Record<string, StudyPlan[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Study Planner</h3>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "outline" : "default"} size="sm">
          {isAdding ? "Cancel" : <><Plus className="h-4 w-4 mr-1" /> Add</>}
        </Button>
      </div>

      {isAdding && (
        <div className="p-3 bg-muted rounded-lg space-y-3">
          <Input
            placeholder="Study session title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          
          <select
            value={selectedDocument}
            onChange={(e) => setSelectedDocument(e.target.value)}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="">No document linked</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>{doc.title}</option>
            ))}
          </select>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-8"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Time</label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-8"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Minutes</label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="5"
                step="5"
                className="h-8"
              />
            </div>
          </div>

          <Textarea
            placeholder="Notes (optional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[50px]"
          />

          <Button onClick={createPlan} className="w-full" size="sm">
            Schedule Session
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {Object.keys(groupedPlans).length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No study sessions scheduled</p>
          </div>
        ) : (
          Object.entries(groupedPlans).map(([dateKey, dayPlans]) => (
            <div key={dateKey} className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <span className={isPast(parseISO(dateKey)) && !isToday(parseISO(dateKey)) ? "text-destructive" : ""}>
                  {getDateLabel(dateKey)}
                </span>
                {isToday(parseISO(dateKey)) && (
                  <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded">
                    Today
                  </span>
                )}
              </h4>
              {dayPlans.map((plan) => {
                const linkedDoc = documents.find((d) => d.id === plan.document_id);
                return (
                  <div
                    key={plan.id}
                    className={`group flex items-start gap-2 p-2 rounded-md border ${
                      plan.completed
                        ? "bg-muted/50 border-border opacity-60"
                        : "bg-card border-border"
                    }`}
                  >
                    <button
                      onClick={() => toggleComplete(plan)}
                      className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
                        plan.completed
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground"
                      }`}
                    >
                      {plan.completed && <Check className="h-2.5 w-2.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${plan.completed ? "line-through" : ""}`}>
                        {plan.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {plan.scheduled_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {plan.scheduled_time.slice(0, 5)}
                          </span>
                        )}
                        <span>{plan.duration_minutes} min</span>
                        {linkedDoc && (
                          <span className="flex items-center gap-1 text-primary">
                            <BookOpen className="h-3 w-3" />
                            {linkedDoc.title}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deletePlan(plan.id)}
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
