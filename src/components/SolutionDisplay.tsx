import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Loader2 } from "lucide-react";

interface SolutionDisplayProps {
  content: string;
  isStreaming: boolean;
}

export function SolutionDisplay({ content, isStreaming }: SolutionDisplayProps) {
  if (!content && isStreaming) {
    return (
      <div className="flex items-center gap-3 py-8 justify-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm font-medium">Analyzing your question...</span>
      </div>
    );
  }

  return (
    <div className="solution-content">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-2 h-5 bg-primary animate-pulse rounded-sm ml-0.5" />
      )}
    </div>
  );
}
