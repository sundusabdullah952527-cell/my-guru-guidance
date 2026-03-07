import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone } from "lucide-react";

interface SiteContentProps {
  contentKey: "content_news" | "content_features";
  className?: string;
}

export const SiteContent = ({ contentKey, className = "" }: SiteContentProps) => {
  const [text, setText] = useState("");

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", contentKey)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const val = typeof data.value === "string" ? data.value : (data.value as any)?.text || "";
          setText(val);
        }
      });
  }, [contentKey]);

  if (!text) return null;

  return (
    <div className={`rounded-xl border border-border bg-card p-4 ${className}`}>
      {contentKey === "content_news" && (
        <div className="flex items-start gap-2">
          <Megaphone className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-foreground whitespace-pre-wrap">{text}</p>
        </div>
      )}
      {contentKey === "content_features" && (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{text}</p>
      )}
    </div>
  );
};
