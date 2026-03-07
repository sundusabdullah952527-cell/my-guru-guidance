import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdSlotProps {
  slot: "ad_header" | "ad_sidebar" | "ad_footer";
  className?: string;
}

export const AdSlot = ({ slot, className = "" }: AdSlotProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [script, setScript] = useState("");

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", slot)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const val = typeof data.value === "string" ? data.value : (data.value as any)?.text || "";
          setScript(val);
        }
      });
  }, [slot]);

  useEffect(() => {
    if (!script || !containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = script;

    // Execute any <script> tags in the injected HTML
    const scripts = container.querySelectorAll("script");
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) =>
        newScript.setAttribute(attr.name, attr.value)
      );
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [script]);

  if (!script) return null;

  return <div ref={containerRef} className={className} />;
};
