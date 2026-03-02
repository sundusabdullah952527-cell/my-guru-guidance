import { cn } from "@/lib/utils";

const levels = ["Class 9", "Class 10", "Class 11", "Class 12", "College"];

interface LevelSelectorProps {
  selected: string;
  onChange: (level: string) => void;
}

export function LevelSelector({ selected, onChange }: LevelSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {levels.map((level) => (
        <button
          key={level}
          onClick={() => onChange(level)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
            selected === level
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-muted-foreground hover:border-primary/40"
          )}
        >
          {level}
        </button>
      ))}
    </div>
  );
}
