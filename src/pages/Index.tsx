import { useState, useCallback, useEffect } from "react";
import { Send, RotateCcw, Sparkles, GraduationCap, Calculator } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { SiteContent } from "@/components/SiteContent";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { SubjectChips } from "@/components/SubjectChips";
import { LevelSelector } from "@/components/LevelSelector";
import { ImageUpload } from "@/components/ImageUpload";
import { SolutionDisplay } from "@/components/SolutionDisplay";
import { HistorySidebar, HistoryItem } from "@/components/HistorySidebar";
import { streamSolution } from "@/lib/stream-chat";
import { useToast } from "@/hooks/use-toast";

const HISTORY_KEY = "solveit-history";

function loadHistory(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch { return []; }
}

function saveHistory(items: HistoryItem[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 20)));
}

const Index = () => {
  const [question, setQuestion] = useState("");
  const [subject, setSubject] = useState("Math");
  const [level, setLevel] = useState("Class 10");
  const [image, setImage] = useState<string | null>(null);
  const [solution, setSolution] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);
  const { toast } = useToast();

  useEffect(() => { saveHistory(history); }, [history]);

  const handleSolve = useCallback(async () => {
    if (!question.trim() && !image) {
      toast({ title: "Please enter a question or upload a photo", variant: "destructive" });
      return;
    }

    setSolution("");
    setIsStreaming(true);
    setShowSolution(true);

    let fullSolution = "";

    await streamSolution({
      request: { question, subject, level, image: image || undefined },
      onDelta: (text) => {
        fullSolution += text;
        setSolution(fullSolution);
      },
      onDone: () => {
        setIsStreaming(false);
        // Log question for analytics
        supabase.from("questions_log").insert({
          question: question || null,
          subject,
          level,
          has_image: !!image,
        }).then();
        const newItem: HistoryItem = {
          id: Date.now().toString(),
          question: question || "Image question",
          subject,
          timestamp: Date.now(),
          solution: fullSolution,
        };
        setHistory((prev) => [newItem, ...prev]);
      },
      onError: (err) => {
        setIsStreaming(false);
        toast({ title: "Error", description: err, variant: "destructive" });
      },
    });
  }, [question, subject, level, image, toast]);

  const handleReset = () => {
    setShowSolution(false);
    setSolution("");
    setQuestion("");
    setImage(null);
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setSolution(item.solution);
    setShowSolution(true);
    setIsStreaming(false);
  };

  const canSubmit = (question.trim() || image) && !isStreaming;

  return (
    <div className="min-h-screen bg-background">
      {/* Header Ad */}
      <AdSlot slot="ad_header" className="w-full" />

      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--solve-gradient)" }}>
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold leading-tight">SolveIt</h1>
            <p className="text-xs text-muted-foreground">AI Homework Helper</p>
          </div>
          
          <Link to="/marks-calculator">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Calculator className="w-3.5 h-3.5" /> Marks Calc
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Latest News */}
        <SiteContent contentKey="content_news" />

        {!showSolution ? (
          <>
            {/* Hero */}
            <div className="text-center space-y-2 py-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Powered by AI
              </div>
              <h2 className="text-2xl font-bold">
                Get step-by-step solutions
              </h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Type your question or snap a photo — get a detailed solution instantly
              </p>
            </div>

            {/* App Features */}
            <SiteContent contentKey="content_features" />

            {/* Sidebar Ad */}
            <AdSlot slot="ad_sidebar" className="w-full" />

            {/* Input Card */}
            <Card className="shadow-lg border-border/60">
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <SubjectChips selected={subject} onChange={setSubject} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Level</label>
                  <LevelSelector selected={level} onChange={setLevel} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Question</label>
                  <Textarea
                    placeholder="Type or paste your question here..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="min-h-[120px] text-[15px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canSubmit) {
                        handleSolve();
                      }
                    }}
                  />
                </div>

                <ImageUpload image={image} onImageChange={setImage} />

                <Button
                  onClick={handleSolve}
                  disabled={!canSubmit}
                  className="w-full h-12 text-base font-semibold rounded-xl shadow-lg"
                  style={{ background: canSubmit ? "var(--solve-gradient)" : undefined, boxShadow: canSubmit ? "var(--solve-glow)" : undefined }}
                >
                  <Send className="w-5 h-5 mr-2" />
                  Solve It
                </Button>
              </CardContent>
            </Card>

            {/* History */}
            <HistorySidebar
              items={history}
              onSelect={handleHistorySelect}
              onClear={() => setHistory([])}
            />
          </>
        ) : (
          <>
            {/* Solution View */}
            <Button
              variant="ghost"
              onClick={handleReset}
              className="gap-2"
              disabled={isStreaming}
            >
              <RotateCcw className="w-4 h-4" />
              Ask Another Question
            </Button>

            <Card className="shadow-lg border-border/60">
              <CardContent className="p-5">
                <SolutionDisplay content={solution} isStreaming={isStreaming} />
              </CardContent>
            </Card>
          </>
        )}

        {/* Footer Ad */}
        <AdSlot slot="ad_footer" className="w-full mt-6" />
      </main>
    </div>
  );
};

export default Index;
