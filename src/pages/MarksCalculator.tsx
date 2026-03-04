import { useState } from "react";
import { GraduationCap, Calculator, ArrowLeftRight, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";

function PercentageCalc() {
  const [obtained, setObtained] = useState("");
  const [total, setTotal] = useState("");

  const pct = obtained && total && Number(total) > 0
    ? ((Number(obtained) / Number(total)) * 100).toFixed(2)
    : null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Enter marks obtained and total marks to get your percentage.</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Marks Obtained</label>
          <Input type="number" placeholder="e.g. 85" value={obtained} onChange={e => setObtained(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Total Marks</label>
          <Input type="number" placeholder="e.g. 100" value={total} onChange={e => setTotal(e.target.value)} />
        </div>
      </div>
      {pct !== null && (
        <div className="rounded-xl p-4 text-center" style={{ background: "var(--solve-gradient)" }}>
          <p className="text-white/80 text-sm">Your Percentage</p>
          <p className="text-3xl font-bold text-white">{pct}%</p>
        </div>
      )}
    </div>
  );
}

function CgpaConverter() {
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<"cgpa-to-pct" | "pct-to-cgpa">("cgpa-to-pct");

  const result = value
    ? mode === "cgpa-to-pct"
      ? (Number(value) * 9.5).toFixed(2)
      : (Number(value) / 9.5).toFixed(2)
    : null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">CBSE 10-point CGPA scale (multiply/divide by 9.5).</p>
      <div className="flex gap-2">
        <Button
          variant={mode === "cgpa-to-pct" ? "default" : "outline"}
          size="sm"
          onClick={() => { setMode("cgpa-to-pct"); setValue(""); }}
          className="text-xs"
        >
          CGPA → %
        </Button>
        <Button
          variant={mode === "pct-to-cgpa" ? "default" : "outline"}
          size="sm"
          onClick={() => { setMode("pct-to-cgpa"); setValue(""); }}
          className="text-xs"
        >
          % → CGPA
        </Button>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          {mode === "cgpa-to-pct" ? "Enter CGPA (e.g. 9.2)" : "Enter Percentage (e.g. 87.4)"}
        </label>
        <Input type="number" step="0.01" placeholder={mode === "cgpa-to-pct" ? "9.2" : "87.4"} value={value} onChange={e => setValue(e.target.value)} />
      </div>
      {result !== null && (
        <div className="rounded-xl p-4 text-center" style={{ background: "var(--solve-gradient)" }}>
          <p className="text-white/80 text-sm">{mode === "cgpa-to-pct" ? "Percentage" : "CGPA"}</p>
          <p className="text-3xl font-bold text-white">
            {mode === "cgpa-to-pct" ? `${result}%` : result}
          </p>
        </div>
      )}
    </div>
  );
}

interface SubjectEntry {
  name: string;
  marks: string;
  total: string;
}

function GradeCalc() {
  const [subjects, setSubjects] = useState<SubjectEntry[]>([
    { name: "", marks: "", total: "100" },
    { name: "", marks: "", total: "100" },
    { name: "", marks: "", total: "100" },
  ]);

  const updateSubject = (i: number, field: keyof SubjectEntry, val: string) => {
    setSubjects(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  };

  const addSubject = () => setSubjects(prev => [...prev, { name: "", marks: "", total: "100" }]);
  const removeSubject = (i: number) => setSubjects(prev => prev.filter((_, idx) => idx !== i));

  const validSubjects = subjects.filter(s => s.marks && s.total && Number(s.total) > 0);
  const totalObtained = validSubjects.reduce((sum, s) => sum + Number(s.marks), 0);
  const totalMax = validSubjects.reduce((sum, s) => sum + Number(s.total), 0);
  const overallPct = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) : null;

  const getGrade = (pct: number) => {
    if (pct >= 90) return "A1";
    if (pct >= 80) return "A2";
    if (pct >= 70) return "B1";
    if (pct >= 60) return "B2";
    if (pct >= 50) return "C1";
    if (pct >= 40) return "C2";
    if (pct >= 33) return "D";
    return "E (Fail)";
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Add your subjects and marks to calculate overall grade.</p>
      <div className="space-y-3">
        {subjects.map((s, i) => (
          <div key={i} className="grid grid-cols-[1fr_0.6fr_0.6fr_auto] gap-2 items-end">
            <div className="space-y-1">
              {i === 0 && <label className="text-xs font-medium text-muted-foreground">Subject</label>}
              <Input placeholder={`Subject ${i + 1}`} value={s.name} onChange={e => updateSubject(i, "name", e.target.value)} />
            </div>
            <div className="space-y-1">
              {i === 0 && <label className="text-xs font-medium text-muted-foreground">Marks</label>}
              <Input type="number" placeholder="85" value={s.marks} onChange={e => updateSubject(i, "marks", e.target.value)} />
            </div>
            <div className="space-y-1">
              {i === 0 && <label className="text-xs font-medium text-muted-foreground">Total</label>}
              <Input type="number" placeholder="100" value={s.total} onChange={e => updateSubject(i, "total", e.target.value)} />
            </div>
            <Button variant="ghost" size="sm" onClick={() => removeSubject(i)} className="text-muted-foreground h-10"
              disabled={subjects.length <= 1}>×</Button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addSubject} className="w-full">+ Add Subject</Button>
      {overallPct !== null && validSubjects.length > 0 && (
        <div className="rounded-xl p-4 text-center" style={{ background: "var(--solve-gradient)" }}>
          <p className="text-white/80 text-sm">Overall Result</p>
          <p className="text-3xl font-bold text-white">{overallPct}%</p>
          <p className="text-white/90 text-sm font-medium mt-1">
            Grade: {getGrade(Number(overallPct))} • {totalObtained}/{totalMax}
          </p>
        </div>
      )}
    </div>
  );
}

const MarksCalculator = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--solve-gradient)" }}>
            <GraduationCap className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-lg font-bold leading-tight">Marks Calculator</h1>
            <p className="text-xs text-muted-foreground">Percentage, CGPA & Grade</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <Card className="shadow-lg border-border/60">
          <CardContent className="p-5">
            <Tabs defaultValue="percentage" className="space-y-4">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="percentage" className="gap-1.5 text-xs">
                  <Calculator className="w-3.5 h-3.5" /> Percentage
                </TabsTrigger>
                <TabsTrigger value="cgpa" className="gap-1.5 text-xs">
                  <ArrowLeftRight className="w-3.5 h-3.5" /> CGPA
                </TabsTrigger>
                <TabsTrigger value="grade" className="gap-1.5 text-xs">
                  <Award className="w-3.5 h-3.5" /> Grade
                </TabsTrigger>
              </TabsList>

              <TabsContent value="percentage"><PercentageCalc /></TabsContent>
              <TabsContent value="cgpa"><CgpaConverter /></TabsContent>
              <TabsContent value="grade"><GradeCalc /></TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-primary hover:underline">← Back to SolveIt</Link>
        </div>
      </main>
    </div>
  );
};

export default MarksCalculator;
