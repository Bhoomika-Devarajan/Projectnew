import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, HelpCircle, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizViewProps {
  documentId: string;
  documentTitle: string;
  documentContent: string;
  onBack: () => void;
}

export function QuizView({ documentId, documentTitle, documentContent, onBack }: QuizViewProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);

  useEffect(() => {
    const loadOrGenerateQuiz = async () => {
      const { data: existingQuiz } = await supabase
        .from("quizzes")
        .select("questions")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existingQuiz) {
        const quizQuestions = existingQuiz.questions as unknown as { questions: Question[] };
        setQuestions(quizQuestions.questions || []);
        setAnswers(new Array(quizQuestions.questions?.length || 0).fill(null));
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("ai-assistant", {
          body: {
            action: "quiz",
            content: documentContent,
            documentTitle,
          },
        });

        if (error) throw error;

        let jsonString = data.result;
        if (jsonString.startsWith("```")) {
          jsonString = jsonString.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
        }
        
        const quizData = JSON.parse(jsonString);
        setQuestions(quizData.questions || []);
        setAnswers(new Array(quizData.questions?.length || 0).fill(null));

        await supabase.from("quizzes").insert({
          document_id: documentId,
          title: `Quiz: ${documentTitle}`,
          questions: quizData,
        });
      } catch (error) {
        console.error("Quiz error:", error);
        toast.error("Failed to generate quiz");
      } finally {
        setLoading(false);
      }
    };

    loadOrGenerateQuiz();
  }, [documentId, documentContent, documentTitle]);

  const handleSelectAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = index;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(answers[currentQuestion + 1]);
      setShowResult(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1]);
      setShowResult(false);
    }
  };

  const handleSubmit = () => {
    let correctCount = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correctCount++;
    });
    setScore(correctCount);
    setShowResult(true);
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswers(new Array(questions.length).fill(null));
  };

  const allAnswered = answers.every((a) => a !== null);
  const question = questions[currentQuestion];

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="font-semibold text-foreground">Practice Quiz</h2>
          <p className="text-sm text-muted-foreground truncate max-w-[250px]">{documentTitle}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="font-medium">Generating quiz...</p>
            <p className="text-sm text-muted-foreground">Creating questions from your material</p>
          </div>
        ) : showResult && allAnswered ? (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <span className="text-2xl font-bold text-primary">
                {score}/{questions.length}
              </span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Quiz Complete!</h3>
            <p className="text-muted-foreground mb-6">
              You got {score} out of {questions.length} correct
            </p>

            <div className="space-y-3 text-left max-w-lg mx-auto">
              {questions.map((q, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${
                    answers[i] === q.correctIndex
                      ? "border-green-500/30 bg-green-500/5"
                      : "border-destructive/30 bg-destructive/5"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {answers[i] === q.correctIndex ? (
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{q.question}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Answer: {q.options[q.correctIndex]}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={handleReset} className="mt-6">
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        ) : question ? (
          <div className="max-w-lg mx-auto">
            {/* Progress */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <div className="flex gap-1">
                {questions.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i === currentQuestion
                        ? "bg-primary"
                        : answers[i] !== null
                        ? "bg-primary/40"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Question */}
            <div className="flex items-start gap-2 mb-4">
              <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <h3 className="font-medium">{question.question}</h3>
            </div>

            {/* Options */}
            <div className="space-y-2">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    selectedAnswer === index
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedAnswer === index
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {selectedAnswer === index && (
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                    <span className="text-sm">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <Button variant="secondary" onClick={handlePrevious} disabled={currentQuestion === 0}>
                Previous
              </Button>
              <div className="flex gap-2">
                {currentQuestion < questions.length - 1 ? (
                  <Button onClick={handleNext} disabled={selectedAnswer === null}>
                    Next
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={!allAnswered}>
                    Submit Quiz
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Unable to generate quiz</p>
          </div>
        )}
      </div>
    </div>
  );
}
