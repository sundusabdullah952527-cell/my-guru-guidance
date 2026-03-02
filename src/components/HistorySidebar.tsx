import { Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HistoryItem {
  id: string;
  question: string;
  subject: string;
  timestamp: number;
  solution: string;
}

interface HistorySidebarProps {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

export function HistorySidebar({ items, onSelect, onClear }: HistorySidebarProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5" />
          Recent Questions
        </div>
        <button
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="space-y-1.5">
        {items.slice(0, 10).map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="w-full text-left p-2.5 rounded-lg bg-card hover:bg-secondary/80 border border-border/50 transition-all group"
          >
            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
              {item.question.slice(0, 60) || "Image question"}
              {item.question.length > 60 ? "..." : ""}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.subject}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
