import { cn } from "@/lib/utils";
import { Calculator, Atom, FlaskConical, Code, BookOpen } from "lucide-react";

const subjects = [
  { id: "Math", label: "Math", icon: Calculator },
  { id: "Physics", label: "Physics", icon: Atom },
  { id: "Chemistry", label: "Chemistry", icon: FlaskConical },
  { id: "Coding", label: "Coding", icon: Code },
  { id: "Other", label: "Other", icon: BookOpen },
];

interface SubjectChipsProps {
  selected: string;
  onChange: (subject: string) => void;
}

export function SubjectChips({ selected, onChange }: SubjectChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {subjects.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all",
            selected === id
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
